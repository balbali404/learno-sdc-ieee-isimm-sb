import { apiRequest } from "@/lib/api/http";
import type {
  ClassEnvironmentReading,
  NotificationItem,
  TeacherClassSummary,
  TeacherDashboard,
  TeacherProfile,
  TeacherSettings,
  TeacherStudentEnrollment,
  TimetableEntry,
  LearnoSession,
} from "@/lib/api/types";

export interface CreateTeacherStudentInput {
  fullName: string;
  email: string;
  dateOfBirth: string;
  classId: string;
}

export interface UpdateTeacherProfileInput {
  fullName?: string;
  avatarUrl?: string | null;
  phone?: string | null;
  bio?: string | null;
}

export const teacherApi = {
  getDashboard() {
    return apiRequest<TeacherDashboard>("/teacher/dashboard");
  },

  getClasses() {
    return apiRequest<TeacherClassSummary[]>("/teacher/classes");
  },

  getClassStudents(classId: string) {
    return apiRequest<TeacherStudentEnrollment[]>(`/teacher/classes/${classId}/students`);
  },

  getClassEnvironmentLatest(classId: string) {
    return apiRequest<{ reading: ClassEnvironmentReading | null }>(
      `/teacher/classes/${classId}/environment/latest`,
    );
  },

  getStudents() {
    return apiRequest<TeacherStudentEnrollment[]>("/teacher/students");
  },

  getTimetable() {
    return apiRequest<TimetableEntry[]>("/teacher/timetable");
  },

  getLessonHistory() {
    return apiRequest<LearnoSession[]>("/learno/sessions");
  },

  getNotifications() {
    return apiRequest<NotificationItem[]>("/teacher/notifications");
  },

  readNotification(notificationId: string) {
    return apiRequest<NotificationItem>(`/teacher/notifications/${notificationId}/read`, {
      method: "PATCH",
    });
  },

  getSettings() {
    return apiRequest<TeacherSettings>("/teacher/settings");
  },

  updateSettings(input: Partial<TeacherSettings>) {
    return apiRequest<TeacherSettings>("/teacher/settings", {
      method: "PATCH",
      body: input,
    });
  },

  getProfile() {
    return apiRequest<TeacherProfile>("/teacher/profile");
  },

  updateProfile(input: UpdateTeacherProfileInput) {
    return apiRequest<TeacherProfile>("/teacher/profile", {
      method: "PATCH",
      body: input,
    });
  },

  createStudent(input: CreateTeacherStudentInput) {
    return apiRequest<{
      message: string;
      student: {
        id: string;
        fullName: string;
        email: string;
        role: string;
        dateOfBirth: string;
        schoolId: string;
      };
      enrollment: {
        id: string;
        classId: string;
        status: string;
      };
      generatedPassword: string;
    }>("/teacher/students", {
      method: "POST",
      body: input,
    });
  },
};
