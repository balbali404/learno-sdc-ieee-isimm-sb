import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";
import { calculateAge } from "../../utils/calculateAge.js";
import type {
  AssignNeuroTestByCriteriaInput,
  AssignNeuroTestInput,
  CreateNeuroTestInput,
  ManualSetStudentConditionInput,
  NeuroConditionCodeInput,
  ReviewNeuroAttemptInput,
  SubmitNeuroAttemptInput,
  UpdateNeuroAssignmentInput,
  UpdateNeuroTestInput,
} from "./neuro.validators.js";
import { evaluateNeuroAttempt } from "./neuro.scoring.js";
import { DEFAULT_NEURO_TEST_TEMPLATES } from "./neuro.templates.js";

const CONDITION_TO_THEME: Record<string, string> = {
  ADHD: "adhd",
  ASD: "asd",
  DYSLEXIA: "dyslexia",
  DYSCALCULIA: "dyscalculia",
  ANXIETY: "anxiety",
  DEPRESSION: "depression",
  DEFAULT: "default",
};

const normalizeThemeCondition = (raw: string | null | undefined): string => {
  if (!raw) {
    return "default";
  }

  const normalized = raw.trim().toUpperCase();
  if (normalized === "AUTISM" || normalized === "AUTISM_SUPPORT" || normalized === "ASC") {
    return "asd";
  }

  return CONDITION_TO_THEME[normalized] ?? "default";
};

const ACTIVE_ASSIGNMENT_STATUSES: Array<"ASSIGNED" | "IN_PROGRESS" | "SUBMITTED"> = [
  "ASSIGNED",
  "IN_PROGRESS",
  "SUBMITTED",
];
const RESULT_ASSIGNMENT_STATUSES: Array<"SUBMITTED" | "REVIEWED"> = ["SUBMITTED", "REVIEWED"];
type AssignmentStatus = "ASSIGNED" | "IN_PROGRESS" | "SUBMITTED" | "REVIEWED" | "CANCELLED";
type SupportLevel = "no_strong_concern" | "monitor" | "repeated_difficulty_indicator" | "support_review_recommended";

type AttemptPolicy = {
  maxAttempts: number;
  lowScoreThreshold: number;
  retryCooldownDays: number;
};

type RetryState = {
  attemptsUsed: number;
  remainingAttempts: number;
  latestScore: number | null;
  latestSupportLevel: SupportLevel | null;
  latestAttemptId: string | null;
  needsRetry: boolean;
  canRetryNow: boolean;
  retryAvailableAt: Date | null;
};

type ThemeCondition =
  | "adhd"
  | "asd"
  | "dyslexia"
  | "dyscalculia"
  | "anxiety"
  | "depression"
  | "default";

const DEFAULT_ATTEMPT_POLICY: AttemptPolicy = {
  maxAttempts: 3,
  lowScoreThreshold: 60,
  retryCooldownDays: 3,
};

const parsePositiveInt = (value: unknown, fallback: number, min: number, max: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, Math.round(parsed)));
};

const parseBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }
    if (normalized === "false") {
      return false;
    }
  }

  return fallback;
};

const clamp = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
};

const parseSupportLevel = (value: unknown): SupportLevel | null => {
  if (typeof value !== "string") {
    return null;
  }

  if (
    value === "no_strong_concern" ||
    value === "monitor" ||
    value === "repeated_difficulty_indicator" ||
    value === "support_review_recommended"
  ) {
    return value;
  }

  return null;
};

const toThemeCondition = (raw: string | null | undefined): ThemeCondition => {
  const normalized = normalizeThemeCondition(raw) as ThemeCondition;

  if (
    normalized === "adhd" ||
    normalized === "asd" ||
    normalized === "dyslexia" ||
    normalized === "dyscalculia" ||
    normalized === "anxiety" ||
    normalized === "depression" ||
    normalized === "default"
  ) {
    return normalized;
  }

  return "default";
};

const averageNumberArray = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const roundNumber = (value: number, decimals = 0): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const getSupportLevelFromScore = (
  score: number,
): "no_strong_concern" | "monitor" | "repeated_difficulty_indicator" | "support_review_recommended" => {
  if (score >= 80) {
    return "support_review_recommended";
  }

  if (score >= 60) {
    return "repeated_difficulty_indicator";
  }

  if (score >= 40) {
    return "monitor";
  }

  return "no_strong_concern";
};

const dedupeConditions = (conditions: NeuroConditionCodeInput[]): NeuroConditionCodeInput[] => {
  const next: NeuroConditionCodeInput[] = [];
  conditions.forEach((condition) => {
    if (!next.includes(condition)) {
      next.push(condition);
    }
  });
  return next;
};

const getTeacherClassIds = async (teacherId: string): Promise<string[]> => {
  const rows = await prisma.timetable.findMany({
    where: { teacherId },
    select: { classId: true },
    distinct: ["classId"],
  });

  return rows.map((row) => row.classId);
};

const getAssignmentScopeStatuses = (scopeRaw: unknown): Array<"ASSIGNED" | "IN_PROGRESS" | "SUBMITTED" | "REVIEWED" | "CANCELLED"> => {
  const scope = typeof scopeRaw === "string" ? scopeRaw.trim().toLowerCase() : "active";

  if (scope === "history") {
    return ["SUBMITTED", "REVIEWED", "CANCELLED"];
  }

  if (scope === "all") {
    return ["ASSIGNED", "IN_PROGRESS", "SUBMITTED", "REVIEWED", "CANCELLED"];
  }

  return ["ASSIGNED", "IN_PROGRESS", "SUBMITTED"];
};

const getLowEngagementRiskBand = (engagement: number): "high" | "medium" | "low" => {
  if (engagement <= 45) {
    return "high";
  }

  if (engagement <= 60) {
    return "medium";
  }

  return "low";
};

const inferRecommendedConditions = (input: {
  averageEngagement: number;
  averageConcentration: number;
  currentCondition: NeuroConditionCodeInput;
}): NeuroConditionCodeInput[] => {
  const { averageEngagement, averageConcentration, currentCondition } = input;
  const suggestions: NeuroConditionCodeInput[] = [];

  if (currentCondition !== "DEFAULT") {
    suggestions.push(currentCondition);
  }

  if (averageConcentration <= 48) {
    suggestions.push("ADHD");
  }

  if (averageEngagement <= 52 && averageConcentration <= 58) {
    suggestions.push("DEPRESSION");
  }

  if (averageEngagement <= 58) {
    suggestions.push("ANXIETY");
  }

  if (averageConcentration <= 55 && averageEngagement <= 62) {
    suggestions.push("ASD");
  }

  if (suggestions.length === 0) {
    suggestions.push("DEFAULT");
  }

  return dedupeConditions(suggestions);
};

