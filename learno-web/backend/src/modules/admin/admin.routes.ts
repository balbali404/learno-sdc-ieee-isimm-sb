import express, { type RequestHandler } from "express";
import * as adminController from "./admin.controller.js";
import { authenticate } from "../../core/middleware/auth.middleware.js";
import { checkRole } from "../../core/middleware/rbac.js";
import { validate } from "../../core/middleware/validateRequest.js";
import { AdminStartSessionSchema, AdminStopSessionSchema } from "./admin.validators.js";

const route = express.Router();

const handlers = adminController as Record<string, RequestHandler | undefined>;

const missingHandler = (name: string): RequestHandler => (_req, res) => {
  res.status(501).json({ message: `${name} endpoint is not available yet.` });
};

const pickHandler = (name: string): RequestHandler => handlers[name] ?? missingHandler(name);

const getDashboard = pickHandler("getDashboard");
const getStudents = pickHandler("getStudents");
const getStudentDetail = pickHandler("getStudentDetail");
const getTeachers = pickHandler("getTeachers");
const getTeacherDetail = pickHandler("getTeacherDetail");
const getAnalytics = pickHandler("getAnalytics");
const getAlerts = pickHandler("getAlerts");
const resolveAlert = pickHandler("resolveAlert");
const getReports = pickHandler("getReports");
const getSessionHistory = pickHandler("getSessionHistory");
const getSessionDetail = pickHandler("getSessionDetail");
const serveSessionLessonPdf = pickHandler("serveSessionLessonPdf");
const serveSessionAdvicePdf = pickHandler("serveSessionAdvicePdf");
const startSessionAsAdmin = pickHandler("startSessionAsAdmin");
const stopSessionAsAdmin = pickHandler("stopSessionAsAdmin");

const analyzeSessionAsAdmin: RequestHandler =
  handlers.analyzeSessionAsAdmin ?? missingHandler("analyzeSessionAsAdmin");

route.use(authenticate, checkRole("SCHOOL_ADMIN", "SUPER_ADMIN"));

route.get("/dashboard", getDashboard);
route.get("/students", getStudents);
route.get("/students/:studentId", getStudentDetail);
route.get("/teachers", getTeachers);
route.get("/teachers/:teacherId", getTeacherDetail);
route.get("/analytics", getAnalytics);
route.get("/alerts", getAlerts);
route.patch("/alerts/:alertId/resolve", resolveAlert);
route.get("/reports", getReports);
route.get("/sessions", getSessionHistory);
route.get("/sessions/:sessionId", getSessionDetail);
route.get("/sessions/:sessionId/lesson-pdf", serveSessionLessonPdf);
route.get("/sessions/:sessionId/advice-pdf", serveSessionAdvicePdf);
route.post("/sessions/:sessionId/analyze", analyzeSessionAsAdmin);
route.post("/sessions/start", validate(AdminStartSessionSchema), startSessionAsAdmin);
route.post("/sessions/stop", validate(AdminStopSessionSchema), stopSessionAsAdmin);

export default route;
