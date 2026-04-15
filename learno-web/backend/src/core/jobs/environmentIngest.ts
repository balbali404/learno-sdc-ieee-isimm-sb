import WebSocket, { RawData } from "ws";
import prisma from "../../config/prisma.js";
import { io } from "../socket.js";

type SensorTelemetry = {
  receivedAt?: string;
  deviceId?: string;
  metrics?: {
    lightLux?: number | null;
    temperatureC?: number | null;
    humidityPct?: number | null;
    mq7LevelPct?: number | null;
    co2Ppm?: number | null;
  };
};

type SensorMessage =
  | { type: "telemetry"; payload?: SensorTelemetry }
  | { type: "snapshot"; payload?: { latestTelemetry?: SensorTelemetry } }
  | { type: string; payload?: unknown };

const parseBool = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
};

const SENSOR_WS_URL_ENV = process.env.SENSOR_WS_URL?.trim();
const SENSOR_API_URL_ENV = process.env.SENSOR_API_URL?.trim();
const hasConfiguredSensorEndpoint = Boolean(SENSOR_WS_URL_ENV || SENSOR_API_URL_ENV);

const SENSOR_INGEST_ENABLED = parseBool(
  process.env.SENSOR_INGEST_ENABLED,
  hasConfiguredSensorEndpoint,
);

const SENSOR_WS_URL = SENSOR_WS_URL_ENV || "ws://127.0.0.1:3000/ws";
const SENSOR_API_URL = SENSOR_API_URL_ENV || "http://127.0.0.1:3000/api/latest";
const SENSOR_POLL_INTERVAL_MS = Number.parseInt(process.env.SENSOR_POLL_INTERVAL_MS ?? "5000", 10);
const SENSOR_CAPTURE_MODE = (process.env.SENSOR_CAPTURE_MODE ?? "session").toLowerCase();
const SENSOR_CLASS_ID = process.env.SENSOR_CLASS_ID?.trim() || null;
const SENSOR_DEVICE_ID = process.env.SENSOR_DEVICE_ID?.trim() || null;

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

const computeCo2Ppm = (telemetry: SensorTelemetry): number | null => {
  const co2Ppm = telemetry.metrics?.co2Ppm;
  if (co2Ppm !== null && co2Ppm !== undefined && Number.isFinite(co2Ppm)) {
    return clamp(Math.round(co2Ppm), 400, 2000);
  }

  const mq7LevelPct = telemetry.metrics?.mq7LevelPct;
  if (mq7LevelPct === null || mq7LevelPct === undefined || !Number.isFinite(mq7LevelPct)) {
    return null;
  }

  const estimated = 400 + (mq7LevelPct / 100) * 1600;
  return clamp(Math.round(estimated), 400, 2000);
};

const toNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

let lastStoredKey = "";
let pollHandle: NodeJS.Timeout | null = null;
let socket: WebSocket | null = null;
let reconnectHandle: NodeJS.Timeout | null = null;
let isRunning = false;
let wsErrorLogged = false;
let pollingErrorLogged = false;

let fakeIngestHandle: NodeJS.Timeout | null = null;
let fakeBootstrapHandle: NodeJS.Timeout | null = null;
let hasRealTelemetryThisRun = false;

const shouldCaptureAlways = SENSOR_CAPTURE_MODE === "always";
const AUTO_FAKE_FALLBACK_DELAY_MS = 12_000;
const AUTO_FAKE_INTERVAL_MS = 5_000;

const randomInRange = (min: number, max: number): number => {
  return min + Math.random() * (max - min);
};

const buildFakeTelemetry = (): SensorTelemetry => {
  const now = new Date();
  const phase = (now.getMinutes() * 60 + now.getSeconds()) / 3600;
  const drift = Math.sin(phase * Math.PI * 2);

  const co2Ppm = Math.max(420, Math.min(1800, Math.round(760 + drift * 120 + randomInRange(-40, 40))));
  const temperatureC = Number((23.2 + drift * 1.4 + randomInRange(-0.6, 0.6)).toFixed(2));
  const humidityPct = Number((48 + drift * 5 + randomInRange(-2, 2)).toFixed(2));
  const lightLux = Number((380 + drift * 80 + randomInRange(-25, 25)).toFixed(1));

  return {
    receivedAt: now.toISOString(),
    deviceId: SENSOR_DEVICE_ID || "fake-sensor",
    metrics: {
      co2Ppm,
      temperatureC,
      humidityPct,
      lightLux,
      mq7LevelPct: Number((((co2Ppm - 400) / 1600) * 100).toFixed(1)),
    },
  };
};

