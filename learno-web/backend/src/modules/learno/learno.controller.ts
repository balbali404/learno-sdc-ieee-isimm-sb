import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import prisma from "../../config/prisma.js";
import { io } from "../../core/socket.js";
import { refreshEnvironmentIngest } from "../../core/jobs/environmentIngest.js";
import {
  WebhookPayloadSchema,
  ProcessingCompleteDataSchema,
  AlertDataSchema,
  type WebhookPayload,
  type ProcessingCompleteData,
  type AlertData,
  type StartSessionInput,
  type StopSessionInput,
} from "./learno.validators.js";

type PrismaJsonObject = Record<string, unknown>;
const prismaAny = prisma as any;

// ── FastAPI base URL ────────────────────────────────
const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "your-webhook-secret-here";

// ═════════════════════════════════════════════════════
// ALERT TYPE MAPPING (snake_case → Prisma enum)
// ═════════════════════════════════════════════════════

const ALERT_TYPE_MAP: Record<string, string> = {
  teacher_dominating: "TEACHER_DOMINATING",
  long_silence: "LONG_SILENCE",
  low_engagement: "LOW_ENGAGEMENT",
  session_started: "SESSION_STARTED",
  session_ended: "SESSION_ENDED",
  processing_complete: "PROCESSING_COMPLETE",
  recording_received: "RECORDING_RECEIVED",
};

const SEVERITY_MAP: Record<string, string> = {
  info: "INFO",
  warning: "WARNING",
  critical: "CRITICAL",
};

const dayOrder = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const toDayIndex = (day: string): number => {
  const index = dayOrder.indexOf(day.toUpperCase());
  return index === -1 ? 0 : index;
};

const asMinutes = (value: Date): number => {
  return value.getUTCHours() * 60 + value.getUTCMinutes();
};

const toTimeOnly = (value: Date): string => {
  const hours = String(value.getUTCHours()).padStart(2, "0");
  const minutes = String(value.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const isWithinWindow = (value: number, start: number, end: number, graceMinutes = 10): boolean => {
  const startWindow = Math.max(0, start - graceMinutes);
  const endWindow = Math.min(1440, end + graceMinutes);
  if (endWindow < startWindow) {
    return value >= startWindow || value <= endWindow;
  }

  return value >= startWindow && value <= endWindow;
};

const buildNotificationMessage = (timetable: {
  class?: { name: string } | null;
  subject?: { name: string } | null;
  startTime: Date;
  endTime: Date;
}) => {
  const classLabel = timetable.class?.name ?? "Class";
  const subjectLabel = timetable.subject?.name ?? "Subject";
  const startLabel = toTimeOnly(timetable.startTime);
  const endLabel = toTimeOnly(timetable.endTime);
  return `${subjectLabel} · ${classLabel} (${startLabel} - ${endLabel})`;
};

const toAsciiFileName = (input: string, fallback: string): string => {
  const normalized = input
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[_\.]+|[_\.]+$/g, "");

  return normalized || fallback;
};

const toJsonObject = (value: unknown): PrismaJsonObject | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as PrismaJsonObject;
};

const seatFromDetectedId = (detectedStudentId: string): number | null => {
  const value = Number.parseInt(detectedStudentId, 10);
  if (!Number.isFinite(value)) {
    return null;
  }
  if (value < 0) {
    return null;
  }
  return value + 1;
};

const extractVisionStudents = (data: ProcessingCompleteData): Array<{
  detectedStudentId: string;
  meanCaes: number | null;
  minCaes: number | null;
  maxCaes: number | null;
  trend: string | null;
  lowEngagement: boolean;
  framesAnalyzed: number | null;
  payload: PrismaJsonObject;
}> => {
  const students: Array<{
    detectedStudentId: string;
    meanCaes: number | null;
    minCaes: number | null;
    maxCaes: number | null;
    trend: string | null;
    lowEngagement: boolean;
    framesAnalyzed: number | null;
    payload: PrismaJsonObject;
  }> = [];

  const smart = toJsonObject(data.visionAnalysis?.smart);
  const enhancement = toJsonObject(smart?.enhancement);
  const summary = toJsonObject(enhancement?.summary);
  const studentRows = Array.isArray(summary?.students) ? summary?.students : [];

  for (const row of studentRows) {
    const payload = toJsonObject(row);
    if (!payload) {
      continue;
    }

    const detectedStudentId = String(payload.detectedStudentId ?? "").trim();
    if (!detectedStudentId) {
      continue;
    }

    const meanCaesRaw = payload.meanCaes;
    const meanCaes =
      typeof meanCaesRaw === "number" && Number.isFinite(meanCaesRaw)
        ? meanCaesRaw
        : null;
    const minCaesRaw = payload.minCaes;
    const minCaes =
      typeof minCaesRaw === "number" && Number.isFinite(minCaesRaw)
        ? minCaesRaw
        : meanCaes;
    const maxCaesRaw = payload.maxCaes;
    const maxCaes =
      typeof maxCaesRaw === "number" && Number.isFinite(maxCaesRaw)
        ? maxCaesRaw
        : meanCaes;
    const trendRaw = payload.trend;
    const trend = typeof trendRaw === "string" && trendRaw.trim() ? trendRaw.trim() : null;
    const lowEngagement = payload.lowEngagement === true;
    const framesAnalyzedRaw = payload.framesAnalyzed;
    const framesAnalyzed =
      typeof framesAnalyzedRaw === "number" && Number.isFinite(framesAnalyzedRaw)
        ? Math.max(0, Math.round(framesAnalyzedRaw))
        : null;

    students.push({
      detectedStudentId,
      meanCaes,
      minCaes,
      maxCaes,
      trend,
      lowEngagement,
      framesAnalyzed,
      payload,
    });
  }

  return students;
};

