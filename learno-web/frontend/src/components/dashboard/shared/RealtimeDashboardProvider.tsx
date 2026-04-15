'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  adminApi,
  authApi,
  guardianApi,
  messagesApi,
  studentApi,
  teacherApi,
} from '@/lib/api';
import type { Role } from '@/lib/api/types';
import { useStoredAuth } from '@/hooks/useStoredAuth';
import { connectLearnoSocket } from '@/lib/realtime/socket';
import { sanitizeCount } from '@/lib/dashboard/format';

interface TeacherRealtimeStats {
  unreadMessages: number;
  unreadNotifications: number;
  alertsCount: number;
  studentCount: number;
  pendingApprovals: number;
}

interface AdminRealtimeStats {
  alertsCount: number;
  openAlerts: number;
  liveSessions: number;
  activeClasses: number;
  studentCount: number;
  activeStudents: number;
  atRiskStudents: number;
  flaggedStudents: number;
  teacherCount: number;
  activeTeachers: number;
}

interface GuardianRealtimeStats {
  unreadMessages: number;
  unreadNotifications: number;
  alertsCount: number;
  childCount: number;
  pendingEnrollments: number;
}

interface StudentRealtimeStats {
  unreadMessages: number;
  lessonCount: number;
  inProgressLessons: number;
  completedLessons: number;
  quizzesCount: number;
  achievementsCount: number;
  streakDays: number;
}

interface RealtimeDashboardContextValue {
  teacherStats: TeacherRealtimeStats;
  adminStats: AdminRealtimeStats;
  guardianStats: GuardianRealtimeStats;
  studentStats: StudentRealtimeStats;
  refreshTeacherStats: () => Promise<void>;
  refreshAdminStats: () => Promise<void>;
  refreshGuardianStats: () => Promise<void>;
  refreshStudentStats: () => Promise<void>;
  setTeacherStats: (patch: Partial<TeacherRealtimeStats>) => void;
  setAdminStats: (patch: Partial<AdminRealtimeStats>) => void;
  setGuardianStats: (patch: Partial<GuardianRealtimeStats>) => void;
  setStudentStats: (patch: Partial<StudentRealtimeStats>) => void;
}

const DEFAULT_TEACHER_STATS: TeacherRealtimeStats = {
  unreadMessages: 0,
  unreadNotifications: 0,
  alertsCount: 0,
  studentCount: 0,
  pendingApprovals: 0,
};

const DEFAULT_ADMIN_STATS: AdminRealtimeStats = {
  alertsCount: 0,
  openAlerts: 0,
  liveSessions: 0,
  activeClasses: 0,
  studentCount: 0,
  activeStudents: 0,
  atRiskStudents: 0,
  flaggedStudents: 0,
  teacherCount: 0,
  activeTeachers: 0,
};

const DEFAULT_GUARDIAN_STATS: GuardianRealtimeStats = {
  unreadMessages: 0,
  unreadNotifications: 0,
  alertsCount: 0,
  childCount: 0,
  pendingEnrollments: 0,
};

const DEFAULT_STUDENT_STATS: StudentRealtimeStats = {
  unreadMessages: 0,
  lessonCount: 0,
  inProgressLessons: 0,
  completedLessons: 0,
  quizzesCount: 0,
  achievementsCount: 0,
  streakDays: 0,
};

const REFRESH_INTERVAL_MS = 30_000;
const SOCKET_REFRESH_DEBOUNCE_MS = 400;

const RealtimeDashboardContext =
  createContext<RealtimeDashboardContextValue | null>(null);

const sanitizePatch = <T extends object>(patch: Partial<T>): Partial<T> => {
  const next = {} as Partial<T>;

  (Object.keys(patch) as Array<keyof T>).forEach((key) => {
    next[key] = sanitizeCount(
      patch[key] as number | null | undefined,
    ) as T[keyof T];
  });

  return next;
};

