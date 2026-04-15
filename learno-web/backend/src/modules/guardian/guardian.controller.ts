import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import prisma from "../../config/prisma.js";
import { generatePassword } from "../../utils/generatePassword.js";
import type {
  AssignGuardianNeuroTestInput,
  CreateGuardianStudentInput,
  GuardianNeuroAssignmentStatusInput,
  UpdateGuardianStudentInput,
} from "./guardian.validators.js";

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || "12", 10);

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

const average = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
};

const toPercentRatio = (value: number | null | undefined): number | null => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  if (value <= 1) {
    return clamp(Math.round(value * 100), 0, 100);
  }

  return clamp(Math.round(value), 0, 100);
};

type ConcentrationTrend = "UP" | "DOWN" | "STABLE";

const inferConcentrationTrend = (scores: number[]): ConcentrationTrend => {
  if (scores.length < 6) {
    return "STABLE";
  }

  const currentWindow = scores.slice(0, 4);
  const previousWindow = scores.slice(4, 8);

  if (previousWindow.length === 0) {
    return "STABLE";
  }

  const delta = average(currentWindow) - average(previousWindow);
  if (delta >= 6) {
    return "UP";
  }

  if (delta <= -6) {
    return "DOWN";
  }

  return "STABLE";
};

const parsePositiveInt = (
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, Math.round(parsed)));
};

const ACTIVE_NEURO_ASSIGNMENT_STATUSES: GuardianNeuroAssignmentStatusInput[] = [
  "ASSIGNED",
  "IN_PROGRESS",
  "SUBMITTED",
];

const GUARDIAN_ASSIGNMENT_ALLOWED_STATUSES: GuardianNeuroAssignmentStatusInput[] = [
  "ASSIGNED",
  "IN_PROGRESS",
  "SUBMITTED",
  "REVIEWED",
  "CANCELLED",
];

const getGuardianAssignmentScopeStatuses = (
  scopeRaw: unknown,
): GuardianNeuroAssignmentStatusInput[] => {
  const scope = typeof scopeRaw === "string" ? scopeRaw.trim().toLowerCase() : "active";

  if (scope === "history") {
    return ["SUBMITTED", "REVIEWED", "CANCELLED"];
  }

  if (scope === "all") {
    return [...GUARDIAN_ASSIGNMENT_ALLOWED_STATUSES];
  }

  return [...ACTIVE_NEURO_ASSIGNMENT_STATUSES];
};

const parseNeuroAssignmentStatus = (
  statusRaw: unknown,
): GuardianNeuroAssignmentStatusInput | null => {
  if (typeof statusRaw !== "string") {
    return null;
  }

  const normalized = statusRaw.trim().toUpperCase();
  if ((GUARDIAN_ASSIGNMENT_ALLOWED_STATUSES as string[]).includes(normalized)) {
    return normalized as GuardianNeuroAssignmentStatusInput;
  }

  return null;
};

const isNeuroConditionCode = (
  value: unknown,
): value is
  | "ADHD"
  | "ASD"
  | "DYSLEXIA"
  | "DYSCALCULIA"
  | "ANXIETY"
  | "DEPRESSION"
  | "DEFAULT" => {
  return (
    value === "ADHD" ||
    value === "ASD" ||
    value === "DYSLEXIA" ||
    value === "DYSCALCULIA" ||
    value === "ANXIETY" ||
    value === "DEPRESSION" ||
    value === "DEFAULT"
  );
};

const ensureGuardianOwnsStudent = async (
  guardianId: string,
  studentId: string,
): Promise<boolean> => {
  const link = await prisma.guardianStudent.findUnique({
    where: {
      guardianId_studentId: {
        guardianId,
        studentId,
      },
    },
    select: {
      guardianId: true,
    },
  });

  return Boolean(link);
};

const buildDateOfBirthFromAge = (age: number): Date => {
  const now = new Date();
  const dob = new Date(now.getFullYear() - age, now.getMonth(), now.getDate());
  dob.setHours(0, 0, 0, 0);
  return dob;
};

// ═══════════════════════════════════════════════════════════
// STUDENT MANAGEMENT
// ═══════════════════════════════════════════════════════════