const toRounded = (value: number | null): number | null => {
  if (value === null || !Number.isFinite(value)) {
    return null;
  }
  return Math.round(value * 10000) / 10000;
};

const sanitizeVisionRaw = (value: unknown): PrismaJsonObject | undefined => {
  const payload = toJsonObject(value);
  if (!payload) {
    return undefined;
  }

  const copy: PrismaJsonObject = { ...payload };
  delete copy.events;
  return copy;
};

const validateSessionWindow = async (teacherId: string, timetableId: string, now: Date) => {
  const timetable = await prisma.timetable.findUnique({
    where: { id: timetableId },
    select: {
      id: true,
      teacherId: true,
      day: true,
      startTime: true,
      endTime: true,
      classId: true,
      subjectId: true,
      class: { select: { name: true } },
      subject: { select: { name: true } },
    },
  });

  if (!timetable || timetable.teacherId !== teacherId) {
    return { ok: false, message: "Timetable entry not found for this teacher." };
  }

  return {
    ok: true,
    timetable,
  };
};

// ═════════════════════════════════════════════════════
// WEBHOOK HANDLER — receives POST from FastAPI
// ═════════════════════════════════════════════════════

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();

  try {
    // Validate webhook secret
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");

    if (token !== WEBHOOK_SECRET) {
      res.status(401).json({ error: "Invalid webhook secret" });
      return;
    }

    // Validate payload shape
    const parsed = WebhookPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
      return;
    }

    const payload = parsed.data;
    console.log(`📡 Webhook received: event=${payload.event}, session=${payload.session_id}`);

    // Log the webhook
    await logWebhook(payload, startTime);

    // Dispatch by event type
    switch (payload.event) {
      case "processing_complete":
        await handleProcessingComplete(payload);
        break;

      case "processing_failed":
        await handleProcessingFailed(payload);
        break;

      case "alert":
        await handleAlertEvent(payload);
        break;

      case "processing_started":
        await handleProcessingStarted(payload);
        break;

      default:
        console.log(`   Unknown event type: ${payload.event}`);
    }

    res.json({ success: true, event: payload.event });
  } catch (error) {
    console.error("Webhook handler error:", error);
    res.status(500).json({ error: "Internal webhook processing error" });
  }
};

// ═════════════════════════════════════════════════════
// EVENT HANDLERS
// ═════════════════════════════════════════════════════

