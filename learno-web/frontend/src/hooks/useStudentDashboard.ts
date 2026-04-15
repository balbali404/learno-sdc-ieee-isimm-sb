'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, studentApi } from '@/lib/api';
import type {
  NeuroAssignmentItem,
  StudentLessonProgress,
  StudentXP,
} from '@/lib/api/types';
import { useStoredAuth } from '@/hooks/useStoredAuth';

export interface BrainChallengeInput {
  challengeKey: string;
  subject?: string;
  isCorrect: boolean;
  xpEarned: number;
  durationSec?: number;
  engagementScore?: number;
  concentrationScore?: number;
  source?: "BRAIN_CHALLENGE" | "FOCUS_MODE" | "QUIZ";
}

interface StudentDashboardState {
  xp: StudentXP;
  recentProgress: StudentLessonProgress[];
  availableLessonsCount: number;
  neuroAssignments: {
    hasPending: boolean;
    pendingCount: number;
    inProgressCount: number;
    nextDueAt: string | null;
    pending: NeuroAssignmentItem[];
    recent: NeuroAssignmentItem[];
  };
  quizzesSummary: {
    attempts: number;
    completedAttempts: number;
    avgScore: number;
    bestScore: number;
    passRate: number;
    engagement: number;
    concentration: number;
  };
  engagementOverview: {
    averageEngagement: number;
    averageConcentration: number;
    focusConsistency: number;
    chaptersCompleted: number;
    studyMinutes: number;
  };
  recentQuizResults: Array<{
    id: string;
    title: string;
    subject: string;
    score: number;
    isCompleted: boolean;
    attempts: number;
    updatedAt: string;
    rank: number;
  }>;
  newAchievements: Array<{
    id: string;
    achievementId: string;
    isNew: boolean;
    achievement: {
      id?: string;
      name: string;
      description: string;
      icon?: string | null;
      xpReward?: number;
      category?: string;
    };
  }>;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon?: string | null;
    xpReward: number;
    category: string;
    unlocked: boolean;
    unlockedAt?: string | null;
    isNew?: boolean;
  }>;
  allProgress: StudentLessonProgress[];
  isLoading: boolean;
  error: string | null;
}

const DEFAULT_XP: StudentXP = {
  totalXP: 0,
  currentLevel: 1,
  xpToNextLevel: 120,
  currentStreak: 0,
  longestStreak: 0,
  dailyXPEarned: 0,
  dailyLessonsDone: 0,
  lastActivityDate: null,
};

const initialState: StudentDashboardState = {
  xp: DEFAULT_XP,
  recentProgress: [],
  availableLessonsCount: 0,
  neuroAssignments: {
    hasPending: false,
    pendingCount: 0,
    inProgressCount: 0,
    nextDueAt: null,
    pending: [],
    recent: [],
  },
  quizzesSummary: {
    attempts: 0,
    completedAttempts: 0,
    avgScore: 0,
    bestScore: 0,
    passRate: 0,
    engagement: 0,
    concentration: 0,
  },
  engagementOverview: {
    averageEngagement: 0,
    averageConcentration: 0,
    focusConsistency: 0,
    chaptersCompleted: 0,
    studyMinutes: 0,
  },
  recentQuizResults: [],
  newAchievements: [],
  achievements: [],
  allProgress: [],
  isLoading: true,
  error: null,
};

const normalizeXP = (xp: StudentXP): StudentXP => {
  const totalXP = Math.max(0, Math.round(xp.totalXP ?? 0));
  const currentLevel = Math.max(1, Math.round(xp.currentLevel ?? xp.level ?? 1));
  const xpToNextLevel = Math.max(0, Math.round(xp.xpToNextLevel ?? 120));

  return {
    ...xp,
    totalXP,
    currentLevel,
    level: currentLevel,
    xpToNextLevel,
    currentStreak: Math.max(0, Math.round(xp.currentStreak ?? 0)),
    longestStreak: Math.max(0, Math.round(xp.longestStreak ?? 0)),
    dailyXPEarned: Math.max(0, Math.round(xp.dailyXPEarned ?? 0)),
    dailyLessonsDone: Math.max(0, Math.round(xp.dailyLessonsDone ?? 0)),
    lastActivityDate: xp.lastActivityDate ?? null,
  };
};