// ── POST /guardian/students ─────────────────────────
// Guardian creates a student account and requests enrollment to a school/class
export const createStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const guardianId = req.user!.id;
    const { fullName, email, dateOfBirth, age, schoolId, classId } = req.body as CreateGuardianStudentInput;

    const parsedDob = dateOfBirth ? new Date(dateOfBirth) : buildDateOfBirthFromAge(age!);
    if (Number.isNaN(parsedDob.getTime())) {
      res.status(400).json({ message: "Invalid date of birth." });
      return;
    }

    // Verify the school exists
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      res.status(404).json({ message: "School not found." });
      return;
    }

    // Verify the class exists and belongs to the school
    const cls = await prisma.class.findFirst({ where: { id: classId, schoolId } });
    if (!cls) {
      res.status(404).json({ message: "Class not found in this school." });
      return;
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ message: "Email already in use." });
      return;
    }

    // Generate a secure password for the student
    const generatedPassword = generatePassword(12);
    const hashedPassword = await bcrypt.hash(generatedPassword, SALT_ROUNDS);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the student user (with schoolId set)
      const student = await tx.user.create({
        data: {
          fullName,
          email,
          password: hashedPassword,
          role: "STUDENT",
          dateOfBirth: parsedDob,
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

      // 2. Create enrollment with PENDING status
      const enrollment = await tx.studentClass.create({
        data: {
          studentId: student.id,
          classId,
          status: "PENDING",
        },
      });

      // 3. Link guardian to student
      await tx.guardianStudent.create({
        data: {
          guardianId,
          studentId: student.id,
        },
      });

      return { student, enrollment };
    });

    res.status(201).json({
      message: "Student created successfully. Awaiting school approval.",
      student: {
        id: result.student.id,
        fullName: result.student.fullName,
        email: result.student.email,
        dateOfBirth: result.student.dateOfBirth,
      },
      enrollment: {
        id: result.enrollment.id,
        classId,
        className: cls.name,
        schoolId,
        schoolName: school.name,
        status: "PENDING",
      },
      // Return the generated password so guardian can give it to the student
      generatedPassword,
    });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /guardian/students/:studentId ──────────────
// Guardian updates linked child profile fields (name / age / DOB)
export const updateStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const guardianId = req.user!.id;
    const studentId = req.params.studentId as string;
    const { fullName, dateOfBirth, age } = req.body as UpdateGuardianStudentInput;

    const guardianOwnsStudent = await ensureGuardianOwnsStudent(guardianId, studentId);
    if (!guardianOwnsStudent) {
      res.status(403).json({ message: "You are not linked to this student." });
      return;
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true },
    });

    if (!student || student.role !== "STUDENT") {
      res.status(404).json({ message: "Student not found." });
      return;
    }

    const updateData: {
      fullName?: string;
      dateOfBirth?: Date;
    } = {};

    if (typeof fullName === "string") {
      updateData.fullName = fullName.trim();
    }

    if (typeof dateOfBirth === "string") {
      const parsedDob = new Date(dateOfBirth);
      if (Number.isNaN(parsedDob.getTime())) {
        res.status(400).json({ message: "Invalid date of birth." });
        return;
      }
      updateData.dateOfBirth = parsedDob;
    } else if (typeof age === "number") {
      updateData.dateOfBirth = buildDateOfBirthFromAge(age);
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ message: "No updates provided." });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: studentId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        dateOfBirth: true,
        schoolId: true,
        school: { select: { id: true, name: true } },
        enrollment: {
          select: {
            id: true,
            status: true,
            seatNumber: true,
            class: { select: { id: true, name: true } },
          },
        },
      },
    });

    res.json({
      message: "Student profile updated successfully.",
      student: updated,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /guardian/students ──────────────────────────
// Get all students linked to this guardian
export const getStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const guardianId = req.user!.id;

    const links = await prisma.guardianStudent.findMany({
      where: { guardianId },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            dateOfBirth: true,
            schoolId: true,
            school: { select: { id: true, name: true } },
            enrollment: {
              select: {
                id: true,
                status: true,
                seatNumber: true,
                class: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    const students = links.map((link) => link.student);

    res.json({ students, total: students.length });
  } catch (err) {
    next(err);
  }
};

// ── GET /guardian/students/:studentId ───────────────
// Get a specific student's details
export const getStudentDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const guardianId = req.user!.id;
    const studentId = req.params.studentId as string;

    // Verify guardian is linked to this student
    const link = await prisma.guardianStudent.findUnique({
      where: { guardianId_studentId: { guardianId, studentId } },
    });

    if (!link) {
      res.status(403).json({ message: "You are not linked to this student." });
      return;
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        fullName: true,
        email: true,
        dateOfBirth: true,
        createdAt: true,
        school: { select: { id: true, name: true } },
        enrollment: {
          select: {
            id: true,
            status: true,
            seatNumber: true,
            enrolledAt: true,
            class: { select: { id: true, name: true } },
          },
        },
        profile: { select: { avatarUrl: true } },
      },
    });

    if (!student) {
      res.status(404).json({ message: "Student not found." });
      return;
    }

    res.json({ student });
  } catch (err) {
    next(err);
  }
};