const upsertDefaultNeuroTests = async () => {
  let created = 0;
  let updated = 0;

  for (const template of DEFAULT_NEURO_TEST_TEMPLATES) {
    const existing = await prisma.neuroTest.findUnique({ where: { key: template.key } });
    if (existing) {
      await prisma.neuroTest.update({
        where: { id: existing.id },
        data: {
          title: template.title,
          description: template.description,
          instructionText: template.instructionText,
          targetCondition: template.targetCondition,
          lifecycle: template.lifecycle,
          version: template.version,
          estimatedMin: template.estimatedMin,
          configJson: template.configJson as Prisma.InputJsonValue,
          questionSetJson: template.questionSetJson as Prisma.InputJsonValue,
          scoringJson: template.scoringJson as Prisma.InputJsonValue,
        },
      });
      updated += 1;
      continue;
    }

    await prisma.neuroTest.create({
      data: {
        key: template.key,
        title: template.title,
        description: template.description,
        instructionText: template.instructionText,
        targetCondition: template.targetCondition,
        lifecycle: template.lifecycle,
        version: template.version,
        estimatedMin: template.estimatedMin,
        configJson: template.configJson as Prisma.InputJsonValue,
        questionSetJson: template.questionSetJson as Prisma.InputJsonValue,
        scoringJson: template.scoringJson as Prisma.InputJsonValue,
      },
    });
    created += 1;
  }

  return {
    created,
    updated,
    total: DEFAULT_NEURO_TEST_TEMPLATES.length,
  };
};

const ensureTeacherOwnsStudent = async (teacherId: string, studentId: string) => {
  const teaches = await prisma.studentClass.findFirst({
    where: {
      studentId,
      status: "APPROVED",
      class: {
        timetables: {
          some: {
            teacherId,
          },
        },
      },
    },
    select: {
      classId: true,
    },
  });

  return teaches;
};

const ensureGuardianOwnsStudent = async (guardianId: string, studentId: string): Promise<boolean> => {
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

const toNullableJsonInput = (
  value: unknown,
): Prisma.InputJsonValue | Prisma.NullTypes.JsonNull | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
};

const toPlainObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getAttemptPolicyFromConfig = (configJson: unknown): AttemptPolicy => {
  const config = toPlainObject(configJson);
  const attemptPolicy = toPlainObject(config?.attemptPolicy);

  const maxAttemptsRaw = Number(attemptPolicy?.maxAttempts);
  const lowScoreThresholdRaw = Number(attemptPolicy?.lowScoreThreshold);
  const retryCooldownDaysRaw = Number(attemptPolicy?.retryCooldownDays);

  return {
    maxAttempts: Number.isFinite(maxAttemptsRaw)
      ? Math.max(1, Math.min(10, Math.round(maxAttemptsRaw)))
      : DEFAULT_ATTEMPT_POLICY.maxAttempts,
    lowScoreThreshold: Number.isFinite(lowScoreThresholdRaw)
      ? Math.max(0, Math.min(100, roundNumber(lowScoreThresholdRaw, 1)))
      : DEFAULT_ATTEMPT_POLICY.lowScoreThreshold,
    retryCooldownDays: Number.isFinite(retryCooldownDaysRaw)
      ? Math.max(0, Math.min(30, Math.round(retryCooldownDaysRaw)))
      : DEFAULT_ATTEMPT_POLICY.retryCooldownDays,
  };
};

const getRetryState = (input: {
  attempts: Array<{
    id: string;
    score: number | null;
    completedAt: Date | null;
    createdAt: Date;
  }>;
  policy: AttemptPolicy;
  now?: Date;
}): RetryState => {
  const attemptsSorted = [...input.attempts].sort(
    (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
  );
  const latestAttempt = attemptsSorted[0] ?? null;
  const latestScore =
    latestAttempt && typeof latestAttempt.score === "number" ? latestAttempt.score : null;
  const latestSupportLevel =
    typeof latestScore === "number" ? getSupportLevelFromScore(latestScore) : null;

  const attemptsUsed = attemptsSorted.length;
  const remainingAttempts = Math.max(0, input.policy.maxAttempts - attemptsUsed);
  const needsRetry =
    typeof latestScore === "number" &&
    latestScore < input.policy.lowScoreThreshold &&
    remainingAttempts > 0;

  const baseDate = latestAttempt?.completedAt ?? latestAttempt?.createdAt ?? null;
  const retryAvailableAt =
    needsRetry && baseDate ? addDays(baseDate, input.policy.retryCooldownDays) : null;
  const now = input.now ?? new Date();
  const canRetryNow = Boolean(retryAvailableAt && retryAvailableAt.getTime() <= now.getTime());

  return {
    attemptsUsed,
    remainingAttempts,
    latestScore,
    latestSupportLevel,
    latestAttemptId: latestAttempt?.id ?? null,
    needsRetry,
    canRetryNow,
    retryAvailableAt,
  };
};

const withAssignmentAttemptPolicy = <T extends {
  test?: { configJson?: unknown } | null;
  attempts?: Array<{
    id: string;
    score: number | null;
    completedAt: Date | null;
    createdAt: Date;
  }>;
}>(assignment: T) => {
  const policy = getAttemptPolicyFromConfig(assignment.test?.configJson ?? null);
  const retryState = getRetryState({
    attempts: assignment.attempts ?? [],
    policy,
  });

  return {
    ...assignment,
    attemptPolicy: {
      ...policy,
      ...retryState,
      statusLabel:
        retryState.needsRetry && retryState.canRetryNow
          ? "retry_available"
          : retryState.needsRetry
            ? "retry_waiting"
            : retryState.latestScore === null
              ? "awaiting_score"
              : retryState.latestScore >= policy.lowScoreThreshold
                ? "passed"
                : "max_attempts_reached",
    },
  };
};

interface ThemeSignalSnapshot {
  averageEngagement: number;
  averageConcentration: number;
  latestAttemptCondition: NeuroConditionCodeInput | null;
  latestTargetCondition: NeuroConditionCodeInput | null;
  latestScore: number | null;
  latestSupportLevel: SupportLevel | null;
  latestCompletedAt: Date | null;
}

const getThemeSignalSnapshot = async (studentId: string): Promise<ThemeSignalSnapshot> => {
  const [studentXP, latestAttempt] = await Promise.all([
    prisma.studentXP.findUnique({
      where: { studentId },
      select: {
        averageEngagement: true,
        averageConcentration: true,
      },
    }),
    prisma.neuroTestAttempt.findFirst({
      where: {
        studentId,
        completedAt: { not: null },
      },
      orderBy: {
        completedAt: "desc",
      },
      select: {
        inferredCondition: true,
        score: true,
        completedAt: true,
        analysisJson: true,
        test: {
          select: {
            targetCondition: true,
          },
        },
      },
    }),
  ]);

  const analysis = toPlainObject(latestAttempt?.analysisJson);
  const supportLevelFromAnalysis = parseSupportLevel(analysis?.supportLevel);
  const fallbackSupportLevel =
    typeof latestAttempt?.score === "number"
      ? getSupportLevelFromScore(latestAttempt.score)
      : null;

  return {
    averageEngagement: clamp(Math.round(studentXP?.averageEngagement ?? 0), 0, 100),
    averageConcentration: clamp(Math.round(studentXP?.averageConcentration ?? 0), 0, 100),
    latestAttemptCondition: latestAttempt?.inferredCondition ?? null,
    latestTargetCondition: latestAttempt?.test?.targetCondition ?? null,
    latestScore: typeof latestAttempt?.score === "number" ? latestAttempt.score : null,
    latestSupportLevel: supportLevelFromAnalysis ?? fallbackSupportLevel,
    latestCompletedAt: latestAttempt?.completedAt ?? null,
  };
};

const inferThemeConditionFromSignals = (signals: ThemeSignalSnapshot): ThemeCondition => {
  const hasBehaviorSignals =
    signals.latestScore !== null ||
    signals.averageEngagement > 0 ||
    signals.averageConcentration > 0;

  if (!hasBehaviorSignals) {
    return "default";
  }

  const recentAttemptThemeCondition = toThemeCondition(
    signals.latestAttemptCondition ?? signals.latestTargetCondition,
  );
  const hasStrongAttemptConcern =
    signals.latestSupportLevel === "support_review_recommended" ||
    signals.latestSupportLevel === "repeated_difficulty_indicator";

  if (hasStrongAttemptConcern && recentAttemptThemeCondition !== "default") {
    return recentAttemptThemeCondition;
  }

  if (signals.averageConcentration <= 45 && signals.averageEngagement >= 50) {
    return "adhd";
  }

  if (signals.averageEngagement <= 44 && signals.averageConcentration <= 58) {
    return "depression";
  }

  if (signals.averageEngagement <= 54 && signals.averageConcentration >= 55) {
    return "anxiety";
  }

  if (signals.averageConcentration <= 52 && signals.averageEngagement <= 62) {
    return "asd";
  }

  if (
    (recentAttemptThemeCondition === "dyslexia" ||
      recentAttemptThemeCondition === "dyscalculia") &&
    signals.averageConcentration <= 54
  ) {
    return recentAttemptThemeCondition;
  }

  if (signals.latestScore !== null && signals.latestScore <= 55 && recentAttemptThemeCondition !== "default") {
    return recentAttemptThemeCondition;
  }

  return "default";
};

const resolveSignalBasedTheme = async (studentId: string) => {
  const signals = await getThemeSignalSnapshot(studentId);
  const inferredCondition = inferThemeConditionFromSignals(signals);

  return {
    inferredCondition,
    signals,
  };
};

const upsertStudentCondition = async (input: {
  studentId: string;
  condition: NeuroConditionCodeInput;
  confidence?: number | null;
  diagnosedByTeacherId?: string | null;
  sourceAssignmentId?: string | null;
  sourceAttemptId?: string | null;
  notes?: string | null;
  sourceType?: string | null;
}) => {
  const profile = await prisma.studentNeuroProfile.upsert({
    where: { studentId: input.studentId },
    create: {
      studentId: input.studentId,
      activeCondition: input.condition,
      confidence: input.confidence ?? null,
      sourceAssignmentId: input.sourceAssignmentId ?? null,
      sourceAttemptId: input.sourceAttemptId ?? null,
      sourceNotes: input.notes ?? null,
      updatedByTeacherId: input.diagnosedByTeacherId ?? null,
    },
    update: {
      activeCondition: input.condition,
      confidence: input.confidence ?? null,
      sourceAssignmentId: input.sourceAssignmentId ?? null,
      sourceAttemptId: input.sourceAttemptId ?? null,
      sourceNotes: input.notes ?? null,
      updatedByTeacherId: input.diagnosedByTeacherId ?? null,
    },
  });

  await prisma.studentNeuroConditionRecord.create({
    data: {
      studentId: input.studentId,
      condition: input.condition,
      confidence: input.confidence ?? null,
      sourceAssignmentId: input.sourceAssignmentId ?? null,
      sourceAttemptId: input.sourceAttemptId ?? null,
      sourceType: input.sourceType ?? "SYSTEM",
      notes: input.notes ?? null,
      diagnosedByTeacherId: input.diagnosedByTeacherId ?? null,
    },
  });

  return profile;
};

export const getConditionCatalog = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await prisma.neuroCondition.findMany({
      orderBy: { code: "asc" },
    });
    res.json(rows);
  } catch (error) {
    console.error("getConditionCatalog error:", error);
    res.status(500).json({ message: "Failed to fetch conditions" });
  }
};

