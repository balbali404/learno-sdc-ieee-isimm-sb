import { apiRequest } from "@/lib/api/http";
import type { LearnoSession, LessonItem, TimetableEntry } from "@/lib/api/types";

export interface StartSessionInput {
  timetableId: string;
  classId?: string;
  subjectId?: string;
  courseName?: string;
  roomId?: string;
  scheduledDurationMinutes?: number;
  autoStart?: boolean;
  forceStopPrevious?: boolean;
  gradeLevel?: number;
  studentAge?: number;
  visionSmartOption?: "off" | "summary" | "enhanced";
  now?: string;
}

export interface StopSessionInput {
  sessionId: string;
  reason?: string;
  force?: boolean;
}

export const learnoApi = {
  startSession(input: StartSessionInput) {
    return apiRequest<{
      success: boolean;
      fastApiForwarded?: boolean;
      warning?: string | null;
      session: {
        id: string;
        status: string;
        startType: string;
        actualStart: string;
      };
    }>("/learno/sessions/start", {
      method: "POST",
      body: input,
    });
  },

  stopSession(input: StopSessionInput) {
    return apiRequest<{ success: boolean; sessionId: string; status: string; force?: boolean }>(
      "/learno/sessions/stop",
      {
        method: "POST",
        body: input,
      },
    );
  },

  getSessions() {
    return apiRequest<LearnoSession[]>("/learno/sessions");
  },

  getSessionDetail(sessionId: string) {
    return apiRequest<LearnoSession & {
      transcriptText?: string | null;
      timetable?: TimetableEntry | null;
      recording?: unknown;
      lessonSummary?: {
        id: string;
        title?: string | null;
        summary?: string | null;
        fullContent?: string | null;
        wordCount?: number | null;
        estimatedReadMinutes?: number | null;
      } | null;
      teacherAdvice?: {
        id: string;
        overallScore?: number | null;
        overallFeedback?: string | null;
        recommendations?: string[];
      } | null;
      alerts?: Array<{
        id: string;
        alertType: string;
        message: string;
        severity: string;
        createdAt: string;
        data?: unknown;
      }>;
    }>(`/learno/sessions/${sessionId}`);
  },

  getSessionAlerts(sessionId: string) {
    return apiRequest<
      Array<{
        id: string;
        sessionId: string;
        alertType: string;
        message: string;
        severity: string;
        data?: unknown;
        createdAt: string;
      }>
    >(`/learno/sessions/${sessionId}/alerts`);
  },

  getLessons() {
    return apiRequest<LessonItem[]>("/learno/lessons");
  },

  approveLesson(lessonId: string) {
    return apiRequest<{ success: boolean; message: string; lesson: LessonItem }>(
      `/learno/lessons/${lessonId}/approve`,
      {
        method: "POST",
      },
    );
  },

  getLessonPdf(lessonId: string) {
    return apiRequest<Blob>(`/learno/lessons/${lessonId}/pdf`, {
      responseType: "blob",
    });
  },
};
