const ids = {
  boardStatus: document.getElementById("boardStatus"),
  socketState: document.getElementById("socketState"),
  lastUpdate: document.getElementById("lastUpdate"),
  deviceId: document.getElementById("deviceId"),
  wifiConnected: document.getElementById("wifiConnected"),
  apiConfigured: document.getElementById("apiConfigured"),
  lastPostOk: document.getElementById("lastPostOk"),
  wifiIp: document.getElementById("wifiIp"),
  wifiRssi: document.getElementById("wifiRssi"),
  uptimeMs: document.getElementById("uptimeMs"),
  wifiSsid: document.getElementById("wifiSsid"),
  heroWifiRssi: document.getElementById("heroWifiRssi"),
  heroUptime: document.getElementById("heroUptime"),
  lightLux: document.getElementById("lightLux"),
  temperatureC: document.getElementById("temperatureC"),
  humidityPct: document.getElementById("humidityPct"),
  mq7LevelPct: document.getElementById("mq7LevelPct"),
  mq7Raw: document.getElementById("mq7Raw"),
  historyList: document.getElementById("historyList"),
  rawPayload: document.getElementById("rawPayload"),
  controlMessage: document.getElementById("controlMessage"),
  simulateHealthy: document.getElementById("simulateHealthy"),
  simulateMissing: document.getElementById("simulateMissing"),
  resetSession: document.getElementById("resetSession"),
  sensors: {
    bh1750: {
      overall: document.getElementById("bh1750Overall"),
      enabled: document.getElementById("bh1750Enabled"),
      detected: document.getElementById("bh1750Detected"),
      readingOk: document.getElementById("bh1750ReadingOk"),
      note: document.getElementById("bh1750Note")
    },
    dht22: {
      overall: document.getElementById("dht22Overall"),
      enabled: document.getElementById("dht22Enabled"),
      detected: document.getElementById("dht22Detected"),
      readingOk: document.getElementById("dht22ReadingOk"),
      note: document.getElementById("dht22Note")
    },
    mq7: {
      overall: document.getElementById("mq7Overall"),
      enabled: document.getElementById("mq7Enabled"),
      detected: document.getElementById("mq7Detected"),
      readingOk: document.getElementById("mq7ReadingOk"),
      note: document.getElementById("mq7Note")
    }
  }
};

const state = {
  history: [],
  latestTelemetry: null
};

function formatNumber(value, suffix = "", digits = 1) {
  return value == null ? "--" : `${Number(value).toFixed(digits)}${suffix}`;
}