const startFakeIngest = (reason: string) => {
  if (fakeIngestHandle || !isRunning) {
    return;
  }

  console.warn(`Sensor data unavailable, using synthetic telemetry (${reason}).`);

  fakeIngestHandle = setInterval(() => {
    const telemetry = buildFakeTelemetry();
    persistTelemetry(telemetry, "fake").catch((err) => {
      console.error("persistTelemetry(fake) error:", err);
    });
  }, AUTO_FAKE_INTERVAL_MS);
};

const stopFakeIngest = () => {
  if (fakeIngestHandle) {
    clearInterval(fakeIngestHandle);
    fakeIngestHandle = null;
  }
};

const scheduleAutoFakeBootstrap = () => {
  if (fakeBootstrapHandle) {
    clearTimeout(fakeBootstrapHandle);
    fakeBootstrapHandle = null;
  }

  fakeBootstrapHandle = setTimeout(() => {
    fakeBootstrapHandle = null;
    if (!isRunning || hasRealTelemetryThisRun) {
      return;
    }
    startFakeIngest("no telemetry received after session start");
  }, AUTO_FAKE_FALLBACK_DELAY_MS);
};

const clearAutoFakeBootstrap = () => {
  if (fakeBootstrapHandle) {
    clearTimeout(fakeBootstrapHandle);
    fakeBootstrapHandle = null;
  }
};

const resolveActiveSession = async (classId?: string | null) => {
  const where: {
    status: "RECORDING";
    classId?: string | null;
    actualStart?: { gte: Date };
  } = {
    status: "RECORDING",
    actualStart: { gte: new Date(Date.now() - 8 * 60 * 60 * 1000) },
  };

  if (classId) {
    where.classId = classId;
  }

  return prisma.session.findFirst({
    where,
    orderBy: { actualStart: "desc" },
    select: { id: true, classId: true, teacherId: true, actualStart: true },
  });
};

const persistTelemetry = async (telemetry: SensorTelemetry, source: "real" | "fake" = "real") => {
  if (!telemetry) {
    return;
  }

  if (source === "real") {
    hasRealTelemetryThisRun = true;
    stopFakeIngest();
    clearAutoFakeBootstrap();
  }

  const deviceId = telemetry.deviceId ?? SENSOR_DEVICE_ID ?? "unknown-device";
  const receivedAt = telemetry.receivedAt ? new Date(telemetry.receivedAt) : new Date();
  if (Number.isNaN(receivedAt.getTime())) {
    return;
  }

  const dedupeKey = `${deviceId}:${receivedAt.toISOString()}`;
  if (dedupeKey === lastStoredKey) {
    return;
  }

  const co2Ppm = computeCo2Ppm(telemetry);
  const temperatureC = toNumberOrNull(telemetry.metrics?.temperatureC);
  const humidityPct = toNumberOrNull(telemetry.metrics?.humidityPct);
  const lightLux = toNumberOrNull(telemetry.metrics?.lightLux);

  if (co2Ppm === null && temperatureC === null && humidityPct === null && lightLux === null) {
    return;
  }

  let classId: string | null = SENSOR_CLASS_ID;
  let sessionId: string | null = null;

  const activeSession = await resolveActiveSession(SENSOR_CLASS_ID);
  if (activeSession) {
    sessionId = activeSession.id;
    classId = activeSession.classId ?? classId;
  } else if (!shouldCaptureAlways) {
    return;
  }

  await prisma.environmentReading.create({
    data: {
      classId,
      sessionId,
      deviceId,
      co2Ppm,
      temperatureC,
      humidityPct,
      lightLux,
      receivedAt,
    },
  });

  lastStoredKey = dedupeKey;

  if (io) {
    const payload = {
      classId,
      sessionId,
      deviceId,
      co2Ppm,
      temperatureC,
      humidityPct,
      lightLux,
      receivedAt: receivedAt.toISOString(),
    };

    if (classId) {
      io.to(`class:${classId}`).emit("environment:update", payload);
    }

    if (sessionId) {
      io.to(`session:${sessionId}`).emit("environment:update", payload);
    }
  }
};

