import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import prisma from "../../config/prisma.js";
import { io } from "../../core/socket.js";
import { calculateAge } from "../../utils/calculateAge.js";
import {
  GetLessonsQuerySchema,
  type GetLessonsQuery,
  type ApproveLessonInput,
  type RejectLessonInput,
  type StartLessonInput,
  type CompleteChapterInput,
  type RateLessonInput,
  type CompleteBrainChallengeInput,
} from "./student.validators.js";

const XP_LEVEL_STEP = 120;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
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

const startOfDay = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const dayDiff = (from: Date, to: Date): number => {
  const fromStart = startOfDay(from).getTime();
  const toStart = startOfDay(to).getTime();
  const diff = Math.floor((toStart - fromStart) / MS_PER_DAY);
  return Math.max(0, diff);
};

const getLevelFromXP = (totalXP: number): number => {
  const level = Math.floor(totalXP / XP_LEVEL_STEP) + 1;
  return Math.max(1, level);
};

const getXPToNextLevel = (totalXP: number): number => {
  const level = getLevelFromXP(totalXP);
  const nextThreshold = level * XP_LEVEL_STEP;
  return Math.max(0, nextThreshold - totalXP);
};

const calculateEngagementFromStudy = (
  expectedMinutes: number,
  actualMinutes: number,
): number => {
  const safeExpected = Math.max(1, expectedMinutes);
  const safeActual = Math.max(1, actualMinutes);
  const ratio = safeActual / safeExpected;
  const closeness = Math.exp(-Math.abs(Math.log(ratio)));
  const base = 55 + closeness * 45;
  const pacingBonus = ratio >= 0.9 && ratio <= 1.2 ? 6 : ratio >= 0.8 && ratio <= 1.4 ? 3 : 0;
  const overrunPenalty = ratio > 2 ? Math.min(20, Math.round((ratio - 2) * 12)) : 0;
  const underrunPenalty = ratio < 0.5 ? Math.min(25, Math.round((0.5 - ratio) * 35)) : 0;
  return clamp(Math.round(base + pacingBonus - overrunPenalty - underrunPenalty), 15, 100);
};

const calculateConcentrationFromStudy = (
  engagement: number,
  xpEarned: number,
  xpReward: number,
): number => {
  const mastery = clamp(
    Math.round((Math.max(0, xpEarned) / Math.max(1, xpReward)) * 100),
    30,
    100,
  );
  const blend = Math.round(engagement * 0.7 + mastery * 0.3);
  const lowMasteryPenalty = mastery < 50 ? Math.round((50 - mastery) * 0.25) : 0;
  return clamp(blend - lowMasteryPenalty, 20, 100);
};

