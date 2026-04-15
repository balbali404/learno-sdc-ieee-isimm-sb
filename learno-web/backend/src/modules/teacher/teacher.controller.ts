import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../../config/prisma.js";
import { generatePassword } from "../../utils/generatePassword.js";
import { UpdateNotificationPrefsInput, CreateStudentInput, UpdateProfileInput } from "../../core/validators/schemas.js";

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || "12", 10);
const prismaAny = prisma as any;

// ── GET Dashboard Data ──────────────────────────────
export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;

    // Get teacher profile
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        schoolId: true,
        profile: { select: { avatarUrl: true, phone: true, bio: true } },
        school: { select: { id: true, name: true } },
      },
    });

    // Unread notifications count
    const unreadNotifications = await prisma.notification.count({
      where: { userId: teacherId, read: false },
    });

    // Unread messages count
    const unreadMessages = await prisma.message.count({
      where: {
        conversation: {
          OR: [{ participantA: teacherId }, { participantB: teacherId }],
        },
        senderId: { not: teacherId },
        status: { in: ["SENT", "DELIVERED"] },
      },
    });

    // Next timetable session
    const nextSession = await prisma.timetable.findFirst({
      where: { teacherId },
      include: { class: true, subject: true },
      orderBy: { day: "asc" },
    });

    // Total classes taught
    const classCount = await prisma.timetable.findMany({
      where: { teacherId },
      select: { classId: true },
      distinct: ["classId"],
    });

    res.json({
      teacher,
      unreadNotifications,
      unreadMessages,
      nextSession,
      totalClasses: classCount.length,
    });
  } catch (error) {
    console.error("getDashboard error:", error);
    res.status(500).json({ message: "Failed to fetch dashboard" });
  }
};

// ── GET Classes ─────────────────────────────────────
export const getClasses = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;

    // Find distinct classes taught by this teacher from the timetable
    const timetables = await prisma.timetable.findMany({
      where: { teacherId },
      include: {
        class: {
          include: {
            _count: { select: { students: true } }
          }
        },
        subject: true,
      },
    });

    // Group by class to avoid duplicates if a teacher teaches multiple subjects to same class
    const classesMap = new Map();
    timetables.forEach(tt => {
      const cls = tt.class;
      if (!classesMap.has(cls.id)) {
        classesMap.set(cls.id, {
          id: cls.id,
          name: cls.name,
          studentCount: cls._count.students,
          subjects: [],
          schedules: []
        });
      }
      const c = classesMap.get(cls.id);
      if (!c.subjects.includes(tt.subject.name)) {
        c.subjects.push(tt.subject.name);
      }
      c.schedules.push({ day: tt.day, startTime: tt.startTime, endTime: tt.endTime });
    });

    res.json(Array.from(classesMap.values()));
  } catch (error) {
    console.error("getClasses error:", error);
    res.status(500).json({ message: "Failed to fetch classes" });
  }
};

// ── GET Class Students ──────────────────────────────
export const getClassStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const classId = req.params.classId as string;

    // Verify teacher teaches this class
    const teachesClass = await prisma.timetable.findFirst({
      where: { teacherId, classId }
    });

    if (!teachesClass) {
      res.status(403).json({ message: "Forbidden. You do not teach this class." });
      return;
    }

    const students = await prisma.studentClass.findMany({
      where: { classId },
      include: {
        student: {
          select: { id: true, fullName: true, email: true, profile: { select: { avatarUrl: true }} }
        }
      }
    });

    res.json(students);
  } catch (error) {
    console.error("getClassStudents error:", error);
    res.status(500).json({ message: "Failed to fetch students" });
  }
};

