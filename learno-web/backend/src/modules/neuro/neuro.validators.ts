import { z } from "zod";

export const NeuroConditionCodeSchema = z.enum([
  "ADHD",
  "ASD",
  "DYSLEXIA",
  "DYSCALCULIA",
  "ANXIETY",
  "DEPRESSION",
  "DEFAULT",
]);

export const NeuroTestLifecycleSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);

export const NeuroAssignmentStatusSchema = z.enum([
  "ASSIGNED",
  "IN_PROGRESS",
  "SUBMITTED",
  "REVIEWED",
  "CANCELLED",
]);

const JsonLikeSchema = z.unknown();

export const CreateNeuroTestSchema = z.object({
  key: z
    .string()
    .min(2, "Test key is required")
    .max(80, "Test key is too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Test key can contain only letters, numbers, _ and -"),
  title: z.string().min(2, "Test title is required").max(180, "Test title is too long"),
  description: z.string().max(4000, "Description is too long").optional().nullable(),
  instructionText: z.string().max(12000, "Instruction text is too long").optional().nullable(),
  targetCondition: NeuroConditionCodeSchema,
  lifecycle: NeuroTestLifecycleSchema.optional(),
  version: z.number().int().min(1, "Version must be >= 1").optional(),
  configJson: JsonLikeSchema.optional().nullable(),
  questionSetJson: JsonLikeSchema.optional().nullable(),
  scoringJson: JsonLikeSchema.optional().nullable(),
  estimatedMin: z.number().int().min(1).max(240).optional().nullable(),
});

export const UpdateNeuroTestSchema = z
  .object({
    key: z
      .string()
      .min(2)
      .max(80)
      .regex(/^[a-zA-Z0-9_-]+$/)
      .optional(),
    title: z.string().min(2).max(180).optional(),
    description: z.string().max(4000).optional().nullable(),
    instructionText: z.string().max(12000).optional().nullable(),
    targetCondition: NeuroConditionCodeSchema.optional(),
    lifecycle: NeuroTestLifecycleSchema.optional(),
    version: z.number().int().min(1).optional(),
    configJson: JsonLikeSchema.optional().nullable(),
    questionSetJson: JsonLikeSchema.optional().nullable(),
    scoringJson: JsonLikeSchema.optional().nullable(),
    estimatedMin: z.number().int().min(1).max(240).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const AssignNeuroTestSchema = z.object({
  testId: z.string().min(1, "Test ID is required"),
  studentId: z.string().min(1, "Student ID is required"),
  classId: z.string().min(1).optional().nullable(),
  visibleToStudent: z.boolean().optional(),
  dueAt: z
    .string()
    .datetime({ offset: true, message: "dueAt must be an ISO datetime with timezone" })
    .optional()
    .nullable(),
  notes: z.string().max(4000, "Notes are too long").optional().nullable(),
});

export const AssignNeuroTestByCriteriaSchema = z
  .object({
    testId: z.string().min(1, "Test ID is required"),
    classId: z.string().min(1).optional().nullable(),
    minAge: z.number().int().min(3).max(30).optional().nullable(),
    maxAge: z.number().int().min(3).max(30).optional().nullable(),
    lowEngagementOnly: z.boolean().optional().default(false),
    engagementThreshold: z.number().int().min(0).max(100).optional().nullable(),
    maxStudents: z.number().int().min(1).max(500).optional().nullable(),
    visibleToStudent: z.boolean().optional(),
    dueAt: z
      .string()
      .datetime({ offset: true, message: "dueAt must be an ISO datetime with timezone" })
      .optional()
      .nullable(),
    notes: z.string().max(4000, "Notes are too long").optional().nullable(),
  })
  .refine(
    (value) => {
      if (value.minAge !== undefined && value.maxAge !== undefined && value.minAge !== null && value.maxAge !== null) {
        return value.minAge <= value.maxAge;
      }

      return true;
    },
    {
      message: "minAge must be less than or equal to maxAge",
      path: ["minAge"],
    },
  );

export const UpdateNeuroAssignmentSchema = z
  .object({
    visibleToStudent: z.boolean().optional(),
    status: z.enum(["ASSIGNED", "CANCELLED"]).optional(),
    dueAt: z
      .string()
      .datetime({ offset: true, message: "dueAt must be an ISO datetime with timezone" })
      .optional()
      .nullable(),
    notes: z.string().max(4000).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one assignment field must be provided",
  });

export const SubmitNeuroAttemptSchema = z.object({
  answersJson: JsonLikeSchema.optional().nullable(),
  score: z.number().min(0).max(100).optional().nullable(),
  analysisJson: JsonLikeSchema.optional().nullable(),
  inferredCondition: NeuroConditionCodeSchema.optional().nullable(),
  confidence: z.number().min(0).max(1).optional().nullable(),
  durationSec: z.number().int().min(0).max(86400).optional().nullable(),
});

export const ReviewNeuroAttemptSchema = z.object({
  reviewerNotes: z.string().max(4000).optional().nullable(),
  overrideCondition: NeuroConditionCodeSchema.optional().nullable(),
  confidence: z.number().min(0).max(1).optional().nullable(),
});

export const ManualSetStudentConditionSchema = z.object({
  condition: NeuroConditionCodeSchema,
  confidence: z.number().min(0).max(1).optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
  sourceType: z.string().min(1).max(80).optional(),
});

export type NeuroConditionCodeInput = z.infer<typeof NeuroConditionCodeSchema>;
export type NeuroTestLifecycleInput = z.infer<typeof NeuroTestLifecycleSchema>;
export type NeuroAssignmentStatusInput = z.infer<typeof NeuroAssignmentStatusSchema>;
export type CreateNeuroTestInput = z.infer<typeof CreateNeuroTestSchema>;
export type UpdateNeuroTestInput = z.infer<typeof UpdateNeuroTestSchema>;
export type AssignNeuroTestInput = z.infer<typeof AssignNeuroTestSchema>;
export type AssignNeuroTestByCriteriaInput = z.infer<typeof AssignNeuroTestByCriteriaSchema>;
export type UpdateNeuroAssignmentInput = z.infer<typeof UpdateNeuroAssignmentSchema>;
export type SubmitNeuroAttemptInput = z.infer<typeof SubmitNeuroAttemptSchema>;
export type ReviewNeuroAttemptInput = z.infer<typeof ReviewNeuroAttemptSchema>;
export type ManualSetStudentConditionInput = z.infer<typeof ManualSetStudentConditionSchema>;
