import express from "express";
import {
  getDashboard,
  getClasses,
  getClassStudents,
  getClassEnvironmentLatest,
  getStudents,
  getTimetable,
  getNotifications,
  readNotification,
  getSettings,
  updateSettings,
  getProfile,
  updateProfile,
  createStudent,
} from "./teacher.controller.js";
import { authenticate } from "../../core/middleware/auth.middleware.js";
import { checkRole } from "../../core/middleware/rbac.js";
import { validate } from "../../core/middleware/validateRequest.js";
import { UpdateNotificationPrefsSchema, UpdateProfileSchema, CreateStudentSchema } from "../../core/validators/schemas.js";

const route = express.Router();

// All teacher routes require TEACHER role
route.use(authenticate, checkRole("TEACHER"));

route.get("/dashboard", getDashboard);
route.get("/classes", getClasses);
route.get("/classes/:classId/students", getClassStudents);
route.get("/classes/:classId/environment/latest", getClassEnvironmentLatest);
route.get("/students", getStudents);
route.get("/timetable", getTimetable);

route.get("/notifications", getNotifications);
route.patch("/notifications/:id/read", readNotification);

route.get("/settings", getSettings);
route.patch("/settings", validate(UpdateNotificationPrefsSchema), updateSettings);

// Profile management
route.get("/profile", getProfile);
route.patch("/profile", validate(UpdateProfileSchema), updateProfile);

// Student management
route.post("/students", validate(CreateStudentSchema), createStudent);

export default route;