async function handleProcessingComplete(payload: WebhookPayload): Promise<void> {
  const dataParsed = ProcessingCompleteDataSchema.safeParse(payload.data);
  if (!dataParsed.success) {
    console.error("Invalid processing_complete data:", dataParsed.error.flatten());
    return;
  }

  const data = dataParsed.data;
  const sessionId = data.sessionId;

  // Resolve engagement score to integer
  const engagementScoreRaw = data.engagementScore;
  const engagementScore = engagementScoreRaw != null ? Math.round(engagementScoreRaw) : null;

  // ── Upsert Session ────────────────────────────────
  await prisma.session.upsert({
    where: { id: sessionId },
    create: {
      id: sessionId,
      teacherId: data.teacherId,
      timetableId: data.timetableId ?? null,
      classId: data.classId ?? null,
      subjectId: data.subjectId ?? null,
      status: "COMPLETED",
      teacherRatio: data.teacherRatio ?? null,
      studentRatio: data.studentRatio ?? null,
      teacherMinutes: data.teacherMinutes ?? null,
      studentMinutes: data.studentMinutes ?? null,
      engagementScore,
      engagementBand: data.engagementBand ?? null,
      silenceCount: data.silenceCount ?? null,
      longestSilenceSec: data.longestSilenceSec ?? null,
      totalSilenceSec: data.totalSilenceSec ?? null,
      transcriptText: data.transcriptText ?? null,
      lessonPdfPath: data.lessonPdfPath ?? null,
      advicePdfPath: data.advicePdfPath ?? null,
      sessionJsonPath: data.sessionJsonPath ?? null,
      processedAt: data.processedAt ? new Date(data.processedAt) : new Date(),
    },
    update: {
      status: "COMPLETED",
      teacherRatio: data.teacherRatio ?? undefined,
      studentRatio: data.studentRatio ?? undefined,
      teacherMinutes: data.teacherMinutes ?? undefined,
      studentMinutes: data.studentMinutes ?? undefined,
      engagementScore: engagementScore ?? undefined,
      engagementBand: data.engagementBand ?? undefined,
      silenceCount: data.silenceCount ?? undefined,
      longestSilenceSec: data.longestSilenceSec ?? undefined,
      totalSilenceSec: data.totalSilenceSec ?? undefined,
      transcriptText: data.transcriptText ?? undefined,
      lessonPdfPath: data.lessonPdfPath ?? undefined,
      advicePdfPath: data.advicePdfPath ?? undefined,
      sessionJsonPath: data.sessionJsonPath ?? undefined,
      processedAt: data.processedAt ? new Date(data.processedAt) : new Date(),
    },
  });

  console.log(`   ✅ Session ${sessionId} saved/updated (COMPLETED)`);

  // ── Persist vision analysis (raw + per-student mapping) ───────────
  const rawVisionPayload = sanitizeVisionRaw(data.visionAnalysis);
  const summaryFromPayload = toJsonObject(data.visionSummary);
  const summaryFromVision = rawVisionPayload
    ? toJsonObject((rawVisionPayload as PrismaJsonObject).summary)
    : undefined;
  const smartOption =
    typeof data.visionSmartOption === "string" && data.visionSmartOption.trim()
      ? data.visionSmartOption.trim()
      : rawVisionPayload &&
          typeof (rawVisionPayload as PrismaJsonObject).smart === "object" &&
          (rawVisionPayload as PrismaJsonObject).smart !== null &&
          typeof ((rawVisionPayload as PrismaJsonObject).smart as PrismaJsonObject).mode === "string"
        ? (((rawVisionPayload as PrismaJsonObject).smart as PrismaJsonObject).mode as string)
        : null;

  const visionStudents = extractVisionStudents(data);
  const classStudentCount = visionStudents.length;
  const classMeanValues = visionStudents
    .map((student) => student.meanCaes)
    .filter((value): value is number => value !== null && Number.isFinite(value));
  const classMinValues = visionStudents
    .map((student) => student.minCaes)
    .filter((value): value is number => value !== null && Number.isFinite(value));
  const classMaxValues = visionStudents
    .map((student) => student.maxCaes)
    .filter((value): value is number => value !== null && Number.isFinite(value));

  const classEngagementAvg = classMeanValues.length > 0
    ? toRounded(classMeanValues.reduce((sum, value) => sum + value, 0) / classMeanValues.length)
    : null;
  const classEngagementMin = classMinValues.length > 0
    ? toRounded(Math.min(...classMinValues))
    : null;
  const classEngagementMax = classMaxValues.length > 0
    ? toRounded(Math.max(...classMaxValues))
    : null;
  const lowEngagementCount = visionStudents.filter((student) => student.lowEngagement).length;
  const totalFramesAnalyzed = visionStudents
    .map((student) => student.framesAnalyzed)
    .filter((value): value is number => value !== null && Number.isFinite(value))
    .reduce((sum, value) => sum + value, 0);

  const visionRecord = await prismaAny.sessionVisionAnalysis.upsert({
    where: { sessionId },
    create: {
      sessionId,
      visionJsonPath: null,
      annotatedVideoPath: data.visionAnnotatedVideoPath ?? null,
      smartOption,
      classEngagementAvg,
      classEngagementMin,
      classEngagementMax,
      classStudentCount,
      lowEngagementCount,
      totalFramesAnalyzed: totalFramesAnalyzed > 0 ? totalFramesAnalyzed : null,
      summary: (summaryFromPayload ?? summaryFromVision ?? null) as any,
      raw: (rawVisionPayload ?? null) as any,
    },
    update: {
      visionJsonPath: null,
      annotatedVideoPath: data.visionAnnotatedVideoPath ?? undefined,
      smartOption: smartOption ?? undefined,
      classEngagementAvg: classEngagementAvg ?? undefined,
      classEngagementMin: classEngagementMin ?? undefined,
      classEngagementMax: classEngagementMax ?? undefined,
      classStudentCount,
      lowEngagementCount,
      totalFramesAnalyzed: totalFramesAnalyzed > 0 ? totalFramesAnalyzed : undefined,
      summary: (summaryFromPayload ?? summaryFromVision ?? undefined) as any,
      raw: (rawVisionPayload ?? undefined) as any,
    },
  });

  await prisma.session.update({
    where: { id: sessionId },
    data: {
      sessionJsonPath: data.finalResultJsonPath ?? undefined,
    },
  });

  await prismaAny.sessionVisionStudent.deleteMany({
    where: { visionAnalysisId: visionRecord.id },
  });

  if (visionStudents.length > 0) {
    const seatToStudentId = new Map<number, string>();
    if (data.classId) {
      const enrollments = await prisma.studentClass.findMany({
        where: {
          classId: data.classId,
          status: "APPROVED",
          seatNumber: { not: null },
        },
        select: {
          studentId: true,
          seatNumber: true,
        },
      });

      for (const enrollment of enrollments) {
        if (enrollment.seatNumber != null) {
          seatToStudentId.set(enrollment.seatNumber, enrollment.studentId);
        }
      }
    }

    await prismaAny.sessionVisionStudent.createMany({
      data: visionStudents.map((student) => {
        const seatNumber = seatFromDetectedId(student.detectedStudentId);
        const mappedStudentId =
          seatNumber != null ? seatToStudentId.get(seatNumber) ?? null : null;

        return {
          visionAnalysisId: visionRecord.id,
          sessionId,
          studentId: mappedStudentId,
          seatNumber,
          detectedStudentId: student.detectedStudentId,
          meanCaes: student.meanCaes,
          minCaes: student.minCaes,
          maxCaes: student.maxCaes,
          trend: student.trend,
          lowEngagement: student.lowEngagement,
          framesAnalyzed: student.framesAnalyzed,
          payload: student.payload as any,
        };
      }),
    });
  }

  // ── Create LessonSummary if we have transcript ────
  if (data.transcriptText) {
    const transcriptionMeta = data.transcriptionMeta;
    const wordCount = transcriptionMeta?.word_count ?? data.transcriptText.split(/\s+/).length;
    const estimatedReadMinutes = Math.ceil(wordCount / 200);

    await prisma.lessonSummary.upsert({
      where: { sessionId },
      create: {
        sessionId,
        title: null, // Will be populated if Gemini provides it
        summary: data.transcriptText.substring(0, 500),
        fullContent: data.transcriptText,
        aiModelUsed: transcriptionMeta?.model_used ?? "whisper-small",
        wordCount,
        estimatedReadMinutes,
        pdfPath: data.lessonPdfPath ?? null,
      },
      update: {
        summary: data.transcriptText.substring(0, 500),
        fullContent: data.transcriptText,
        aiModelUsed: transcriptionMeta?.model_used ?? "whisper-small",
        wordCount,
        estimatedReadMinutes,
        pdfPath: data.lessonPdfPath ?? undefined,
      },
    });

    console.log(`   📚 LessonSummary saved for session ${sessionId}`);
  }

  // ── Create Lesson with chapters (DRAFT status) ────
  if (data.lessonData) {
    const lessonData = data.lessonData;
    
    // Map difficulty string to enum
    const difficultyMap: Record<string, string> = {
      BEGINNER: "BEGINNER",
      INTERMEDIATE: "INTERMEDIATE", 
      ADVANCED: "ADVANCED",
    };
    const difficulty = difficultyMap[lessonData.difficulty] || "INTERMEDIATE";

    // Create or update the lesson as DRAFT
    const lesson = await prisma.lesson.upsert({
      where: { sessionId },
      create: {
        sessionId,
        teacherId: data.teacherId,
        classId: data.classId ?? null,
        subjectId: data.subjectId ?? null,
        title: lessonData.title,
        description: lessonData.description ?? null,
        difficulty: difficulty as any,
        gradeLevel: lessonData.gradeLevel,
        ageGroup: lessonData.ageGroup ?? null,
        totalDurationMin: lessonData.totalDurationMin,
        totalXP: lessonData.totalXP,
        pdfPath: lessonData.pdfPath ?? null,
        jsonPath: lessonData.jsonPath ?? null,
        learningObjectives: lessonData.learningObjectives ?? undefined,
        keyVocabulary: lessonData.keyVocabulary ?? undefined,
        subjectColor: lessonData.subjectColor ?? null,
        language: lessonData.language ?? null,
        status: "DRAFT", // Lessons come as DRAFT - teacher must approve
        isPublished: false,
      },
      update: {
        title: lessonData.title,
        description: lessonData.description ?? undefined,
        difficulty: difficulty as any,
        gradeLevel: lessonData.gradeLevel,
        ageGroup: lessonData.ageGroup ?? undefined,
        totalDurationMin: lessonData.totalDurationMin,
        totalXP: lessonData.totalXP,
        pdfPath: lessonData.pdfPath ?? undefined,
        jsonPath: lessonData.jsonPath ?? undefined,
        learningObjectives: lessonData.learningObjectives ?? undefined,
        keyVocabulary: lessonData.keyVocabulary ?? undefined,
        subjectColor: lessonData.subjectColor ?? undefined,
        language: lessonData.language ?? undefined,
      },
    });

    // Create chapters
    if (lessonData.chapters && lessonData.chapters.length > 0) {
      // Delete existing chapters first (in case of re-processing)
      await prisma.chapter.deleteMany({ where: { lessonId: lesson.id } });

      // Create new chapters
      await prisma.chapter.createMany({
        data: lessonData.chapters.map((ch) => ({
          lessonId: lesson.id,
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          content: ch.content,
          summary: ch.summary ?? null,
          durationMin: ch.durationMin,
          readingTimeSec: ch.readingTimeSec,
          xpReward: ch.xpReward,
          keyInsight: ch.keyInsight ?? null,
          keyPoints: ch.keyPoints ?? undefined,
        })),
      });
    }

    console.log(`   📖 Lesson DRAFT created: ${lesson.id} with ${lessonData.chapters?.length ?? 0} chapters`);

    // Create notification for teacher to review the draft lesson
    await prisma.notification.create({
      data: {
        userId: data.teacherId,
        type: "AI_ALERT",
        title: "New Lesson Ready for Review",
        message: `AI has generated a lesson "${lessonData.title}" from your class session. Please review and approve it.`,
      },
    });
  }

  // ── Create TeacherAdvice if we have advice data ───
  if (data.adviceText || data.adviceSummary) {
    await prisma.teacherAdvice.upsert({
      where: { sessionId },
      create: {
        sessionId,
        teacherId: data.teacherId,
        overallScore: engagementScore,
        overallFeedback: data.adviceText ?? null,
        recommendations: data.adviceSummary ? data.adviceSummary : undefined,
        metricsSnapshot: data.transcriptionMeta ? (data.transcriptionMeta as any) : undefined,
        pdfPath: data.advicePdfPath ?? null,
      },
      update: {
        overallScore: engagementScore ?? undefined,
        overallFeedback: data.adviceText ?? undefined,
        recommendations: data.adviceSummary ? data.adviceSummary : undefined,
        metricsSnapshot: data.transcriptionMeta ? (data.transcriptionMeta as any) : undefined,
        pdfPath: data.advicePdfPath ?? undefined,
      },
    });

    console.log(`   💡 TeacherAdvice saved for session ${sessionId}`);
  }

  // ── Save alerts from the payload ──────────────────
  const alerts = data.alerts || [];
  for (const alert of alerts) {
    const alertType = ALERT_TYPE_MAP[alert.alert_type] || "PROCESSING_COMPLETE";
    const severity = SEVERITY_MAP[alert.severity] || "INFO";

    await prisma.sessionAlert.create({
      data: {
        sessionId,
        alertType: alertType as any,
        message: alert.message || "Alert",
        severity: severity as any,
        data: alert.data ? alert.data : undefined,
      },
    });
  }

  if (alerts.length > 0) {
    console.log(`   🔔 ${alerts.length} alerts saved for session ${sessionId}`);
  }

  // ── Create Notification for the teacher ───────────
  await prisma.notification.create({
    data: {
      userId: data.teacherId,
      type: "AI_ALERT",
      title: "Session Processing Complete",
      message: `Your classroom session has been analyzed. Engagement: ${data.engagementBand ?? "N/A"} (${engagementScore ?? 0}/100)`,
    },
  });

  // ── Emit Socket.IO event to the teacher ───────────
  io?.to(`user:${data.teacherId}`).emit("learno:session_complete", {
    sessionId,
    engagementScore,
    engagementBand: data.engagementBand,
    teacherRatio: data.teacherRatio,
    studentRatio: data.studentRatio,
  });

  console.log(`   📢 Notification + Socket event sent to teacher ${data.teacherId}`);
}

