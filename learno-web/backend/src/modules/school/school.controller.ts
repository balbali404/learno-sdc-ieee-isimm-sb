import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import prisma from "../../config/prisma.js";
import { generatePassword } from "../../utils/generatePassword.js";

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || "12", 10);

// ═══════════════════════════════════════════════════════════
// CO-ADMINS
// ═══════════════════════════════════════════════════════════

// ── POST /api/school/co-admins ──────────────────────
export const addCoAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId;
    const { fullName, email } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ message: "Email already in use." });
      return;
    }

    const generatedPassword = generatePassword(12);
    const hashedPassword = await bcrypt.hash(generatedPassword, SALT_ROUNDS);
    const admin = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        role: "SCHOOL_ADMIN",
        schoolId,
      },
      select: { id: true, fullName: true, email: true, role: true, createdAt: true },
    });

    res.status(201).json({
      message: "Co-admin created successfully.",
      admin,
      generatedPassword,
    });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════
// TEACHERS
// ═══════════════════════════════════════════════════════════

// ── POST /api/school/teachers ───────────────────────
export const addTeacher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId;
    const { fullName, email } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ message: "Email already in use." });
      return;
    }

    const generatedPassword = generatePassword(12);
    const hashedPassword = await bcrypt.hash(generatedPassword, SALT_ROUNDS);
    const teacher = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        role: "TEACHER",
        schoolId,
      },
      select: { id: true, fullName: true, email: true, role: true, createdAt: true },
    });

    res.status(201).json({
      message: "Teacher created successfully.",
      teacher,
      generatedPassword,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/school/teachers ────────────────────────
export const getTeachers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId;
    const teachers = await prisma.user.findMany({
      where: { schoolId, role: "TEACHER" },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
        profile: { select: { avatarUrl: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ teachers, total: teachers.length });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/school/teachers/:id ─────────────────
export const removeTeacher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId;
    const teacher = await prisma.user.findFirst({
      where: { id: req.params.id as string, schoolId, role: "TEACHER" },
    });
    if (!teacher) {
      res.status(404).json({ message: "Teacher not found in your school." });
      return;
    }

    await prisma.user.delete({ where: { id: req.params.id as string } });
    res.json({ message: "Teacher removed successfully." });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════
// ENROLLMENT MANAGEMENT
// ═══════════════════════════════════════════════════════════

// ── GET /api/school/enrollments/pending ──────────────
export const getPendingEnrollments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId;

    const pendingEnrollments = await prisma.studentClass.findMany({
      where: {
        status: "PENDING",
        class: { schoolId },
      },
      include: {
        student: { select: { id: true, fullName: true, email: true, dateOfBirth: true } },
        class: { select: { id: true, name: true } },
      },
      orderBy: { enrolledAt: "desc" },
    });

    res.json({ enrollments: pendingEnrollments, total: pendingEnrollments.length });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/school/enrollments/handle ─────────────
// Approve (with seat number) or reject a pending enrollment
export const handleEnrollment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId;
    const { enrollmentId, action, seatNumber } = req.body;

    const enrollment = await prisma.studentClass.findUnique({
      where: { id: enrollmentId },
      include: { class: { select: { schoolId: true } } },
    });

    if (!enrollment || enrollment.class.schoolId !== schoolId) {
      res.status(404).json({ message: "Enrollment not found in your school." });
      return;
    }

    if (enrollment.status !== "PENDING") {
      res.status(400).json({ message: `Enrollment already ${enrollment.status.toLowerCase()}.` });
      return;
    }

    if (action === "APPROVED") {
      if (!seatNumber) {
        res.status(400).json({ message: "Seat number is required when approving." });
        return;
      }

      const updated = await prisma.studentClass.update({
        where: { id: enrollmentId },
        data: { status: "APPROVED", seatNumber },
        include: {
          student: { select: { id: true, fullName: true } },
          class: { select: { id: true, name: true } },
        },
      });

      res.json({ message: "Enrollment approved.", enrollment: updated });
      return;
    }

    // REJECTED — delete the enrollment and the student account
    await prisma.$transaction(async (tx) => {
      const studentId = enrollment.studentId;
      await tx.studentClass.delete({ where: { id: enrollmentId } });
      // Optionally keep the student account, or delete it:
      // await tx.user.delete({ where: { id: studentId } });
    });

    res.json({ message: "Enrollment rejected." });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════
// STUDENTS
// ═══════════════════════════════════════════════════════════

// ── GET /api/school/students ────────────────────────
export const getStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId;
    const students = await prisma.user.findMany({
      where: { schoolId, role: "STUDENT" },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        dateOfBirth: true,
        createdAt: true,
        enrollment: {
          select: {
            status: true,
            seatNumber: true,
            class: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ students, total: students.length });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/school/students/:id ─────────────────
export const removeStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId;
    const student = await prisma.user.findFirst({
      where: { id: req.params.id as string, schoolId, role: "STUDENT" },
    });
    if (!student) {
      res.status(404).json({ message: "Student not found in your school." });
      return;
    }

    await prisma.user.delete({ where: { id: req.params.id as string } });
    res.json({ message: "Student removed successfully." });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════
// CLASSES
// ═══════════════════════════════════════════════════════════

// ── POST /api/school/classes ────────────────────────
export const createClass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId;
    const { name } = req.body;

    const newClass = await prisma.class.create({
      data: { schoolId, name },
    });

    res.status(201).json({ message: "Class created successfully.", class: newClass });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/school/classes ─────────────────────────
export const getClasses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId;
    const classes = await prisma.class.findMany({
      where: { schoolId },
      include: { _count: { select: { students: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json({ classes, total: classes.length });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/school/classes/:id ──────────────────
export const deleteClass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId;
    const cls = await prisma.class.findFirst({ where: { id: req.params.id as string, schoolId } });
    if (!cls) {
      res.status(404).json({ message: "Class not found in your school." });
      return;
    }

    await prisma.class.delete({ where: { id: req.params.id as string } });
    res.json({ message: "Class deleted successfully." });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════
// SUBJECTS
// ═══════════════════════════════════════════════════════════

// ── POST /api/school/subjects ───────────────────────
export const createSubject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId;
    const { name } = req.body;

    const existing = await prisma.subject.findFirst({ where: { schoolId, name } });
    if (existing) {
      res.status(409).json({ message: "Subject already exists in your school." });
      return;
    }

    const subject = await prisma.subject.create({ data: { schoolId, name } });
    res.status(201).json({ message: "Subject created successfully.", subject });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/school/subjects ────────────────────────
export const getSubjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId;
    const subjects = await prisma.subject.findMany({ where: { schoolId } });

    res.json({ subjects, total: subjects.length });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/school/subjects/:id ─────────────────
export const deleteSubject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId;
    const subject = await prisma.subject.findFirst({ where: { id: req.params.id as string, schoolId } });
    if (!subject) {
      res.status(404).json({ message: "Subject not found in your school." });
      return;
    }

    await prisma.subject.delete({ where: { id: req.params.id as string } });
    res.json({ message: "Subject deleted successfully." });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════
// TIMETABLE
// ═══════════════════════════════════════════════════════════

// ── POST /api/school/timetable ──────────────────────
export const createTimetableEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId;
    const { teacherId, classId, subjectId, day, startTime, endTime } = req.body;

    // Verify teacher belongs to same school
    const teacher = await prisma.user.findFirst({
      where: { id: teacherId, schoolId, role: "TEACHER" },
    });
    if (!teacher) {
      res.status(404).json({ message: "Teacher not found in your school." });
      return;
    }

    // Verify class belongs to same school
    const cls = await prisma.class.findFirst({ where: { id: classId, schoolId } });
    if (!cls) {
      res.status(404).json({ message: "Class not found in your school." });
      return;
    }

    const entry = await prisma.timetable.create({
      data: {
        teacherId,
        classId,
        subjectId,
        day,
        startTime: new Date(`1970-01-01T${startTime}:00Z`),
        endTime: new Date(`1970-01-01T${endTime}:00Z`),
      },
      include: {
        teacher: { select: { id: true, fullName: true } },
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ message: "Timetable entry created.", timetable: entry });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/school/timetable ───────────────────────
export const getTimetable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId;

    const classes = await prisma.class.findMany({
      where: { schoolId },
      select: { id: true },
    });
    const classIds = classes.map((c) => c.id);

    const timetable = await prisma.timetable.findMany({
      where: { classId: { in: classIds } },
      include: {
        teacher: { select: { id: true, fullName: true } },
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
      },
      orderBy: [{ day: "asc" }, { startTime: "asc" }],
    });

    res.json({ timetable, total: timetable.length });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/school/timetable/:id ────────────────
export const deleteTimetableEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId;

    const entry = await prisma.timetable.findUnique({
      where: { id: req.params.id as string },
      include: { class: { select: { schoolId: true } } },
    });
    if (!entry || entry.class.schoolId !== schoolId) {
      res.status(404).json({ message: "Timetable entry not found in your school." });
      return;
    }

    await prisma.timetable.delete({ where: { id: req.params.id as string } });
    res.json({ message: "Timetable entry deleted successfully." });
  } catch (err) {
    next(err);
  }
};
