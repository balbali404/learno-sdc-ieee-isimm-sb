import "dotenv/config";
import bcrypt from "bcrypt";

const IDS = {
  school: "seed-school-learno",
  class: "seed-class-a",
  timetable: "seed-timetable-single",
} as const;

const STUDENTS = [
  { name: "Adam Karim", email: "adam@student.learno.com", seat: 1, neuro: "ADHD" },
  { name: "Nour Belkacem", email: "nour@student.learno.com", seat: 2, neuro: "DYSLEXIA" },
  { name: "Yasmine Haddad", email: "yasmine@student.learno.com", seat: 3, neuro: "DYSCALCULIA" },
  { name: "Rayan Salem", email: "rayan@student.learno.com", seat: 4, neuro: "ASD" },
  { name: "Lina Ait", email: "lina@student.learno.com", seat: 5, neuro: "ANXIETY" },
  { name: "Imad Nouri", email: "imad@student.learno.com", seat: 6, neuro: "DEPRESSION" },
  { name: "Sara Benali", email: "sara@student.learno.com", seat: 7, neuro: "DEFAULT" },
] as const;

const GUARDIANS = [
  { name: "Karim Adam", email: "karim.adam@gmail.com", studentEmail: "adam@student.learno.com" },
  { name: "Nour Belkacem", email: "nour.belkacem@gmail.com", studentEmail: "nour@student.learno.com" },
] as const;

const DEFAULT_STUDENT_AGE = 10;
const PASSWORD = "Learno123";

const toTime = (hour: number, minute: number): Date => {
  return new Date(Date.UTC(1970, 0, 1, hour, minute, 0));
};

const toDateOfBirthFromAge = (age: number, ref = new Date()): Date => {
  const year = ref.getUTCFullYear() - age;
  return new Date(Date.UTC(year, 8, 1, 0, 0, 0));
};

const CONDITION_LABELS: Record<
  "ADHD" | "ASD" | "DYSLEXIA" | "DYSCALCULIA" | "ANXIETY" | "DEPRESSION" | "DEFAULT",
  string
> = {
  ADHD: "Attention Support (ADHD)",
  ASD: "Sensory and Social Support (ASD)",
  DYSLEXIA: "Reading Support (Dyslexia)",
  DYSCALCULIA: "Math Support (Dyscalculia)",
  ANXIETY: "Anxiety Support",
  DEPRESSION: "Mood Support",
  DEFAULT: "General Learning Profile",
};

const CONDITION_DESCRIPTIONS: Record<
  "ADHD" | "ASD" | "DYSLEXIA" | "DYSCALCULIA" | "ANXIETY" | "DEPRESSION" | "DEFAULT",
  string
> = {
  ADHD: "Classroom signals that may suggest sustained attention and impulsivity support needs.",
  ASD: "Classroom signals related to sensory processing and structured interaction support.",
  DYSLEXIA: "Reading and decoding support indicators for classroom planning.",
  DYSCALCULIA: "Numeracy and symbolic reasoning support indicators for classroom planning.",
  ANXIETY: "Indicators linked to stress and participation confidence in school contexts.",
  DEPRESSION: "Indicators linked to persistent low engagement and mood-related school impact.",
  DEFAULT: "Baseline profile used when no specific condition is currently assigned.",
};