export const bootstrapDefaultNeuroTests = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await upsertDefaultNeuroTests();
    res.json({
      message: "Default neuro tests synchronized",
      ...result,
    });
  } catch (error) {
    console.error("bootstrapDefaultNeuroTests error:", error);
    res.status(500).json({ message: "Failed to bootstrap default neuro tests" });
  }
};

export const createNeuroTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as CreateNeuroTestInput;

    const existing = await prisma.neuroTest.findUnique({ where: { key: body.key } });
    if (existing) {
      res.status(409).json({ message: "Neuro test key already exists" });
      return;
    }

    const created = await prisma.neuroTest.create({
      data: {
        key: body.key,
        title: body.title,
        description: body.description ?? null,
        instructionText: body.instructionText ?? null,
        targetCondition: body.targetCondition,
        lifecycle: body.lifecycle ?? "DRAFT",
        version: body.version ?? 1,
        configJson: toNullableJsonInput(body.configJson),
        questionSetJson: toNullableJsonInput(body.questionSetJson),
        scoringJson: toNullableJsonInput(body.scoringJson),
        estimatedMin: body.estimatedMin ?? null,
      },
      include: {
        condition: true,
      },
    });

    res.status(201).json(created);
  } catch (error) {
    console.error("createNeuroTest error:", error);
    res.status(500).json({ message: "Failed to create neuro test" });
  }
};

export const listNeuroTests = async (req: Request, res: Response): Promise<void> => {
  try {
    const bootstrapDefaults = parseBoolean(req.query.bootstrapDefaults, false);

    let rows = await prisma.neuroTest.findMany({
      include: {
        condition: true,
      },
      orderBy: [{ lifecycle: "asc" }, { updatedAt: "desc" }],
    });

    if (bootstrapDefaults && rows.length === 0) {
      await upsertDefaultNeuroTests();
      rows = await prisma.neuroTest.findMany({
        include: {
          condition: true,
        },
        orderBy: [{ lifecycle: "asc" }, { updatedAt: "desc" }],
      });
    }

    res.json(rows);
  } catch (error) {
    console.error("listNeuroTests error:", error);
    res.status(500).json({ message: "Failed to fetch neuro tests" });
  }
};