const updateStudentAveragesFromSources = async (studentId: string) => {
  const [chapterRows, focusRows] = await Promise.all([
    prisma.studentChapterProgress.findMany({
      where: {
        studentId,
        status: "COMPLETED",
        engagementScore: { not: null },
        concentrationScore: { not: null },
      },
      select: {
        engagementScore: true,
        concentrationScore: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
    prisma.studentFocusSession.findMany({
      where: { studentId },
      select: {
        engagementScore: true,
        concentrationScore: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
  ]);

  const merged = [
    ...chapterRows.map((row) => ({
      engagement: row.engagementScore ?? 0,
      concentration: row.concentrationScore ?? 0,
      updatedAt: row.updatedAt,
      weight: 0.65,
    })),
    ...focusRows.map((row) => ({
      engagement: row.engagementScore,
      concentration: row.concentrationScore,
      updatedAt: row.updatedAt,
      weight: 1.0,
    })),
  ]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 250);

  if (merged.length === 0) {
    await prisma.studentXP.update({
      where: { studentId },
      data: {
        averageEngagement: 0,
        averageConcentration: 0,
      },
    });
    return { averageEngagement: 0, averageConcentration: 0 };
  }

  const weighted = merged.reduce(
    (acc, row) => {
      acc.engagement += row.engagement * row.weight;
      acc.concentration += row.concentration * row.weight;
      acc.weight += row.weight;
      return acc;
    },
    { engagement: 0, concentration: 0, weight: 0 },
  );

  const averageEngagement = clamp(
    Math.round(weighted.engagement / Math.max(1, weighted.weight)),
    0,
    100,
  );
  const averageConcentration = clamp(
    Math.round(weighted.concentration / Math.max(1, weighted.weight)),
    0,
    100,
  );

  await prisma.studentXP.update({
    where: { studentId },
    data: {
      averageEngagement,
      averageConcentration,
    },
  });

  return { averageEngagement, averageConcentration };
};

const refreshStudentEngagementAverages = async (studentId: string) => {
  await updateStudentAveragesFromSources(studentId);
};

const applyStudentActivity = async (
  studentId: string,
  xpDelta: number,
  lessonCompletedDelta = 0,
) => {
  const now = new Date();

  const existing = await prisma.studentXP.upsert({
    where: { studentId },
    create: { studentId },
    update: {},
  });

  const safeXpDelta = Math.max(0, Math.round(xpDelta));
  const safeLessonDelta = Math.max(0, Math.round(lessonCompletedDelta));

  const totalXP = Math.max(0, existing.totalXP + safeXpDelta);

  let currentStreak = existing.currentStreak;
  let dailyXPEarned = existing.dailyXPEarned;
  let dailyLessonsDone = existing.dailyLessonsDone;

  if (existing.lastActivityDate) {
    const diff = dayDiff(existing.lastActivityDate, now);

    if (diff === 0) {
      // same day, keep streak
    } else if (diff === 1) {
      currentStreak += 1;
      dailyXPEarned = 0;
      dailyLessonsDone = 0;
    } else {
      currentStreak = 1;
      dailyXPEarned = 0;
      dailyLessonsDone = 0;
    }
  } else {
    currentStreak = 1;
    dailyXPEarned = 0;
    dailyLessonsDone = 0;
  }

  dailyXPEarned += safeXpDelta;
  dailyLessonsDone += safeLessonDelta;

  if (currentStreak < 1) {
    currentStreak = 1;
  }

  const longestStreak = Math.max(existing.longestStreak, currentStreak);
  const currentLevel = getLevelFromXP(totalXP);
  const xpToNextLevel = getXPToNextLevel(totalXP);

  return prisma.studentXP.update({
    where: { studentId },
    data: {
      totalXP,
      currentLevel,
      xpToNextLevel,
      currentStreak,
      longestStreak,
      dailyXPEarned,
      dailyLessonsDone,
      lastActivityDate: now,
    },
  });
};

const ensureStudentXP = async (studentId: string) => {
  const now = new Date();
  const current = await prisma.studentXP.upsert({
    where: { studentId },
    create: { studentId },
    update: {},
  });

  let dailyXPEarned = current.dailyXPEarned;
  let dailyLessonsDone = current.dailyLessonsDone;

  if (current.lastActivityDate && dayDiff(current.lastActivityDate, now) > 0) {
    dailyXPEarned = 0;
    dailyLessonsDone = 0;
  }

  const normalizedLevel = getLevelFromXP(current.totalXP);
  const normalizedXpToNext = getXPToNextLevel(current.totalXP);

  const hasChanges =
    current.currentLevel !== normalizedLevel ||
    current.xpToNextLevel !== normalizedXpToNext ||
    current.dailyXPEarned !== dailyXPEarned ||
    current.dailyLessonsDone !== dailyLessonsDone;

  if (!hasChanges) {
    return current;
  }

  return prisma.studentXP.update({
    where: { studentId },
    data: {
      currentLevel: normalizedLevel,
      xpToNextLevel: normalizedXpToNext,
      dailyXPEarned,
      dailyLessonsDone,
    },
  });
};

// ═════════════════════════════════════════════════════
// LESSON MANAGEMENT (Teacher actions)
// ═════════════════════════════════════════════════════

/**
 * Get all lessons (for teachers: includes drafts; for students: only approved)
 */
export const getLessons = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const parsedQuery = GetLessonsQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      res.status(400).json({ message: "Invalid lessons query parameters" });
      return;
    }

    const query: GetLessonsQuery = parsedQuery.data;

    const where: any = {};

    // Students can only see APPROVED lessons
    if (userRole === "STUDENT") {
      where.status = "APPROVED";
      where.isPublished = true;
    } else if (userRole === "TEACHER") {
      // Teachers see their own lessons (any status)
      where.teacherId = userId;
      if (query.status) {
        where.status = query.status;
      }
    }

    if (query.subjectId) {
      where.subjectId = query.subjectId;
    }
    if (query.difficulty) {
      where.difficulty = query.difficulty;
    }

    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const [lessons, total] = await Promise.all([
      prisma.lesson.findMany({
        where,
        include: {
          subject: { select: { id: true, name: true, color: true } },
          chapters: {
            select: { id: true, chapterNumber: true, title: true, xpReward: true },
            orderBy: { chapterNumber: "asc" },
          },
          _count: { select: { progress: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.lesson.count({ where }),
    ]);

    if (userRole === "STUDENT" && lessons.length > 0) {
      const lessonIds = lessons.map((lesson) => lesson.id);

      const [lessonProgressRows, chapterProgressRows] = await Promise.all([
        prisma.studentLessonProgress.findMany({
          where: {
            studentId: userId,
            lessonId: { in: lessonIds },
          },
          select: {
            lessonId: true,
            progressPercent: true,
            chaptersCompleted: true,
            isCompleted: true,
          },
        }),
        prisma.studentChapterProgress.findMany({
          where: {
            studentId: userId,
            chapter: {
              lessonId: { in: lessonIds },
            },
            status: "COMPLETED",
          },
          select: {
            chapterId: true,
            chapter: {
              select: {
                lessonId: true,
              },
            },
          },
        }),
      ]);

      const progressByLessonId = new Map(
        lessonProgressRows.map((row) => [row.lessonId, row]),
      );

      const completedChapterIdsByLessonId = new Map<string, string[]>();
      chapterProgressRows.forEach((row) => {
        const lessonId = row.chapter.lessonId;
        const current = completedChapterIdsByLessonId.get(lessonId) ?? [];
        current.push(row.chapterId);
        completedChapterIdsByLessonId.set(lessonId, current);
      });

      const enrichedLessons = lessons.map((lesson) => {
        const studentProgress = progressByLessonId.get(lesson.id);
        return {
          ...lesson,
          studentProgress: studentProgress
            ? {
                progressPercent: studentProgress.progressPercent,
                chaptersCompleted: studentProgress.chaptersCompleted,
                isCompleted: studentProgress.isCompleted,
                completedChapterIds: completedChapterIdsByLessonId.get(lesson.id) ?? [],
              }
            : {
                progressPercent: 0,
                chaptersCompleted: 0,
                isCompleted: false,
                completedChapterIds: [],
              },
        };
      });

      res.json({
        lessons: enrichedLessons,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
      return;
    }

    res.json({
      lessons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getLessons error:", error);
    res.status(500).json({ message: "Failed to fetch lessons" });
  }
};

/**
 * Get draft lessons awaiting teacher approval
 */
export const getDraftLessons = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;

    const lessons = await prisma.lesson.findMany({
      where: {
        teacherId,
        status: "DRAFT",
      },
      include: {
        subject: { select: { id: true, name: true, color: true } },
        session: { select: { id: true, actualStart: true, actualEnd: true } },
        chapters: {
          select: { id: true, chapterNumber: true, title: true, xpReward: true, summary: true },
          orderBy: { chapterNumber: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(lessons);
  } catch (error) {
    console.error("getDraftLessons error:", error);
    res.status(500).json({ message: "Failed to fetch draft lessons" });
  }
};

/**
 * Get a single lesson with full details
 */
export const getLessonDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const lessonIdParam = req.params.lessonId;
    const lessonId = Array.isArray(lessonIdParam) ? lessonIdParam[0] : lessonIdParam;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        subject: { select: { id: true, name: true, color: true } },
        session: { select: { id: true, actualStart: true, actualEnd: true, transcriptText: true } },
        chapters: {
          orderBy: { chapterNumber: "asc" },
        },
      },
    });

    if (!lesson) {
      res.status(404).json({ message: "Lesson not found" });
      return;
    }

    // Students can only view approved lessons
    if (userRole === "STUDENT" && lesson.status !== "APPROVED") {
      res.status(403).json({ message: "Lesson not available" });
      return;
    }

    // Teachers can only view their own lessons
    if (userRole === "TEACHER" && lesson.teacherId !== userId) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    if (userRole === "STUDENT") {
      const [lessonProgress, chapterProgress] = await Promise.all([
        prisma.studentLessonProgress.findUnique({
          where: {
            studentId_lessonId: {
              studentId: userId,
              lessonId,
            },
          },
          select: {
            progressPercent: true,
            chaptersCompleted: true,
            isCompleted: true,
          },
        }),
        prisma.studentChapterProgress.findMany({
          where: {
            studentId: userId,
            chapter: { lessonId },
            status: "COMPLETED",
          },
          select: {
            chapterId: true,
          },
        }),
      ]);

      res.json({
        ...lesson,
        studentProgress: {
          progressPercent: lessonProgress?.progressPercent ?? 0,
          chaptersCompleted: lessonProgress?.chaptersCompleted ?? 0,
          isCompleted: lessonProgress?.isCompleted ?? false,
          completedChapterIds: chapterProgress.map((row) => row.chapterId),
        },
      });
      return;
    }

    res.json(lesson);
  } catch (error) {
    console.error("getLessonDetail error:", error);
    res.status(500).json({ message: "Failed to fetch lesson detail" });
  }
};

/**
 * Serve lesson PDF for students
 */
export const getLessonPdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const lessonIdParam = req.params.lessonId;
    const lessonId = Array.isArray(lessonIdParam) ? lessonIdParam[0] : lessonIdParam;

    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        status: "APPROVED",
        isPublished: true,
      },
      select: {
        id: true,
        pdfPath: true,
      },
    });

    if (!lesson) {
      res.status(404).json({ message: "Lesson not found" });
      return;
    }

    if (!lesson.pdfPath) {
      res.status(404).json({ message: "PDF not available for this lesson" });
      return;
    }

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
    console.error("getLessonPdf error:", error);
    res.status(500).json({ message: "Failed to serve PDF" });
  }
};

/**
 * Approve a draft lesson (Teacher only)
 */
export const approveLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const body = req.body as ApproveLessonInput;

    const lesson = await prisma.lesson.findUnique({
      where: { id: body.lessonId },
    });

    if (!lesson) {
      res.status(404).json({ message: "Lesson not found" });
      return;
    }

    if (lesson.teacherId !== teacherId) {
      res.status(403).json({ message: "You can only approve your own lessons" });
      return;
    }

    if (lesson.status !== "DRAFT") {
      res.status(400).json({ message: "Only draft lessons can be approved" });
      return;
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id: body.lessonId },
      data: {
        status: "APPROVED",
        approvedBy: teacherId,
        approvedAt: new Date(),
        isPublished: true,
      },
      include: {
        subject: { select: { id: true, name: true } },
        chapters: { select: { id: true, title: true } },
      },
    });

    // Notify via Socket.IO
    io?.to(`teacher:${teacherId}`).emit("lesson:approved", {
      lessonId: updatedLesson.id,
      title: updatedLesson.title,
    });

    res.json({
      success: true,
      message: "Lesson approved and published",
      lesson: updatedLesson,
    });
  } catch (error) {
    console.error("approveLesson error:", error);
    res.status(500).json({ message: "Failed to approve lesson" });
  }
};

