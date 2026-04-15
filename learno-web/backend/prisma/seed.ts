import "dotenv/config";
import bcrypt from "bcrypt";

const IDS = {
  school: "seed-school-learno",
  class: "seed-class-a",
  timetable: "seed-timetable-single",
} as const;

const STUDENTS = [
  { name: "Adam Karim", email: "adam@student.learno.com", seat: 1  },
  { name: "Nour Belkacem", email: "nour@student.learno.com", seat: 2 },
  { name: "Yasmine Haddad", email: "yasmine@student.learno.com", seat: 3 },
  { name: "Rayan Salem", email: "rayan@student.learno.com", seat: 4 },
  { name: "Lina Ait", email: "lina@student.learno.com", seat: 5 },
  { name: "Imad Nouri", email: "imad@student.learno.com", seat: 6 },
  { name: "Sara Benali", email: "sara@student.learno.com", seat: 7 },
  { name: "Saif Balbali", email: "saifbalbali@student.learno.com", seat: 8 },
] as const;

const DEFAULT_STUDENT_AGE = 10;

const toTime = (hour: number, minute: number): Date => {
  return new Date(Date.UTC(1970, 0, 1, hour, minute, 0));
};

const toDateOfBirthFromAge = (age: number, ref = new Date()): Date => {
  const year = ref.getUTCFullYear() - age;
  return new Date(Date.UTC(year, 8, 1, 0, 0, 0)); // 1 Septembre
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
  ADHD:
    "Classroom signals that may suggest sustained attention and impulsivity support needs.",
  ASD:
    "Classroom signals related to sensory processing and structured interaction support.",
  DYSLEXIA:
    "Reading and decoding support indicators for classroom planning.",
  DYSCALCULIA:
    "Numeracy and symbolic reasoning support indicators for classroom planning.",
  ANXIETY:
    "Indicators linked to stress and participation confidence in school contexts.",
  DEPRESSION:
    "Indicators linked to persistent low engagement and mood-related school impact.",
  DEFAULT: "Baseline profile used when no specific condition is currently assigned.",
};

