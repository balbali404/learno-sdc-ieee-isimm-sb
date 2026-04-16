import { apiRequest } from "@/lib/api/http";
import type { SessionHistoryResponse } from "@/lib/api/types";

export interface AdminDashboardResponse {
  greeting: {
    adminName: string;
    dateLabel: string;
    schoolName: string;
    alertsCount: number;
  };
  summary: {
    totalStudents: number;
    activeClasses: number;
    alertsToday: number;
    teachersActive: number;
    liveSessions?: number;
    totalStudentsTrend: number;
    activeClassesTrend: number;
    alertsTrend: number;
    teachersTrend: number;
    avgEngagement: number;
    avgAttention: number;
    avgLiveCo2?: number;
    avgLiveLight?: number;
    avgLiveNoise?: number;
    avgAllCo2?: number | null;
    avgAllLight?: number | null;
  };
  analytics: {
    engagementTrend: Array<{
      day: string;
      engagement: number;
      attention: number;
      attendance: number;
    }>;
    environmentTrend: Array<{
      time: string;
      noise: number;
      co2: number;
      light: number;
    }>;
    environmentSnapshot?: {
      noise: number;
      co2: number;
      light: number;
      updatedAt: string;
    };
    environmentAverage?: {
      noise: number;
      co2: number;
      light: number;
      updatedAt: string;
    };
    liveSessionEnvironment?: Array<{
      sessionId: string;
      classId?: string | null;
      className: string;
      teacherId: string;
      teacherName: string;
      status: string;
      startedAt: string;
      co2: number;
      light: number;
      noise: number;
      updatedAt?: string | null;
    }>;
    attentionByClass: Array<{
      class: string;
      score: number;
    }>;
  };
  teachers: Array<{
    id: string;
    name: string;
    subject: string;
    classes: number;
    students: number;
    rating: number;
    status: "active" | "away" | "inactive";
    email: string;
    phone: string | null;
    avatar: string;
    avatarBg: string;
    avatarColor: string;
    experience: string;
    lastActivity: string;
  }>;
  alerts: Array<{
    id: string;
    title: string;
    desc: string;
    type: string;
    room: string;
    time: string;
    priority: "high" | "medium" | "low";
    status: "open" | "resolved";
    metric?: "co2" | "light" | "noise";
    value?: number;
    unit?: string;
    className?: string;
    sessionId?: string;
  }>;
  support: {
    needsAttention: Array<{
      name: string;
      class: string;
      flag: string;
      avatar: string;
      avatarBg: string;
      avatarColor: string;
    }>;
    behavioralPatterns: Array<{
      label: string;
      value: string;
      icon: string;
    }>;
    interventions: Array<{
      student: string;
      type: string;
      status: "active" | "pending" | "done";
      date: string;
    }>;
  };
}

export interface AdminStudentsResponse {
  stats: {
    total: number;
    active: number;
    atRisk: number;
    flagged: number;
  };
  students: Array<{
    id: string;
    name: string;
    email: string;
    className: string;
    classId?: string | null;
    grade: string;
    status: "active" | "risk" | "flagged";
    engagement: number;
    attendance: number;
    flag: string | null;
    avatar: string;
    avatarBg: string;
    avatarColor: string;
    age?: number | null;
    enrollmentStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
    seatNumber?: number | null;
    profile?: {
      phone: string | null;
      avatarUrl: string | null;
      bio: string | null;
    };
    createdAt?: string;
  }>;
}

export interface AdminTeachersResponse {
  stats: {
    totalTeachers: number;
    classesToday: number;
    avgRating: number;
    newThisMonth: number;
  };
  teachers: Array<{
    id: string;
    name: string;
    subject: string;
    classes: number;
    students: number;
    rating: number;
    status: "active" | "away" | "inactive";
    email: string;
    phone: string | null;
    avatar: string;
    avatarBg: string;
    avatarColor: string;
    experience: string;
    lastActivity: string;
    schoolId?: string | null;
    profile?: {
      phone: string | null;
      avatarUrl: string | null;
      bio: string | null;
    };
    createdAt?: string;
  }>;
}