/**
 * Reject a draft lesson (Teacher only)
 */
export const rejectLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const body = req.body as RejectLessonInput;

    const lesson = await prisma.lesson.findUnique({
      where: { id: body.lessonId },
    });

    if (!lesson) {
      res.status(404).json({ message: "Lesson not found" });
      return;
    }

    if (lesson.teacherId !== teacherId) {
      res.status(403).json({ message: "You can only reject your own lessons" });
      return;
    }

    if (lesson.status !== "DRAFT") {
      res.status(400).json({ message: "Only draft lessons can be rejected" });
      return;
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id: body.lessonId },
      data: {
        status: "REJECTED",
        rejectionReason: body.reason,
        isPublished: false,
      },
    });

    res.json({
      success: true,
      message: "Lesson rejected",
      lesson: updatedLesson,
    });
  } catch (error) {
    console.error("rejectLesson error:", error);
    res.status(500).json({ message: "Failed to reject lesson" });
  }
};

// ═════════════════════════════════════════════════════
// STUDENT PROGRESS & XP
// ═════════════════════════════════════════════════════

/**
 * Get student's XP, level, and streak info
 */
export const getStudentXP = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;

    const studentXP = await ensureStudentXP(studentId);

    res.json(studentXP);
  } catch (error) {
    console.error("getStudentXP error:", error);
    res.status(500).json({ message: "Failed to fetch student XP" });
  }
};

/**
 * Get student's lesson progress
 */