async function handleProcessingFailed(payload: WebhookPayload): Promise<void> {
  const sessionId = payload.session_id;
  const errorMessage = payload.data?.error || "Unknown processing error";

  // Update session status to FAILED
  try {
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: "FAILED",
        errorMessage,
      },
    });
  } catch {
    // Session might not exist yet — create it
    console.warn(`   Session ${sessionId} not found for failure update`);
  }

  // Get teacher ID from session if it exists
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { teacherId: true },
  });

  if (session) {
    await prisma.notification.create({
      data: {
        userId: session.teacherId,
        type: "AI_ALERT",
        title: "Session Processing Failed",
        message: `An error occurred while processing your classroom session: ${errorMessage}`,
      },
    });

    io?.to(`user:${session.teacherId}`).emit("learno:session_failed", {
      sessionId,
      error: errorMessage,
    });
  }

  console.log(`   ❌ Session ${sessionId} marked FAILED: ${errorMessage}`);
}

async function handleAlertEvent(payload: WebhookPayload): Promise<void> {
  const alertParsed = AlertDataSchema.safeParse(payload.data);
  if (!alertParsed.success) {
    console.error("Invalid alert data:", alertParsed.error.flatten());
    return;
  }

  const alert = alertParsed.data;
  const alertType = ALERT_TYPE_MAP[alert.alert_type] || "PROCESSING_COMPLETE";
  const severity = SEVERITY_MAP[alert.severity] || "INFO";

  // Save alert to DB (session must exist)
  try {
    await prisma.sessionAlert.create({
      data: {
        sessionId: alert.session_id,
        alertType: alertType as any,
        message: alert.message,
        severity: severity as any,
        data: alert.data ? alert.data : undefined,
      },
    });
  } catch {
    console.warn(`   Could not save alert — session ${alert.session_id} may not exist yet`);
  }

  // Get teacher for this session
  const session = await prisma.session.findUnique({
    where: { id: alert.session_id },
    select: { teacherId: true },
  });

  if (session) {
    // Emit real-time alert via Socket.IO
    io?.to(`user:${session.teacherId}`).emit("learno:alert", {
      sessionId: alert.session_id,
      alertType: alert.alert_type,
      message: alert.message,
      severity: alert.severity,
      data: alert.data,
    });
  }

  if (alert.alert_type === "session_missed") {
    if (session?.teacherId) {
      await prisma.notification.create({
        data: {
          userId: session.teacherId,
          type: "AI_ALERT",
          title: "Session Missed",
          message: alert.message,
        },
      }).catch(() => null);
    }
  }

  console.log(`   🔔 Alert saved: ${alert.alert_type} (${alert.severity})`);
}

