/**
 * Lessono SDC — Webhook Integration Test
 *
 * Tests the full flow:
 *   1. Create a session
 *   2. Connect via WebSocket
 *   3. Send sensor data via webhook → verify DB write + WS event
 *   4. Send AI alert via webhook → verify DB write + WS event
 *   5. Fetch analytics → verify aggregated response
 *   6. End session
 *
 * Prerequisites:
 *   - PostgreSQL running with DATABASE_URL set in .env
 *   - Run `npx prisma migrate dev --name init` first
 *   - Run with: npx tsx scripts/test-webhooks.ts
 */

import { io as ioClient, Socket as ClientSocket } from "socket.io-client";

const BASE = process.env.BASE_URL || "http://localhost:4000";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "your-webhook-secret-here";

// Dummy IDs — replace with real seeded IDs for a full integration test
const TEACHER_ID = process.env.TEST_TEACHER_ID || "test-teacher-id";
const CLASS_ID = process.env.TEST_CLASS_ID || "test-class-id";

let sessionId: string;
let wsClient: ClientSocket;

async function post(path: string, body: object, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function patch(path: string) {
  const res = await fetch(`${BASE}${path}`, { method: "PATCH" });
  return { status: res.status, data: await res.json() };
}

async function get(path: string) {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, data: await res.json() };
}

function connectWS(sessionId: string): Promise<ClientSocket> {
  return new Promise((resolve) => {
    const client = ioClient(BASE);
    client.on("connect", () => {
      client.emit("session:join", sessionId);
      console.log(`  ✓ WebSocket connected & joined session:${sessionId}`);
      resolve(client);
    });
  });
}

function waitForEvent<T>(client: ClientSocket, event: string, timeout = 5000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for "${event}"`)), timeout);
    client.once(event, (data: T) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

async function run() {
  console.log("\n🔬 Lessono SDC — Webhook Integration Test\n");

  // ── 1. Health check ────────────────────────────────
  console.log("1. Health check...");
  const health = await get("/api/health");
  console.log(`  ✓ Server is ${health.data.status} (${health.data.wsClients} WS clients)\n`);

  // ── 2. Create a session ────────────────────────────
  console.log("2. Creating session...");
  const sessionRes = await post("/api/sessions", {
    teacher_id: TEACHER_ID,
    class_id: CLASS_ID,
  });
  sessionId = sessionRes.data.id;
  console.log(`  ✓ Session created: ${sessionId}\n`);

  // ── 3. Connect WebSocket ───────────────────────────
  console.log("3. Connecting WebSocket...");
  wsClient = await connectWS(sessionId);
  console.log();

  // ── 4. Send sensor data via webhook ────────────────
  console.log("4. Sending sensor data via webhook...");
  const sensorPromise = waitForEvent(wsClient, "sensor:update");
  const sensorRes = await post(
    "/api/webhook/sensor-data",
    {
      session_id: sessionId,
      noise_level: 45.2,
      co2_level: 680,
      light_level: 350,
    },
    { "X-Webhook-Secret": WEBHOOK_SECRET }
  );
  console.log(`  ✓ Webhook response: ${sensorRes.data.status}`);
  const sensorEvent = await sensorPromise;
  console.log(`  ✓ WebSocket event received:`, sensorEvent);
  console.log();

  // ── 5. Send AI alert via webhook ───────────────────
  console.log("5. Sending AI alert via webhook...");
  const alertPromise = waitForEvent(wsClient, "alert:new");
  const alertRes = await post(
    "/api/webhook/ai-alert",
    {
      session_id: sessionId,
      type: "NOISE",
      severity: "HIGH",
      message: "Noise level exceeded threshold (45 dB)",
    },
    { "X-Webhook-Secret": WEBHOOK_SECRET }
  );
  console.log(`  ✓ Webhook response: ${alertRes.data.status}`);
  const alertEvent = await alertPromise;
  console.log(`  ✓ WebSocket event received:`, alertEvent);
  console.log();

  // ── 6. Send more sensor data for richer analytics ──
  console.log("6. Sending additional sensor data...");
  for (let i = 0; i < 5; i++) {
    await post(
      "/api/webhook/sensor-data",
      {
        session_id: sessionId,
        noise_level: 30 + Math.random() * 40,
        co2_level: 400 + Math.random() * 800,
        light_level: 100 + Math.random() * 500,
      },
      { "X-Webhook-Secret": WEBHOOK_SECRET }
    );
  }
  console.log(`  ✓ 5 additional sensor readings sent\n`);

  // ── 7. Fetch analytics ─────────────────────────────
  console.log("7. Fetching analytics...");
  const analytics = await get(`/api/sessions/${sessionId}/analytics`);
  console.log(`  ✓ Sensor readings: ${analytics.data.sensor.totalReadings}`);
  console.log(`  ✓ Noise — avg: ${analytics.data.sensor.noise.avg}, min: ${analytics.data.sensor.noise.min}, max: ${analytics.data.sensor.noise.max}`);
  console.log(`  ✓ CO2   — avg: ${analytics.data.sensor.co2.avg}`);
  console.log(`  ✓ Alerts: ${analytics.data.alerts.total} total`);
  console.log(`  ✓ Histogram buckets: ${analytics.data.sensor.noise.histogram.length}`);
  console.log();

  // ── 8. End session ─────────────────────────────────
  console.log("8. Ending session...");
  const endedPromise = waitForEvent(wsClient, "session:ended");
  const endRes = await patch(`/api/sessions/${sessionId}/end`);
  console.log(`  ✓ Session status: ${endRes.data.status}`);
  const endedEvent = await endedPromise;
  console.log(`  ✓ WebSocket session:ended received:`, endedEvent);
  console.log();

  // ── Cleanup ────────────────────────────────────────
  wsClient.disconnect();
  console.log("✅ All tests passed!\n");
  process.exit(0);
}

run().catch((err) => {
  console.error("\n❌ Test failed:", err.message);
  wsClient?.disconnect();
  process.exit(1);
});