export const getStudentProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;

    const progress = await prisma.studentLessonProgress.findMany({
      where: { studentId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            totalXP: true,
            totalDurationMin: true,
            subject: { select: { name: true, color: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    res.json(progress);
  } catch (error) {
    console.error("getStudentProgress error:", error);
    res.status(500).json({ message: "Failed to fetch student progress" });
  }
};

/**
 * Start a lesson (creates progress record)
 */
export const startLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const body = req.body as StartLessonInput;

    // Check lesson exists and is approved
    const lesson = await prisma.lesson.findUnique({
      where: { id: body.lessonId },
      include: { chapters: { orderBy: { chapterNumber: "asc" } } },
    });

    if (!lesson || lesson.status !== "APPROVED") {
      res.status(404).json({ message: "Lesson not available" });
      return;
    }

    // Upsert progress
    const progress = await prisma.studentLessonProgress.upsert({
      where: {
        studentId_lessonId: { studentId, lessonId: body.lessonId },
      },
      create: {
        studentId,
        lessonId: body.lessonId,
        lastAccessedAt: new Date(),
      },
      update: {
        lastAccessedAt: new Date(),
      },
    });

    // Update lesson enrollment count
    await prisma.lesson.update({
      where: { id: body.lessonId },
      data: { studentsEnrolled: { increment: progress.createdAt === progress.updatedAt ? 1 : 0 } },
    });

    res.json({
      success: true,
      progress,
      chapters: lesson.chapters,
    });
  } catch (error) {
    console.error("startLesson error:", error);
    res.status(500).json({ message: "Failed to start lesson" });
  }
};

/**
 * Complete a chapter and earn XP
 */
export const completeChapter = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const body = req.body as CompleteChapterInput;

    // Get chapter with lesson info
    const chapter = await prisma.chapter.findUnique({
      where: { id: body.chapterId },
      include: {
        lesson: {
          include: { chapters: { select: { id: true } } },
        },
      },
    });

    if (!chapter) {
      res.status(404).json({ message: "Chapter not found" });
      return;
    }

    // Check chapter is not already completed
    const existingProgress = await prisma.studentChapterProgress.findUnique({
      where: {
        studentId_chapterId: { studentId, chapterId: body.chapterId },
      },
    });

    if (existingProgress?.status === "COMPLETED") {
      res.json({
        success: true,
        message: "Chapter already completed",
        xpEarned: 0,
      });
      return;
    }

    const xpEarned = chapter.xpReward;
    const effectiveTimeSpent = Math.max(1, Math.round(body.timeSpentMin || 0));
    const expectedMinutes = Math.max(1, chapter.durationMin || 5);
    const engagementScore = calculateEngagementFromStudy(expectedMinutes, effectiveTimeSpent);
    const concentrationScore = calculateConcentrationFromStudy(
      engagementScore,
      xpEarned,
      chapter.xpReward,
    );

    // Update chapter progress
    await prisma.studentChapterProgress.upsert({
      where: {
        studentId_chapterId: { studentId, chapterId: body.chapterId },
      },
      create: {
        studentId,
        chapterId: body.chapterId,
        status: "COMPLETED",
        xpEarned,
        timeSpentMin: effectiveTimeSpent,
        engagementScore,
        concentrationScore,
        startedAt: new Date(),
        completedAt: new Date(),
      },
      update: {
        status: "COMPLETED",
        xpEarned,
        timeSpentMin: { increment: effectiveTimeSpent },
        engagementScore,
        concentrationScore,
        completedAt: new Date(),
      },
    });

    // Update lesson progress
    const completedChapters = await prisma.studentChapterProgress.count({
      where: {
        studentId,
        chapter: { lessonId: chapter.lessonId },
        status: "COMPLETED",
      },
    });

    const totalChapters = chapter.lesson.chapters.length;
    const progressPercent = Math.round((completedChapters / totalChapters) * 100);
    const isLessonCompleted = completedChapters >= totalChapters;

    await prisma.studentLessonProgress.update({
      where: {
        studentId_lessonId: { studentId, lessonId: chapter.lessonId },
      },
      data: {
        chaptersCompleted: completedChapters,
        progressPercent,
        xpEarned: { increment: xpEarned },
        timeSpentMin: { increment: effectiveTimeSpent },
        isCompleted: isLessonCompleted,
        completedAt: isLessonCompleted ? new Date() : undefined,
        lastAccessedAt: new Date(),
      },
    });

    const updatedXP = await applyStudentActivity(
      studentId,
      xpEarned,
      isLessonCompleted ? 1 : 0,
    );

    await refreshStudentEngagementAverages(studentId);

    // Check for achievements
    const newAchievements = await checkAndUnlockAchievements(studentId, updatedXP.totalXP);

    // Update lesson completion rate
    if (isLessonCompleted) {
      const completedCount = await prisma.studentLessonProgress.count({
        where: { lessonId: chapter.lessonId, isCompleted: true },
      });
      const enrolledCount = await prisma.studentLessonProgress.count({
        where: { lessonId: chapter.lessonId },
      });
      
      await prisma.lesson.update({
        where: { id: chapter.lessonId },
        data: {
          completionRate: enrolledCount > 0 ? (completedCount / enrolledCount) * 100 : 0,
        },
      });
    }

    // Emit XP update via Socket
    io?.to(`user:${studentId}`).emit("xp:earned", {
      xpEarned,
      totalXP: updatedXP.totalXP,
      chapterId: body.chapterId,
      lessonCompleted: isLessonCompleted,
      engagementScore,
      concentrationScore,
      newAchievements,
    });

    res.json({
      success: true,
      xpEarned,
      totalXP: updatedXP.totalXP,
      progressPercent,
      lessonCompleted: isLessonCompleted,
      engagementScore,
      concentrationScore,
      newAchievements,
    });
  } catch (error) {
    console.error("completeChapter error:", error);
    res.status(500).json({ message: "Failed to complete chapter" });
  }
};