async function handleProcessingStarted(payload: WebhookPayload): Promise<void> {
  const sessionId = payload.session_id;

  try {
    await prisma.session.update({
      where: { id: sessionId },
      data: { status: "PROCESSING" },
    });
  } catch {
    console.warn(`   Session ${sessionId} not found for processing_started update`);
  }

  console.log(`   ⏳ Session ${sessionId} status → PROCESSING`);
}

// ═════════════════════════════════════════════════════
// WEBHOOK LOGGING
// ═════════════════════════════════════════════════════

async function logWebhook(payload: WebhookPayload, startTime: number): Promise<void> {
  try {
    await prisma.webhookLog.create({
      data: {
        sessionId: payload.session_id,
        eventType: payload.event,
        direction: "inbound",
        method: "POST",
        url: "/api/learno/webhook",
        payload: payload as any,
        success: true,
        durationMs: Date.now() - startTime,
      },
    });
  } catch (err) {
    console.error("Failed to log webhook:", err);
  }
}

// ═════════════════════════════════════════════════════
// SESSION MANAGEMENT — called by teacher
// ═════════════════════════════════════════════════════

export const startSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const body = req.body as StartSessionInput;
    const now = body.now ? new Date(body.now) : new Date();
    const forceStopPrevious = body.forceStopPrevious ?? true;

    const activeExisting = await prisma.session.findMany({
      where: {
        teacherId,
        status: { in: ["RECORDING", "WAITING_UPLOAD", "PROCESSING"] },
      },
      select: { id: true, status: true, actualStart: true },
      orderBy: { createdAt: "desc" },
    });

    if (activeExisting.length > 0) {
      if (!forceStopPrevious) {
        res.status(409).json({ message: "You already have an active session." });
        return;
      }

      for (const active of activeExisting) {
        const isRecording = active.status === "RECORDING";

        await prisma.session.update({
          where: { id: active.id },
          data: {
            status: isRecording ? "WAITING_UPLOAD" : "FAILED",
            actualEnd: new Date(),
            durationMinutes: active.actualStart
              ? Math.round((Date.now() - active.actualStart.getTime()) / 60000)
              : null,
            errorMessage: isRecording
              ? undefined
              : "Force-stopped by new session start",
          },
        });

        if (isRecording) {
          try {
            await fetch(`${FASTAPI_URL}/session/stop`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                session_id: active.id,
                reason: "force_stop_previous",
              }),
            });
          } catch (err) {
            console.error("Failed to reach FastAPI for forced previous session stop:", err);
          }
        }
      }
    }

    const scheduleCheck = await validateSessionWindow(teacherId, body.timetableId, now);
    if (!scheduleCheck.ok) {
      res.status(403).json({ message: scheduleCheck.message ?? "Session not allowed." });
      return;
    }

    const timetable = scheduleCheck.timetable;

    // Create Session in our DB
    const session = await prisma.session.create({
      data: {
        teacherId,
        timetableId: body.timetableId,
        classId: body.classId ?? timetable?.classId ?? null,
        subjectId: body.subjectId ?? timetable?.subjectId ?? null,
        startType: body.autoStart ? "AUTO" : "MANUAL",
        status: "RECORDING",
        actualStart: now,
        scheduledStart: timetable?.startTime ?? undefined,
        scheduledEnd: timetable?.endTime ?? undefined,
      },
    });

    refreshEnvironmentIngest().catch((err) => {
      console.error("environmentIngest refresh failed:", err);
    });

    let fastApiForwarded = true;
    let fastApiWarning: string | null = null;

    // Forward to FastAPI
    try {
      const response = await fetch(`${FASTAPI_URL}/session/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.id,
          professor_id: teacherId,
          timetable_id: body.timetableId,
          class_id: body.classId ?? timetable?.classId,
          subject_id: body.subjectId ?? timetable?.subjectId,
          course_name: body.courseName,
          room_id: body.roomId,
          scheduled_duration_minutes: body.scheduledDurationMinutes,
          auto_start: body.autoStart,
          grade_level: body.gradeLevel,
          student_age: body.studentAge,
          vision_smart_option: body.visionSmartOption,
        }),
      });

      if (!response.ok) {
        fastApiForwarded = false;
        fastApiWarning = "FastAPI start endpoint returned an error.";
      }
    } catch (err) {
      fastApiForwarded = false;
      fastApiWarning = "FastAPI could not be reached.";
      console.error("Failed to reach FastAPI for session start:", err);
      // Session still created locally — FastAPI connectivity issue
    }

    res.status(201).json({
      success: true,
      fastApiForwarded,
      warning: fastApiWarning,
      session: {
        id: session.id,
        status: session.status,
        startType: session.startType,
        actualStart: session.actualStart,
      },
    });
  } catch (error) {
    console.error("startSession error:", error);
    res.status(500).json({ message: "Failed to start session" });
  }
};

export const stopSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const body = req.body as StopSessionInput;
    const forceStop = body.force === true;

    // Verify ownership
    const session = await prisma.session.findUnique({
      where: { id: body.sessionId },
    });

    if (!session || session.teacherId !== teacherId) {
      res.status(404).json({ message: "Session not found" });
      return;
    }

    if (!forceStop && session.status !== "RECORDING") {
      res.status(409).json({
        message: `Session is ${session.status} and cannot be stopped normally.`,
      });
      return;
    }

    const nextStatus = forceStop ? "FAILED" : "WAITING_UPLOAD";
    const now = new Date();

    // Update local session
    await prisma.session.update({
      where: { id: body.sessionId },
      data: {
        status: nextStatus,
        actualEnd: session.actualEnd ?? now,
        durationMinutes:
          session.durationMinutes ??
          (session.actualStart
            ? Math.round((Date.now() - session.actualStart.getTime()) / 60000)
            : null),
        errorMessage: forceStop
          ? `Force-stopped by teacher (${body.reason ?? "manual"}).`
          : undefined,
      },
    });

    refreshEnvironmentIngest().catch((err) => {
      console.error("environmentIngest refresh failed:", err);
    });

    // Forward to FastAPI - wait for response to ensure it stopped
    let fastapiStopped = false;
    try {
      const response = await fetch(`${FASTAPI_URL}/session/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: body.sessionId,
          reason: body.reason,
          force: forceStop,
        }),
      });
      if (response.ok) {
        const result = await response.json() as { success?: boolean; status?: string };
        fastapiStopped = result.success === true;
      }
    } catch (err) {
      console.error("Failed to reach FastAPI for session stop:", err);
    }

    // If force stop but AI didn't stop properly, warn in response
    if (forceStop && !fastapiStopped) {
      console.warn(`Force stop requested but AI service may still be processing session ${body.sessionId}`);
    }

    res.json({
      success: true,
      sessionId: body.sessionId,
      status: nextStatus.toLowerCase(),
      force: forceStop,
      aiStopped: fastapiStopped,
    });
  } catch (error) {
    console.error("stopSession error:", error);
    res.status(500).json({ message: "Failed to stop session" });
  }
};