export const updateNeuroTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const testId = req.params.testId as string;
    const body = req.body as UpdateNeuroTestInput;

    const existing = await prisma.neuroTest.findUnique({ where: { id: testId } });
    if (!existing) {
      res.status(404).json({ message: "Neuro test not found" });
      return;
    }

    if (body.key && body.key !== existing.key) {
      const duplicate = await prisma.neuroTest.findUnique({ where: { key: body.key } });
      if (duplicate) {
        res.status(409).json({ message: "Neuro test key already exists" });
        return;
      }
    }

    const updated = await prisma.neuroTest.update({
      where: { id: testId },
      data: {
        key: body.key,
        title: body.title,
        description: body.description,
        instructionText: body.instructionText,
        targetCondition: body.targetCondition,
        lifecycle: body.lifecycle,
        version: body.version,
        configJson: toNullableJsonInput(body.configJson),
        questionSetJson: toNullableJsonInput(body.questionSetJson),
        scoringJson: toNullableJsonInput(body.scoringJson),
        estimatedMin: body.estimatedMin,
      },
      include: {
        condition: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("updateNeuroTest error:", error);
    res.status(500).json({ message: "Failed to update neuro test" });
  }
};

export const assignNeuroTestToStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const body = req.body as AssignNeuroTestInput;

    const [test, student, teacherStudentClass] = await Promise.all([
      prisma.neuroTest.findUnique({ where: { id: body.testId } }),
      prisma.user.findUnique({ where: { id: body.studentId }, select: { id: true, role: true, schoolId: true } }),
      ensureTeacherOwnsStudent(teacherId, body.studentId),
    ]);

    if (!test) {
      res.status(404).json({ message: "Neuro test not found" });
      return;
    }

    if (test.lifecycle !== "ACTIVE") {
      res.status(400).json({ message: "Only ACTIVE tests can be assigned" });
      return;
    }

    if (!student || student.role !== "STUDENT") {
      res.status(404).json({ message: "Student not found" });
      return;
    }

    if (!teacherStudentClass) {
      res.status(403).json({ message: "You are not allowed to assign tests for this student" });
      return;
    }

    const existingActiveAssignment = await prisma.neuroTestAssignment.findFirst({
      where: {
        testId: body.testId,
        studentId: body.studentId,
        status: {
          in: ACTIVE_ASSIGNMENT_STATUSES,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (existingActiveAssignment) {
      res.status(409).json({
        message: "Student already has an active assignment for this test",
        existingAssignmentId: existingActiveAssignment.id,
      });
      return;
    }

    const assignment = await prisma.neuroTestAssignment.create({
      data: {
        testId: body.testId,
        studentId: body.studentId,
        assignedByTeacherId: teacherId,
        classId: body.classId ?? teacherStudentClass.classId,
        visibleToStudent: body.visibleToStudent ?? true,
        dueAt: body.dueAt ? new Date(body.dueAt) : null,
        notes: body.notes ?? null,
      },
      include: {
        test: true,
        student: { select: { id: true, fullName: true, email: true } },
      },
    });

    res.status(201).json(assignment);
  } catch (error) {
    console.error("assignNeuroTestToStudent error:", error);
    res.status(500).json({ message: "Failed to assign neuro test" });
  }
};

export const getTeacherNeuroAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;

    const statusFilterRaw = req.query.status;
    const testIdFilterRaw = req.query.testId;
    const studentIdFilterRaw = req.query.studentId;

    const allowedStatuses = new Set<AssignmentStatus>([
      "ASSIGNED",
      "IN_PROGRESS",
      "SUBMITTED",
      "REVIEWED",
      "CANCELLED",
    ]);
    const statusFilter =
      typeof statusFilterRaw === "string" && allowedStatuses.has(statusFilterRaw as AssignmentStatus)
        ? (statusFilterRaw as AssignmentStatus)
        : undefined;
    const testIdFilter = typeof testIdFilterRaw === "string" ? testIdFilterRaw : undefined;
    const studentIdFilter = typeof studentIdFilterRaw === "string" ? studentIdFilterRaw : undefined;

    const rows = await prisma.neuroTestAssignment.findMany({
      where: {
        assignedByTeacherId: teacherId,
        status: statusFilter,
        testId: testIdFilter,
        studentId: studentIdFilter,
      },
      include: {
        test: true,
        student: { select: { id: true, fullName: true, email: true } },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        attempts: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
      orderBy: { assignedAt: "desc" },
    });

    res.json(rows.map((assignment) => withAssignmentAttemptPolicy(assignment)));
  } catch (error) {
    console.error("getTeacherNeuroAssignments error:", error);
    res.status(500).json({ message: "Failed to fetch teacher assignments" });
  }
};

export const getTeacherNeuroAssignmentDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const assignmentId = req.params.assignmentId as string;

    const assignment = await prisma.neuroTestAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        test: {
          include: {
            condition: true,
          },
        },
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            dateOfBirth: true,
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
          include: {
            reviewedByTeacher: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!assignment) {
      res.status(404).json({ message: "Assignment not found" });
      return;
    }

    if (assignment.assignedByTeacherId !== teacherId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const canAccessStudent = await ensureTeacherOwnsStudent(teacherId, assignment.studentId);
    if (!canAccessStudent) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const withPolicy = withAssignmentAttemptPolicy(assignment);
    const scores = assignment.attempts
      .map((attempt) => attempt.score)
      .filter((score): score is number => typeof score === "number");
    const latestAttempt = assignment.attempts[0] ?? null;
    const latestScore =
      latestAttempt && typeof latestAttempt.score === "number" ? latestAttempt.score : null;
    const bestScore = scores.length > 0 ? Math.max(...scores) : null;
    const averageScore = scores.length > 0 ? roundNumber(averageNumberArray(scores), 1) : null;

    res.json({
      assignment: withPolicy,
      analytics: {
        attemptsCount: assignment.attempts.length,
        scoredAttemptsCount: scores.length,
        latestScore,
        bestScore,
        averageScore,
        latestSupportLevel:
          typeof latestScore === "number" ? getSupportLevelFromScore(latestScore) : null,
      },
    });
  } catch (error) {
    console.error("getTeacherNeuroAssignmentDetail error:", error);
    res.status(500).json({ message: "Failed to fetch assignment detail" });
  }
};

export const getTeacherNeuroRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const classIdFilter = typeof req.query.classId === "string" ? req.query.classId : undefined;
    const limit = parsePositiveInt(req.query.limit, 40, 1, 200);
    const engagementThreshold = parsePositiveInt(req.query.engagementThreshold, 60, 0, 100);
    const includeAssigned = parseBoolean(req.query.includeAssigned, false);

    const teacherClassIds = await getTeacherClassIds(teacherId);
    if (teacherClassIds.length === 0) {
      res.json({
        summary: {
          totalStudentsScanned: 0,
          threshold: engagementThreshold,
          lowEngagementStudents: 0,
        },
        recommendations: [],
      });
      return;
    }

    if (classIdFilter && !teacherClassIds.includes(classIdFilter)) {
      res.status(403).json({ message: "You are not allowed to access this class" });
      return;
    }

    const scopedClassIds = classIdFilter ? [classIdFilter] : teacherClassIds;

    const [enrollments, activeTests] = await Promise.all([
      prisma.studentClass.findMany({
        where: {
          classId: { in: scopedClassIds },
          status: "APPROVED",
        },
        select: {
          classId: true,
          class: {
            select: {
              id: true,
              name: true,
            },
          },
          studentId: true,
          student: {
            select: {
              id: true,
              fullName: true,
              email: true,
              dateOfBirth: true,
              studentXP: {
                select: {
                  averageEngagement: true,
                  averageConcentration: true,
                  currentStreak: true,
                  dailyLessonsDone: true,
                  lastActivityDate: true,
                },
              },
              neuroProfile: {
                select: {
                  activeCondition: true,
                  confidence: true,
                },
              },
              neuroAssignmentsAsStudent: {
                where: {
                  status: {
                    in: ACTIVE_ASSIGNMENT_STATUSES,
                  },
                },
                select: {
                  id: true,
                  testId: true,
                  status: true,
                },
              },
            },
          },
        },
      }),
      prisma.neuroTest.findMany({
        where: {
          lifecycle: "ACTIVE",
        },
        select: {
          id: true,
          key: true,
          title: true,
          targetCondition: true,
          estimatedMin: true,
        },
        orderBy: [
          { targetCondition: "asc" },
          { updatedAt: "desc" },
        ],
      }),
    ]);

    const testsByCondition = new Map<NeuroConditionCodeInput, typeof activeTests>();
    activeTests.forEach((test) => {
      const key = test.targetCondition as NeuroConditionCodeInput;
      const existing = testsByCondition.get(key) ?? [];
      existing.push(test);
      testsByCondition.set(key, existing);
    });

    const recommendations = enrollments
      .map((enrollment) => {
        const engagement = enrollment.student.studentXP?.averageEngagement ?? 0;
        const concentration = enrollment.student.studentXP?.averageConcentration ?? 0;

        if (engagement > engagementThreshold) {
          return null;
        }

        const currentCondition =
          (enrollment.student.neuroProfile?.activeCondition as NeuroConditionCodeInput | undefined) ??
          "DEFAULT";

        const suggestedConditions = inferRecommendedConditions({
          averageEngagement: engagement,
          averageConcentration: concentration,
          currentCondition,
        });

        const activeAssignedTestIds = new Set(
          enrollment.student.neuroAssignmentsAsStudent.map((assignment) => assignment.testId),
        );

        const candidateTests = suggestedConditions
          .flatMap((condition) => {
            if (condition === "DEFAULT") {
              return activeTests;
            }

            return testsByCondition.get(condition) ?? [];
          })
          .filter((test) => includeAssigned || !activeAssignedTestIds.has(test.id));

        const uniqueCandidateTests = Array.from(
          new Map(candidateTests.map((test) => [test.id, test])).values(),
        ).slice(0, 3);

        if (uniqueCandidateTests.length === 0) {
          return null;
        }

        const age = calculateAge(enrollment.student.dateOfBirth);
        const riskBand = getLowEngagementRiskBand(engagement);
        const reasonParts = [
          `Average engagement ${engagement}/100`,
          `Average concentration ${concentration}/100`,
        ];

        if (currentCondition !== "DEFAULT") {
          reasonParts.push(`Current profile condition ${currentCondition}`);
        }

        return {
          student: {
            id: enrollment.student.id,
            fullName: enrollment.student.fullName,
            email: enrollment.student.email,
            age,
          },
          class: enrollment.class,
          metrics: {
            averageEngagement: engagement,
            averageConcentration: concentration,
            currentStreak: enrollment.student.studentXP?.currentStreak ?? 0,
            dailyLessonsDone: enrollment.student.studentXP?.dailyLessonsDone ?? 0,
            lastActivityDate: enrollment.student.studentXP?.lastActivityDate ?? null,
          },
          riskBand,
          reason: reasonParts.join("; "),
          suggestedConditions,
          recommendedTests: uniqueCandidateTests,
          activeAssignmentsCount: enrollment.student.neuroAssignmentsAsStudent.length,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      .sort((a, b) => {
        if (a.metrics.averageEngagement !== b.metrics.averageEngagement) {
          return a.metrics.averageEngagement - b.metrics.averageEngagement;
        }

        return a.metrics.averageConcentration - b.metrics.averageConcentration;
      })
      .slice(0, limit);

    res.json({
      summary: {
        totalStudentsScanned: enrollments.length,
        threshold: engagementThreshold,
        lowEngagementStudents: recommendations.length,
      },
      recommendations,
    });
  } catch (error) {
    console.error("getTeacherNeuroRecommendations error:", error);
    res.status(500).json({ message: "Failed to fetch neuro recommendations" });
  }
};

export const assignNeuroTestByCriteria = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const body = req.body as AssignNeuroTestByCriteriaInput;

    const test = await prisma.neuroTest.findUnique({ where: { id: body.testId } });
    if (!test) {
      res.status(404).json({ message: "Neuro test not found" });
      return;
    }

    if (test.lifecycle !== "ACTIVE") {
      res.status(400).json({ message: "Only ACTIVE tests can be assigned" });
      return;
    }

    const teacherClassIds = await getTeacherClassIds(teacherId);
    if (teacherClassIds.length === 0) {
      res.status(400).json({ message: "You do not currently teach any classes" });
      return;
    }

    if (body.classId && !teacherClassIds.includes(body.classId)) {
      res.status(403).json({ message: "You are not allowed to assign tests for this class" });
      return;
    }

    const scopedClassIds = body.classId ? [body.classId] : teacherClassIds;
    const engagementThreshold = body.engagementThreshold ?? 60;
    const lowEngagementOnly = body.lowEngagementOnly ?? false;
    const maxStudents = body.maxStudents ?? 120;

    const enrollments = await prisma.studentClass.findMany({
      where: {
        classId: { in: scopedClassIds },
        status: "APPROVED",
      },
      select: {
        classId: true,
        studentId: true,
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            dateOfBirth: true,
            studentXP: {
              select: {
                averageEngagement: true,
                averageConcentration: true,
              },
            },
          },
        },
      },
    });

    const filtered = enrollments
      .filter((enrollment) => enrollment.student.role === "STUDENT")
      .filter((enrollment) => {
        const age = calculateAge(enrollment.student.dateOfBirth);

        if (body.minAge !== undefined && body.minAge !== null) {
          if (age === null || age < body.minAge) {
            return false;
          }
        }

        if (body.maxAge !== undefined && body.maxAge !== null) {
          if (age === null || age > body.maxAge) {
            return false;
          }
        }

        const averageEngagement = enrollment.student.studentXP?.averageEngagement ?? 0;
        if (lowEngagementOnly && averageEngagement > engagementThreshold) {
          return false;
        }

        return true;
      })
      .slice(0, maxStudents);

    if (filtered.length === 0) {
      res.json({
        message: "No students matched the assignment criteria",
        scanned: enrollments.length,
        eligible: 0,
        created: 0,
        skippedExisting: 0,
        assignments: [],
      });
      return;
    }

    const existingAssignments = await prisma.neuroTestAssignment.findMany({
      where: {
        testId: body.testId,
        studentId: {
          in: filtered.map((entry) => entry.studentId),
        },
        status: {
          in: ACTIVE_ASSIGNMENT_STATUSES,
        },
      },
      select: {
        id: true,
        studentId: true,
      },
    });

    const existingByStudentId = new Set(existingAssignments.map((assignment) => assignment.studentId));

    const assignmentsToCreate = filtered.filter((entry) => !existingByStudentId.has(entry.studentId));

    const dueAt = body.dueAt ? new Date(body.dueAt) : null;

    const createdAssignments =
      assignmentsToCreate.length > 0
        ? await prisma.$transaction(
            assignmentsToCreate.map((entry) =>
              prisma.neuroTestAssignment.create({
                data: {
                  testId: body.testId,
                  studentId: entry.studentId,
                  assignedByTeacherId: teacherId,
                  classId: entry.classId,
                  visibleToStudent: body.visibleToStudent ?? true,
                  dueAt,
                  notes: body.notes ?? null,
                },
                include: {
                  test: {
                    select: {
                      id: true,
                      key: true,
                      title: true,
                      targetCondition: true,
                    },
                  },
                  student: {
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
                },
              }),
            ),
          )
        : [];

    res.status(201).json({
      message: "Bulk assignment completed",
      scanned: enrollments.length,
      eligible: filtered.length,
      created: createdAssignments.length,
      skippedExisting: filtered.length - createdAssignments.length,
      filters: {
        classId: body.classId ?? null,
        minAge: body.minAge ?? null,
        maxAge: body.maxAge ?? null,
        lowEngagementOnly,
        engagementThreshold,
      },
      assignments: createdAssignments,
    });
  } catch (error) {
    console.error("assignNeuroTestByCriteria error:", error);
    res.status(500).json({ message: "Failed to create assignments by criteria" });
  }
};

