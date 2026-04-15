import { z } from "zod";

// ── Guardian creates student schema ─────────────────
export const CreateGuardianStudentSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format")
    .optional(),
  age: z.number().int().min(3, "Age must be at least 3").max(120, "Age must be 120 or lower").optional(),
  schoolId: z.string().min(1, "School ID is required"),
  classId: z.string().min(1, "Class ID is required"),
}).refine((value) => Boolean(value.dateOfBirth) || value.age !== undefined, {
  message: "Provide either dateOfBirth or age",
});

export const UpdateGuardianStudentSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(120, "Full name is too long")
      .optional(),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format")
      .optional(),
    age: z
      .number()
      .int()
      .min(3, "Age must be at least 3")
      .max(120, "Age must be 120 or lower")
      .optional(),
  })
  .refine(
    (value) =>
      value.fullName !== undefined ||
      value.dateOfBirth !== undefined ||
      value.age !== undefined,
    {
      message: "Provide at least one field to update",
    },
  );

// ── Guardian neuro test assignment schemas ───────────
export const AssignGuardianNeuroTestSchema = z.object({
  testId: z.string().min(1, "Test ID is required"),
  studentId: z.string().min(1, "Student ID is required"),
  visibleToStudent: z.boolean().optional(),
  dueAt: z
    .string()
    .datetime({ offset: true, message: "dueAt must be an ISO datetime with timezone" })
    .optional()
    .nullable(),
  notes: z.string().max(4000, "Notes are too long").optional().nullable(),
});

export const GuardianNeuroAssignmentStatusSchema = z.enum([
  "ASSIGNED",
  "IN_PROGRESS",
  "SUBMITTED",
  "REVIEWED",
  "CANCELLED",
]);

export type CreateGuardianStudentInput = z.infer<typeof CreateGuardianStudentSchema>;
export type UpdateGuardianStudentInput = z.infer<typeof UpdateGuardianStudentSchema>;
export type AssignGuardianNeuroTestInput = z.infer<typeof AssignGuardianNeuroTestSchema>;
export type GuardianNeuroAssignmentStatusInput = z.infer<typeof GuardianNeuroAssignmentStatusSchema>;