const handleMessage = (raw: RawData) => {
  const text = typeof raw === "string" ? raw : raw.toString("utf8");
  if (!text) {
    return;
  }

  try {
    const message = JSON.parse(text) as SensorMessage;
    if (message.type === "telemetry") {
      persistTelemetry(message.payload as SensorTelemetry).catch((err) => {
        console.error("persistTelemetry error:", err);
      });
      return;
    }

    if (message.type === "snapshot") {
      const latest = (message as { payload?: { latestTelemetry?: SensorTelemetry } }).payload?.latestTelemetry;
      if (latest) {
        persistTelemetry(latest).catch((err) => {
          console.error("persistTelemetry error:", err);
        });
      }
    }
  } catch (err) {
    console.error("Failed to parse sensor message:", err);
  }
};

const startPollingFallback = () => {
  if (!isRunning || pollHandle || !SENSOR_API_URL) {
    return;
  }

  pollHandle = setInterval(async () => {
    try {
      const response = await fetch(SENSOR_API_URL, { method: "GET" });
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as { telemetry?: SensorTelemetry | null };
      if (data?.telemetry) {
        await persistTelemetry(data.telemetry, "real");
      } else if (!hasRealTelemetryThisRun) {
        startFakeIngest("sensor API has no telemetry");
      }
    } catch (err) {
      if (!pollingErrorLogged) {
        console.warn("Sensor polling unavailable, ignoring sensor ingest.");
        pollingErrorLogged = true;
      }
      if (!hasRealTelemetryThisRun) {
        startFakeIngest("sensor API unreachable");
      }
    }
  }, Number.isFinite(SENSOR_POLL_INTERVAL_MS) ? SENSOR_POLL_INTERVAL_MS : 5000);
};

const clearReconnect = () => {
  if (reconnectHandle) {
    clearTimeout(reconnectHandle);
    reconnectHandle = null;
  }
};

const scheduleReconnect = () => {
  if (!isRunning) {
    return;
  }
  clearReconnect();
  reconnectHandle = setTimeout(connectWebSocket, 3000);
};

const connectWebSocket = () => {
  if (!isRunning) {
    return;
  }

  if (!SENSOR_WS_URL) {
    startPollingFallback();
    if (!hasRealTelemetryThisRun) {
      startFakeIngest("sensor websocket URL missing");
    }
    return;
  }

  try {
    socket = new WebSocket(SENSOR_WS_URL);
  } catch (err) {
    if (!wsErrorLogged) {
      console.warn("Sensor websocket unavailable, switching to polling fallback.");
      wsErrorLogged = true;
    }
    startPollingFallback();
    if (!hasRealTelemetryThisRun) {
      startFakeIngest("sensor websocket unavailable");
    }
    scheduleReconnect();
    return;
  }

  socket.on("open", () => {
    wsErrorLogged = false;
    pollingErrorLogged = false;
  });
  socket.on("message", handleMessage);
  socket.on("error", () => {
    if (!wsErrorLogged) {
      console.warn("Sensor websocket unavailable, switching to polling fallback.");
      wsErrorLogged = true;
    }
    startPollingFallback();
    if (!hasRealTelemetryThisRun) {
      startFakeIngest("sensor websocket disconnected");
    }
  });
  socket.on("close", () => {
    socket = null;
    scheduleReconnect();
  });
};

export const startEnvironmentIngest = () => {
  if (!SENSOR_INGEST_ENABLED || isRunning || (!SENSOR_WS_URL && !SENSOR_API_URL)) {
    return;
  }

  isRunning = true;
  hasRealTelemetryThisRun = false;
  clearAutoFakeBootstrap();

  connectWebSocket();
  startPollingFallback();
  scheduleAutoFakeBootstrap();
};

export const stopEnvironmentIngest = () => {
  isRunning = false;
  hasRealTelemetryThisRun = false;
  clearReconnect();
  clearAutoFakeBootstrap();

  if (pollHandle) {
    clearInterval(pollHandle);
    pollHandle = null;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.close();
    socket = null;
  }

  stopFakeIngest();
};

export const refreshEnvironmentIngest = async () => {
  if (!SENSOR_INGEST_ENABLED || (!SENSOR_WS_URL && !SENSOR_API_URL)) {
    stopEnvironmentIngest();
    return;
  }

  const activeCount = await prisma.session.count({
    where: { status: "RECORDING" },
  });

  if (activeCount > 0 || shouldCaptureAlways) {
    startEnvironmentIngest();
  } else {
    stopEnvironmentIngest();
  }
};