export interface AdminStudentDetail {
  id: string;
  fullName: string;
  email: string;
  age: number | null;
  dateOfBirth?: string | null;
  createdAt: string;
  profile: {
    phone: string | null;
    avatarUrl: string | null;
    bio: string | null;
  };
  enrollment: {
    status: "PENDING" | "APPROVED" | "REJECTED" | null;
    seatNumber: number | null;
    class: { id: string; name: string } | null;
  };
  learning: {
    averageProgress: number;
    totalXp: number;
    completedLessons: number;
    trackedLessons: number;
  };
}

export interface AdminTeacherDetail {
  id: string;
  fullName: string;
  email: string;
  schoolId?: string | null;
  createdAt: string;
  profile: {
    phone: string | null;
    avatarUrl: string | null;
    bio: string | null;
  };
  summary: {
    classesCount: number;
    timetableEntriesCount: number;
    sessionsCount: number;
  };
  timetable: Array<{
    id: string;
    day: string;
    startTime: string;
    endTime: string;
    class: {
      id: string;
      name: string;
      studentsCount: number;
    };
    subject: {
      id: string;
      name: string;
    };
  }>;
  recentSessions: Array<{
    id: string;
    status: string;
    createdAt: string;
  }>;
}

export interface AdminAnalyticsResponse {
  kpis: {
    avgEngagement: number;
    avgAttendance: number;
    avgAttention: number;
    interventions: number;
  };
  weeklyData: Array<{
    day: string;
    engagement: number;
    attendance: number;
    attention: number;
  }>;
  monthlyAttendance: Array<{
    month: string;
    rate: number;
  }>;
  subjectEngagement: Array<{
    subject: string;
    score: number;
  }>;
  riskDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export interface AdminAlertsResponse {
  stats: {
    totalAlerts: number;
    open: number;
    resolved: number;
    avgResponseMin: number;
  };
  alerts: Array<{
    id: string;
    title: string;
    desc: string;
    type: string;
    room: string;
    time: string;
    priority: "high" | "medium" | "low";
    status: "open" | "resolved";
  }>;
}

export interface AdminReportsResponse {
  stats: {
    reportsGenerated: number;
    scheduledReports: number;
    totalDownloads: number;
    lastExportLabel: string;
  };
  availableReports: Array<{
    id: string;
    title: string;
    desc: string;
    lastGenerated: string;
    size: string;
    type: "PDF" | "CSV" | "XLSX";
  }>;
  scheduledReports: Array<{
    title: string;
    schedule: string;
    nextRun: string;
    status: "active" | "paused";
  }>;
}

export interface AdminSessionDetail {
  id: string;
  status: string;
  startType: string;
  createdAt: string;
  actualStart?: string | null;
  actualEnd?: string | null;
  durationMinutes?: number | null;
  engagementScore?: number | null;
  engagementBand?: string | null;
  teacherRatio?: number | null;
  studentRatio?: number | null;
  lessonPdfPath?: string | null;
  advicePdfPath?: string | null;
  sessionJsonPath?: string | null;
  visionJsonPath?: null;
  visionAnnotatedVideoPath?: string | null;
  visionSmartOption?: string | null;
  classEngagementAvg?: number | null;
  classEngagementMin?: number | null;
  classEngagementMax?: number | null;
  classStudentCount?: number | null;
  lowEngagementCount?: number | null;
  totalFramesAnalyzed?: number | null;
  visionSummary?: Record<string, unknown> | null;
  visionRaw?: Record<string, unknown> | null;
  visionStudents?: Array<{
    id: string;
    seatNumber?: number | null;
    detectedStudentId?: string | null;
    studentId?: string | null;
    studentName?: string | null;
    seatNumberFromStudent?: number | null;
    meanCaes?: number | null;
    minCaes?: number | null;
    maxCaes?: number | null;
    framesAnalyzed?: number | null;
    trend?: string | null;
    lowEngagement?: boolean;
    payload?: Record<string, unknown> | null;
  }>;
  transcriptText?: string | null;
  errorMessage?: string | null;
  class?: { id: string; name: string; schoolId?: string } | null;
  subject?: { id: string; name: string } | null;
  teacher: { id: string; fullName: string; email: string; schoolId?: string | null };
  timetable?: {
    id: string;
    day: string;
    startTime: string;
    endTime: string;
  } | null;
alerts?: Array<{
    id: string;
    type: string;
    title?: string | null;
    message?: string | null;
    severity: string;
    resolved: boolean;
    createdAt: string;
  }>;
  environment?: {
    avgCo2: number;
    avgTemperature: number;
    avgHumidity: number;
    avgLight: number;
    readingsCount: number;
    readings: Array<{
      co2: number | null;
      temperature: number | null;
      humidity: number | null;
      light: number | null;
      receivedAt: string;
    }>;
  } | null;
}

export interface AdminSessionAnalysis {
  sessionId: string;
  engagementScore?: number | null;
  engagementBand?: string | null;
  summary?: string | null;
  stressScore?: number | null;
  stressBand?: string | null;
  stressSummary?: string | null;
  alerts?: Array<{
    type: string;
    severity: "INFO" | "WARNING" | "CRITICAL" | string;
    message: string;
  }>;
}

export interface AdminStartSessionInput {
  teacherId: string;
  timetableId?: string;
  classId?: string;
  subjectId?: string;
  courseName?: string;
  roomId?: string;
  scheduledDurationMinutes?: number;
  autoStart?: boolean;
  visionSmartOption?: "off" | "summary" | "enhanced";
}

export interface AdminStopSessionInput {
  sessionId: string;
  reason?: string;
}

export interface AdminStartStopSessionResponse {
  success: boolean;
  fastApiForwarded: boolean;
  warning?: string | null;
  session: {
    id: string;
    status: string;
    startType?: string;
    actualStart?: string | null;
    actualEnd?: string | null;
    durationMinutes?: number | null;
  };
}

export const adminApi = {
  getDashboard(query?: { schoolId?: string }) {
    return apiRequest<AdminDashboardResponse>("/admin/dashboard", { query });
  },

  getStudents(query?: { schoolId?: string }) {
    return apiRequest<AdminStudentsResponse>("/admin/students", { query });
  },

  getStudentDetail(studentId: string) {
    return apiRequest<AdminStudentDetail>(`/admin/students/${studentId}`);
  },

  getTeachers(query?: { schoolId?: string }) {
    return apiRequest<AdminTeachersResponse>("/admin/teachers", { query });
  },

  getTeacherDetail(teacherId: string) {
    return apiRequest<AdminTeacherDetail>(`/admin/teachers/${teacherId}`);
  },

  getAnalytics(query?: { schoolId?: string }) {
    return apiRequest<AdminAnalyticsResponse>("/admin/analytics", { query });
  },

  getAlerts(query?: { schoolId?: string }) {
    return apiRequest<AdminAlertsResponse>("/admin/alerts", { query });
  },

  resolveAlert(alertId: string) {
    return apiRequest<{ success: boolean }>(`/admin/alerts/${alertId}/resolve`, {
      method: "PATCH",
    });
  },

  getReports(query?: { schoolId?: string }) {
    return apiRequest<AdminReportsResponse>("/admin/reports", { query });
  },

  getSessions(query?: { schoolId?: string; teacherId?: string; status?: string; limit?: number }) {
    return apiRequest<SessionHistoryResponse>("/admin/sessions", { query });
  },

  getSessionDetail(sessionId: string) {
    return apiRequest<AdminSessionDetail>(`/admin/sessions/${sessionId}`);
  },

  startSession(input: AdminStartSessionInput) {
    return apiRequest<AdminStartStopSessionResponse>("/admin/sessions/start", {
      method: "POST",
      body: input,
    });
  },

  stopSession(input: AdminStopSessionInput) {
    return apiRequest<AdminStartStopSessionResponse>("/admin/sessions/stop", {
      method: "POST",
      body: input,
    });
  },

  analyzeSession(sessionId: string) {
    return apiRequest<{ success: boolean; analysis: AdminSessionAnalysis; warning?: string | null }>(
      `/admin/sessions/${sessionId}/analyze`,
      {
        method: "POST",
      },
    );
  },

  getSessionLessonPdf(sessionId: string) {
    return apiRequest<Blob>(`/admin/sessions/${sessionId}/lesson-pdf`, {
      responseType: "blob",
    });
  },

  getSessionAdvicePdf(sessionId: string) {
    return apiRequest<Blob>(`/admin/sessions/${sessionId}/advice-pdf`, {
      responseType: "blob",
    });
  },
};
