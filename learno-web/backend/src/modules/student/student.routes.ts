import express from "express";
import {
  // Lessons
  getLessons,
  getDraftLessons,
  getLessonDetail,
  getLessonPdf,
  approveLesson,
  rejectLesson,
  // Student Progress
  getStudentXP,
  getStudentProgress,
  startLesson,
  completeChapter,
  rateLesson,
  // Achievements
  getAchievements,
  getStudentAchievements,
  markAchievementSeen,
  // Dashboard
  getStudentDashboard,
  getStudentQuizStats,
  completeBrainChallenge,
  getLessonEngagement,
  getStudentSettings,
  updateStudentSettings,
  getStudentProfile,
} from "./student.controller.js";
import { authenticate } from "../../core/middleware/auth.middleware.js";
import { checkRole } from "../../core/middleware/rbac.js";
import { validate } from "../../core/middleware/validateRequest.js";
import {
  GetLessonsQuerySchema,
  ApproveLessonSchema,
  RejectLessonSchema,
  StartLessonSchema,
  CompleteChapterSchema,
  RateLessonSchema,
  CompleteBrainChallengeSchema,
} from "./student.validators.js";
import {
  UpdateNotificationPrefsSchema,
} from "../../core/validators/schemas.js";

const route = express.Router();

// All routes require authentication
route.use(authenticate);

// ═════════════════════════════════════════════════════
// TEACHER ROUTES — Lesson Approval (must be before :lessonId param routes)
// ═════════════════════════════════════════════════════

// Get draft lessons awaiting approval (Teacher only)
route.get("/lessons/drafts", checkRole("TEACHER"), getDraftLessons);

// Approve a draft lesson (Teacher only)
route.post("/lessons/approve", checkRole("TEACHER"), validate(ApproveLessonSchema), approveLesson);

// Reject a draft lesson (Teacher only)
route.post("/lessons/reject", checkRole("TEACHER"), validate(RejectLessonSchema), rejectLesson);

// ═════════════════════════════════════════════════════
// LESSON ROUTES (Both Teacher & Student can access)
// ═════════════════════════════════════════════════════

// Get all lessons (filtered by role - teachers see all, students see approved only)
route.get("/lessons", getLessons);

// Get single lesson detail
route.get("/lessons/:lessonId", getLessonDetail);

// Get lesson PDF (student only)
route.get("/lessons/:lessonId/pdf", checkRole("STUDENT"), getLessonPdf);

// ═════════════════════════════════════════════════════
// STUDENT ROUTES — Progress & XP
// ═════════════════════════════════════════════════════

// Get student dashboard
route.get("/dashboard", checkRole("STUDENT"), getStudentDashboard);

// Get student's XP and level
route.get("/xp", checkRole("STUDENT"), getStudentXP);

// Get student's lesson progress
route.get("/progress", checkRole("STUDENT"), getStudentProgress);

// Get quiz and score metrics
route.get("/quiz-stats", checkRole("STUDENT"), getStudentQuizStats);

// Get lesson engagement analytics
route.get("/engagement", checkRole("STUDENT"), getLessonEngagement);

// Start a lesson
route.post("/lessons/start", checkRole("STUDENT"), validate(StartLessonSchema), startLesson);

// Complete a chapter
route.post("/chapters/complete", checkRole("STUDENT"), validate(CompleteChapterSchema), completeChapter);

// Rate a lesson
route.post("/lessons/rate", checkRole("STUDENT"), validate(RateLessonSchema), rateLesson);

// Complete brain challenge and save XP
route.post(
  "/brain-challenge/complete",
  checkRole("STUDENT"),
  validate(CompleteBrainChallengeSchema),
  completeBrainChallenge,
);

// Student settings and profile
route.get("/profile", checkRole("STUDENT"), getStudentProfile);
route.get("/settings", checkRole("STUDENT"), getStudentSettings);
route.patch(
  "/settings",
  checkRole("STUDENT"),
  validate(UpdateNotificationPrefsSchema),
  updateStudentSettings,
);

// ═════════════════════════════════════════════════════
// ACHIEVEMENT ROUTES
// ═════════════════════════════════════════════════════

// Get all achievements (with unlock status for student)
route.get("/achievements", checkRole("STUDENT"), getAchievements);

// Get student's unlocked achievements
route.get("/achievements/unlocked", checkRole("STUDENT"), getStudentAchievements);

// Mark achievement as seen
route.patch("/achievements/:achievementId/seen", checkRole("STUDENT"), markAchievementSeen);

export default route;