export function RealtimeDashboardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, user } = useStoredAuth();

  const [teacherStats, setTeacherStatsState] =
    useState<TeacherRealtimeStats>(DEFAULT_TEACHER_STATS);
  const [adminStats, setAdminStatsState] =
    useState<AdminRealtimeStats>(DEFAULT_ADMIN_STATS);
  const [guardianStats, setGuardianStatsState] =
    useState<GuardianRealtimeStats>(DEFAULT_GUARDIAN_STATS);
  const [studentStats, setStudentStatsState] =
    useState<StudentRealtimeStats>(DEFAULT_STUDENT_STATS);

  const socketRefreshTimeoutRef = useRef<number | null>(null);

  const setTeacherStats = useCallback((patch: Partial<TeacherRealtimeStats>) => {
    setTeacherStatsState((prev) => ({
      ...prev,
      ...sanitizePatch<TeacherRealtimeStats>(patch),
    }));
  }, []);

  const setAdminStats = useCallback((patch: Partial<AdminRealtimeStats>) => {
    setAdminStatsState((prev) => ({
      ...prev,
      ...sanitizePatch<AdminRealtimeStats>(patch),
    }));
  }, []);

  const setGuardianStats = useCallback((patch: Partial<GuardianRealtimeStats>) => {
    setGuardianStatsState((prev) => ({
      ...prev,
      ...sanitizePatch<GuardianRealtimeStats>(patch),
    }));
  }, []);

  const setStudentStats = useCallback((patch: Partial<StudentRealtimeStats>) => {
    setStudentStatsState((prev) => ({
      ...prev,
      ...sanitizePatch<StudentRealtimeStats>(patch),
    }));
  }, []);

  const refreshTeacherStats = useCallback(async () => {
    const [dashboardResult, notificationsResult, studentsResult, draftsResult] =
      await Promise.allSettled([
        teacherApi.getDashboard(),
        teacherApi.getNotifications(),
        teacherApi.getStudents(),
        studentApi.getDraftLessons(),
      ]);

    const nextStats: TeacherRealtimeStats = {
      ...DEFAULT_TEACHER_STATS,
    };

    if (dashboardResult.status === 'fulfilled') {
      nextStats.unreadMessages = sanitizeCount(
        dashboardResult.value.unreadMessages,
      );
      nextStats.unreadNotifications = sanitizeCount(
        dashboardResult.value.unreadNotifications,
      );
      nextStats.alertsCount = sanitizeCount(
        dashboardResult.value.unreadNotifications,
      );
    }

    if (notificationsResult.status === 'fulfilled') {
      nextStats.alertsCount = sanitizeCount(
        notificationsResult.value.filter((item) => !item.read).length,
      );
    }

    if (studentsResult.status === 'fulfilled') {
      nextStats.studentCount = sanitizeCount(studentsResult.value.length);
    }

    if (draftsResult.status === 'fulfilled') {
      nextStats.pendingApprovals = sanitizeCount(
        draftsResult.value.filter((lesson) => lesson.status === 'DRAFT').length,
      );
    }

    setTeacherStatsState(nextStats);
  }, []);

  const refreshAdminStats = useCallback(async () => {
    const [dashboardResult, alertsResult, studentsResult, teachersResult, sessionsResult] =
      await Promise.allSettled([
        adminApi.getDashboard(),
        adminApi.getAlerts(),
        adminApi.getStudents(),
        adminApi.getTeachers(),
        adminApi.getSessions({ limit: 50 }),
      ]);

    const nextStats: AdminRealtimeStats = {
      ...DEFAULT_ADMIN_STATS,
    };

    if (dashboardResult.status === 'fulfilled') {
      nextStats.alertsCount = sanitizeCount(
        dashboardResult.value.greeting.alertsCount,
      );
      nextStats.activeClasses = sanitizeCount(
        dashboardResult.value.summary.activeClasses,
      );
      nextStats.activeTeachers = sanitizeCount(
        dashboardResult.value.summary.teachersActive,
      );
    }

    if (alertsResult.status === 'fulfilled') {
      nextStats.openAlerts = sanitizeCount(alertsResult.value.stats.open);
      nextStats.alertsCount = sanitizeCount(alertsResult.value.stats.open);
    }

    if (studentsResult.status === 'fulfilled') {
      nextStats.studentCount = sanitizeCount(studentsResult.value.stats.total);
      nextStats.activeStudents = sanitizeCount(studentsResult.value.stats.active);
      nextStats.atRiskStudents = sanitizeCount(studentsResult.value.stats.atRisk);
      nextStats.flaggedStudents = sanitizeCount(studentsResult.value.stats.flagged);
    }

    if (teachersResult.status === 'fulfilled') {
      nextStats.teacherCount = sanitizeCount(
        teachersResult.value.stats.totalTeachers,
      );

      if (nextStats.activeTeachers === 0) {
        nextStats.activeTeachers = sanitizeCount(
          teachersResult.value.teachers.filter(
            (teacher) => teacher.status === 'active',
          ).length,
        );
      }
    }

    if (sessionsResult.status === 'fulfilled') {
      const { recording, waitingUpload, processing } = sessionsResult.value.summary;
      nextStats.liveSessions = sanitizeCount(recording + waitingUpload + processing);
    }

    setAdminStatsState(nextStats);
  }, []);

  const refreshGuardianStats = useCallback(async () => {
    const [studentsResult, unreadResult, notificationsResult] = await Promise.allSettled([
      guardianApi.getStudents(),
      messagesApi.getUnreadCount(),
      authApi.getMyNotifications({ unreadOnly: true, limit: 1 }),
    ]);

    const nextStats: GuardianRealtimeStats = {
      ...DEFAULT_GUARDIAN_STATS,
    };

    if (studentsResult.status === 'fulfilled') {
      const students = studentsResult.value.students ?? [];
      const pending = students.filter(
        (student) => student.enrollment?.status !== 'APPROVED',
      ).length;

      nextStats.childCount = sanitizeCount(students.length);
      nextStats.pendingEnrollments = sanitizeCount(pending);
      nextStats.alertsCount = sanitizeCount(pending);
    }

    if (unreadResult.status === 'fulfilled') {
      nextStats.unreadMessages = sanitizeCount(unreadResult.value.unreadCount);
    }

    if (notificationsResult.status === 'fulfilled') {
      nextStats.unreadNotifications = sanitizeCount(notificationsResult.value.unreadCount);
    }

    setGuardianStatsState(nextStats);
  }, []);

  const refreshStudentStats = useCallback(async () => {
    const [dashboardResult, progressResult, achievementsResult, quizStatsResult, unreadResult] =
      await Promise.allSettled([
        studentApi.getDashboard(),
        studentApi.getProgress(),
        studentApi.getUnlockedAchievements(),
        studentApi.getQuizStats(),
        messagesApi.getUnreadCount(),
      ]);

    const nextStats: StudentRealtimeStats = {
      ...DEFAULT_STUDENT_STATS,
    };

    if (dashboardResult.status === 'fulfilled') {
      nextStats.lessonCount = sanitizeCount(
        dashboardResult.value.availableLessonsCount,
      );
      nextStats.streakDays = sanitizeCount(
        dashboardResult.value.xp.currentStreak ??
          dashboardResult.value.xp.longestStreak ??
          0,
      );
    }

    if (progressResult.status === 'fulfilled') {
      nextStats.inProgressLessons = sanitizeCount(
        progressResult.value.filter(
          (progress) => !progress.isCompleted && progress.progressPercent > 0,
        ).length,
      );
      nextStats.completedLessons = sanitizeCount(
        progressResult.value.filter((progress) => progress.isCompleted).length,
      );
    }

    if (achievementsResult.status === 'fulfilled') {
      nextStats.achievementsCount = sanitizeCount(
        achievementsResult.value.length,
      );
    }

    if (quizStatsResult.status === 'fulfilled') {
      nextStats.quizzesCount = sanitizeCount(
        quizStatsResult.value.summary.attempts,
      );
    }

    if (unreadResult.status === 'fulfilled') {
      nextStats.unreadMessages = sanitizeCount(unreadResult.value.unreadCount);
    }

    setStudentStatsState(nextStats);
  }, []);

  const refreshForRole = useCallback(
    async (role: Role) => {
      if (role === 'TEACHER') {
        await refreshTeacherStats();
        return;
      }

      if (role === 'SCHOOL_ADMIN' || role === 'SUPER_ADMIN') {
        await refreshAdminStats();
        return;
      }

      if (role === 'GUARDIAN') {
        await refreshGuardianStats();
        return;
      }

      if (role === 'STUDENT') {
        await refreshStudentStats();
      }
    },
    [
      refreshAdminStats,
      refreshGuardianStats,
      refreshStudentStats,
      refreshTeacherStats,
    ],
  );

  useEffect(() => {
    if (!token || !user?.role) {
      return;
    }

    const initialRefreshId = window.setTimeout(() => {
      refreshForRole(user.role).catch(() => null);
    }, 0);

    const intervalId = window.setInterval(() => {
      refreshForRole(user.role).catch(() => null);
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearTimeout(initialRefreshId);
      window.clearInterval(intervalId);
    };
  }, [refreshForRole, token, user?.role]);

  useEffect(() => {
    if (!token || !user?.role) {
      return;
    }

    const socket = connectLearnoSocket(token);

    const queueRefresh = () => {
      if (socketRefreshTimeoutRef.current) {
        return;
      }

      socketRefreshTimeoutRef.current = window.setTimeout(() => {
        socketRefreshTimeoutRef.current = null;
        refreshForRole(user.role).catch(() => null);
      }, SOCKET_REFRESH_DEBOUNCE_MS);
    };

    socket.on('connect', queueRefresh);
    socket.on('message:new', queueRefresh);
    socket.on('message:notification', queueRefresh);
    socket.on('message:read', queueRefresh);
    socket.on('learno:alert', queueRefresh);
    socket.on('learno:session_complete', queueRefresh);
    socket.on('learno:session_failed', queueRefresh);
    socket.on('lesson:approved', queueRefresh);
    socket.on('xp:earned', queueRefresh);

    return () => {
      socket.off('connect', queueRefresh);
      socket.off('message:new', queueRefresh);
      socket.off('message:notification', queueRefresh);
      socket.off('message:read', queueRefresh);
      socket.off('learno:alert', queueRefresh);
      socket.off('learno:session_complete', queueRefresh);
      socket.off('learno:session_failed', queueRefresh);
      socket.off('lesson:approved', queueRefresh);
      socket.off('xp:earned', queueRefresh);
      socket.disconnect();

      if (socketRefreshTimeoutRef.current) {
        window.clearTimeout(socketRefreshTimeoutRef.current);
        socketRefreshTimeoutRef.current = null;
      }
    };
  }, [refreshForRole, token, user?.role]);

  const value = useMemo<RealtimeDashboardContextValue>(
    () => ({
      teacherStats,
      adminStats,
      guardianStats,
      studentStats,
      refreshTeacherStats,
      refreshAdminStats,
      refreshGuardianStats,
      refreshStudentStats,
      setTeacherStats,
      setAdminStats,
      setGuardianStats,
      setStudentStats,
    }),
    [
      adminStats,
      guardianStats,
      refreshAdminStats,
      refreshGuardianStats,
      refreshStudentStats,
      refreshTeacherStats,
      setAdminStats,
      setGuardianStats,
      setStudentStats,
      setTeacherStats,
      studentStats,
      teacherStats,
    ],
  );

  return (
    <RealtimeDashboardContext.Provider value={value}>
      {children}
    </RealtimeDashboardContext.Provider>
  );
}

export function useRealtimeDashboard() {
  const context = useContext(RealtimeDashboardContext);

  if (!context) {
    throw new Error(
      'useRealtimeDashboard must be used within RealtimeDashboardProvider.',
    );
  }

  return context;
}
