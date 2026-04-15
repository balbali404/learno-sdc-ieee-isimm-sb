import { apiRequest } from "@/lib/api/http";
import type {
  LessonItem,
  NeuroAssignmentItem,
  Pagination,
  Role,
  StudentLessonProgress,
  StudentXP,
} from "@/lib/api/types";

export interface GetLessonsQuery extends Record<string, string | number | boolean | undefined | null> {
  status?: string;
  subjectId?: string;
  difficulty?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  page?: number;
  limit?: number;
}

export interface ApproveLessonInput {
  lessonId: string;
}

export interface RejectLessonInput {
  lessonId: string;
  reason: string;
}

export interface StartLessonInput {
  lessonId: string;
}

export interface CompleteChapterInput {
  chapterId: string;
  timeSpentMin: number;
}

export interface RateLessonInput {
  lessonId: string;
  rating: number;
}

export interface CompleteBrainChallengeInput {
  challengeKey: string;
  subject?: string;
  isCorrect: boolean;
  xpEarned: number;
  durationSec?: number;
  engagementScore?: number;
  concentrationScore?: number;
  source?: "BRAIN_CHALLENGE" | "FOCUS_MODE" | "QUIZ";
}

export interface StudentNotificationSettings {
  id: string;
  userId: string;
  urgentAlerts: boolean;
  environmentWarnings: boolean;
  sessionSummaries: boolean;
  weeklyReports: boolean;
  soundAlerts: boolean;
}

export interface StudentProfile {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  schoolId?: string | null;
  dateOfBirth?: string | null;
  createdAt?: string;
  age?: number | null;
  school?: { id: string; name: string } | null;
  profile?: {
    avatarUrl: string | null;
    phone?: string | null;
    bio?: string | null;
  } | null;
}

export interface UpdateStudentProfileInput {
  fullName?: string;
  dateOfBirth?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  bio?: string | null;
}

export interface UpdateStudentSettingsInput {
  urgentAlerts?: boolean;
  environmentWarnings?: boolean;
  sessionSummaries?: boolean;
  weeklyReports?: boolean;
  soundAlerts?: boolean;
}