/**
 * Rate a completed lesson
 */
export const rateLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const body = req.body as RateLessonInput;

    // Check student has completed the lesson
    const progress = await prisma.studentLessonProgress.findUnique({
      where: {
        studentId_lessonId: { studentId, lessonId: body.lessonId },
      },
    });

    if (!progress) {
      res.status(400).json({ message: "You must start the lesson before rating" });
      return;
    }

    // Update rating
    await prisma.studentLessonProgress.update({
      where: {
        studentId_lessonId: { studentId, lessonId: body.lessonId },
      },
      data: {
        rating: body.rating,
        ratedAt: new Date(),
      },
    });

    // Recalculate lesson average rating
    const ratings = await prisma.studentLessonProgress.aggregate({
      where: { lessonId: body.lessonId, rating: { not: null } },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.lesson.update({
      where: { id: body.lessonId },
      data: {
        rating: ratings._avg.rating || 0,
        ratingCount: ratings._count.rating,
      },
    });

    res.json({
      success: true,
      message: "Rating submitted",
    });
  } catch (error) {
    console.error("rateLesson error:", error);
    res.status(500).json({ message: "Failed to rate lesson" });
  }
};

// ═════════════════════════════════════════════════════
// ACHIEVEMENTS
// ═════════════════════════════════════════════════════

/**
 * Get all achievements with student's unlock status
 */