// ═════════════════════════════════════════════════════
// SESSION QUERIES — teacher reads data
// ═════════════════════════════════════════════════════

export const getSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;

    const sessions = await prismaAny.session.findMany({
      where: { teacherId },
      include: {
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        visionAnalysis: {
          select: {
            id: true,
            smartOption: true,
            classEngagementAvg: true,
            classEngagementMin: true,
            classEngagementMax: true,
            classStudentCount: true,
            lowEngagementCount: true,
            totalFramesAnalyzed: true,
            annotatedVideoPath: true,
          },
        },
        lesson: {
          include: {
            chapters: { orderBy: { chapterNumber: "asc" } },
          },
        },
        _count: { select: { alerts: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json(sessions);
  } catch (error) {
    console.error("getSessions error:", error);
    res.status(500).json({ message: "Failed to fetch sessions" });
  }
};

export const getSessionDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const sessionId = req.params.sessionId as string;

    const session = await prismaAny.session.findUnique({
      where: { id: sessionId },
      include: {
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        timetable: true,
        recording: true,
        lessonSummary: true,
        teacherAdvice: true,
        visionAnalysis: {
          include: {
            students: {
              include: {
                student: {
                  select: {
                    id: true,
                    fullName: true,
                    enrollment: {
                      select: {
                        seatNumber: true,
                      },
                    },
                  },
                },
              },
              orderBy: [
                { seatNumber: "asc" },
                { detectedStudentId: "asc" },
              ],
            },
          },
        },
        alerts: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!session || session.teacherId !== teacherId) {
      res.status(404).json({ message: "Session not found" });
      return;
    }

    res.json(session);
  } catch (error) {
    console.error("getSessionDetail error:", error);
    res.status(500).json({ message: "Failed to fetch session detail" });
  }
};

export const getSessionAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const sessionId = req.params.sessionId as string;

    // Verify ownership
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { teacherId: true },
    });

    if (!session || session.teacherId !== teacherId) {
      res.status(404).json({ message: "Session not found" });
      return;
    }

    const alerts = await prisma.sessionAlert.findMany({
      where: { sessionId: sessionId as string },
      orderBy: { createdAt: "desc" },
    });

    res.json(alerts);
  } catch (error) {
    console.error("getSessionAlerts error:", error);
    res.status(500).json({ message: "Failed to fetch session alerts" });
  }
};