function formatWhen(value) {
  if (!value) {
    return "No data";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}

function formatUptime(value) {
  if (value == null) {
    return "--";
  }

  const totalSeconds = Math.floor(value / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

function setChipState(element, stateName, text) {
  element.textContent = text;
  element.classList.remove("online", "offline", "warn", "neutral");
  element.classList.add(stateName);
}

function setBooleanText(element, value) {
  element.textContent = value ? "Yes" : "No";
}

function renderHistory() {
  ids.historyList.innerHTML = "";

  if (state.history.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "history-item";
    emptyState.innerHTML =
      "<div><strong>No telemetry yet</strong><span class='history-meta'>Use the simulator buttons above, or flash the ESP32 once it is connected.</span></div>";
    ids.historyList.append(emptyState);
    return;
  }

  state.history.slice(0, 12).forEach((entry) => {
    const item = document.createElement("article");
    item.className = "history-item";
    item.innerHTML = `
      <div>
        <strong>${entry.deviceId}</strong>
        <div class="history-meta">
          Light ${formatNumber(entry.metrics.lightLux, " lux")} |
          Temp ${formatNumber(entry.metrics.temperatureC, " deg C")} |
          Humidity ${formatNumber(entry.metrics.humidityPct, " %")} |
          MQ-7 ${formatNumber(entry.metrics.mq7LevelPct, " %")} |
          Raw ${formatNumber(entry.metrics.mq7Raw, "", 0)}
        </div>
      </div>
      <div class="history-meta">${formatWhen(entry.receivedAt)}</div>
    `;
    ids.historyList.append(item);
  });
}

function renderSensorTest(sensorKey, sensorTest) {
  const sensorIds = ids.sensors[sensorKey];
  if (!sensorIds || !sensorTest) {
    return;
  }

  setBooleanText(sensorIds.enabled, sensorTest.enabled);
  setBooleanText(sensorIds.detected, sensorTest.detected);
  setBooleanText(sensorIds.readingOk, sensorTest.readingOk);
  sensorIds.note.textContent = sensorTest.note ?? "No note";

  if (!sensorTest.enabled) {
    setChipState(sensorIds.overall, "neutral", "Disabled");
    return;
  }

  if (sensorTest.readingOk) {
    setChipState(sensorIds.overall, "online", "Pass");
    return;
  }

  if (sensorTest.detected) {
    setChipState(sensorIds.overall, "warn", "Detected");
    return;
  }

  setChipState(sensorIds.overall, "offline", "Fail");
}

function renderBoardStatus(entry) {
  if (!entry) {
    setChipState(ids.boardStatus, "neutral", "Waiting for board");
    return;
  }

  const lastSeenMs = Date.now() - Date.parse(entry.receivedAt);
  if (lastSeenMs < 15000) {
    setChipState(ids.boardStatus, "online", "Online");
    return;
  }

  setChipState(ids.boardStatus, "warn", "Stale");
}

function renderTelemetry(entry) {
  state.latestTelemetry = entry;
  renderBoardStatus(entry);

  if (!entry) {
    ids.deviceId.textContent = "--";
    ids.lastUpdate.textContent = "No data";
    ids.rawPayload.textContent = "No payload yet.";
    renderHistory();
    return;
  }

  ids.deviceId.textContent = entry.deviceId ?? "--";
  ids.lastUpdate.textContent = formatWhen(entry.receivedAt);

  ids.wifiIp.textContent = entry.wifi?.ip ?? "--";
  ids.wifiRssi.textContent = formatNumber(entry.wifi?.rssi, " dBm", 0);
  ids.uptimeMs.textContent = formatUptime(entry.uptimeMs);
  ids.wifiSsid.textContent = entry.wifi?.ssid ?? "--";
  ids.heroWifiRssi.textContent = formatNumber(entry.wifi?.rssi, "", 0);
  ids.heroUptime.textContent = formatUptime(entry.uptimeMs);

  ids.lightLux.textContent = formatNumber(entry.metrics?.lightLux);
  ids.temperatureC.textContent = formatNumber(entry.metrics?.temperatureC);
  ids.humidityPct.textContent = formatNumber(entry.metrics?.humidityPct);
  ids.mq7LevelPct.textContent = formatNumber(entry.metrics?.mq7LevelPct);
  ids.mq7Raw.textContent = formatNumber(entry.metrics?.mq7Raw, "", 0);

  setChipState(
    ids.wifiConnected,
    entry.systemTests?.wifiConnected ? "online" : "offline",
    entry.systemTests?.wifiConnected ? "Pass" : "Fail"
  );
  setChipState(
    ids.apiConfigured,
    entry.systemTests?.apiConfigured ? "online" : "offline",
    entry.systemTests?.apiConfigured ? "Pass" : "Fail"
  );
  setChipState(
    ids.lastPostOk,
    entry.systemTests?.lastTelemetrySendOk ? "online" : "offline",
    entry.systemTests?.lastTelemetrySendOk ? "Pass" : "Fail"
  );

  renderSensorTest("bh1750", entry.sensorTests?.bh1750);
  renderSensorTest("dht22", entry.sensorTests?.dht22);
  renderSensorTest("mq7", entry.sensorTests?.mq7);

  ids.rawPayload.textContent = JSON.stringify(entry, null, 2);
  renderHistory();
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

async function runSimulation(profile) {
  ids.controlMessage.textContent = `Running ${profile} simulation...`;

  await fetchJson("/api/simulate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ profile })
  });

  ids.controlMessage.textContent =
    profile === "healthy"
      ? "Healthy simulated payload sent to the dashboard."
      : "Missing-sensor simulated payload sent to the dashboard.";
}

async function resetSession() {
  ids.controlMessage.textContent = "Resetting saved test data...";
  await fetchJson("/api/reset", {
    method: "POST"
  });
  ids.controlMessage.textContent =
    "Session reset. You can simulate data again or wait for real ESP32 telemetry.";
}

async function bootstrap() {
  const [latestBody, historyBody] = await Promise.all([
    fetchJson("/api/latest"),
    fetchJson("/api/history?limit=12")
  ]);

  state.history = (historyBody.readings ?? []).reverse();
  renderTelemetry(latestBody.telemetry);
}

function connectSocket() {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const socket = new WebSocket(`${protocol}//${location.host}/ws`);

  socket.addEventListener("open", () => {
    setChipState(ids.socketState, "online", "Live");
  });

  socket.addEventListener("close", () => {
    setChipState(ids.socketState, "warn", "Reconnecting");
    window.setTimeout(connectSocket, 1500);
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);

    if (message.type === "snapshot") {
      state.history = (message.payload.history ?? []).reverse();
      renderTelemetry(message.payload.latestTelemetry);
      return;
    }

    if (message.type === "telemetry") {
      state.history.unshift(message.payload);
      state.history = state.history.slice(0, 12);
      renderTelemetry(message.payload);
      return;
    }

    if (message.type === "reset") {
      state.history = [];
      renderTelemetry(null);
    }
  });
}

ids.simulateHealthy.addEventListener("click", () => {
  runSimulation("healthy").catch((error) => {
    ids.controlMessage.textContent = `Simulation failed: ${error.message}`;
  });
});

ids.simulateMissing.addEventListener("click", () => {
  runSimulation("missing").catch((error) => {
    ids.controlMessage.textContent = `Simulation failed: ${error.message}`;
  });
});

ids.resetSession.addEventListener("click", () => {
  resetSession().catch((error) => {
    ids.controlMessage.textContent = `Reset failed: ${error.message}`;
  });
});

bootstrap()
  .catch((error) => {
    setChipState(ids.socketState, "offline", "Server offline");
    ids.controlMessage.textContent =
      "The dashboard could not reach the server. Start npm and refresh.";
    console.error(error);
    renderTelemetry(null);
  })
  .finally(() => {
    connectSocket();
    window.setInterval(() => renderBoardStatus(state.latestTelemetry), 1000);
  });