export const getAchievements = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;

    const achievements = await prisma.achievement.findMany({
      where: { isHidden: false },
      include: {
        studentAchievements: {
          where: { studentId },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    const formatted = achievements.map((ach) => ({
      ...ach,
      unlocked: ach.studentAchievements.length > 0,
      unlockedAt: ach.studentAchievements[0]?.unlockedAt ?? null,
      isNew: ach.studentAchievements[0]?.isNew ?? false,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("getAchievements error:", error);
    res.status(500).json({ message: "Failed to fetch achievements" });
  }
};

/**
 * Get student's unlocked achievements
 */
export const getStudentAchievements = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;

    const achievements = await prisma.studentAchievement.findMany({
      where: { studentId },
      include: {
        achievement: true,
      },
      orderBy: { unlockedAt: "desc" },
    });

    res.json(achievements);
  } catch (error) {
    console.error("getStudentAchievements error:", error);
    res.status(500).json({ message: "Failed to fetch student achievements" });
  }
};

/**
 * Mark achievement as seen (remove "new" badge)
 */
export const markAchievementSeen = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const achievementIdParam = req.params.achievementId;
    const achievementId = Array.isArray(achievementIdParam)
      ? achievementIdParam[0]
      : achievementIdParam;

    await prisma.studentAchievement.updateMany({
      where: { studentId, achievementId },
      data: { isNew: false },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("markAchievementSeen error:", error);
    res.status(500).json({ message: "Failed to mark achievement seen" });
  }
};

/**
 * Save XP from student brain challenge interactions
 */
export const completeBrainChallenge = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const body = req.body as CompleteBrainChallengeInput;

    const cappedXp = clamp(body.xpEarned ?? 0, 0, 150);
    const earnedXp = body.isCorrect ? cappedXp : Math.min(10, cappedXp);

    const updatedXP = await applyStudentActivity(studentId, earnedXp, 0);

    const normalizedEngagement = clamp(
      Math.round(body.engagementScore ?? (body.isCorrect ? 78 : 52)),
      0,
      100,
    );
    const normalizedConcentration = clamp(
      Math.round(body.concentrationScore ?? (body.isCorrect ? 74 : 50)),
      0,
      100,
    );

    await prisma.studentXP.upsert({
      where: { studentId },
      create: { studentId },
      update: {},
    });

    const focusSession = await prisma.studentFocusSession.upsert({
      where: {
        studentId_challengeKey: {
          studentId,
          challengeKey: body.challengeKey,
        },
      },
      create: {
        studentId,
        challengeKey: body.challengeKey,
        source: body.source ?? "BRAIN_CHALLENGE",
        subject: body.subject ?? null,
        xpEarned: earnedXp,
        durationSec: Math.max(0, body.durationSec ?? 0),
        engagementScore: normalizedEngagement,
        concentrationScore: normalizedConcentration,
      },
      update: {
        source: body.source ?? undefined,
        subject: body.subject ?? undefined,
        xpEarned: earnedXp,
        durationSec: {
          increment: Math.max(0, body.durationSec ?? 0),
        },
        engagementScore: normalizedEngagement,
        concentrationScore: normalizedConcentration,
      },
    });

    const { averageEngagement, averageConcentration } =
      await updateStudentAveragesFromSources(studentId);

    const newAchievements = await checkAndUnlockAchievements(studentId, updatedXP.totalXP);

    io?.to(`user:${studentId}`).emit("xp:earned", {
      xpEarned: earnedXp,
      totalXP: updatedXP.totalXP,
      challengeKey: body.challengeKey,
      source: body.source ?? null,
      challengeSubject: body.subject ?? null,
      isCorrect: body.isCorrect,
      engagementScore: normalizedEngagement,
      concentrationScore: normalizedConcentration,
      newAchievements,
    });

    res.json({
      success: true,
      xpEarned: earnedXp,
      totalXP: updatedXP.totalXP,
      currentLevel: updatedXP.currentLevel,
      xpToNextLevel: updatedXP.xpToNextLevel,
      currentStreak: updatedXP.currentStreak,
      engagementScore: normalizedEngagement,
      concentrationScore: normalizedConcentration,
      averageEngagement,
      averageConcentration,
      challengeProgressId: focusSession.id,
      newAchievements,
    });
  } catch (error) {
    console.error("completeBrainChallenge error:", error);
    res.status(500).json({ message: "Failed to save brain challenge progress" });
  }
};

/**
 * Get quiz-like performance stats from student's lesson progress
 */
export const getStudentQuizStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        enrollment: {
          select: {
            classId: true,
          },
        },
      },
    });

    const classId = student?.enrollment?.classId;

    const [progressRows, classSessions] = await Promise.all([
      prisma.studentLessonProgress.findMany({
        where: { studentId },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              subject: { select: { name: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      classId
        ? prisma.session.findMany({
            where: {
              classId,
              status: "COMPLETED",
            },
            select: {
              engagementScore: true,
              createdAt: true,
              subject: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 30,
          })
        : Promise.resolve([]),
    ]);

    const attempts = progressRows.length;
    const scores = progressRows.map((row) => row.progressPercent ?? 0);
    const totalScore = scores.reduce((sum, value) => sum + value, 0);
    const avgScore = attempts > 0 ? Math.round(totalScore / attempts) : 0;
    const bestScore = attempts > 0 ? Math.max(...scores) : 0;
    const passedAttempts = scores.filter((score) => score >= 60).length;
    const passRate = attempts > 0 ? Math.round((passedAttempts / attempts) * 100) : 0;

    const engagementValues = classSessions
      .map((session) => session.engagementScore)
      .filter((value): value is number => typeof value === "number");
    const engagement =
      engagementValues.length > 0
        ? Math.round(
            engagementValues.reduce((sum, value) => sum + value, 0) /
              engagementValues.length,
          )
        : 0;

    const recentResults = progressRows.slice(0, 10).map((row, index) => ({
      id: row.id,
      title: row.lesson?.title ?? "Lesson Quiz",
      subject: row.lesson?.subject?.name ?? "General",
      score: row.progressPercent ?? 0,
      isCompleted: row.isCompleted,
      attempts: Math.max(1, Math.round((row.chaptersCompleted || 0) / 2) || 1),
      updatedAt: row.updatedAt,
      rank: index + 1,
    }));

    res.json({
      summary: {
        attempts,
        completedAttempts: progressRows.filter((row) => row.isCompleted).length,
        avgScore,
        bestScore,
        passRate,
        engagement,
        concentration:
          classSessions.length > 0
            ? Math.round(
                classSessions.reduce((sum, session) => {
                  const value = clamp(session.engagementScore ?? 0, 0, 100);
                  return sum + Math.round(value * 0.8 + 15);
                }, 0) / classSessions.length,
              )
            : 0,
      },
      recentResults,
    });
  } catch (error) {
    console.error("getStudentQuizStats error:", error);
    res.status(500).json({ message: "Failed to fetch quiz stats" });
  }
};

/**
 * Get lesson engagement analytics derived from student study behavior
 */
export const getLessonEngagement = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const windowDaysRaw = req.query.windowDays;
    const parsedWindow = Number(windowDaysRaw);
    const windowDays = Number.isFinite(parsedWindow)
      ? clamp(Math.round(parsedWindow), 7, 90)
      : 30;

    const since = new Date(Date.now() - windowDays * MS_PER_DAY);

    const [chapterProgress, focusSessions] = await Promise.all([
      prisma.studentChapterProgress.findMany({
        where: {
          studentId,
          completedAt: { not: null, gte: since },
          status: "COMPLETED",
        },
        include: {
          chapter: {
            select: {
              id: true,
              lessonId: true,
              title: true,
              durationMin: true,
              xpReward: true,
              lesson: {
                select: {
                  id: true,
                  title: true,
                  subject: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { completedAt: "asc" },
      }),
      prisma.studentFocusSession.findMany({
        where: {
          studentId,
          createdAt: { gte: since },
        },
        select: {
          engagementScore: true,
          concentrationScore: true,
          durationSec: true,
          createdAt: true,
        },
      }),
    ]);

    if (chapterProgress.length === 0) {
      res.json({
        overview: {
          averageEngagement: 0,
          averageConcentration: 0,
          focusConsistency: 0,
          chaptersCompleted: 0,
          studyMinutes: 0,
        },
        dailyTrend: [],
        lessons: [],
      });
      return;
    }

    type DailyBucket = {
      date: string;
      engagement: number[];
      concentration: number[];
      minutes: number;
      chapters: number;
    };

    type LessonBucket = {
      lessonId: string;
      lessonTitle: string;
      subject: string;
      engagement: number[];
      concentration: number[];
      chaptersCompleted: number;
      minutes: number;
      xpEarned: number;
    };

    const dailyBuckets = new Map<string, DailyBucket>();
    const lessonBuckets = new Map<string, LessonBucket>();
    const engagementAll: Array<{ value: number; weight: number }> = [];
    const concentrationAll: Array<{ value: number; weight: number }> = [];
    let focusMinutes = 0;

    chapterProgress.forEach((row) => {
      const completedAt = row.completedAt ?? row.updatedAt;
      const dateKey = completedAt.toISOString().slice(0, 10);

      const expectedMinutes = Math.max(1, row.chapter.durationMin ?? 5);
      const actualMinutes = Math.max(1, row.timeSpentMin ?? 0);

      const engagementScore = calculateEngagementFromStudy(expectedMinutes, actualMinutes);
      const concentrationScore = calculateConcentrationFromStudy(
        engagementScore,
        row.xpEarned,
        row.chapter.xpReward,
      );

      engagementAll.push({ value: engagementScore, weight: 0.65 });
      concentrationAll.push({ value: concentrationScore, weight: 0.65 });

      const daily = dailyBuckets.get(dateKey) ?? {
        date: dateKey,
        engagement: [],
        concentration: [],
        minutes: 0,
        chapters: 0,
      };
      daily.engagement.push(engagementScore);
      daily.concentration.push(concentrationScore);
      daily.minutes += actualMinutes;
      daily.chapters += 1;
      dailyBuckets.set(dateKey, daily);

      const lessonId = row.chapter.lessonId;
      const lesson = lessonBuckets.get(lessonId) ?? {
        lessonId,
        lessonTitle: row.chapter.lesson.title,
        subject: row.chapter.lesson.subject?.name ?? "General",
        engagement: [],
        concentration: [],
        chaptersCompleted: 0,
        minutes: 0,
        xpEarned: 0,
      };

      lesson.engagement.push(engagementScore);
      lesson.concentration.push(concentrationScore);
      lesson.chaptersCompleted += 1;
      lesson.minutes += actualMinutes;
      lesson.xpEarned += row.xpEarned;

      lessonBuckets.set(lessonId, lesson);
    });

    focusSessions.forEach((session) => {
      const engagementScore = clamp(Math.round(session.engagementScore ?? 0), 0, 100);
      const concentrationScore = clamp(
        Math.round(session.concentrationScore ?? engagementScore),
        0,
        100,
      );
      engagementAll.push({ value: engagementScore, weight: 1 });
      concentrationAll.push({ value: concentrationScore, weight: 1 });
      focusMinutes += Math.round(Math.max(0, session.durationSec ?? 0) / 60);
    });

    const average = (arr: number[]) =>
      arr.length ? Math.round(arr.reduce((sum, value) => sum + value, 0) / arr.length) : 0;

    const weightedAverage = (entries: Array<{ value: number; weight: number }>) => {
      if (entries.length === 0) {
        return 0;
      }
      const totals = entries.reduce(
        (acc, entry) => {
          acc.sum += entry.value * entry.weight;
          acc.weight += entry.weight;
          return acc;
        },
        { sum: 0, weight: 0 },
      );
      return totals.weight > 0 ? Math.round(totals.sum / totals.weight) : 0;
    };

    const weightedVariance = (entries: Array<{ value: number; weight: number }>, mean: number) => {
      if (entries.length === 0) {
        return 0;
      }
      const totals = entries.reduce(
        (acc, entry) => {
          acc.sum += entry.weight * Math.pow(entry.value - mean, 2);
          acc.weight += entry.weight;
          return acc;
        },
        { sum: 0, weight: 0 },
      );
      return totals.weight > 0 ? totals.sum / totals.weight : 0;
    };

    const dailyTrend = Array.from(dailyBuckets.values())
      .map((bucket) => ({
        date: bucket.date,
        engagement: average(bucket.engagement),
        concentration: average(bucket.concentration),
        chaptersCompleted: bucket.chapters,
        studyMinutes: bucket.minutes,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const lessons = Array.from(lessonBuckets.values())
      .map((bucket) => ({
        lessonId: bucket.lessonId,
        lessonTitle: bucket.lessonTitle,
        subject: bucket.subject,
        engagement: average(bucket.engagement),
        concentration: average(bucket.concentration),
        chaptersCompleted: bucket.chaptersCompleted,
        studyMinutes: bucket.minutes,
        xpEarned: bucket.xpEarned,
      }))
      .sort((a, b) => b.engagement - a.engagement);

    const engagementMean = weightedAverage(engagementAll);
    const concentrationMean = weightedAverage(concentrationAll);

    const focusConsistency = clamp(
      Math.round(100 - Math.sqrt(weightedVariance(engagementAll, engagementMean))),
      0,
      100,
    );

    res.json({
      overview: {
        averageEngagement: engagementMean,
        averageConcentration: concentrationMean,
        focusConsistency,
        chaptersCompleted: chapterProgress.length,
        studyMinutes:
          chapterProgress.reduce((sum, row) => sum + Math.max(1, row.timeSpentMin ?? 0), 0) +
          focusMinutes,
      },
      dailyTrend,
      lessons,
    });
  } catch (error) {
    console.error("getLessonEngagement error:", error);
    res.status(500).json({ message: "Failed to fetch lesson engagement" });
  }
};

// ═════════════════════════════════════════════════════
// DASHBOARD
// ═════════════════════════════════════════════════════

/**
 * Get student dashboard data (XP, progress, recent lessons)
 */
export const getStudentDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;

    const [
      studentXP,
      recentProgress,
      newAchievements,
      availableLessons,
      neuroProfile,
      pendingNeuroAssignments,
      recentNeuroAssignments,
    ] = await Promise.all([
      ensureStudentXP(studentId),
      // Recent lesson progress
      prisma.studentLessonProgress.findMany({
        where: { studentId },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              totalXP: true,
              subjectColor: true,
              subject: { select: { name: true, color: true } },
              chapters: { select: { id: true } },
            },
          },
        },
        orderBy: { lastAccessedAt: "desc" },
        take: 5,
      }),
      // New (unseen) achievements
      prisma.studentAchievement.findMany({
        where: { studentId, isNew: true },
        include: { achievement: true },
      }),
      // Available lessons count
      prisma.lesson.count({
        where: { status: "APPROVED", isPublished: true },
      }),
      prisma.studentNeuroProfile.findUnique({
        where: { studentId },
        select: {
          activeCondition: true,
          confidence: true,
          updatedAt: true,
        },
      }),
      prisma.neuroTestAssignment.findMany({
        where: {
          studentId,
          visibleToStudent: true,
          status: {
            in: ["ASSIGNED", "IN_PROGRESS"],
          },
        },
        include: {
          test: {
            select: {
              id: true,
              key: true,
              title: true,
              targetCondition: true,
              estimatedMin: true,
            },
          },
          assignedByTeacher: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: [
          { dueAt: "asc" },
          { assignedAt: "desc" },
        ],
        take: 8,
      }),
      prisma.neuroTestAssignment.findMany({
        where: {
          studentId,
          visibleToStudent: true,
          status: {
            in: ["ASSIGNED", "IN_PROGRESS", "SUBMITTED", "REVIEWED"],
          },
        },
        include: {
          test: {
            select: {
              id: true,
              key: true,
              title: true,
              targetCondition: true,
              estimatedMin: true,
            },
          },
          assignedByTeacher: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          attempts: {
            select: {
              id: true,
              score: true,
              completedAt: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
        orderBy: {
          assignedAt: "desc",
        },
        take: 8,
      }),
    ]);

    const conditionMap: Record<string, string> = {
      ADHD: "adhd",
      ASD: "asd",
      DYSLEXIA: "dyslexia",
      DYSCALCULIA: "dyscalculia",
      ANXIETY: "anxiety",
      DEPRESSION: "depression",
      DEFAULT: "default",
    };

    const inProgressCount = pendingNeuroAssignments.filter(
      (assignment) => assignment.status === "IN_PROGRESS",
    ).length;

    const nextDueAt = pendingNeuroAssignments
      .map((assignment) => assignment.dueAt)
      .filter((value): value is Date => value instanceof Date)
      .sort((left, right) => left.getTime() - right.getTime())[0] ?? null;

    res.json({
      xp: studentXP,
      recentProgress,
      newAchievements,
      availableLessonsCount: availableLessons,
      neuro: {
        condition: conditionMap[neuroProfile?.activeCondition ?? "DEFAULT"] ?? "default",
        rawCondition: neuroProfile?.activeCondition ?? "DEFAULT",
        confidence: neuroProfile?.confidence ?? null,
        updatedAt: neuroProfile?.updatedAt ?? null,
      },
      neuroAssignments: {
        hasPending: pendingNeuroAssignments.length > 0,
        pendingCount: pendingNeuroAssignments.length,
        inProgressCount,
        nextDueAt,
        pending: pendingNeuroAssignments,
        recent: recentNeuroAssignments,
      },
    });
  } catch (error) {
    console.error("getStudentDashboard error:", error);
    res.status(500).json({ message: "Failed to fetch dashboard" });
  }
};

export const getStudentProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        schoolId: true,
        dateOfBirth: true,
        createdAt: true,
        school: { select: { id: true, name: true } },
        profile: true,
        neuroProfile: {
          select: {
            activeCondition: true,
            confidence: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ message: "Student not found" });
      return;
    }

    const age = calculateAge(user.dateOfBirth);
    const conditionMap: Record<string, string> = {
      ADHD: "adhd",
      ASD: "asd",
      DYSLEXIA: "dyslexia",
      DYSCALCULIA: "dyscalculia",
      ANXIETY: "anxiety",
      DEPRESSION: "depression",
      DEFAULT: "default",
    };

    const normalizedCondition = conditionMap[user.neuroProfile?.activeCondition ?? "DEFAULT"] ?? "default";

    res.json({
      ...user,
      age,
      condition: normalizedCondition,
      neuroCondition: normalizedCondition,
      neuroRawCondition: user.neuroProfile?.activeCondition ?? "DEFAULT",
    });
  } catch (error) {
    console.error("getStudentProfile error:", error);
    res.status(500).json({ message: "Failed to fetch student profile" });
  }
};

export const getStudentSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;

    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId: studentId },
    });

    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId: studentId },
      });
    }

    res.json(prefs);
  } catch (error) {
    console.error("getStudentSettings error:", error);
    res.status(500).json({ message: "Failed to fetch student settings" });
  }
};