// ═════════════════════════════════════════════════════
// TEACHER LESSONS — list, approve, serve PDF
// ═════════════════════════════════════════════════════

export const getTeacherLessons = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const statusFilter = (req.query.status as string)?.toUpperCase();

    const where: any = { teacherId };
    if (statusFilter && statusFilter !== "ALL") {
      where.status = statusFilter; // DRAFT, APPROVED, REJECTED, ARCHIVED
    }

    const lessons = await prisma.lesson.findMany({
      where,
      include: {
        chapters: { orderBy: { chapterNumber: "asc" } },
        session: {
          select: {
            id: true,
            createdAt: true,
            class: { select: { id: true, name: true } },
            subject: { select: { id: true, name: true } },
          },
        },
        subject: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(lessons);
  } catch (error) {
    console.error("getTeacherLessons error:", error);
    res.status(500).json({ message: "Failed to fetch lessons" });
  }
};

export const approveLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const lessonId = req.params.lessonId as string;

    // Verify ownership
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });

    if (!lesson || lesson.teacherId !== teacherId) {
      res.status(404).json({ message: "Lesson not found" });
      return;
    }

    if (lesson.status === "APPROVED") {
      res.json({ message: "Lesson is already approved", lesson });
      return;
    }

    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        status: "APPROVED",
        isPublished: true,
        approvedBy: teacherId,
        approvedAt: new Date(),
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: teacherId,
        type: "GENERAL",
        title: "Lesson Published",
        message: `Your lesson "${updated.title}" has been approved and is now available to students.`,
      },
    });

    res.json({ message: "Lesson approved and published", lesson: updated });
  } catch (error) {
    console.error("approveLesson error:", error);
    res.status(500).json({ message: "Failed to approve lesson" });
  }
};