// â”€â”€ GET Latest Class Environment Reading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getClassEnvironmentLatest = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const classId = req.params.classId as string;

    const teachesClass = await prisma.timetable.findFirst({
      where: { teacherId, classId },
      select: { id: true },
    });

    if (!teachesClass) {
      res.status(403).json({ message: "Forbidden. You do not teach this class." });
      return;
    }

    const reading = await prisma.environmentReading.findFirst({
      where: { classId },
      orderBy: { receivedAt: "desc" },
    });

    if (!reading) {
      res.json({ reading: null });
      return;
    }

    res.json({
      reading: {
        id: reading.id,
        classId: reading.classId,
        sessionId: reading.sessionId,
        deviceId: reading.deviceId,
        co2Ppm: reading.co2Ppm,
        temperatureC: reading.temperatureC,
        humidityPct: reading.humidityPct,
        lightLux: reading.lightLux,
        receivedAt: reading.receivedAt,
      },
    });
  } catch (error) {
    console.error("getClassEnvironmentLatest error:", error);
    res.status(500).json({ message: "Failed to fetch class environment" });
  }
};

// ── GET All Students ────────────────────────────────
export const getStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;

    // Teacher's classes
    const classIds = await prisma.timetable.findMany({
      where: { teacherId },
      select: { classId: true }
    }).then(res => [...new Set(res.map(r => r.classId))]);

    // Students in those classes
    const students = await prisma.studentClass.findMany({
      where: { classId: { in: classIds } },
      include: {
        student: {
          select: { id: true, fullName: true, email: true, profile: { select: { avatarUrl: true }} }
        },
        class: { select: { id: true, name: true } }
      }
    });

    const studentIds = [...new Set(students.map((entry) => entry.studentId).filter(Boolean))] as string[];

    const latestVisionRowsRaw = studentIds.length
      ? await prismaAny.sessionVisionStudent.findMany({
          where: {
            studentId: { in: studentIds },
          },
          orderBy: [
            { createdAt: "desc" },
          ],
          select: {
            studentId: true,
            meanCaes: true,
            minCaes: true,
            maxCaes: true,
            trend: true,
            lowEngagement: true,
            createdAt: true,
            session: {
              select: {
                id: true,
                classId: true,
                createdAt: true,
                visionAnalysis: {
                  select: {
                    classEngagementAvg: true,
                  },
                },
              },
            },
          },
        })
      : [];

    const latestByStudent = new Map<string, any>();
    for (const row of latestVisionRowsRaw) {
      if (!row.studentId) {
        continue;
      }
      if (!latestByStudent.has(row.studentId)) {
        latestByStudent.set(row.studentId, row);
      }
    }

    res.json(
      students.map((entry) => {
        const vision = latestByStudent.get(entry.studentId);
        const attention =
          typeof vision?.meanCaes === "number"
            ? Math.max(0, Math.min(100, Math.round(vision.meanCaes * 100)))
            : 0;

        return {
          ...entry,
          attentionScore: attention,
          vision: vision
            ? {
                meanCaes: vision.meanCaes,
                minCaes: vision.minCaes,
                maxCaes: vision.maxCaes,
                trend: vision.trend,
                lowEngagement: vision.lowEngagement,
                classEngagementAvg: vision.session?.visionAnalysis?.classEngagementAvg ?? null,
                sessionId: vision.session?.id ?? null,
                sessionCreatedAt: vision.session?.createdAt ?? null,
              }
            : null,
        };
      }),
    );
  } catch (error) {
    console.error("getStudents error:", error);
    res.status(500).json({ message: "Failed to fetch students" });
  }
};

// ── GET Timetable ───────────────────────────────────
export const getTimetable = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;

    const timetable = await prisma.timetable.findMany({
      where: { teacherId },
      include: {
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
      },
      orderBy: [
        { day: 'asc' },   // Note: Enums sort alphabetically. In real app, map Day enum to number.
        { startTime: 'asc' }
      ]
    });

    res.json(timetable);
  } catch (error) {
    console.error("getTimetable error:", error);
    res.status(500).json({ message: "Failed to fetch timetable" });
  }
};