export const updateStudentSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const updates = req.body as {
      urgentAlerts?: boolean;
      environmentWarnings?: boolean;
      sessionSummaries?: boolean;
      weeklyReports?: boolean;
      soundAlerts?: boolean;
    };

    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: studentId },
      create: { userId: studentId, ...updates },
      update: { ...updates },
    });

    res.json(prefs);
  } catch (error) {
    console.error("updateStudentSettings error:", error);
    res.status(500).json({ message: "Failed to update student settings" });
  }
};

// ═════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═════════════════════════════════════════════════════

/**
 * Check and unlock achievements based on current progress
 */
async function checkAndUnlockAchievements(
  studentId: string,
  totalXP: number
): Promise<Array<{ id: string; name: string; xpReward: number }>> {
  const newlyUnlocked: Array<{ id: string; name: string; xpReward: number }> = [];

  // Get all achievements not yet unlocked by this student
  const eligibleAchievements = await prisma.achievement.findMany({
    where: {
      studentAchievements: {
        none: { studentId },
      },
    },
  });

  // Get student stats
  const [lessonsCompleted, currentStreak] = await Promise.all([
    prisma.studentLessonProgress.count({
      where: { studentId, isCompleted: true },
    }),
    prisma.studentXP.findUnique({
      where: { studentId },
      select: { currentStreak: true },
    }),
  ]);

  for (const achievement of eligibleAchievements) {
    let shouldUnlock = false;

    // Check XP milestone
    if (achievement.xpRequired && totalXP >= achievement.xpRequired) {
      shouldUnlock = true;
    }

    // Check lessons completed
    if (achievement.lessonsRequired && lessonsCompleted >= achievement.lessonsRequired) {
      shouldUnlock = true;
    }

    // Check streak
    if (
      achievement.streakRequired &&
      currentStreak?.currentStreak &&
      currentStreak.currentStreak >= achievement.streakRequired
    ) {
      shouldUnlock = true;
    }

    if (shouldUnlock) {
      await prisma.studentAchievement.create({
        data: {
          studentId,
          achievementId: achievement.id,
          xpAwarded: achievement.xpReward,
          isNew: true,
        },
      });

      // Award XP for the achievement
      await applyStudentActivity(studentId, achievement.xpReward, 0);

      newlyUnlocked.push({
        id: achievement.id,
        name: achievement.name,
        xpReward: achievement.xpReward,
      });
    }
  }

  return newlyUnlocked;
}
