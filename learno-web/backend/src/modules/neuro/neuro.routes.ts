import express from "express";
import { authenticate } from "../../core/middleware/auth.middleware.js";
import { checkRole } from "../../core/middleware/rbac.js";
import { validate } from "../../core/middleware/validateRequest.js";
import {
  assignNeuroTestByCriteria,
  assignNeuroTestToStudent,
  bootstrapDefaultNeuroTests,
  createNeuroTest,
  getConditionCatalog,
  getStudentMyNeuroAssignmentDetail,
  getStudentConditionForTheme,
  getStudentConditionHistory,
  getStudentMyNeuroAssignments,
  getStudentMyNeuroResults,
  getTeacherNeuroAssignmentDetail,
  getTeacherNeuroAssignments,
  getTeacherNeuroRecommendations,
  listNeuroTests,
  reviewNeuroAttempt,
  setStudentConditionManually,
  startMyNeuroAssignment,
  submitMyNeuroAttempt,
  updateNeuroAssignment,
  updateNeuroTest,
} from "./neuro.controller.js";
import {
  AssignNeuroTestByCriteriaSchema,
  AssignNeuroTestSchema,
  CreateNeuroTestSchema,
  ManualSetStudentConditionSchema,
  ReviewNeuroAttemptSchema,
  SubmitNeuroAttemptSchema,
  UpdateNeuroAssignmentSchema,
  UpdateNeuroTestSchema,
} from "./neuro.validators.js";

const route = express.Router();

route.use(authenticate);

// Shared read endpoint for dashboard theming
route.get(
  "/student-condition",
  checkRole("STUDENT", "TEACHER", "GUARDIAN", "SCHOOL_ADMIN", "SUPER_ADMIN"),
  getStudentConditionForTheme,
);
route.get(
  "/student-condition/:studentId",
  checkRole("STUDENT", "TEACHER", "GUARDIAN", "SCHOOL_ADMIN", "SUPER_ADMIN"),
  getStudentConditionForTheme,
);

// Conditions catalog
route.get("/conditions", checkRole("TEACHER", "SCHOOL_ADMIN", "SUPER_ADMIN"), getConditionCatalog);

// Test definitions
route.get("/tests", checkRole("TEACHER", "SCHOOL_ADMIN", "SUPER_ADMIN"), listNeuroTests);
route.post(
  "/tests",
  checkRole("SCHOOL_ADMIN", "SUPER_ADMIN"),
  validate(CreateNeuroTestSchema),
  createNeuroTest,
);
route.patch(
  "/tests/:testId",
  checkRole("SCHOOL_ADMIN", "SUPER_ADMIN"),
  validate(UpdateNeuroTestSchema),
  updateNeuroTest,
);
route.post(
  "/tests/bootstrap-defaults",
  checkRole("SCHOOL_ADMIN", "SUPER_ADMIN"),
  bootstrapDefaultNeuroTests,
);

// Teacher assignment and review flow
route.post(
  "/assignments",
  checkRole("TEACHER"),
  validate(AssignNeuroTestSchema),
  assignNeuroTestToStudent,
);
route.post(
  "/assignments/bulk",
  checkRole("TEACHER"),
  validate(AssignNeuroTestByCriteriaSchema),
  assignNeuroTestByCriteria,
);
route.get(
  "/assignments/teacher",
  checkRole("TEACHER"),
  getTeacherNeuroAssignments,
);
route.get(
  "/assignments/:assignmentId/teacher",
  checkRole("TEACHER"),
  getTeacherNeuroAssignmentDetail,
);
route.get(
  "/assignments/teacher/recommendations",
  checkRole("TEACHER"),
  getTeacherNeuroRecommendations,
);
route.patch(
  "/assignments/:assignmentId",
  checkRole("TEACHER"),
  validate(UpdateNeuroAssignmentSchema),
  updateNeuroAssignment,
);
route.patch(
  "/attempts/:attemptId/review",
  checkRole("TEACHER"),
  validate(ReviewNeuroAttemptSchema),
  reviewNeuroAttempt,
);
route.patch(
  "/students/:studentId/condition",
  checkRole("TEACHER"),
  validate(ManualSetStudentConditionSchema),
  setStudentConditionManually,
);
route.get(
  "/students/:studentId/condition-history",
  checkRole("STUDENT", "TEACHER", "SCHOOL_ADMIN", "SUPER_ADMIN"),
  getStudentConditionHistory,
);

// Student assignment flow
route.get("/assignments/me", checkRole("STUDENT"), getStudentMyNeuroAssignments);
route.get("/assignments/me/results", checkRole("STUDENT"), getStudentMyNeuroResults);
route.get("/assignments/:assignmentId/me", checkRole("STUDENT"), getStudentMyNeuroAssignmentDetail);
route.patch(
  "/assignments/:assignmentId/start",
  checkRole("STUDENT"),
  startMyNeuroAssignment,
);
route.post(
  "/assignments/:assignmentId/submit",
  checkRole("STUDENT"),
  validate(SubmitNeuroAttemptSchema),
  submitMyNeuroAttempt,
);

export default route;