const NEURO_TEMPLATES = [
  {
    key: "focus-check",
    title: "Focus Check",
    description: "CPT-style sustained attention, Go/No-Go inhibition, working-memory sequencing, and multi-step instruction handling.",
    instructionText: "Complete the full Focus Check interactive flow. This screener supports classroom planning and is not a medical diagnosis.",
    targetCondition: "ADHD",
    estimatedMin: 5,
  },
  {
    key: "reading-support-check",
    title: "Reading Support Check",
    description: "Decoding, word recognition, comprehension, sentence reconstruction, and text-only versus audio-supported comparison.",
    instructionText: "Complete the full Reading Support Check interactive flow to identify classroom reading-support needs.",
    targetCondition: "DYSLEXIA",
    estimatedMin: 5,
  },
  {
    key: "math-reasoning-check",
    title: "Math Reasoning Check",
    description: "Symbolic comparison, number sense, representation matching, sequence logic, and arithmetic fluency.",
    instructionText: "Complete the full Math Reasoning Check interactive flow to identify numeracy-support needs.",
    targetCondition: "DYSCALCULIA",
    estimatedMin: 5,
  },
  {
    key: "comfort-check",
    title: "Comfort Check",
    description: "Private sensory self-report with classroom context matching for noise, light, air, and concentration comfort.",
    instructionText: "Complete the full Comfort Check interactive flow to guide sensory and environmental classroom adjustments.",
    targetCondition: "ASD",
    estimatedMin: 2,
  },
  {
    key: "learning-reflection",
    title: "Learning Reflection",
    description: "School engagement self-report with focus, confidence, difficulty, help-seeking, and mental effort prompts.",
    instructionText: "Complete the full Learning Reflection interactive flow to support confidence and engagement planning.",
    targetCondition: "ANXIETY",
    estimatedMin: 3,
  },
  {
    key: "mood-check",
    title: "Mood Check",
    description: "Self-report mood assessment with engagement and energy indicators.",
    instructionText: "Complete the full Mood Check to support emotional well-being planning.",
    targetCondition: "DEPRESSION",
    estimatedMin: 3,
  },
] as const;

