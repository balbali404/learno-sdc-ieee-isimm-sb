import express from "express";
import {
  addCoAdmin,
  addTeacher,
  getTeachers,
  removeTeacher,
  getPendingEnrollments,
  handleEnrollment,
  getStudents,
  removeStudent,
  createClass,
  getClasses,
  deleteClass,
  createSubject,
  getSubjects,
  deleteSubject,
  createTimetableEntry,
  getTimetable,
  deleteTimetableEntry,
} from "./school.controller.js";
import { authenticate } from "../../core/middleware/auth.middleware.js";
import { checkRole } from "../../core/middleware/rbac.js";
import { validate } from "../../core/middleware/validateRequest.js";
import {
  CreateUserSchema,
  CreateClassSchema,
  CreateSubjectSchema,
  CreateTimetableSchema,
  EnrollmentActionSchema,
} from "../../core/validators/schemas.js";

const route = express.Router();

// All school routes require SCHOOL_ADMIN
route.use(authenticate, checkRole("SCHOOL_ADMIN"));

// Co-Admins
route.post("/co-admins", validate(CreateUserSchema), addCoAdmin);

// Teachers
route.post("/teachers", validate(CreateUserSchema), addTeacher);
route.get("/teachers", getTeachers);
route.delete("/teachers/:id", removeTeacher);

// Enrollment management (guardian creates student → school approves)
route.get("/enrollments/pending", getPendingEnrollments);
route.post("/enrollments/handle", validate(EnrollmentActionSchema), handleEnrollment);

// Students (view & remove)
route.get("/students", getStudents);
route.delete("/students/:id", removeStudent);

// Classes
route.post("/classes", validate(CreateClassSchema), createClass);
route.get("/classes", getClasses);
route.delete("/classes/:id", deleteClass);

// Subjects
route.post("/subjects", validate(CreateSubjectSchema), createSubject);
route.get("/subjects", getSubjects);
route.delete("/subjects/:id", deleteSubject);

// Timetable
route.post("/timetable", validate(CreateTimetableSchema), createTimetableEntry);
route.get("/timetable", getTimetable);
route.delete("/timetable/:id", deleteTimetableEntry);

export default route;
