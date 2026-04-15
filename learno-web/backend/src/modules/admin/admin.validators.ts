import { z } from "zod";

export const AdminStartSessionSchema = z.object({
  teacherId: z.string().min(1, "Teacher ID is required"),
  timetableId: z.string().min(1).optional(),
  classId: z.string().min(1).optional(),
  subjectId: z.string().min(1).optional(),
  courseName: z.string().min(1).optional(),
  roomId: z.string().min(1).optional(),
  scheduledDurationMinutes: z.number().int().min(1).max(300).optional(),
  autoStart: z.boolean().optional(),
  visionSmartOption: z.enum(["off", "summary", "enhanced"]).optional(),
});

export const AdminStopSessionSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  reason: z.string().min(1).optional(),
});

export type AdminStartSessionInput = z.infer<typeof AdminStartSessionSchema>;
export type AdminStopSessionInput = z.infer<typeof AdminStopSessionSchema>;