// ── GET /guardian/students/:studentId/progress ──────
// Get a student's learning progress
export const getStudentProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const guardianId = req.user!.id;
    const studentId = req.params.studentId as string;

    // Verify guardian is linked to this student
    const link = await prisma.guardianStudent.findUnique({
      where: { guardianId_studentId: { guardianId, studentId } },
    });

    if (!link) {
      res.status(403).json({ message: "You are not linked to this student." });
      return;
    }

    const [studentXP, lessonProgress, achievements, enrollment] = await Promise.all([
      prisma.studentXP.findUnique({
        where: { studentId },
      }),
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
        orderBy: { lastAccessedAt: "desc" },
        take: 20,
      }),
      prisma.studentAchievement.findMany({
        where: { studentId },
        include: {
          achievement: {
            select: {
              id: true,
              name: true,
              description: true,
              icon: true,
              xpReward: true,
            },
          },
        },
        orderBy: { unlockedAt: "desc" },
        take: 10,
      }),
      prisma.studentClass.findUnique({
        where: { studentId },
        select: { classId: true },
      }),
    ]);

    const classSessions = enrollment?.classId
      ? await prisma.session.findMany({
          where: {
            classId: enrollment.classId,
            status: "COMPLETED",
          },
          select: {
            engagementScore: true,
            studentRatio: true,
            teacherRatio: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 24,
        })
      : [];

    const concentrationSeries: number[] = [];
    const attentionSeries: number[] = [];
    const engagementSeries: number[] = [];

    classSessions.forEach((session) => {
      const engagement =
        typeof session.engagementScore === "number"
          ? clamp(Math.round(session.engagementScore), 0, 100)
          : null;

      const studentRatio = toPercentRatio(session.studentRatio);
      const teacherRatio = toPercentRatio(session.teacherRatio);

      let attention: number | null = null;
      if (studentRatio !== null) {
        attention = studentRatio;
      } else if (teacherRatio !== null) {
        attention = clamp(100 - teacherRatio, 0, 100);
      }

      if (attention !== null) {
        attentionSeries.push(attention);
      }

      if (engagement !== null) {
        engagementSeries.push(engagement);
      }

      const concentration =
        engagement !== null && attention !== null
          ? clamp(Math.round(engagement * 0.65 + attention * 0.35), 0, 100)
          : engagement ?? attention;

      if (concentration !== null) {
        concentrationSeries.push(concentration);
      }
    });

    const classConcentration =
      concentrationSeries.length > 0
        ? {
            concentrationScore: average(concentrationSeries),
            attentionScore: average(
              attentionSeries.length > 0 ? attentionSeries : concentrationSeries,
            ),
            classEngagementScore: average(
              engagementSeries.length > 0 ? engagementSeries : concentrationSeries,
            ),
            sessionCount: concentrationSeries.length,
            trend: inferConcentrationTrend(concentrationSeries),
          }
        : null;

    res.json({
      xp: studentXP || { totalXP: 0, level: 1 },
      recentLessons: lessonProgress,
      recentAchievements: achievements,
      classConcentration,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /guardian/neuro/tests ────────────────────────
// List active neuro tests assignable by guardian
export const getAssignableNeuroTests = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const limit = parsePositiveInt(req.query.limit, 80, 1, 300);
    const targetConditionRaw =
      typeof req.query.targetCondition === "string"
        ? req.query.targetCondition.trim().toUpperCase()
        : undefined;

    const targetCondition =
      targetConditionRaw && isNeuroConditionCode(targetConditionRaw)
        ? targetConditionRaw
        : undefined;

    const where = {
      lifecycle: "ACTIVE" as const,
      ...(targetCondition ? { targetCondition } : {}),
    };

    const [tests, total] = await Promise.all([
      prisma.neuroTest.findMany({
        where,
        select: {
          id: true,
          key: true,
          title: true,
          description: true,
          instructionText: true,
          targetCondition: true,
          lifecycle: true,
          version: true,
          estimatedMin: true,
          updatedAt: true,
          condition: {
            select: {
              id: true,
              code: true,
              label: true,
              description: true,
              isActive: true,
            },
          },
        },
        orderBy: [{ targetCondition: "asc" }, { updatedAt: "desc" }],
        take: limit,
      }),
      prisma.neuroTest.count({ where }),
    ]);

    res.json({
      tests,
      total,
      limit,
      filters: {
        targetCondition: targetCondition ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /guardian/neuro/assignments ─────────────────
// Guardian assigns an active neuro test to linked child
export const assignNeuroTestToChild = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const guardianId = req.user!.id;
    const body = req.body as AssignGuardianNeuroTestInput;

    const [test, student, guardianOwnsStudent] = await Promise.all([
      prisma.neuroTest.findUnique({
        where: { id: body.testId },
        select: {
          id: true,
          title: true,
          lifecycle: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: body.studentId },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          enrollment: {
            select: {
              classId: true,
            },
          },
        },
      }),
      ensureGuardianOwnsStudent(guardianId, body.studentId),
    ]);

    if (!test) {
      res.status(404).json({ message: "Neuro test not found." });
      return;
    }

    if (test.lifecycle !== "ACTIVE") {
      res.status(400).json({ message: "Only ACTIVE tests can be assigned." });
      return;
    }

    if (!student || student.role !== "STUDENT") {
      res.status(404).json({ message: "Student not found." });
      return;
    }

    if (!guardianOwnsStudent) {
      res.status(403).json({ message: "You are not linked to this student." });
      return;
    }

    const existingActiveAssignment = await prisma.neuroTestAssignment.findFirst({
      where: {
        testId: body.testId,
        studentId: body.studentId,
        status: {
          in: ACTIVE_NEURO_ASSIGNMENT_STATUSES,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (existingActiveAssignment) {
      res.status(409).json({
        message: "Student already has an active assignment for this test.",
        existingAssignmentId: existingActiveAssignment.id,
      });
      return;
    }

    const assignment = await prisma.$transaction(async (tx) => {
      const created = await tx.neuroTestAssignment.create({
        data: {
          testId: body.testId,
          studentId: body.studentId,
          assignedByTeacherId: guardianId,
          classId: student.enrollment?.classId ?? null,
          visibleToStudent: body.visibleToStudent ?? true,
          dueAt: body.dueAt ? new Date(body.dueAt) : null,
          notes: body.notes ?? null,
        },
        include: {
          test: true,
          student: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          assignedByTeacher: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          class: {
            select: {
              id: true,
              name: true,
            },
          },
          attempts: {
            orderBy: {
              createdAt: "desc",
            },
            take: 3,
          },
        },
      });

      await tx.notification.create({
        data: {
          userId: body.studentId,
          type: "GENERAL",
          title: "New Neuro Test Assigned",
          message: `${test.title} was assigned to you. Open Neuro Tests to start it.`,
        },
      });

      return created;
    });

    res.status(201).json(assignment);
  } catch (err) {
    next(err);
  }
};

// ── GET /guardian/students/:studentId/neuro-assignments
// Guardian views neuro assignments for linked student
export const getStudentNeuroAssignments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const guardianId = req.user!.id;
    const studentId = req.params.studentId as string;
    const scope = typeof req.query.scope === "string" ? req.query.scope.trim().toLowerCase() : "active";
    const scopeStatuses = getGuardianAssignmentScopeStatuses(req.query.scope);
    const statusFilter = parseNeuroAssignmentStatus(req.query.status);
    const limit = parsePositiveInt(req.query.limit, 80, 1, 300);

    const guardianOwnsStudent = await ensureGuardianOwnsStudent(guardianId, studentId);
    if (!guardianOwnsStudent) {
      res.status(403).json({ message: "You are not linked to this student." });
      return;
    }

    const where = {
      studentId,
      status: statusFilter ?? ({ in: scopeStatuses } as const),
    };

    const [assignments, total] = await Promise.all([
      prisma.neuroTestAssignment.findMany({
        where,
        include: {
          test: true,
          assignedByTeacher: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          class: {
            select: {
              id: true,
              name: true,
            },
          },
          attempts: {
            orderBy: {
              createdAt: "desc",
            },
            take: 3,
          },
        },
        orderBy: {
          assignedAt: "desc",
        },
        take: limit,
      }),
      prisma.neuroTestAssignment.count({ where }),
    ]);

    const pendingCount = assignments.filter(
      (assignment) => assignment.status === "ASSIGNED" || assignment.status === "IN_PROGRESS",
    ).length;

    const submittedCount = assignments.filter(
      (assignment) => assignment.status === "SUBMITTED" || assignment.status === "REVIEWED",
    ).length;

    res.json({
      studentId,
      scope,
      total,
      limit,
      summary: {
        pendingCount,
        submittedCount,
      },
      assignments,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /guardian/schools ───────────────────────────
// Get list of schools (for selecting when creating student)
export const getSchools = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });

    res.json({ schools, total: schools.length });
  } catch (err) {
    next(err);
  }
};

// ── GET /guardian/schools/:schoolId/classes ─────────
// Get classes for a specific school (for selecting when creating student)
export const getSchoolClasses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.params.schoolId as string;

    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      res.status(404).json({ message: "School not found." });
      return;
    }

    const classes = await prisma.class.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });

    res.json({ school: { id: school.id, name: school.name }, classes, total: classes.length });
  } catch (err) {
    next(err);
  }
};
