import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { existsSync } from "node:fs";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const dataDir = path.join(rootDir, "data");
const dataFile = path.join(dataDir, "telemetry.ndjson");

function resolvePort() {
  const args = process.argv.slice(2);

  const portFlagIndex = args.findIndex(
    (arg) => arg === "--port" || arg === "-p"
  );
  if (portFlagIndex !== -1) {
    const fromFlag = Number.parseInt(args[portFlagIndex + 1] ?? "", 10);
    if (Number.isFinite(fromFlag) && fromFlag > 0) {
      return fromFlag;
    }
  }

  for (const arg of args) {
    const value = Number.parseInt(arg, 10);
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  const fromEnv = Number.parseInt(process.env.PORT ?? "3000", 10);
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : 3000;
}

const PORT = resolvePort();
const HOST = process.env.HOST ?? "0.0.0.0";
const MAX_HISTORY = Number.parseInt(process.env.MAX_HISTORY ?? "250", 10);

const app = express();
app.use(cors());
app.use(express.json({ limit: "256kb" }));
app.use(express.static(publicDir));

let latestTelemetry = null;
const history = [];
const announcedSessionStarts = new Set();

function toNumberOrNull(value) {
  if (value == null || value === "") {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function normalizeSensorTest(value, fallbackLabel) {
  if (typeof value === "boolean") {
    return {
      enabled: value,
      detected: value,
      readingOk: value,
      note: value ? `${fallbackLabel} is reporting` : `${fallbackLabel} is offline`
    };
  }

  return {
    enabled: Boolean(value?.enabled),
    detected: Boolean(value?.detected),
    readingOk: Boolean(value?.readingOk),
    note: typeof value?.note === "string" && value.note.trim()
      ? value.note.trim()
      : "No note"
  };
}

function normalizeSystemTests(value) {
  return {
    wifiConnected: Boolean(value?.wifiConnected),
    apiConfigured:
      value?.apiConfigured == null ? true : Boolean(value.apiConfigured),
    lastTelemetrySendOk: Boolean(value?.lastTelemetrySendOk)
  };
}

function normalizeTelemetry(payload) {
  const metrics = payload?.metrics ?? {};
  const wifi = payload?.wifi ?? {};
  const sensorTests = payload?.sensorTests ?? payload?.sensorStatus ?? {};

  return {
    receivedAt: new Date().toISOString(),
    deviceId:
      typeof payload?.deviceId === "string" && payload.deviceId.trim()
        ? payload.deviceId.trim()
        : "unknown-device",
    firmwareVersion:
      typeof payload?.firmwareVersion === "string"
        ? payload.firmwareVersion
        : null,
    uptimeMs: toNumberOrNull(payload?.uptimeMs),
    wifi: {
      ssid: typeof wifi.ssid === "string" ? wifi.ssid : null,
      ip: typeof wifi.ip === "string" ? wifi.ip : null,
      rssi: toNumberOrNull(wifi.rssi)
    },
    metrics: {
      lightLux: toNumberOrNull(metrics.lightLux),
      temperatureC: toNumberOrNull(metrics.temperatureC),
      humidityPct: toNumberOrNull(metrics.humidityPct),
      mq7Raw: toNumberOrNull(metrics.mq7Raw),
      mq7Voltage: toNumberOrNull(metrics.mq7Voltage),
      mq7LevelPct: toNumberOrNull(metrics.mq7LevelPct),
      co2Ppm: toNumberOrNull(metrics.co2Ppm)
    },
    sensorTests: {
      bh1750: normalizeSensorTest(sensorTests.bh1750, "BH1750"),
      dht22: normalizeSensorTest(sensorTests.dht22, "DHT22"),
      mq7: normalizeSensorTest(sensorTests.mq7, "MQ-7")
    },
    systemTests: normalizeSystemTests(payload?.systemTests)
  };
}

function extractSessionContext(payload) {
  const sessionIdCandidates = [
    payload?.sessionId,
    payload?.session_id,
    payload?.session?.id
  ];
  const teacherIdCandidates = [
    payload?.teacherId,
    payload?.teacher_id,
    payload?.teacher?.id,
    payload?.professor_id
  ];

  const sessionId = sessionIdCandidates.find(
    (value) => typeof value === "string" && value.trim()
  );
  const teacherId = teacherIdCandidates.find(
    (value) => typeof value === "string" && value.trim()
  );
  const status = [
    payload?.status,
    payload?.sessionStatus,
    payload?.session?.status
  ].find((value) => typeof value === "string" && value.trim());

  return {
    sessionId: sessionId?.trim() ?? null,
    teacherId: teacherId?.trim() ?? null,
    status: status?.toLowerCase() ?? null
  };
}

function logSessionStartIfPresent(payload) {
  const { sessionId, teacherId, status } = extractSessionContext(payload);
  const eventType =
    typeof payload?.event === "string" ? payload.event.toLowerCase() : null;
  const hasStartSignal =
    eventType === "session_started" ||
    payload?.sessionStarted === true ||
    status === "recording" ||
    status === "started";

  if (!sessionId || !hasStartSignal) {
    return;
  }

  if (announcedSessionStarts.has(sessionId)) {
    return;
  }

  announcedSessionStarts.add(sessionId);
  console.log(
    `[SESSION] started | teacherId=${teacherId ?? "unknown"} | sessionId=${sessionId}`
  );
}

function pushHistory(entry) {
  history.push(entry);
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
}

async function bootstrapHistory() {
  await mkdir(dataDir, { recursive: true });
  if (!existsSync(dataFile)) {
    return;
  }

  const fileContent = await readFile(dataFile, "utf8");
  const entries = fileContent
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const recentEntries = entries.slice(-MAX_HISTORY);
  recentEntries.forEach((entry) => pushHistory(entry));
  latestTelemetry = recentEntries.at(-1) ?? null;
}

app.get("/api/health", (_request, response) => {
  const lastSeenMs = latestTelemetry
    ? Date.now() - Date.parse(latestTelemetry.receivedAt)
    : null;

  response.json({
    ok: true,
    latestTelemetryAt: latestTelemetry?.receivedAt ?? null,
    bufferedReadings: history.length,
    boardOnline: lastSeenMs != null && lastSeenMs < 15000
  });
});

app.get("/api/latest", (_request, response) => {
  response.json({
    ok: true,
    telemetry: latestTelemetry
  });
});

app.get("/api/history", (request, response) => {
  const requestedLimit = Number.parseInt(request.query.limit ?? "30", 10);
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(requestedLimit, MAX_HISTORY))
    : 30;

  response.json({
    ok: true,
    readings: history.slice(-limit)
  });
});

app.post("/api/telemetry", async (request, response) => {
  logSessionStartIfPresent(request.body);

  const telemetry = normalizeTelemetry(request.body);
  latestTelemetry = telemetry;
  pushHistory(telemetry);

  try {
    await appendFile(dataFile, `${JSON.stringify(telemetry)}\n`, "utf8");
  } catch (error) {
    console.error("Failed to persist telemetry", error);
  }

  broadcast({
    type: "telemetry",
    payload: telemetry
  });

  response.status(202).json({
    ok: true,
    receivedAt: telemetry.receivedAt
  });
});

function buildSimulatedPayload(profile) {
  const healthy = profile !== "missing";

  return normalizeTelemetry({
    deviceId: `sim-${profile}`,
    firmwareVersion: "simulator",
    uptimeMs: 123456,
    wifi: {
      ssid: "DOUA",
      ip: "192.168.1.77",
      rssi: healthy ? -49 : -71
    },
    metrics: {
      lightLux: healthy ? 421.7 : null,
      temperatureC: healthy ? 24.8 : null,
      humidityPct: healthy ? 47.9 : null,
      mq7Raw: null,
      mq7Voltage: null,
      mq7LevelPct: null,
      co2Ppm: healthy ? 612 : null
    },
    sensorTests: {
      bh1750: healthy
        ? {
            enabled: true,
            detected: true,
            readingOk: true,
            note: "Reading OK"
          }
        : {
            enabled: true,
            detected: false,
            readingOk: false,
            note: "Not detected on I2C"
          },
      dht22: healthy
        ? {
            enabled: true,
            detected: true,
            readingOk: true,
            note: "Temperature and humidity readings are valid"
          }
        : {
            enabled: true,
            detected: false,
            readingOk: false,
            note: "No valid DHT22 reading yet. Check wiring and sensor power."
          },
      mq7: {
        enabled: true,
        detected: true,
        readingOk: healthy,
        note: healthy
          ? "Analog reading OK. Smoothed ADC 138.0, spread 8.2%. Relative trend is ready; ppm still needs calibration."
          : "Warm-up in progress: 12/30 s. Smoothed ADC 26.3."
      }
    },
    systemTests: {
      wifiConnected: true,
      apiConfigured: true,
      lastTelemetrySendOk: true
    }
  });
}

app.post("/api/simulate", async (request, response) => {
  const profile =
    request.body?.profile === "missing" ? "missing" : "healthy";
  const telemetry = buildSimulatedPayload(profile);

  latestTelemetry = telemetry;
  pushHistory(telemetry);

  try {
    await appendFile(dataFile, `${JSON.stringify(telemetry)}\n`, "utf8");
  } catch (error) {
    console.error("Failed to persist simulated telemetry", error);
  }

  broadcast({
    type: "telemetry",
    payload: telemetry
  });

  response.status(202).json({
    ok: true,
    profile,
    receivedAt: telemetry.receivedAt
  });
});

app.post("/api/reset", async (_request, response) => {
  latestTelemetry = null;
  history.length = 0;
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, "", "utf8");

  broadcast({
    type: "reset"
  });

  response.json({
    ok: true
  });
});

app.get("*", (_request, response) => {
  response.sendFile(path.join(publicDir, "index.html"));
});

const server = app.listen(PORT, HOST, async () => {
  await bootstrapHistory();
  console.log(`Learno telemetry server running at http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server, path: "/ws" });

function broadcast(message) {
  const encodedMessage = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(encodedMessage);
    }
  });
}

wss.on("connection", (socket, request) => {
  const remoteAddress = request?.socket?.remoteAddress ?? "unknown";
  console.log(
    `[WS] client connected | ip=${remoteAddress} | clients=${wss.clients.size}`
  );

  socket.on("close", () => {
    console.log(
      `[WS] client disconnected | ip=${remoteAddress} | clients=${wss.clients.size}`
    );
  });

  socket.send(
    JSON.stringify({
      type: "snapshot",
      payload: {
        latestTelemetry,
        history: history.slice(-20)
      }
    })
  );
});
