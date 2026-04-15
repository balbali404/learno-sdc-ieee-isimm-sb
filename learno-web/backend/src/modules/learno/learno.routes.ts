import express from "express";
import {
  handleWebhook,
  startSession,
  stopSession,
  getSessions,
  getSessionDetail,
  getSessionAlerts,
  getTeacherTimetableForToday,
  getTeacherLessons,
  approveLesson,
  serveLessonPdf,
} from "./learno.controller.js";
import { authenticate } from "../../core/middleware/auth.middleware.js";
import { checkRole } from "../../core/middleware/rbac.js";
import { validate } from "../../core/middleware/validateRequest.js";
import { StartSessionSchema, StopSessionSchema } from "./learno.validators.js";

const route = express.Router();

// ── Webhook endpoint (No JWT auth — uses webhook secret) ──
route.post("/webhook", handleWebhook);

// ── Timetable for FastAPI auto-start (No JWT — uses webhook secret) ──
route.get("/timetable/:teacherId", getTeacherTimetableForToday);

// ── Teacher session management (JWT + TEACHER role) ───────
route.use(authenticate, checkRole("TEACHER"));

route.post("/sessions/start", validate(StartSessionSchema), startSession);
route.post("/sessions/stop", validate(StopSessionSchema), stopSession);
route.get("/sessions", getSessions);
route.get("/sessions/:sessionId", getSessionDetail);
route.get("/sessions/:sessionId/alerts", getSessionAlerts);

// ── Lesson management (teacher reviews AI-generated lessons) ──
route.get("/lessons", getTeacherLessons);
route.post("/lessons/:lessonId/approve", approveLesson);
route.get("/lessons/:lessonId/pdf", serveLessonPdf);

export default route;