export function useStudentDashboard() {
  const { token } = useStoredAuth();
  const [state, setState] = useState<StudentDashboardState>(initialState);

  const refresh = useCallback(async () => {
    if (!token) {
      setState({ ...initialState, isLoading: false, error: null });
      return;
    }

    setState((current) => ({ ...current, isLoading: true, error: null }));

    try {
      const [dashboardResult, quizStatsResult, achievementsResult, progressResult, engagementResult] =
        await Promise.allSettled([
          studentApi.getDashboard(),
          studentApi.getQuizStats(),
          studentApi.getAchievements(),
          studentApi.getProgress(),
          studentApi.getEngagement(30),
        ]);

      const results = [
        dashboardResult,
        quizStatsResult,
        achievementsResult,
        progressResult,
        engagementResult,
      ] as const;

      const hasAnySuccess = results.some((result) => result.status === 'fulfilled');

      if (!hasAnySuccess) {
        const firstFailed = results.find(
          (result): result is PromiseRejectedResult => result.status === 'rejected',
        );

        throw firstFailed?.reason ?? new Error('Failed to load student dashboard data.');
      }

      setState((current) => ({
        ...current,
        xp:
          dashboardResult.status === 'fulfilled'
            ? normalizeXP(dashboardResult.value.xp)
            : current.xp,
        recentProgress:
          dashboardResult.status === 'fulfilled'
            ? dashboardResult.value.recentProgress ?? []
            : current.recentProgress,
        availableLessonsCount:
          dashboardResult.status === 'fulfilled'
            ? dashboardResult.value.availableLessonsCount ?? 0
            : current.availableLessonsCount,
        neuroAssignments:
          dashboardResult.status === 'fulfilled'
            ? {
                hasPending: dashboardResult.value.neuroAssignments?.hasPending ?? false,
                pendingCount: dashboardResult.value.neuroAssignments?.pendingCount ?? 0,
                inProgressCount: dashboardResult.value.neuroAssignments?.inProgressCount ?? 0,
                nextDueAt: dashboardResult.value.neuroAssignments?.nextDueAt ?? null,
                pending: dashboardResult.value.neuroAssignments?.pending ?? [],
                recent: dashboardResult.value.neuroAssignments?.recent ?? [],
              }
            : current.neuroAssignments,
        quizzesSummary:
          quizStatsResult.status === 'fulfilled'
            ? {
                attempts: quizStatsResult.value.summary.attempts ?? 0,
                completedAttempts: quizStatsResult.value.summary.completedAttempts ?? 0,
                avgScore: quizStatsResult.value.summary.avgScore ?? 0,
                bestScore: quizStatsResult.value.summary.bestScore ?? 0,
                passRate: quizStatsResult.value.summary.passRate ?? 0,
                engagement: quizStatsResult.value.summary.engagement ?? 0,
                concentration: quizStatsResult.value.summary.concentration ?? 0,
              }
            : current.quizzesSummary,
        engagementOverview:
          engagementResult.status === 'fulfilled'
            ? {
                averageEngagement: engagementResult.value.overview.averageEngagement ?? 0,
                averageConcentration:
                  engagementResult.value.overview.averageConcentration ?? 0,
                focusConsistency: engagementResult.value.overview.focusConsistency ?? 0,
                chaptersCompleted: engagementResult.value.overview.chaptersCompleted ?? 0,
                studyMinutes: engagementResult.value.overview.studyMinutes ?? 0,
              }
            : current.engagementOverview,
        recentQuizResults:
          quizStatsResult.status === 'fulfilled'
            ? quizStatsResult.value.recentResults ?? []
            : current.recentQuizResults,
        newAchievements:
          dashboardResult.status === 'fulfilled'
            ? dashboardResult.value.newAchievements ?? []
            : current.newAchievements,
        achievements:
          achievementsResult.status === 'fulfilled'
            ? achievementsResult.value ?? []
            : current.achievements,
        allProgress:
          progressResult.status === 'fulfilled'
            ? progressResult.value ?? []
            : current.allProgress,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      if (error instanceof ApiError) {
        setState((current) => ({
          ...current,
          isLoading: false,
          error: error.message,
        }));
      } else {
        setState((current) => ({
          ...current,
          isLoading: false,
          error: 'Failed to load student dashboard data.',
        }));
      }
    }
  }, [token]);

  useEffect(() => {
    refresh().catch(() => null);
  }, [refresh]);

  const completeBrainChallenge = useCallback(
    async (input: BrainChallengeInput) => {
      if (!token) {
        throw new ApiError('You need to sign in first.', 401);
      }

      const response = await studentApi.completeBrainChallenge(input);
      setState((current) => ({
        ...current,
        xp: normalizeXP({
          ...current.xp,
          totalXP: response.totalXP,
          currentLevel: response.currentLevel,
          xpToNextLevel: response.xpToNextLevel,
          currentStreak: response.currentStreak,
          dailyXPEarned: (current.xp.dailyXPEarned ?? 0) + response.xpEarned,
        }),
        engagementOverview: {
          ...current.engagementOverview,
          averageEngagement:
            response.averageEngagement ?? current.engagementOverview.averageEngagement,
          averageConcentration:
            response.averageConcentration ?? current.engagementOverview.averageConcentration,
        },
      }));

      return response;
    },
    [token],
  );

  const markAchievementSeen = useCallback(async (achievementId: string) => {
    await studentApi.markAchievementSeen(achievementId);
    setState((current) => ({
      ...current,
      achievements: current.achievements.map((achievement) =>
        achievement.id === achievementId
          ? { ...achievement, isNew: false }
          : achievement,
      ),
      newAchievements: current.newAchievements.filter(
        (achievement) => achievement.achievementId !== achievementId,
      ),
    }));
  }, []);

  const computed = useMemo(() => {
    const completedLessons = state.allProgress.filter((item) => item.isCompleted).length;
    const inProgressLessons = state.allProgress.filter(
      (item) => !item.isCompleted && item.progressPercent > 0,
    ).length;
    const averageProgress =
      state.allProgress.length > 0
        ? Math.round(
            state.allProgress.reduce(
              (sum, item) => sum + (item.progressPercent ?? 0),
              0,
            ) / state.allProgress.length,
          )
        : 0;

    const unlockedAchievements = state.achievements.filter(
      (item) => item.unlocked,
    ).length;

    return {
      completedLessons,
      inProgressLessons,
      averageProgress,
      unlockedAchievements,
    };
  }, [state.achievements, state.allProgress]);

  return {
    ...state,
    ...computed,
    refresh,
    completeBrainChallenge,
    markAchievementSeen,
  };
}