// ── GET Notifications ───────────────────────────────
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;

    const notifications = await prisma.notification.findMany({
      where: { userId: teacherId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json(notifications);
  } catch (error) {
    console.error("getNotifications error:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

// ── PATCH Read Notification ─────────────────────────
export const readNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const notificationId = req.params.id as string;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== teacherId) {
      res.status(404).json({ message: "Notification not found" });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    res.json(updated);
  } catch (error) {
    console.error("readNotification error:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
};

export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId: teacherId }
    });

    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId: teacherId }
      });
    }

    res.json(prefs);
  } catch (error) {
    console.error("getSettings error:", error);
    res.status(500).json({ message: "Failed to fetch settings" });
  }
};

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const updates = req.body as UpdateNotificationPrefsInput;

    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: teacherId },
      create: { userId: teacherId, ...updates },
      update: { ...updates },
    });

    res.json(prefs);
  } catch (error) {
    console.error("updateSettings error:", error);
    res.status(500).json({ message: "Failed to update settings" });
  }
};

// ═══════════════════════════════════════════════════════════
// PROFILE MANAGEMENT
// ═══════════════════════════════════════════════════════════

// ── GET Profile ─────────────────────────────────────
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        schoolId: true,
        createdAt: true,
        school: { select: { id: true, name: true } },
        profile: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error("getProfile error:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

// ── PATCH Update Profile ────────────────────────────
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const { fullName, avatarUrl, phone, bio } = req.body as UpdateProfileInput;

    // Update user fullName if provided
    if (fullName) {
      await prisma.user.update({
        where: { id: teacherId },
        data: { fullName },
      });
    }

    // Upsert profile data
    const profile = await prisma.userProfile.upsert({
      where: { userId: teacherId },
      create: {
        userId: teacherId,
        avatarUrl,
        phone,
        bio,
      },
      update: {
        avatarUrl,
        phone,
        bio,
      },
    });

    // Fetch updated user with profile
    const user = await prisma.user.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        profile: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error("updateProfile error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

// ═══════════════════════════════════════════════════════════
// STUDENT MANAGEMENT
// ═══════════════════════════════════════════════════════════

// ── POST Create Student ─────────────────────────────
// Teacher creates a student account in their class (password auto-generated)
export const createStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const schoolId = req.user!.schoolId;
    const { fullName, email, dateOfBirth, classId } = req.body as CreateStudentInput;

    // Verify teacher teaches this class
    const teachesClass = await prisma.timetable.findFirst({
      where: { teacherId, classId },
    });

    if (!teachesClass) {
      res.status(403).json({ message: "You do not teach this class." });
      return;
    }

    // Verify the class belongs to the teacher's school
    const cls = await prisma.class.findFirst({ where: { id: classId, schoolId } });
    if (!cls) {
      res.status(404).json({ message: "Class not found in your school." });
      return;
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ message: "Email already in use." });
      return;
    }

    const generatedPassword = generatePassword(12);
    const hashedPassword = await bcrypt.hash(generatedPassword, SALT_ROUNDS);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the student user
      const student = await tx.user.create({
        data: {
          fullName,
          email,
          password: hashedPassword,
          role: "STUDENT",
          dateOfBirth: new Date(dateOfBirth),
          schoolId,
        },
      });

      await tx.studentNeuroProfile.create({
        data: {
          studentId: student.id,
          activeCondition: "DEFAULT",
          sourceNotes: "Initialized at student account creation",
        },
      });

      // 2. Create approved enrollment (teacher creates = auto-approved)
      const enrollment = await tx.studentClass.create({
        data: {
          studentId: student.id,
          classId,
          status: "APPROVED",
        },
      });

      return { student, enrollment };
    });

    res.status(201).json({
      message: "Student created and enrolled successfully.",
      student: {
        id: result.student.id,
        fullName: result.student.fullName,
        email: result.student.email,
        role: result.student.role,
        dateOfBirth: result.student.dateOfBirth,
        schoolId: result.student.schoolId,
      },
      enrollment: {
        id: result.enrollment.id,
        classId,
        status: "APPROVED",
      },
      generatedPassword,
    });
  } catch (error) {
    console.error("createStudent error:", error);
    res.status(500).json({ message: "Failed to create student" });
  }
};