async function main() {
  const { default: prisma } = await import("../src/config/prisma.js");

  console.log("Seeding database with neuro data...");

  const hashedPassword = await bcrypt.hash(PASSWORD, 12);

  const school = await prisma.school.upsert({
    where: { id: IDS.school },
    update: { name: "AllInOne School" },
    create: { id: IDS.school, name: "AllInOne School" },
  });

  const schoolAdmin = await prisma.user.upsert({
    where: { email: "admin@allinone.com" },
    update: { fullName: "AllInOne Administrator", password: hashedPassword, role: "SCHOOL_ADMIN", schoolId: school.id },
    create: { fullName: "AllInOne Administrator", email: "admin@allinone.com", password: hashedPassword, role: "SCHOOL_ADMIN", schoolId: school.id },
  });

  const teacher = await prisma.user.upsert({
    where: { email: "farah@allinone.com" },
    update: { fullName: "Farah", password: hashedPassword, role: "TEACHER", schoolId: school.id },
    create: { fullName: "Farah", email: "farah@allinone.com", password: hashedPassword, role: "TEACHER", schoolId: school.id },
  });

  const classA = await prisma.class.upsert({
    where: { id: IDS.class },
    update: { name: "Class A", schoolId: school.id },
    create: { id: IDS.class, name: "Class A", schoolId: school.id },
  });

  const subject = await prisma.subject.upsert({
    where: { schoolId_name: { schoolId: school.id, name: "Mathematics" } },
    update: { color: "#2DD4BF" },
    create: { schoolId: school.id, name: "Mathematics", color: "#2DD4BF" },
  });

  await prisma.timetable.upsert({
    where: { id: IDS.timetable },
    update: { teacherId: teacher.id, classId: classA.id, subjectId: subject.id, day: "MONDAY", startTime: toTime(9, 0), endTime: toTime(10, 0) },
    create: { id: IDS.timetable, teacherId: teacher.id, classId: classA.id, subjectId: subject.id, day: "MONDAY", startTime: toTime(9, 0), endTime: toTime(10, 0) },
  });

  const studentRecords: Array<{ id: string; fullName: string; email: string; seatNumber: number; neuro: string }> = [];

  for (const studentSeed of STUDENTS) {
    const dateOfBirth = toDateOfBirthFromAge(DEFAULT_STUDENT_AGE);

    const student = await prisma.user.upsert({
      where: { email: studentSeed.email },
      update: { fullName: studentSeed.name, password: hashedPassword, role: "STUDENT", schoolId: school.id, dateOfBirth },
      create: { fullName: studentSeed.name, email: studentSeed.email, password: hashedPassword, role: "STUDENT", schoolId: school.id, dateOfBirth },
    });

    await prisma.studentClass.upsert({
      where: { studentId: student.id },
      update: { classId: classA.id, status: "APPROVED", seatNumber: studentSeed.seat },
      create: { studentId: student.id, classId: classA.id, status: "APPROVED", seatNumber: studentSeed.seat },
    });

    studentRecords.push({
      id: student.id,
      fullName: student.fullName,
      email: student.email,
      seatNumber: studentSeed.seat,
      neuro: studentSeed.neuro,
    });
  }

  const guardianRecords: Array<{ id: string; name: string; email: string; studentEmail: string }> = [];

  for (const guardianSeed of GUARDIANS) {
    const guardian = await prisma.user.upsert({
      where: { email: guardianSeed.email },
      update: { fullName: guardianSeed.name, password: hashedPassword, role: "GUARDIAN", schoolId: school.id },
      create: { fullName: guardianSeed.name, email: guardianSeed.email, password: hashedPassword, role: "GUARDIAN", schoolId: school.id },
    });

    const student = studentRecords.find((s) => s.email === guardianSeed.studentEmail);
    if (student) {
      await prisma.guardianStudent.upsert({
        where: { guardianId_studentId: { guardianId: guardian.id, studentId: student.id } },
        update: {},
        create: { guardianId: guardian.id, studentId: student.id },
      });
    }

    guardianRecords.push({
      id: guardian.id,
      name: guardianSeed.name,
      email: guardianSeed.email,
      studentEmail: guardianSeed.studentEmail,
    });
  }

  await prisma.notificationPreference.createMany({
    data: [{ userId: teacher.id }, { userId: schoolAdmin.id }, ...guardianRecords.map((g) => ({ userId: g.id }))],
    skipDuplicates: true,
  });

  const orderedConditions = ["ADHD", "ASD", "DYSLEXIA", "DYSCALCULIA", "ANXIETY", "DEPRESSION", "DEFAULT"] as const;

  for (const code of orderedConditions) {
    await prisma.neuroCondition.upsert({
      where: { code },
      update: { label: CONDITION_LABELS[code], description: CONDITION_DESCRIPTIONS[code], isActive: true },
      create: { code, label: CONDITION_LABELS[code], description: CONDITION_DESCRIPTIONS[code], isActive: true },
    });
  }

  const neuroTests = [] as Array<{ id: string; key: string; title: string; targetCondition: string }>;

  for (const template of NEURO_TEMPLATES) {
    const test = await prisma.neuroTest.upsert({
      where: { key: template.key },
      update: {
        title: template.title,
        description: template.description,
        instructionText: template.instructionText,
        targetCondition: template.targetCondition,
        lifecycle: "ACTIVE",
        version: 2,
        configJson: { source: "seed", runtime: "interactive-screener-v1", screenerId: template.key, attemptPolicy: { maxAttempts: 3, lowScoreThreshold: 60, retryCooldownDays: 3 } },
        questionSetJson: { format: "screener-runtime-v1", source: "seed", screenerId: template.key, version: 2 },
        scoringJson: { engine: "screener-runtime-v1", inferredCondition: template.targetCondition },
        estimatedMin: template.estimatedMin,
      },
      create: {
        key: template.key,
        title: template.title,
        description: template.description,
        instructionText: template.instructionText,
        targetCondition: template.targetCondition,
        lifecycle: "ACTIVE",
        version: 2,
        configJson: { source: "seed", runtime: "interactive-screener-v1", screenerId: template.key, attemptPolicy: { maxAttempts: 3, lowScoreThreshold: 60, retryCooldownDays: 3 } },
        questionSetJson: { format: "screener-runtime-v1", source: "seed", screenerId: template.key, version: 2 },
        scoringJson: { engine: "screener-runtime-v1", inferredCondition: template.targetCondition },
        estimatedMin: template.estimatedMin,
      },
      select: { id: true, key: true, title: true, targetCondition: true },
    });
    neuroTests.push(test);
  }

  const testMap = new Map(neuroTests.map((t) => [t.targetCondition, t]));
  const defaultTest = testMap.get("DEFAULT") || neuroTests[0];

  for (const student of studentRecords) {
    const activeCondition = student.neuro;
    const confidence = 0.75;

    await prisma.studentNeuroProfile.upsert({
      where: { studentId: student.id },
      update: { activeCondition, confidence, sourceNotes: "Seeded neuro profile", updatedByTeacherId: teacher.id },
      create: { studentId: student.id, activeCondition, confidence, sourceNotes: "Seeded neuro profile", updatedByTeacherId: teacher.id },
    });

    await prisma.studentNeuroConditionRecord.create({
      data: { studentId: student.id, condition: activeCondition, confidence, sourceType: "SEED_BASELINE", notes: "Initial seeded neuro profile", diagnosedByTeacherId: teacher.id },
    });

    const relevantTest = testMap.get(activeCondition) || defaultTest;
    const status = student.neuro === "DEFAULT" ? "ASSIGNED" : "REVIEWED";
    const score = student.neuro === "DEFAULT" ? null : 65 + (student.seat * 5) % 30;

    const assignment = await prisma.neuroTestAssignment.create({
      data: {
        testId: relevantTest.id,
        studentId: student.id,
        assignedByTeacherId: teacher.id,
        classId: classA.id,
        status,
        visibleToStudent: true,
        notes: `Seeded ${activeCondition} assignment`,
        dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    if (score !== null) {
      const now = Date.now();
      const answersJson = {
        taskAnalytics: [
          {
            taskId: `${relevantTest.key}-task-1`,
            title: "Core task",
            questions: [
              { id: "q1", prompt: "Sample question 1", expected: "A", selected: "A", correct: true, skipped: false, durationMs: 1800, attempts: 1 },
              { id: "q2", prompt: "Sample question 2", expected: "B", selected: score >= 70 ? "B" : "C", correct: score >= 70, skipped: false, durationMs: 2600, attempts: 1 },
            ],
            summary: { supportLevel: score >= 70 ? "repeated_difficulty_indicator" : "monitor" },
          },
        ],
      };

      const analysisJson = {
        supportLevel: score >= 70 ? "repeated_difficulty_indicator" : "monitor",
        subScores: { attention: score, workingMemory: Math.max(30, score - 6), processing: Math.max(30, score - 10) },
      };

      await prisma.neuroTestAttempt.create({
        data: {
          assignmentId: assignment.id,
          testId: relevantTest.id,
          studentId: student.id,
          startedAt: new Date(now - 15 * 60 * 1000),
          completedAt: new Date(now - 10 * 60 * 1000),
          durationSec: 300,
          answersJson: answersJson as unknown as object,
          score,
          analysisJson: analysisJson as unknown as object,
          inferredCondition: activeCondition !== "DEFAULT" ? activeCondition : null,
          confidence: activeCondition !== "DEFAULT" ? confidence : null,
          reviewedByTeacherId: teacher.id,
          reviewerNotes: `Seeded ${activeCondition} attempt`,
        },
      });
    }
  }

  console.log("Seed complete.");
  console.log("SCHOOL ADMIN: admin@allinone.com / Learno123");
  console.log("TEACHER: farah@allinone.com / Learno123");
  console.log("GUARDIANS: *@gmail.com / Learno123");
  console.log("7 STUDENTS: *@student.learno.com / Learno123");
  console.log("Each student has a different neuro condition and assignment.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });