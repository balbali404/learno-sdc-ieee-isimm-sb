import { z } from "zod";

// ── Webhook Payload from FastAPI ────────────────────

export const WebhookPayloadSchema = z.object({
  event: z.string(),
  session_id: z.string(),
  timestamp: z.string(),
  data: z.record(z.string(), z.any()),
});

export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;

// ── Alert from FastAPI ──────────────────────────────

const AlertSeverityEnum = z.enum(["info", "warning", "critical"]);
const AlertTypeEnum = z.enum([
  "teacher_dominating",
  "long_silence",
  "background_noise",
  "low_engagement",
  "session_started",
  "session_ended",
  "processing_complete",
  "recording_received",
  "session_missed",
]);

export const AlertDataSchema = z.object({
  alert_type: AlertTypeEnum,
  session_id: z.string(),
  message: z.string(),
  severity: AlertSeverityEnum.default("info"),
  data: z.record(z.string(), z.any()).optional().nullable(),
  timestamp: z.string().optional(),
});

export type AlertData = z.infer<typeof AlertDataSchema>;

// ═══════════════════════════════════════════════════════════
// LESSON DATA (from FastAPI webhook) - Must be defined before ProcessingCompleteDataSchema
// ═══════════════════════════════════════════════════════════

export const LessonChapterSchema = z.object({
  chapterId: z.string(),
  chapterNumber: z.number().int(),
  title: z.string(),
  content: z.string(),
  summary: z.string().optional().nullable(),
  durationMin: z.number().int().default(5),
  readingTimeSec: z.number().int().default(120),
  xpReward: z.number().int().default(30),
  keyInsight: z.string().optional().nullable(),
  keyPoints: z.array(z.string()).optional().nullable(),
});

export const LessonDataSchema = z.object({
  lessonId: z.string(),
  sessionId: z.string().nullable().optional(),
  teacherId: z.string().nullable().optional(),
  classId: z.string().nullable().optional(),
  subjectId: z.string().nullable().optional(),
  title: z.string(),
  subject: z.string(),
  subjectColor: z.string().optional(),
  description: z.string().optional().nullable(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("INTERMEDIATE"),
  gradeLevel: z.number().int().default(10),
  ageGroup: z.string().optional().nullable(),
  totalDurationMin: z.number().int().default(25),
  totalXP: z.number().int().default(100),
  chapters: z.array(LessonChapterSchema),
  keyVocabulary: z.array(z.object({
    term: z.string(),
    definition: z.string(),
  })).optional().nullable(),
  learningObjectives: z.array(z.string()).optional().nullable(),
  language: z.string().optional().nullable(),
  pdfPath: z.string().optional().nullable(),
  jsonPath: z.string().optional().nullable(),
});
export type LessonData = z.infer<typeof LessonDataSchema>;

// ── Processing Complete payload ─────────────────────

export const ProcessingCompleteDataSchema = z.object({
  sessionId: z.string(),
  teacherId: z.string(),
  timetableId: z.string().optional().nullable(),
  classId: z.string().optional().nullable(),
  subjectId: z.string().optional().nullable(),

  // Talk time metrics
  teacherRatio: z.number().optional().nullable(),
  studentRatio: z.number().optional().nullable(),
  teacherMinutes: z.number().optional().nullable(),
  studentMinutes: z.number().optional().nullable(),

  // Engagement
  engagementScore: z.number().optional().nullable(),
  engagementBand: z.string().optional().nullable(),

  // Silence summary
  silenceCount: z.number().optional().nullable(),
  longestSilenceSec: z.number().optional().nullable(),
  totalSilenceSec: z.number().optional().nullable(),

  // Transcription
  transcriptText: z.string().optional().nullable(),

  // Transcription NLP metadata
  transcriptionMeta: z.object({
    model_used: z.string().optional(),
    language: z.string().optional(),
    word_count: z.number().optional(),
    confusion_keywords: z.array(z.any()).optional(),
    question_density: z.record(z.string(), z.any()).optional(),
    word_repetitions: z.array(z.any()).optional(),
  }).optional().nullable(),

  // Generated files
  lessonPdfPath: z.string().optional().nullable(),
  lessonJsonPath: z.string().optional().nullable(),
  advicePdfPath: z.string().optional().nullable(),
  visionJsonPath: z.string().optional().nullable(),
  visionAnnotatedVideoPath: z.string().optional().nullable(),
  visionSmartOption: z.string().optional().nullable(),
  visionSummary: z.record(z.string(), z.any()).optional().nullable(),
  visionAnalysis: z.record(z.string(), z.any()).optional().nullable(),
  classEngagementAvg: z.number().optional().nullable(),
  classEngagementMin: z.number().optional().nullable(),
  classEngagementMax: z.number().optional().nullable(),
  classStudentCount: z.number().int().optional().nullable(),
  lowEngagementCount: z.number().int().optional().nullable(),
  totalFramesAnalyzed: z.number().int().optional().nullable(),
  adviceSummary: z.array(z.any()).optional().nullable(),
  adviceText: z.string().optional().nullable(),
  sessionJsonPath: z.string().optional().nullable(),

  // Advanced metrics payload
  advancedMetrics: z.record(z.string(), z.any()).optional().nullable(),
  alertFlags: z.record(z.string(), z.any()).optional().nullable(),

  // Lesson data from AI (for student dashboard)
  lessonData: LessonDataSchema.optional().nullable(),

  // Alerts
  alerts: z.array(z.any()).optional().nullable(),

  // Timestamp
  processedAt: z.string().optional().nullable(),
  finalResultJsonPath: z.string().optional().nullable(),
});

export type ProcessingCompleteData = z.infer<typeof ProcessingCompleteDataSchema>;

// ── Start Session Request (from teacher) ────────────

export const StartSessionSchema = z.object({
  timetableId: z.string(),
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  courseName: z.string().optional(),
  roomId: z.string().optional(),
  scheduledDurationMinutes: z.number().int().positive().default(60),
  autoStart: z.boolean().default(false),
  forceStopPrevious: z.boolean().default(true),
  gradeLevel: z.number().int().min(1).max(12).default(10),
  studentAge: z.number().int().min(5).max(25).optional(),
  visionSmartOption: z.enum(["off", "summary", "enhanced"]).optional(),
  now: z.string().optional(),
});

export type StartSessionInput = z.infer<typeof StartSessionSchema>;

// ── Stop Session Request ────────────────────────────

export const StopSessionSchema = z.object({
  sessionId: z.string(),
  reason: z.string().optional().default("manual"),
  force: z.boolean().optional().default(false),
});

export type StopSessionInput = z.infer<typeof StopSessionSchema>;

// ═══════════════════════════════════════════════════════════
// STUDENT LESSON ENDPOINTS
// ═══════════════════════════════════════════════════════════

export const GetLessonsQuerySchema = z.object({
  subject: z.string().optional(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  gradeLevel: z.coerce.number().int().min(1).max(12).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type GetLessonsQuery = z.infer<typeof GetLessonsQuerySchema>;

export const UpdateChapterProgressSchema = z.object({
  chapterId: z.string().min(1),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]),
  timeSpentMin: z.number().int().min(0).optional(),
});
export type UpdateChapterProgressInput = z.infer<typeof UpdateChapterProgressSchema>;

export const RateLessonSchema = z.object({
  rating: z.number().int().min(1).max(5),
});
export type RateLessonInput = z.infer<typeof RateLessonSchema>;
