'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Download, Eye, FileText, Loader2, RotateCcw } from 'lucide-react';
import { ApiError, learnoApi, studentApi } from '@/lib/api';
import type { LessonItem } from '@/lib/api/types';
import { useStoredAuth } from '@/hooks/useStoredAuth';

const badgeByStatus: Record<string, string> = {
  APPROVED: 'bg-green-50 text-green-700 border-green-100',
  DRAFT: 'bg-amber-50 text-amber-700 border-amber-100',
  REJECTED: 'bg-slate-100 text-slate-600 border-slate-200',
  ARCHIVED: 'bg-slate-100 text-slate-600 border-slate-200',
};

const formatDate = (isoDate?: string): string => {
  if (!isoDate) return 'No date';
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(isoDate));
  } catch {
    return 'No date';
  }
};

const toSafeNumber = (value: number | undefined | null): number => value ?? 0;

export function ReportsContent() {
  const { token } = useStoredAuth();
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLessons = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await learnoApi.getLessons();
      setLessons(response ?? []);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load lesson reports.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    loadLessons().catch(() => null);
  }, [token]);

  const approvedCount = lessons.filter((lesson) => lesson.status === 'APPROVED').length;
  const pendingCount = lessons.filter((lesson) => lesson.status === 'DRAFT').length;
  const rejectedCount = lessons.filter((lesson) => lesson.status === 'REJECTED').length;

  const approveLesson = async (lessonId: string) => {
    setIsMutating(true);
    setError(null);

    try {
      await studentApi.approveLesson({ lessonId });
      await loadLessons();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to approve lesson.');
      }
    } finally {
      setIsMutating(false);
    }
  };

  const rejectLesson = async (lessonId: string) => {
    const reason = window.prompt('Reason for rejection:', 'Needs revision');
    if (!reason) {
      return;
    }

    setIsMutating(true);
    setError(null);

    try {
      await studentApi.rejectLesson({ lessonId, reason });
      await loadLessons();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to reject lesson.');
      }
    } finally {
      setIsMutating(false);
    }
  };

  const viewPdf = async (lesson: LessonItem) => {
    setIsMutating(true);
    setError(null);

    try {
      const blob = await learnoApi.getLessonPdf(lesson.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to open PDF.');
      }
    } finally {
      setIsMutating(false);
    }
  };

  if (!token) {
    return (
      <div className="p-6 max-w-screen-xl mx-auto">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h1 className="text-xl font-bold text-slate-800">Reports</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in first to load reports and approvals.</p>
          <Link
            href="/login"
            className="mt-4 inline-flex rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Reports</h1>
          <p className="text-sm text-slate-500 mt-1">
            Powered by `/learno/lessons` + student approve/reject endpoints.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadLessons()}
          disabled={isLoading || isMutating}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download size={14} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
          <p className="text-sm text-green-700 mt-1">Approved</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-center">
          <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
          <p className="text-sm text-amber-700 mt-1">Pending Review</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
          <p className="text-3xl font-bold text-slate-700">{rejectedCount}</p>
          <p className="text-sm text-slate-600 mt-1">Rejected</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Teacher approval flow is active: draft lessons stay hidden from students until you approve them.
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Loading reports...
          </div>
        ) : null}

        {!isLoading && lessons.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
            No lesson reports available yet.
          </div>
        ) : null}

        {!isLoading
          ? lessons.map((lesson) => (
              <article
                key={lesson.id}
                className="rounded-xl border border-slate-100 bg-white p-5 hover:border-slate-200 transition-all"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${badgeByStatus[lesson.status] ?? badgeByStatus.ARCHIVED}`}
                      >
                        <FileText size={11} />
                        {lesson.status}
                      </span>
                      <span className="rounded-full border border-slate-100 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
                        {lesson.subject?.name ?? 'General'}
                      </span>
                      <span className="rounded-full border border-slate-100 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
                        {formatDate(lesson.createdAt)}
                      </span>
                    </div>

                    <h2 className="font-semibold text-slate-800">{lesson.title || 'Untitled lesson'}</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {lesson.description || 'No summary yet.'}
                    </p>

                    <div className="mt-3 flex items-center gap-5 text-xs text-slate-500">
                      <span>Chapters: {lesson.chapters?.length ?? 0}</span>
                      <span>XP: {toSafeNumber(lesson.totalXP)}</span>
                      <span>Duration: {toSafeNumber(lesson.totalDurationMin)} min</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-32">
                    <button
                      type="button"
                      onClick={() => viewPdf(lesson)}
                      disabled={isMutating}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#54C3EF]/10 px-3 py-2 text-xs font-medium text-[#0ea5e9] hover:bg-[#54C3EF]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Eye size={12} />
                      Preview PDF
                    </button>

                    {lesson.status === 'DRAFT' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => approveLesson(lesson.id)}
                          disabled={isMutating}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700 border border-green-100 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <CheckCircle size={12} />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectLesson(lesson.id)}
                          disabled={isMutating}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 border border-amber-100 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <RotateCcw size={12} />
                          Reject
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          : null}
      </div>
    </div>
  );
}