export const studentApi = {
  getLessons(query?: GetLessonsQuery) {
    return apiRequest<{ lessons: LessonItem[]; pagination: Pagination }>("/student/lessons", {
      query,
    });
  },

  getDraftLessons() {
    return apiRequest<LessonItem[]>("/student/lessons/drafts");
  },

  getLessonDetail(lessonId: string) {
    return apiRequest<LessonItem>(`/student/lessons/${lessonId}`);
  },

  getLessonPdf(lessonId: string) {
    return apiRequest<Blob>(`/student/lessons/${lessonId}/pdf`, {
      responseType: "blob",
    });
  },

  approveLesson(input: ApproveLessonInput) {
    return apiRequest<{ success: boolean; message: string; lesson: LessonItem }>(
      "/student/lessons/approve",
      {
        method: "POST",
        body: input,
      },
    );
  },

  rejectLesson(input: RejectLessonInput) {
    return apiRequest<{ success: boolean; message: string; lesson: LessonItem }>(
      "/student/lessons/reject",
      {
        method: "POST",
        body: input,
      },
    );
  },

  getDashboard() {
    return apiRequest<{
      xp: StudentXP;
      recentProgress: StudentLessonProgress[];
      newAchievements: Array<{
        id: string;
        achievementId: string;
        isNew: boolean;
        achievement: {
          name: string;
          description: string;
        };
      }>;
      availableLessonsCount: number;
      neuro?: {
        condition: string;
        rawCondition: string;
        confidence: number | null;
        updatedAt: string | null;
      };
      neuroAssignments?: {
        hasPending: boolean;
        pendingCount: number;
        inProgressCount: number;
        nextDueAt: string | null;
        pending: NeuroAssignmentItem[];
        recent: NeuroAssignmentItem[];
      };
    }>("/student/dashboard");
  },

  getXP() {
    return apiRequest<StudentXP>("/student/xp");
  },

  getProgress() {
    return apiRequest<StudentLessonProgress[]>("/student/progress");
  },

  getQuizStats() {
    return apiRequest<{
      summary: {
        attempts: number;
        completedAttempts: number;
        avgScore: number;
        bestScore: number;
        passRate: number;
        engagement: number;
        concentration?: number;
      };
      recentResults: Array<{
        id: string;
        title: string;
        subject: string;
        score: number;
        isCompleted: boolean;
        attempts: number;
        updatedAt: string;
        rank: number;
      }>;
    }>("/student/quiz-stats");
  },

  startLesson(input: StartLessonInput) {
    return apiRequest<{
      success: boolean;
      progress: StudentLessonProgress;
      chapters: Array<{ id: string; chapterNumber: number; title: string; xpReward: number }>;
    }>("/student/lessons/start", {
      method: "POST",
      body: input,
    });
  },

  completeChapter(input: CompleteChapterInput) {
    return apiRequest<{
      success: boolean;
      xpEarned: number;
      totalXP: number;
      progressPercent: number;
      lessonCompleted: boolean;
      engagementScore?: number;
      concentrationScore?: number;
      newAchievements: Array<{ id: string; name: string; xpReward: number }>;
    }>("/student/chapters/complete", {
      method: "POST",
      body: input,
    });
  },

  getEngagement(windowDays?: number) {
    return apiRequest<{
      overview: {
        averageEngagement: number;
        averageConcentration: number;
        focusConsistency: number;
        chaptersCompleted: number;
        studyMinutes: number;
      };
      dailyTrend: Array<{
        date: string;
        engagement: number;
        concentration: number;
        chaptersCompleted: number;
        studyMinutes: number;
      }>;
      lessons: Array<{
        lessonId: string;
        lessonTitle: string;
        subject: string;
        engagement: number;
        concentration: number;
        chaptersCompleted: number;
        studyMinutes: number;
        xpEarned: number;
      }>;
    }>("/student/engagement", {
      query: {
        windowDays,
      },
    });
  },

  completeBrainChallenge(input: CompleteBrainChallengeInput) {
    return apiRequest<{
      success: boolean;
      xpEarned: number;
      totalXP: number;
      currentLevel: number;
      xpToNextLevel: number;
      currentStreak: number;
      engagementScore?: number;
      concentrationScore?: number;
      averageEngagement?: number;
      averageConcentration?: number;
      challengeProgressId?: string;
      newAchievements: Array<{ id: string; name: string; xpReward: number }>;
    }>("/student/brain-challenge/complete", {
      method: "POST",
      body: input,
    });
  },

  getProfile() {
    return apiRequest<StudentProfile>("/student/profile");
  },

  updateProfile(input: UpdateStudentProfileInput) {
    return apiRequest<{ message: string; user: StudentProfile }>("/auth/profile", {
      method: "PUT",
      body: input,
    });
  },

  getSettings() {
    return apiRequest<StudentNotificationSettings>("/student/settings");
  },

  updateSettings(input: UpdateStudentSettingsInput) {
    return apiRequest<StudentNotificationSettings>("/student/settings", {
      method: "PATCH",
      body: input,
    });
  },

  rateLesson(input: RateLessonInput) {
    return apiRequest<{ success: boolean; message: string }>("/student/lessons/rate", {
      method: "POST",
      body: input,
    });
  },

  getAchievements() {
    return apiRequest<
      Array<{
        id: string;
        name: string;
        description: string;
        icon?: string | null;
        xpReward: number;
        category: string;
        unlocked: boolean;
        unlockedAt?: string | null;
        isNew?: boolean;
      }>
    >("/student/achievements");
  },

  getUnlockedAchievements() {
    return apiRequest<
      Array<{
        id: string;
        studentId: string;
        achievementId: string;
        unlockedAt: string;
        xpAwarded: number;
        isNew: boolean;
        achievement: {
          id: string;
          name: string;
          description: string;
          icon?: string | null;
          xpReward: number;
        };
      }>
    >("/student/achievements/unlocked");
  },

  markAchievementSeen(achievementId: string) {
    return apiRequest<{ success: boolean }>(`/student/achievements/${achievementId}/seen`, {
      method: "PATCH",
    });
  },
};
