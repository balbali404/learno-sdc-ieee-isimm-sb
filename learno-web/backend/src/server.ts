import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./core/middleware/errorHandler.js";
import authRoutes from "./modules/auth/auth.routes.js";
import schoolRoutes from "./modules/school/school.routes.js";
import teacherRoutes from "./modules/teacher/teacher.routes.js";
import guardianRoutes from "./modules/guardian/guardian.routes.js";
import messageRoutes from "./modules/message/message.routes.js";
import learnoRoutes from "./modules/learno/learno.routes.js";
import studentRoutes from "./modules/student/student.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import neuroRoutes from "./modules/neuro/neuro.routes.js";
import { initSocket } from "./core/socket.js";
import { startSessionScheduler } from "./core/jobs/sessionScheduler.js";
import { refreshEnvironmentIngest } from "./core/jobs/environmentIngest.js";

const app = express();
const httpServer = createServer(app);
const io = initSocket(httpServer);
const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || "20mb";

// ── Middleware ───────────────────────────────────────
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"],
  credentials: true,
  optionsSuccessStatus: 200,
}));
app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(cookieParser());

// ── Serve test frontend ────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/app", express.static(path.resolve(__dirname, "../../frontend")));

// ── Routes ──────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/school", schoolRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/guardian", guardianRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/learno", learnoRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/neuro", neuroRoutes);

// ── Health check ────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ── Error handler (must be last) ────────────────────
app.use(errorHandler);

// ── Start ───────────────────────────────────────────
const PORT = parseInt(process.env.PORT || "4000", 10);
httpServer.listen(PORT, () => {
  console.log(`
  ┌───────────────────────────────────────────────────┐
  │  Learno SDC — Express Server (MVP)                │
  │                                                   │
  │  REST API    → http://localhost:${PORT}/api          │
  │  Health      → http://localhost:${PORT}/api/health   │
  └───────────────────────────────────────────────────┘
  `);
});

startSessionScheduler();
refreshEnvironmentIngest().catch((err) => {
  console.error("environmentIngest refresh failed:", err);
});

export { app, httpServer, io };