export const serveLessonPdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const lessonId = req.params.lessonId as string;

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });

    if (!lesson || lesson.teacherId !== teacherId) {
      res.status(404).json({ message: "Lesson not found" });
      return;
    }

    if (!lesson.pdfPath) {
      res.status(404).json({ message: "PDF not available for this lesson" });
      return;
    }

    // Resolve the absolute path — pdfPath may be absolute already or relative
    let pdfAbsPath = lesson.pdfPath;
    if (!path.isAbsolute(pdfAbsPath)) {
      pdfAbsPath = path.resolve(pdfAbsPath);
    }

    if (fs.existsSync(pdfAbsPath)) {
      const safeFileName = toAsciiFileName(path.basename(pdfAbsPath), "lesson.pdf");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${safeFileName}"`);
      const stream = fs.createReadStream(pdfAbsPath);
      stream.pipe(res);
      return;
    }

    // Fallback: pdfPath might belong to FastAPI server storage
    const fileName = path.basename(pdfAbsPath);
    const safeFileName = toAsciiFileName(fileName, "lesson.pdf");
    const fastApiUrl = process.env.FASTAPI_URL || "http://localhost:8000";
    const candidates = [
      `${fastApiUrl}/files/${encodeURIComponent(pdfAbsPath)}`,
      `${fastApiUrl}/files/${encodeURIComponent(fileName)}`,
    ];

    for (const url of candidates) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          continue;
        }

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${safeFileName}"`);
        const arrayBuffer = await response.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));
        return;
      } catch (err) {
        console.warn("FastAPI PDF fetch failed:", err);
      }
    }

    res.status(404).json({ message: "PDF file not found on disk" });
  } catch (error) {
    console.error("serveLessonPdf error:", error);
    res.status(500).json({ message: "Failed to serve PDF" });
  }
};

// ═════════════════════════════════════════════════════
// TIMETABLE FOR FASTAPI AUTO-START
// ═════════════════════════════════════════════════════

export const getTeacherTimetableForToday = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.params.teacherId as string;

    // Verify the webhook secret for FastAPI calls
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");

    if (token !== WEBHOOK_SECRET) {
      res.status(401).json({ message: "Invalid webhook secret" });
      return;
    }

    // Get current day of the week
    const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const today = days[new Date().getDay()];

    // Fetch today's timetable for this teacher
    const timetable = await prisma.timetable.findMany({
      where: {
        teacherId,
        day: today as any,
      },
      include: {
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
      },
      orderBy: { startTime: "asc" },
    });

    res.json({
      teacherId,
      today,
      timetable: timetable.map((entry) => ({
        id: entry.id,
        teacherId: entry.teacherId,
        classId: entry.classId,
        subjectId: entry.subjectId,
        day: entry.day,
        startTime: entry.startTime.toISOString(),
        endTime: entry.endTime.toISOString(),
        class: entry.class,
        subject: entry.subject,
        // Calculate duration in minutes
        durationMinutes: Math.round(
          (entry.endTime.getTime() - entry.startTime.getTime()) / 60000
        ),
      })),
    });
  } catch (error) {
    console.error("getTeacherTimetableForToday error:", error);
    res.status(500).json({ message: "Failed to fetch timetable" });
  }
};