const NEURO_TEMPLATES = [
  {
    key: "focus-check",
    title: "Focus Check",
    description:
      "CPT-style sustained attention, Go/No-Go inhibition, working-memory sequencing, and multi-step instruction handling.",
    instructionText:
      "Complete the full Focus Check interactive flow. This screener supports classroom planning and is not a medical diagnosis.",
    targetCondition: "ADHD",
    estimatedMin: 5,
    configJson: {
      source: "seed",
      runtime: "interactive-screener-v1",
      screenerId: "focus-check",
      domain: "attention",
      attemptPolicy: {
        maxAttempts: 3,
        lowScoreThreshold: 60,
        retryCooldownDays: 3,
      },
    },
    questionSetJson: {
      format: "screener-runtime-v1",
      source: "seed",
      screenerId: "focus-check",
      version: 2,
    },
    scoringJson: {
      engine: "screener-runtime-v1",
      inferredCondition: "ADHD",
      indicatorKeys: [
        "repeated attention difficulty indicators",
        "difficulty sustaining performance across structured tasks",
      ],
    },
  },
  {
    key: "reading-support-check",
    title: "Reading Support Check",
    description:
      "Decoding, word recognition, comprehension, sentence reconstruction, and text-only versus audio-supported comparison.",
    instructionText:
      "Complete the full Reading Support Check interactive flow to identify classroom reading-support needs.",
    targetCondition: "DYSLEXIA",
    estimatedMin: 5,
    configJson: {
      source: "seed",
      runtime: "interactive-screener-v1",
      screenerId: "reading-support-check",
      domain: "reading",
      attemptPolicy: {
        maxAttempts: 3,
        lowScoreThreshold: 60,
        retryCooldownDays: 3,
      },
    },
    questionSetJson: {
      format: "screener-runtime-v1",
      source: "seed",
      screenerId: "reading-support-check",
      version: 2,
    },
    scoringJson: {
      engine: "screener-runtime-v1",
      inferredCondition: "DYSLEXIA",
      indicatorKeys: [
        "possible reading-access difficulty",
        "repeated decoding or word-discrimination difficulty",
      ],
    },
  },
  {
    key: "math-reasoning-check",
    title: "Math Reasoning Check",
    description:
      "Symbolic comparison, number sense, representation matching, sequence logic, and arithmetic fluency.",
    instructionText:
      "Complete the full Math Reasoning Check interactive flow to identify numeracy-support needs.",
    targetCondition: "DYSCALCULIA",
    estimatedMin: 5,
    configJson: {
      source: "seed",
      runtime: "interactive-screener-v1",
      screenerId: "math-reasoning-check",
      domain: "math",
      attemptPolicy: {
        maxAttempts: 3,
        lowScoreThreshold: 60,
        retryCooldownDays: 3,
      },
    },
    questionSetJson: {
      format: "screener-runtime-v1",
      source: "seed",
      screenerId: "math-reasoning-check",
      version: 2,
    },
    scoringJson: {
      engine: "screener-runtime-v1",
      inferredCondition: "DYSCALCULIA",
      indicatorKeys: [
        "possible math-processing difficulty",
        "repeated difficulty with symbolic numerical tasks",
      ],
    },
  },
  {
    key: "comfort-check",
    title: "Comfort Check",
    description:
      "Private sensory self-report with classroom context matching for noise, light, air, and concentration comfort.",
    instructionText:
      "Complete the full Comfort Check interactive flow to guide sensory and environmental classroom adjustments.",
    targetCondition: "ASD",
    estimatedMin: 2,
    configJson: {
      source: "seed",
      runtime: "interactive-screener-v1",
      screenerId: "comfort-check",
      domain: "sensory",
      attemptPolicy: {
        maxAttempts: 3,
        lowScoreThreshold: 60,
        retryCooldownDays: 3,
      },
    },
    questionSetJson: {
      format: "screener-runtime-v1",
      source: "seed",
      screenerId: "comfort-check",
      version: 2,
    },
    scoringJson: {
      engine: "screener-runtime-v1",
      inferredCondition: "ASD",
      indicatorKeys: [
        "repeated sensory discomfort indicators",
        "possible classroom overstimulation",
      ],
    },
  },
  {
    key: "learning-reflection",
    title: "Learning Reflection",
    description:
      "School engagement self-report with focus, confidence, difficulty, help-seeking, and mental effort prompts.",
    instructionText:
      "Complete the full Learning Reflection interactive flow to support confidence and engagement planning.",
    targetCondition: "ANXIETY",
    estimatedMin: 3,
    configJson: {
      source: "seed",
      runtime: "interactive-screener-v1",
      screenerId: "learning-reflection",
      domain: "engagement",
      attemptPolicy: {
        maxAttempts: 3,
        lowScoreThreshold: 60,
        retryCooldownDays: 3,
      },
    },
    questionSetJson: {
      format: "screener-runtime-v1",
      source: "seed",
      screenerId: "learning-reflection",
      version: 2,
    },
    scoringJson: {
      engine: "screener-runtime-v1",
      inferredCondition: "ANXIETY",
      indicatorKeys: [
        "repeated disengagement indicators",
        "repeated emotional strain indicators",
      ],
      anxietySensitivityThreshold: 64,
      depressionSensitivityThreshold: 76,
    },
  },
] as const;

