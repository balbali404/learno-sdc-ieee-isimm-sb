import { z } from "zod";

// ═════════════════════════════════════════════════════
// LESSON VALIDATORS
// ═════════════════════════════════════════════════════

export const GetLessonsQuerySchema = z.object({
  status: z.enum(["DRAFT", "APPROVED", "REJECTED", "ARCHIVED"]).optional(),
  subjectId: z.string().optional(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export const ApproveLessonSchema = z.object({
  lessonId: z.string().min(1, "Lesson ID is required"),
});

export const RejectLessonSchema = z.object({
  lessonId: z.string().min(1, "Lesson ID is required"),
  reason: z.string().min(1, "Rejection reason is required"),
});

// ═════════════════════════════════════════════════════
// STUDENT PROGRESS VALIDATORS
// ═════════════════════════════════════════════════════

export const StartLessonSchema = z.object({
  lessonId: z.string().min(1, "Lesson ID is required"),
});

export const CompleteChapterSchema = z.object({
  chapterId: z.string().min(1, "Chapter ID is required"),
  timeSpentMin: z.number().min(0).default(0),
});

export const RateLessonSchema = z.object({
  lessonId: z.string().min(1, "Lesson ID is required"),
  rating: z.number().min(1).max(5),
});

export const CompleteBrainChallengeSchema = z.object({
  challengeKey: z.string().min(1, "Challenge key is required"),
  subject: z.string().min(1).max(80).optional(),
  isCorrect: z.boolean(),
  xpEarned: z.number().int().min(0).max(150),
  durationSec: z.number().int().min(0).max(600).optional(),
  engagementScore: z.number().int().min(0).max(100).optional(),
  concentrationScore: z.number().int().min(0).max(100).optional(),
  source: z.enum(["BRAIN_CHALLENGE", "FOCUS_MODE", "QUIZ"]).optional(),
});

// ═════════════════════════════════════════════════════
// ACHIEVEMENT VALIDATORS
// ═════════════════════════════════════════════════════

export const MarkAchievementSeenSchema = z.object({
  achievementId: z.string().min(1, "Achievement ID is required"),
});

// ═════════════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════════════

export type GetLessonsQuery = z.infer<typeof GetLessonsQuerySchema>;
export type ApproveLessonInput = z.infer<typeof ApproveLessonSchema>;
export type RejectLessonInput = z.infer<typeof RejectLessonSchema>;
export type StartLessonInput = z.infer<typeof StartLessonSchema>;
export type CompleteChapterInput = z.infer<typeof CompleteChapterSchema>;
export type RateLessonInput = z.infer<typeof RateLessonSchema>;
export type CompleteBrainChallengeInput = z.infer<typeof CompleteBrainChallengeSchema>;
export type MarkAchievementSeenInput = z.infer<typeof MarkAchievementSeenSchema>;