export const updateNeuroAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const assignmentId = req.params.assignmentId as string;
    const body = req.body as UpdateNeuroAssignmentInput;

    const assignment = await prisma.neuroTestAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        student: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!assignment) {
      res.status(404).json({ message: "Assignment not found" });
      return;
    }

    if (assignment.assignedByTeacherId !== teacherId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const canAccessStudent = await ensureTeacherOwnsStudent(teacherId, assignment.studentId);
    if (!canAccessStudent) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    if (
      (assignment.status === "SUBMITTED" || assignment.status === "REVIEWED") &&
      body.status
    ) {
      res.status(400).json({ message: "Submitted or reviewed assignments cannot be re-opened or cancelled" });
      return;
    }

    const updated = await prisma.neuroTestAssignment.update({
      where: { id: assignmentId },
      data: {
        visibleToStudent: body.visibleToStudent,
        notes: body.notes,
        dueAt: body.dueAt !== undefined ? (body.dueAt ? new Date(body.dueAt) : null) : undefined,
        status: body.status,
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

    res.json(withAssignmentAttemptPolicy(updated));
  } catch (error) {
    console.error("updateNeuroAssignment error:", error);
    res.status(500).json({ message: "Failed to update assignment" });
  }
};

export const getStudentMyNeuroAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const scope = typeof req.query.scope === "string" ? req.query.scope.trim().toLowerCase() : "active";
    const scopeStatuses = getAssignmentScopeStatuses(req.query.scope);
    const limit = parsePositiveInt(req.query.limit, 100, 1, 300);

    const rows = await prisma.neuroTestAssignment.findMany({
      where: {
        studentId,
        visibleToStudent: true,
        status: {
          in: scopeStatuses,
        },
      },
      include: {
        test: true,
        class: {
          select: {
            id: true,
            name: true,
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
          include: {
            reviewedByTeacher: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 3,
        },
      },
      orderBy: { assignedAt: "desc" },
      take: limit,
    });

    const rowsWithPolicy = rows.map((assignment) => withAssignmentAttemptPolicy(assignment));
    const filteredRows =
      scope === "active"
        ? rowsWithPolicy.filter((assignment) => {
            if (assignment.status === "ASSIGNED" || assignment.status === "IN_PROGRESS") {
              return true;
            }

            return assignment.status === "SUBMITTED" && assignment.attemptPolicy.needsRetry;
          })
        : rowsWithPolicy;

    res.json(filteredRows);
  } catch (error) {
    console.error("getStudentMyNeuroAssignments error:", error);
    res.status(500).json({ message: "Failed to fetch student assignments" });
  }
};

export const getStudentMyNeuroResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const limit = parsePositiveInt(req.query.limit, 80, 1, 200);

    const rows = await prisma.neuroTestAssignment.findMany({
      where: {
        studentId,
        visibleToStudent: true,
        status: {
          in: RESULT_ASSIGNMENT_STATUSES,
        },
      },
      include: {
        test: true,
        class: {
          select: {
            id: true,
            name: true,
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
          include: {
            reviewedByTeacher: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
      take: limit,
    });

    const latestAttempts = rows
      .map((assignment) => assignment.attempts[0])
      .filter((attempt): attempt is NonNullable<typeof attempt> => Boolean(attempt));
    const averageScore =
      latestAttempts.length > 0
        ? roundNumber(
            averageNumberArray(
              latestAttempts
                .map((attempt) => attempt.score)
                .filter((value): value is number => typeof value === "number"),
            ),
            1,
          )
        : 0;

    const rowsWithPolicy = rows.map((assignment) => withAssignmentAttemptPolicy(assignment));

    res.json({
      summary: {
        totalAssignments: rows.length,
        reviewedCount: rows.filter((assignment) => assignment.status === "REVIEWED").length,
        averageScore,
      },
      assignments: rowsWithPolicy,
    });
  } catch (error) {
    console.error("getStudentMyNeuroResults error:", error);
    res.status(500).json({ message: "Failed to fetch student neuro results" });
  }
};

export const getStudentMyNeuroAssignmentDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const assignmentId = req.params.assignmentId as string;

    const assignment = await prisma.neuroTestAssignment.findUnique({
      where: {
        id: assignmentId,
      },
      include: {
        test: {
          include: {
            condition: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
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
          include: {
            reviewedByTeacher: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!assignment || assignment.studentId !== studentId) {
      res.status(404).json({ message: "Assignment not found" });
      return;
    }

    if (!assignment.visibleToStudent) {
      res.status(403).json({ message: "Assignment is not visible" });
      return;
    }

    res.json(withAssignmentAttemptPolicy(assignment));
  } catch (error) {
    console.error("getStudentMyNeuroAssignmentDetail error:", error);
    res.status(500).json({ message: "Failed to fetch assignment detail" });
  }
};

export const startMyNeuroAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const assignmentId = req.params.assignmentId as string;

    const assignment = await prisma.neuroTestAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        test: {
          select: {
            configJson: true,
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
        },
      },
    });

    if (!assignment || assignment.studentId !== studentId) {
      res.status(404).json({ message: "Assignment not found" });
      return;
    }

    if (!assignment.visibleToStudent) {
      res.status(403).json({ message: "Assignment is not visible" });
      return;
    }

    if (
      assignment.status !== "ASSIGNED" &&
      assignment.status !== "IN_PROGRESS" &&
      assignment.status !== "SUBMITTED"
    ) {
      res.status(400).json({ message: "Assignment cannot be started" });
      return;
    }

    const policy = getAttemptPolicyFromConfig(assignment.test?.configJson ?? null);
    const retryState = getRetryState({
      attempts: assignment.attempts,
      policy,
    });

    if (assignment.status === "SUBMITTED") {
      if (!retryState.needsRetry) {
        res.status(400).json({
          message: "No additional attempt is required for this test",
          attemptPolicy: {
            ...policy,
            ...retryState,
          },
        });
        return;
      }

      if (!retryState.canRetryNow) {
        res.status(429).json({
          message: "The next retry is available after the cooldown period",
          attemptPolicy: {
            ...policy,
            ...retryState,
          },
        });
        return;
      }
    }

    const updated = await prisma.neuroTestAssignment.update({
      where: { id: assignmentId },
      data: {
        status: "IN_PROGRESS",
        startedAt:
          assignment.status === "IN_PROGRESS" && assignment.startedAt
            ? assignment.startedAt
            : new Date(),
        submittedAt: assignment.status === "SUBMITTED" ? null : assignment.submittedAt,
      },
      include: {
        test: true,
        attempts: {
          orderBy: {
            createdAt: "desc",
          },
          take: 3,
        },
      },
    });

    res.json(withAssignmentAttemptPolicy(updated));
  } catch (error) {
    console.error("startMyNeuroAssignment error:", error);
    res.status(500).json({ message: "Failed to start assignment" });
  }
};

export const submitMyNeuroAttempt = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const assignmentId = req.params.assignmentId as string;
    const body = req.body as SubmitNeuroAttemptInput;

    const assignment = await prisma.neuroTestAssignment.findUnique({
      where: { id: assignmentId },
      include: { test: true },
    });

    if (!assignment || assignment.studentId !== studentId) {
      res.status(404).json({ message: "Assignment not found" });
      return;
    }

    if (!assignment.visibleToStudent) {
      res.status(403).json({ message: "Assignment is not visible" });
      return;
    }

    if (assignment.status !== "ASSIGNED" && assignment.status !== "IN_PROGRESS") {
      res.status(400).json({ message: "Assignment cannot be submitted" });
      return;
    }

    const startedAt = assignment.startedAt ?? new Date();
    const completedAt = new Date();
    const durationSec =
      body.durationSec ?? Math.max(0, Math.round((completedAt.getTime() - startedAt.getTime()) / 1000));
    const existingAttemptsCount = await prisma.neuroTestAttempt.count({
      where: { assignmentId: assignment.id },
    });
    const policy = getAttemptPolicyFromConfig(assignment.test.configJson ?? null);

    const engineEvaluation = evaluateNeuroAttempt({
      testKey: assignment.test.key,
      targetCondition: assignment.test.targetCondition,
      questionSetJson: assignment.test.questionSetJson,
      scoringJson: assignment.test.scoringJson,
      answersJson: body.answersJson,
    });

    const resolvedScore = engineEvaluation?.score ?? body.score ?? null;
    const resolvedInferredCondition =
      engineEvaluation?.inferredCondition ?? body.inferredCondition ?? null;
    const resolvedConfidence = engineEvaluation?.confidence ?? body.confidence ?? null;

    const mergedAnalysis = (() => {
      const base = toPlainObject(body.analysisJson) ?? {};

      if (engineEvaluation) {
        return {
          ...base,
          ...engineEvaluation.analysisJson,
        };
      }

      if (typeof resolvedScore === "number") {
        return {
          ...base,
          supportLevel:
            typeof base.supportLevel === "string"
              ? base.supportLevel
              : getSupportLevelFromScore(resolvedScore),
        };
      }

      return Object.keys(base).length > 0 ? base : null;
    })();

    const result = await prisma.$transaction(async (tx) => {
      const attempt = await tx.neuroTestAttempt.create({
        data: {
          assignmentId: assignment.id,
          testId: assignment.testId,
          studentId,
          startedAt,
          completedAt,
          durationSec,
          answersJson: toNullableJsonInput(body.answersJson),
          score: resolvedScore,
          analysisJson: toNullableJsonInput(mergedAnalysis),
          inferredCondition: resolvedInferredCondition,
          confidence: resolvedConfidence,
        },
      });

      await tx.neuroTestAssignment.update({
        where: { id: assignment.id },
        data: {
          status: "SUBMITTED",
          startedAt,
          submittedAt: completedAt,
        },
      });

      let profile = null;
      if (resolvedInferredCondition && resolvedInferredCondition !== "DEFAULT") {
        profile = await tx.studentNeuroProfile.upsert({
          where: { studentId },
          create: {
            studentId,
            activeCondition: resolvedInferredCondition,
            confidence: resolvedConfidence,
            sourceAssignmentId: assignment.id,
            sourceAttemptId: attempt.id,
            sourceNotes: "Auto-applied from submitted neuro test attempt",
            updatedByTeacherId: assignment.assignedByTeacherId,
          },
          update: {
            activeCondition: resolvedInferredCondition,
            confidence: resolvedConfidence,
            sourceAssignmentId: assignment.id,
            sourceAttemptId: attempt.id,
            sourceNotes: "Auto-applied from submitted neuro test attempt",
            updatedByTeacherId: assignment.assignedByTeacherId,
          },
        });

        await tx.studentNeuroConditionRecord.create({
          data: {
            studentId,
            condition: resolvedInferredCondition,
            confidence: resolvedConfidence,
            sourceAssignmentId: assignment.id,
            sourceAttemptId: attempt.id,
            sourceType: "TEST_AUTO_RESULT",
            notes: "Condition set from submitted neuro test result",
            diagnosedByTeacherId: assignment.assignedByTeacherId,
          },
        });
      }

      return { attempt, profile };
    });

    const attemptsUsed = existingAttemptsCount + 1;
    const remainingAttempts = Math.max(0, policy.maxAttempts - attemptsUsed);
    const needsRetry =
      typeof resolvedScore === "number" &&
      resolvedScore < policy.lowScoreThreshold &&
      remainingAttempts > 0;
    const retryAvailableAt = needsRetry
      ? addDays(completedAt, policy.retryCooldownDays)
      : null;

    res.status(201).json({
      ...result,
      attemptPolicy: {
        ...policy,
        attemptsUsed,
        remainingAttempts,
        latestScore: resolvedScore,
        latestSupportLevel:
          typeof resolvedScore === "number"
            ? getSupportLevelFromScore(resolvedScore)
            : null,
        latestAttemptId: result.attempt.id,
        needsRetry,
        canRetryNow:
          retryAvailableAt !== null && retryAvailableAt.getTime() <= Date.now(),
        retryAvailableAt,
      },
    });
  } catch (error) {
    console.error("submitMyNeuroAttempt error:", error);
    res.status(500).json({ message: "Failed to submit attempt" });
  }
};

export const reviewNeuroAttempt = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const attemptId = req.params.attemptId as string;
    const body = req.body as ReviewNeuroAttemptInput;

    const attempt = await prisma.neuroTestAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assignment: true,
      },
    });

    if (!attempt) {
      res.status(404).json({ message: "Attempt not found" });
      return;
    }

    if (attempt.assignment.assignedByTeacherId !== teacherId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const studentClass = await ensureTeacherOwnsStudent(teacherId, attempt.studentId);
    if (!studentClass) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedAttempt = await tx.neuroTestAttempt.update({
        where: { id: attemptId },
        data: {
          reviewedByTeacherId: teacherId,
          reviewerNotes: body.reviewerNotes ?? null,
          confidence: body.confidence ?? attempt.confidence ?? null,
        },
      });

      const updatedAssignment = await tx.neuroTestAssignment.update({
        where: { id: attempt.assignmentId },
        data: {
          status: "REVIEWED",
          reviewedAt: new Date(),
        },
      });

      let profile = null;
      if (body.overrideCondition) {
        profile = await tx.studentNeuroProfile.upsert({
          where: { studentId: attempt.studentId },
          create: {
            studentId: attempt.studentId,
            activeCondition: body.overrideCondition,
            confidence: body.confidence ?? updatedAttempt.confidence ?? null,
            sourceAssignmentId: attempt.assignmentId,
            sourceAttemptId: attempt.id,
            sourceNotes: body.reviewerNotes ?? "Teacher-reviewed test result",
            updatedByTeacherId: teacherId,
          },
          update: {
            activeCondition: body.overrideCondition,
            confidence: body.confidence ?? updatedAttempt.confidence ?? null,
            sourceAssignmentId: attempt.assignmentId,
            sourceAttemptId: attempt.id,
            sourceNotes: body.reviewerNotes ?? "Teacher-reviewed test result",
            updatedByTeacherId: teacherId,
          },
        });

        await tx.studentNeuroConditionRecord.create({
          data: {
            studentId: attempt.studentId,
            condition: body.overrideCondition,
            confidence: body.confidence ?? updatedAttempt.confidence ?? null,
            sourceAssignmentId: attempt.assignmentId,
            sourceAttemptId: attempt.id,
            sourceType: "TEACHER_REVIEW",
            notes: body.reviewerNotes ?? "Teacher reviewed and set condition",
            diagnosedByTeacherId: teacherId,
          },
        });
      }

      return {
        attempt: updatedAttempt,
        assignment: updatedAssignment,
        profile,
      };
    });

    res.json(result);
  } catch (error) {
    console.error("reviewNeuroAttempt error:", error);
    res.status(500).json({ message: "Failed to review attempt" });
  }
};