async function main() {
  const { default: prisma } = await import("../src/config/prisma.js");

  console.log("Seeding minimal dataset with neuro data...");

  const adminPassword = await bcrypt.hash("Admin123!", 12);
  const userPassword = await bcrypt.hash("Password123!", 12);

  const school = await prisma.school.upsert({
    where: { id: IDS.school },
    update: {
      name: "Learno School",
    },
    create: {
      id: IDS.school,
      name: "Learno School",
    },
  });

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@learno.com" },
    update: {
      fullName: "Main Administrator",
      password: adminPassword,
      role: "SCHOOL_ADMIN",
      schoolId: school.id,
    },
    create: {
      fullName: "Main Administrator",
      email: "admin@learno.com",
      password: adminPassword,
      role: "SCHOOL_ADMIN",
      schoolId: school.id,
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: "farah@learno.com" },
    update: {
      fullName: "Farah",
      password: userPassword,
      role: "TEACHER",
      schoolId: school.id,
    },
    create: {
      fullName: "Farah",
      email: "farah@learno.com",
      password: userPassword,
      role: "TEACHER",
      schoolId: school.id,
    },
  });

  const guardian = await prisma.user.upsert({
    where: { email: "guardian@learno.com" },
    update: {
      fullName: "Guardian One",
      password: userPassword,
      role: "GUARDIAN",
      schoolId: school.id,
    },
    create: {
      fullName: "Guardian One",
      email: "guardian@learno.com",
      password: userPassword,
      role: "GUARDIAN",
      schoolId: school.id,
    },
  });

  const classA = await prisma.class.upsert({
    where: { id: IDS.class },
    update: {
      name: "Class A",
      schoolId: school.id,
    },
    create: {
      id: IDS.class,
      name: "Class A",
      schoolId: school.id,
    },
  });

  const subject = await prisma.subject.upsert({
    where: {
      schoolId_name: {
        schoolId: school.id,
        name: "Mathematics",
      },
    },
    update: {
      color: "#2DD4BF",
    },
    create: {
      schoolId: school.id,
      name: "Mathematics",
      color: "#2DD4BF",
    },
  });

  await prisma.timetable.upsert({
    where: { id: IDS.timetable },
    update: {
      teacherId: teacher.id,
      classId: classA.id,
      subjectId: subject.id,
      day: "MONDAY",
      startTime: toTime(9, 0),
      endTime: toTime(10, 0),
    },
    create: {
      id: IDS.timetable,
      teacherId: teacher.id,
      classId: classA.id,
      subjectId: subject.id,
      day: "MONDAY",
      startTime: toTime(9, 0),
      endTime: toTime(10, 0),
    },
  });

  const studentRecords: Array<{
    id: string;
    fullName: string;
    email: string;
    seatNumber: number;
  }> = [];

  for (const studentSeed of STUDENTS) {
    const dateOfBirth = toDateOfBirthFromAge(DEFAULT_STUDENT_AGE);

    const student = await prisma.user.upsert({
      where: { email: studentSeed.email },
      update: {
        fullName: studentSeed.name,
        password: userPassword,
        role: "STUDENT",
        schoolId: school.id,
        dateOfBirth,
      },
      create: {
        fullName: studentSeed.name,
        email: studentSeed.email,
        password: userPassword,
        role: "STUDENT",
        schoolId: school.id,
        dateOfBirth,
      },
    });

    await prisma.studentClass.upsert({
      where: { studentId: student.id },
      update: {
        classId: classA.id,
        status: "APPROVED",
        seatNumber: studentSeed.seat,
      },
      create: {
        studentId: student.id,
        classId: classA.id,
        status: "APPROVED",
        seatNumber: studentSeed.seat,
      },
    });

    await prisma.guardianStudent.upsert({
      where: {
        guardianId_studentId: {
          guardianId: guardian.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        guardianId: guardian.id,
        studentId: student.id,
      },
    });

    studentRecords.push({
      id: student.id,
      fullName: student.fullName,
      email: student.email,
      seatNumber: studentSeed.seat,
    });
  }

  await prisma.notificationPreference.createMany({
    data: [
      { userId: teacher.id },
      { userId: guardian.id },
      { userId: superAdmin.id },
    ],
    skipDuplicates: true,
  });

  const orderedConditions = [
    "ADHD",
    "ASD",
    "DYSLEXIA",
    "DYSCALCULIA",
    "ANXIETY",
    "DEPRESSION",
    "DEFAULT",
  ] as const;

  for (const code of orderedConditions) {
    await prisma.neuroCondition.upsert({
      where: { code },
      update: {
        label: CONDITION_LABELS[code],
        description: CONDITION_DESCRIPTIONS[code],
        isActive: true,
      },
      create: {
        code,
        label: CONDITION_LABELS[code],
        description: CONDITION_DESCRIPTIONS[code],
        isActive: true,
      },
    });
  }

  const neuroTests = [] as Array<{
    id: string;
    key: string;
    title: string;
    targetCondition: string;
  }>;

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
        configJson: template.configJson as unknown as object,
        questionSetJson: template.questionSetJson as unknown as object,
        scoringJson: template.scoringJson as unknown as object,
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
        configJson: template.configJson as unknown as object,
        questionSetJson: template.questionSetJson as unknown as object,
        scoringJson: template.scoringJson as unknown as object,
        estimatedMin: template.estimatedMin,
      },
      select: {
        id: true,
        key: true,
        title: true,
        targetCondition: true,
      },
    });

    neuroTests.push(test);
  }

  const profileConditions = [
    "ADHD",
    "DYSLEXIA",
    "DYSCALCULIA",
    "ASD",
    "ANXIETY",
    "DEFAULT",
    "DEPRESSION",
  ] as const;

  for (const [index, student] of studentRecords.entries()) {
    const activeCondition = profileConditions[index % profileConditions.length];
    const confidence = Number((0.58 + (index % 4) * 0.08).toFixed(2));

    await prisma.studentNeuroProfile.upsert({
      where: { studentId: student.id },
      update: {
        activeCondition,
        confidence,
        sourceNotes: "Seeded baseline neuro profile",
        updatedByTeacherId: teacher.id,
      },
      create: {
        studentId: student.id,
        activeCondition,
        confidence,
        sourceNotes: "Seeded baseline neuro profile",
        updatedByTeacherId: teacher.id,
      },
    });

    await prisma.studentNeuroConditionRecord.create({
      data: {
        studentId: student.id,
        condition: activeCondition,
        confidence,
        sourceType: "SEED_BASELINE",
        notes: "Initial seeded neuro profile",
        diagnosedByTeacherId: teacher.id,
      },
    });
  }

  const activeTestsByKey = new Map(neuroTests.map((test) => [test.key, test]));

  const assignmentSpecs = [
    {
      studentEmail: STUDENTS[0].email,
      testKey: "focus-check",
      status: "REVIEWED",
      score: 68,
      inferredCondition: "ADHD",
      confidence: 0.74,
      supportLevel: "repeated_difficulty_indicator",
      reviewerNotes:
        "Introduce short chunked tasks and visual pacing prompts during independent work.",
    },
    {
      studentEmail: STUDENTS[1].email,
      testKey: "reading-support-check",
      status: "SUBMITTED",
      score: 55,
      inferredCondition: "DYSLEXIA",
      confidence: 0.7,
      supportLevel: "monitor",
      reviewerNotes: null,
    },
    {
      studentEmail: STUDENTS[2].email,
      testKey: "math-reasoning-check",
      status: "ASSIGNED",
      score: null,
      inferredCondition: null,
      confidence: null,
      supportLevel: null,
      reviewerNotes: null,
    },
    {
      studentEmail: STUDENTS[3].email,
      testKey: "comfort-check",
      status: "REVIEWED",
      score: 83,
      inferredCondition: "ASD",
      confidence: 0.86,
      supportLevel: "support_review_recommended",
      reviewerNotes:
        "Keep sensory break options available and reduce unexpected transitions.",
    },
    {
      studentEmail: STUDENTS[4].email,
      testKey: "learning-reflection",
      status: "IN_PROGRESS",
      score: null,
      inferredCondition: null,
      confidence: null,
      supportLevel: null,
      reviewerNotes: null,
    },
  ] as const;

  for (const spec of assignmentSpecs) {
    const student = studentRecords.find((entry) => entry.email === spec.studentEmail);
    const test = activeTestsByKey.get(spec.testKey);
    if (!student || !test) {
      continue;
    }

    const assignment = await prisma.neuroTestAssignment.create({
      data: {
        testId: test.id,
        studentId: student.id,
        assignedByTeacherId: teacher.id,
        classId: classA.id,
        status: spec.status,
        visibleToStudent: true,
        notes: "Seeded neuro assignment",
        dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
    });

    if (spec.score === null) {
      continue;
    }

    const now = Date.now();
    const startedAt = new Date(now - 15 * 60 * 1000);
    const completedAt = new Date(now - 10 * 60 * 1000);
    const answersJson = {
      taskAnalytics: [
        {
          taskId: `${spec.testKey}-task-1`,
          title: "Core task",
          questions: [
            {
              id: "q1",
              prompt: "Sample question 1",
              expected: "A",
              selected: "A",
              correct: true,
              skipped: false,
              durationMs: 1800,
              attempts: 1,
            },
            {
              id: "q2",
              prompt: "Sample question 2",
              expected: "B",
              selected: spec.score >= 70 ? "B" : "C",
              correct: spec.score >= 70,
              skipped: false,
              durationMs: 2600,
              attempts: 1,
            },
          ],
          summary: {
            supportLevel: spec.supportLevel,
          },
        },
      ],
    };

    const analysisJson = {
      supportLevel: spec.supportLevel,
      subScores: {
        attention: spec.score,
        workingMemory: Math.max(30, spec.score - 6),
        processing: Math.max(30, spec.score - 10),
      },
      notes: "Seeded attempt analytics",
    };

    const attempt = await prisma.neuroTestAttempt.create({
      data: {
        assignmentId: assignment.id,
        testId: test.id,
        studentId: student.id,
        startedAt,
        completedAt,
        durationSec: 300,
        answersJson: answersJson as unknown as object,
        score: spec.score,
        analysisJson: analysisJson as unknown as object,
        inferredCondition: spec.inferredCondition,
        confidence: spec.confidence,
        reviewedByTeacherId: spec.status === "REVIEWED" ? teacher.id : null,
        reviewerNotes: spec.reviewerNotes,
      },
    });

    if (spec.inferredCondition && spec.status === "REVIEWED") {
      await prisma.studentNeuroProfile.upsert({
        where: { studentId: student.id },
        update: {
          activeCondition: spec.inferredCondition,
          confidence: spec.confidence,
          sourceAssignmentId: assignment.id,
          sourceAttemptId: attempt.id,
          sourceNotes: "Seeded reviewed neuro attempt",
          updatedByTeacherId: teacher.id,
        },
        create: {
          studentId: student.id,
          activeCondition: spec.inferredCondition,
          confidence: spec.confidence,
          sourceAssignmentId: assignment.id,
          sourceAttemptId: attempt.id,
          sourceNotes: "Seeded reviewed neuro attempt",
          updatedByTeacherId: teacher.id,
        },
      });

      await prisma.studentNeuroConditionRecord.create({
        data: {
          studentId: student.id,
          condition: spec.inferredCondition,
          confidence: spec.confidence,
          sourceAssignmentId: assignment.id,
          sourceAttemptId: attempt.id,
          sourceType: "SEED_REVIEWED_ATTEMPT",
          notes: "Condition updated from seeded reviewed attempt",
          diagnosedByTeacherId: teacher.id,
        },
      });
    }
  }

  console.log("Seed complete.");
  console.log("ADMIN: admin@learno.com / Admin123!");
  console.log("TEACHER: farah@learno.com / Password123!");
  console.log("GUARDIAN: guardian@learno.com / Password123!");
  console.log("7 STUDENTS: *@student.learno.com / Password123!");
  console.log("Neuro: seeded condition catalog, active tests, profiles, assignments, and attempts.");
  console.log(`School: ${school.id} | Class: ${classA.id} | Subject: ${subject.id}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
