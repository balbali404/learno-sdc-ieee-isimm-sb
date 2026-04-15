import { z } from "zod";

// ── Auth schemas ────────────────────────────────────

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const RegisterGuardianSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

// ── Admin schemas ───────────────────────────────────

export const CreateSchoolSchema = z.object({
  schoolName: z.string().min(2, "School name must be at least 2 characters"),
  adminFullName: z.string().min(2, "Admin full name must be at least 2 characters"),
  adminEmail: z.string().email("Invalid email address"),
  adminPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export const UpdateSchoolSchema = z.object({
  name: z.string().min(2, "School name must be at least 2 characters"),
});

// ── User creation schemas ───────────────────────────

// For school admin creating teachers/co-admins (password auto-generated)
export const CreateUserSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

// For teacher creating student (password auto-generated)
export const CreateStudentSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  dateOfBirth: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  classId: z.string().min(1, "Class ID is required"),
});

export const EnrollmentActionSchema = z.object({
  enrollmentId: z.string().min(1, "Enrollment ID is required"),
  action: z.enum(["APPROVED", "REJECTED"]),
  seatNumber: z.number().int().min(1).optional(), // required when approving
});

// ── School management schemas ───────────────────────

export const CreateClassSchema = z.object({
  name: z.string().min(1, "Class name is required"),
});

export const CreateSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
});

export const CreateTimetableSchema = z.object({
  teacherId: z.string().min(1, "Teacher ID is required"),
  classId: z.string().min(1, "Class ID is required"),
  subjectId: z.string().min(1, "Subject ID is required"),
  day: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
});

// ── Messaging schemas ───────────────────────────────

export const StartConversationSchema = z.object({
  participantId: z.string().min(1, "Participant ID is required"),
});

export const SendMessageSchema = z.object({
  content: z.string().min(1, "Message content cannot be empty"),
});

// ── Settings schemas ────────────────────────────────
export const UpdateNotificationPrefsSchema = z.object({
  urgentAlerts: z.boolean().optional(),
  environmentWarnings: z.boolean().optional(),
  sessionSummaries: z.boolean().optional(),
  weeklyReports: z.boolean().optional(),
  soundAlerts: z.boolean().optional(),
});

// ── Profile schemas ─────────────────────────────────
export const UpdateProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
  dateOfBirth: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  avatarUrl: z.string().url("Invalid URL").optional().nullable(),
  phone: z.string().optional().nullable(),
  bio: z.string().max(500, "Bio must be at most 500 characters").optional().nullable(),
});

// ── Type exports ────────────────────────────────────

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterGuardianInput = z.infer<typeof RegisterGuardianSchema>;
export type CreateSchoolInput = z.infer<typeof CreateSchoolSchema>;
export type UpdateSchoolInput = z.infer<typeof UpdateSchoolSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type CreateStudentInput = z.infer<typeof CreateStudentSchema>;
export type EnrollmentActionInput = z.infer<typeof EnrollmentActionSchema>;
export type CreateClassInput = z.infer<typeof CreateClassSchema>;
export type CreateSubjectInput = z.infer<typeof CreateSubjectSchema>;
export type CreateTimetableInput = z.infer<typeof CreateTimetableSchema>;

export type StartConversationInput = z.infer<typeof StartConversationSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type UpdateNotificationPrefsInput = z.infer<typeof UpdateNotificationPrefsSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