export const setStudentConditionManually = async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const studentId = req.params.studentId as string;
    const body = req.body as ManualSetStudentConditionInput;

    const studentClass = await ensureTeacherOwnsStudent(teacherId, studentId);
    if (!studentClass) {
      res.status(403).json({ message: "You are not allowed to update this student" });
      return;
    }

    const profile = await upsertStudentCondition({
      studentId,
      condition: body.condition,
      confidence: body.confidence,
      diagnosedByTeacherId: teacherId,
      notes: body.notes,
      sourceType: body.sourceType ?? "TEACHER_MANUAL",
    });

    res.json(profile);
  } catch (error) {
    console.error("setStudentConditionManually error:", error);
    res.status(500).json({ message: "Failed to set student condition" });
  }
};

export const getStudentConditionForTheme = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestedStudentId = req.params.studentId as string | undefined;
    const actor = req.user!;

    let studentId = actor.id;
    if (requestedStudentId && requestedStudentId !== actor.id) {
      studentId = requestedStudentId;

      if (actor.role === "TEACHER") {
        const canAccess = await ensureTeacherOwnsStudent(actor.id, studentId);
        if (!canAccess) {
          res.status(403).json({ message: "Forbidden" });
          return;
        }
      } else if (actor.role === "GUARDIAN") {
        const canAccess = await ensureGuardianOwnsStudent(actor.id, studentId);
        if (!canAccess) {
          res.status(403).json({ message: "Forbidden" });
          return;
        }
      } else if (actor.role !== "SCHOOL_ADMIN" && actor.role !== "SUPER_ADMIN") {
        res.status(403).json({ message: "Forbidden" });
        return;
      }
    }

    const profile = await prisma.studentNeuroProfile.findUnique({
      where: { studentId },
      include: {
        condition: true,
      },
    });

    if (profile) {
      const profileCondition = toThemeCondition(profile.activeCondition);

      if (profileCondition !== "default") {
        res.json({
          studentId,
          condition: profileCondition,
          rawCondition: profile.activeCondition,
          confidence: profile.confidence,
          sourceAssignmentId: profile.sourceAssignmentId,
          sourceAttemptId: profile.sourceAttemptId,
          updatedAt: profile.updatedAt,
          source: "profile",
        });
        return;
      }

      const signalResult = await resolveSignalBasedTheme(studentId);
      if (signalResult.inferredCondition !== "default") {
        res.json({
          studentId,
          condition: signalResult.inferredCondition,
          rawCondition:
            signalResult.signals.latestAttemptCondition ??
            signalResult.signals.latestTargetCondition ??
            "DEFAULT",
          confidence: profile.confidence,
          sourceAssignmentId: profile.sourceAssignmentId,
          sourceAttemptId: profile.sourceAttemptId,
          updatedAt: signalResult.signals.latestCompletedAt ?? profile.updatedAt,
          source: "signal_inference",
          signals: {
            averageEngagement: signalResult.signals.averageEngagement,
            averageConcentration: signalResult.signals.averageConcentration,
            latestScore: signalResult.signals.latestScore,
            latestSupportLevel: signalResult.signals.latestSupportLevel,
            latestCompletedAt: signalResult.signals.latestCompletedAt,
          },
        });
        return;
      }

      res.json({
        studentId,
        condition: profileCondition,
        rawCondition: profile.activeCondition,
        confidence: profile.confidence,
        sourceAssignmentId: profile.sourceAssignmentId,
        sourceAttemptId: profile.sourceAttemptId,
        updatedAt: profile.updatedAt,
        source: "profile_default",
      });
      return;
    }

    const latestRecord = await prisma.studentNeuroConditionRecord.findFirst({
      where: { studentId },
      orderBy: { diagnosedAt: "desc" },
      select: {
        condition: true,
        confidence: true,
        sourceAssignmentId: true,
        sourceAttemptId: true,
        diagnosedAt: true,
      },
    });

    if (latestRecord) {
      res.json({
        studentId,
        condition: normalizeThemeCondition(latestRecord.condition),
        rawCondition: latestRecord.condition,
        confidence: latestRecord.confidence,
        sourceAssignmentId: latestRecord.sourceAssignmentId,
        sourceAttemptId: latestRecord.sourceAttemptId,
        updatedAt: latestRecord.diagnosedAt,
        source: "history_fallback",
      });
      return;
    }

    const latestDiagnosis = await prisma.studentDiagnosis.findFirst({
      where: { studentId },
      orderBy: { diagnosedAt: "desc" },
      select: {
        condition: true,
        diagnosedAt: true,
      },
    });

    if (latestDiagnosis) {
      res.json({
        studentId,
        condition: normalizeThemeCondition(latestDiagnosis.condition),
        rawCondition: latestDiagnosis.condition,
        source: "legacy_diagnosis_fallback",
        updatedAt: latestDiagnosis.diagnosedAt,
      });
      return;
    }

    const signalResult = await resolveSignalBasedTheme(studentId);
    if (signalResult.inferredCondition !== "default") {
      res.json({
        studentId,
        condition: signalResult.inferredCondition,
        rawCondition:
          signalResult.signals.latestAttemptCondition ??
          signalResult.signals.latestTargetCondition ??
          "DEFAULT",
        source: "signal_inference",
        updatedAt: signalResult.signals.latestCompletedAt,
        signals: {
          averageEngagement: signalResult.signals.averageEngagement,
          averageConcentration: signalResult.signals.averageConcentration,
          latestScore: signalResult.signals.latestScore,
          latestSupportLevel: signalResult.signals.latestSupportLevel,
          latestCompletedAt: signalResult.signals.latestCompletedAt,
        },
      });
      return;
    }

    res.json({
      studentId,
      condition: "default",
      source: "fallback",
    });
  } catch (error) {
    console.error("getStudentConditionForTheme error:", error);
    res.status(500).json({ message: "Failed to fetch student condition" });
  }
};

export const getStudentConditionHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.params.studentId as string;
    const actor = req.user!;

    if (actor.role === "TEACHER") {
      const allowed = await ensureTeacherOwnsStudent(actor.id, studentId);
      if (!allowed) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }
    } else if (actor.role === "STUDENT" && actor.id !== studentId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const rows = await prisma.studentNeuroConditionRecord.findMany({
      where: { studentId },
      include: {
        conditionRef: true,
      },
      orderBy: { diagnosedAt: "desc" },
    });

    res.json(rows);
  } catch (error) {
    console.error("getStudentConditionHistory error:", error);
    res.status(500).json({ message: "Failed to fetch condition history" });
  }
};
