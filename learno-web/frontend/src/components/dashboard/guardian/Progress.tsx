'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  BookOpen,
  ChevronDown,
  Flame,
  Loader2,
  Target,
  TrendingUp,
} from 'lucide-react';
import { ApiError, guardianApi } from '@/lib/api';
import type { GuardianStudent } from '@/lib/api/types';
import { useStoredAuth } from '@/hooks/useStoredAuth';
import { useRealtimeDashboard } from '@/components/dashboard/shared/RealtimeDashboardProvider';
import { formatBadgeCount } from '@/lib/dashboard/format';

type StudentProgressResponse = Awaited<ReturnType<typeof guardianApi.getStudentProgress>>;

const PERIOD_OPTIONS = ['This Week', 'This Month', 'All Time'];

const toPct = (value: number | undefined | null) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
};

const toStatusBadge = (status: string | undefined) => {
  if (status === 'APPROVED') return 'bg-green-50 text-green-700 border-green-100';
  if (status === 'REJECTED') return 'bg-red-50 text-red-700 border-red-100';
  if (status === 'COMPLETED') return 'bg-blue-50 text-blue-700 border-blue-100';
  return 'bg-amber-50 text-amber-700 border-amber-100';
};

export function Progress() {
  const { token } = useStoredAuth();
  const { guardianStats } = useRealtimeDashboard();

  const [students, setStudents] = useState<GuardianStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(PERIOD_OPTIONS[1]);
  const [progress, setProgress] = useState<StudentProgressResponse | null>(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setIsLoadingStudents(false);
      return;
    }

    const loadStudents = async () => {
      setIsLoadingStudents(true);
      setError(null);

      try {
        const response = await guardianApi.getStudents();
        const list = response.students ?? [];
        setStudents(list);
        if (list.length > 0) {
          setSelectedStudentId((current) => current || list[0].id);
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Failed to load students.');
        }
      } finally {
        setIsLoadingStudents(false);
      }
    };

    loadStudents().catch(() => null);
  }, [token]);

  useEffect(() => {
    if (!token || !selectedStudentId) {
      setProgress(null);
      return;
    }

    const loadProgress = async () => {
      setIsLoadingProgress(true);
      setError(null);

      try {
        const response = await guardianApi.getStudentProgress(selectedStudentId);
        setProgress(response);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Failed to load progress data.');
        }
      } finally {
        setIsLoadingProgress(false);
      }
    };

    loadProgress().catch(() => null);
  }, [selectedStudentId, token]);

  const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? null;
  const selectedChildLabel = selectedStudent
    ? `${selectedStudent.fullName} - ${selectedStudent.enrollment?.class?.name ?? 'No Class'}`
    : 'Select child';

  const recentLessons = progress?.recentLessons ?? [];
  const recentAchievements = progress?.recentAchievements ?? [];
  const totalXP = progress?.xp?.totalXP ?? 0;
  const level = progress?.xp?.currentLevel ?? progress?.xp?.level ?? 1;
  const streak = progress?.xp?.currentStreak ?? 0;

  const completedLessons = recentLessons.filter((lesson) => {
    const status = (lesson.status ?? '').toUpperCase();
    return status === 'COMPLETED' || status === 'APPROVED' || (lesson.progressPercent ?? 0) >= 100;
  }).length;

  const averageProgress = recentLessons.length
    ? Math.round(
        recentLessons.reduce((sum, lesson) => sum + (lesson.progressPercent ?? 0), 0) /
          recentLessons.length,
      )
    : 0;

  if (!token) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-3xl font-semibold text-[#2C3E50]">Progress Report</h2>
          <p className="text-gray-600 mt-2">Sign in first to load your child&apos;s learning progress.</p>
          <Link
            href="/login"
            className="mt-4 inline-flex rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-[#2C3E50]">Progress Report</h2>
          <p className="text-gray-600 mt-1">Live data from `/guardian/students/:studentId/progress`.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-lg border border-[#DCFCE7] bg-[#F0FDF4] px-3 py-1.5 text-xs font-semibold text-[#15803D]">
              Messages {formatBadgeCount(guardianStats.unreadMessages)}
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg border border-[#FECDD3] bg-[#FFF1F2] px-3 py-1.5 text-xs font-semibold text-[#BE123C]">
              Alerts {formatBadgeCount(guardianStats.alertsCount)}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative">
            <span className="sr-only">Select period</span>
            <select
              value={selectedPeriod}
              onChange={(event) => setSelectedPeriod(event.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2 pr-9 text-sm font-medium text-gray-700 hover:border-gray-300"
            >
              {PERIOD_OPTIONS.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </label>

          <label className="relative">
            <span className="sr-only">Select child</span>
            <select
              value={selectedStudentId}
              onChange={(event) => setSelectedStudentId(event.target.value)}
              disabled={students.length === 0 || isLoadingStudents}
              className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2 pr-9 text-sm font-medium text-gray-700 hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {students.length === 0 ? <option value="">No children linked</option> : null}
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </label>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {isLoadingStudents || isLoadingProgress ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 inline-flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" />
          Loading progress...
        </div>
      ) : null}

      {!isLoadingStudents && students.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          No children linked to this guardian account yet.
        </div>
      ) : null}

      {students.length > 0 && selectedStudent ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-[#EBF4FF] rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-[#2563EB]" size={22} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total XP</p>
                  <p className="text-2xl font-semibold text-[#2C3E50]">{totalXP}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">{selectedPeriod}</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-[#DCFCE7] rounded-lg flex items-center justify-center">
                  <Target className="text-[#10B981]" size={22} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Level</p>
                  <p className="text-2xl font-semibold text-[#2C3E50]">{level}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">{selectedChildLabel}</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-[#FFF7ED] rounded-lg flex items-center justify-center">
                  <Flame className="text-[#EA580C]" size={22} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Streak</p>
                  <p className="text-2xl font-semibold text-[#2C3E50]">{streak}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">days active</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-[#FEF9C3] rounded-lg flex items-center justify-center">
                  <Award className="text-[#CA8A04]" size={22} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Achievements</p>
                  <p className="text-2xl font-semibold text-[#2C3E50]">{recentAchievements.length}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">recent unlocks</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold text-[#2C3E50] mb-5">Recent Lesson Progress</h3>

                {recentLessons.length === 0 ? (
                  <p className="text-sm text-gray-500">No lesson progress data yet.</p>
                ) : (
                  <div className="space-y-4">
                    {recentLessons.map((lesson) => {
                      const progressPercent = toPct(lesson.progressPercent);
                      const xpEarned = lesson.xpEarned ?? 0;
                      const status = lesson.status ?? 'PENDING';

                      return (
                        <article key={lesson.id} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-[#2C3E50]">{lesson.lesson.title}</p>
                              <p className="text-xs text-gray-500 mt-1">{lesson.lesson.subject?.name ?? 'General'}</p>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                                +{xpEarned} XP
                              </span>
                              <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${toStatusBadge(status)}`}>
                                {status}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                              <span>Completion</span>
                              <span>{progressPercent}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-200">
                              <div className="h-2 rounded-full bg-[#2563EB]" style={{ width: `${progressPercent}%` }} />
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold text-[#2C3E50] mb-4">Learning Snapshot</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg bg-[#EBF4FF] p-4 border border-[#BFDBFE]">
                    <p className="text-xs text-gray-600">Average Progress</p>
                    <p className="text-2xl font-semibold text-[#2563EB] mt-1">{averageProgress}%</p>
                  </div>
                  <div className="rounded-lg bg-[#DCFCE7] p-4 border border-[#BBF7D0]">
                    <p className="text-xs text-gray-600">Completed Lessons</p>
                    <p className="text-2xl font-semibold text-[#15803D] mt-1">{completedLessons}</p>
                  </div>
                  <div className="rounded-lg bg-[#FEF9C3] p-4 border border-[#FDE68A]">
                    <p className="text-xs text-gray-600">Recent Lessons</p>
                    <p className="text-2xl font-semibold text-[#A16207] mt-1">{recentLessons.length}</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold text-[#2C3E50] mb-4">Achievements</h3>

                {recentAchievements.length === 0 ? (
                  <p className="text-sm text-gray-500">No achievements unlocked yet.</p>
                ) : (
                  <div className="space-y-3">
                    {recentAchievements.map((item) => (
                      <div key={item.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-lg bg-[#FEF9C3] text-[#CA8A04] flex items-center justify-center">
                            <Award size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-[#2C3E50]">{item.achievement.name}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{item.achievement.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(item.unlockedAt).toLocaleDateString()} - {item.achievement.xpReward} XP
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-[#2C3E50] mb-4">Focus Area</h3>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center gap-2 mb-2 text-[#2563EB]">
                    <BookOpen size={16} />
                    <p className="text-sm font-medium">Keep lesson consistency</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Encourage daily lesson completion to improve streak and unlock more achievements.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
