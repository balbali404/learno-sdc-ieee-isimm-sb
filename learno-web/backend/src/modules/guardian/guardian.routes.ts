import express from "express";
import {
  assignNeuroTestToChild,
  createStudent,
  getAssignableNeuroTests,
  getStudentNeuroAssignments,
  getStudents,
  getStudentDetail,
  getStudentProgress,
  getSchools,
  getSchoolClasses,
  updateStudent,
} from "./guardian.controller.js";
import { authenticate } from "../../core/middleware/auth.middleware.js";
import { checkRole } from "../../core/middleware/rbac.js";
import { validate } from "../../core/middleware/validateRequest.js";
import {
  AssignGuardianNeuroTestSchema,
  CreateGuardianStudentSchema,
  UpdateGuardianStudentSchema,
} from "./guardian.validators.js";

const route = express.Router();

// All guardian routes require GUARDIAN role
route.use(authenticate, checkRole("GUARDIAN"));

// School/Class lookup (for student enrollment form)
route.get("/schools", getSchools);
route.get("/schools/:schoolId/classes", getSchoolClasses);

// Student management
route.post("/students", validate(CreateGuardianStudentSchema), createStudent);
route.get("/students", getStudents);
route.get("/students/:studentId", getStudentDetail);
route.patch("/students/:studentId", validate(UpdateGuardianStudentSchema), updateStudent);
route.get("/students/:studentId/progress", getStudentProgress);

// Neuro tests (guardian -> linked children)
route.get("/neuro/tests", getAssignableNeuroTests);
route.post("/neuro/assignments", validate(AssignGuardianNeuroTestSchema), assignNeuroTestToChild);
route.get("/students/:studentId/neuro-assignments", getStudentNeuroAssignments);

export default route;
