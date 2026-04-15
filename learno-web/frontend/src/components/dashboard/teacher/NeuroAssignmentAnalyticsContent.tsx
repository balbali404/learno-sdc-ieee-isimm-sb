'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, RotateCcw } from 'lucide-react';
import { ApiError, neuroApi } from '@/lib/api';
import type {
  NeuroTestAttemptItem,
  TeacherNeuroAssignmentDetailResponse,
} from '@/lib/api/types';

type TaskQuestionAnalytics = {
  id: string;
  prompt: string;
  expected: string | number | null;
  selected: string | number | null;
  correct: boolean | null;
  skipped: boolean;
  durationMs: number | null;
  attempts: number | null;
};

type TaskAnalytics = {
  taskId: string;
  title: string;
  questions: TaskQuestionAnalytics[];
  summary?: Record<string, unknown>;
};

const supportLevelLabel: Record<string, string> = {
  no_strong_concern: 'No strong concern',
  monitor: 'Monitor',
  repeated_difficulty_indicator: 'Repeated difficulty indicator',
  support_review_recommended: 'Support review recommended',
};

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const toTaskAnalytics = (value: unknown): TaskAnalytics[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry): TaskAnalytics | null => {
      const row = toRecord(entry);
      if (!row) {
        return null;
      }

      const questions = Array.isArray(row.questions)
        ? row.questions
            .map((question) => {
              const parsed = toRecord(question);
              if (!parsed) {
                return null;
              }

              return {
                id: typeof parsed.id === 'string' ? parsed.id : 'q',
                prompt: typeof parsed.prompt === 'string' ? parsed.prompt : 'Question',
                expected:
                  typeof parsed.expected === 'string' || typeof parsed.expected === 'number'
                    ? parsed.expected
                    : null,
                selected:
                  typeof parsed.selected === 'string' || typeof parsed.selected === 'number'
                    ? parsed.selected
                    : null,
                correct: typeof parsed.correct === 'boolean' ? parsed.correct : null,
                skipped: Boolean(parsed.skipped),
                durationMs:
                  typeof parsed.durationMs === 'number' ? parsed.durationMs : null,
                attempts: typeof parsed.attempts === 'number' ? parsed.attempts : null,
              } satisfies TaskQuestionAnalytics;
            })
            .filter((question): question is TaskQuestionAnalytics => Boolean(question))
        : [];

      return {
        taskId: typeof row.taskId === 'string' ? row.taskId : 'task',
        title: typeof row.title === 'string' ? row.title : 'Task',
        questions,
        summary: toRecord(row.summary) ?? undefined,
      };
    })
    .filter((entry): entry is TaskAnalytics => Boolean(entry));
};

const getSupportLevelFromAttempt = (attempt: NeuroTestAttemptItem): string => {
  const analysis = toRecord(attempt.analysisJson);
  const supportLevel = typeof analysis?.supportLevel === 'string' ? analysis.supportLevel : null;
  if (!supportLevel) {
    return 'Not available';
  }

  return supportLevelLabel[supportLevel] ?? supportLevel;
};

const getSubScores = (attempt: NeuroTestAttemptItem): Array<{ key: string; value: number }> => {
  const analysis = toRecord(attempt.analysisJson);
  const subScores = toRecord(analysis?.subScores);
  if (!subScores) {
    return [];
  }

  return Object.entries(subScores)
    .filter(([, value]) => typeof value === 'number')
    .map(([key, value]) => ({ key, value: Number(value) }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 6);
};

const getTaskAnalyticsFromAttempt = (attempt: NeuroTestAttemptItem): TaskAnalytics[] => {
  const answers = toRecord(attempt.answersJson);
  const analysis = toRecord(attempt.analysisJson);

  const fromAnswers = toTaskAnalytics(answers?.taskAnalytics);
  if (fromAnswers.length > 0) {
    return fromAnswers;
  }

  return toTaskAnalytics(analysis?.taskAnalytics);
};

export function NeuroAssignmentAnalyticsContent() {
  const params = useParams<{ assignmentId: string }>();
  const assignmentId = Array.isArray(params?.assignmentId)
    ? params.assignmentId[0]
    : params?.assignmentId;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<TeacherNeuroAssignmentDetailResponse | null>(null);

  const loadDetail = useCallback(async () => {
    if (!assignmentId) {
      setError('Assignment id is missing.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await neuroApi.getTeacherAssignmentDetail(assignmentId);
      setPayload(response);
    } catch (loadError) {
      const message =
        loadError instanceof ApiError
          ? loadError.message
          : 'Could not load assignment analytics.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    loadDetail().catch(() => null);
  }, [loadDetail]);

  const assignment = payload?.assignment ?? null;

  const attempts = useMemo(() => {
    return assignment?.attempts ?? [];
  }, [assignment?.attempts]);

  const topAttempt = attempts[0] ?? null;

  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Link
            href="/teacher/neuro-tests"
            className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-800"
          >
            <ArrowLeft size={14} /> Back to Neuro Tests
          </Link>
          <h1 className="text-xl font-bold text-slate-800">Neuro Assignment Analytics</h1>
          <p className="text-sm text-slate-500">
            Attempt timeline, score trend, and question-level breakdown for this student assignment.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadDetail().catch(() => null)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RotateCcw size={15} /> Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 inline-flex items-center gap-2">
          <AlertTriangle size={14} />
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          <Loader2 size={16} className="mx-auto mb-2 animate-spin" />
          Loading assignment analytics...
        </div>
      ) : null}

      {!isLoading && assignment ? (
        <>
          <section className="rounded-xl border border-slate-100 bg-white p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="rounded-lg bg-slate-50 px-3 py-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Student</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {assignment.student?.fullName ?? assignment.studentId}
                </p>
                <p className="text-xs text-slate-500">{assignment.student?.email}</p>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Test</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {assignment.test?.title ?? assignment.testId}
                </p>
                <p className="text-xs text-slate-500">{assignment.test?.key}</p>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Latest score</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {payload?.analytics.latestScore !== null && payload?.analytics.latestScore !== undefined
                    ? `${Math.round(payload.analytics.latestScore)}%`
                    : 'Not scored'}
                </p>
                <p className="text-xs text-slate-500">
                  {payload?.analytics.latestSupportLevel
                    ? supportLevelLabel[payload.analytics.latestSupportLevel] ?? payload.analytics.latestSupportLevel
                    : 'No support level'}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Attempts</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {assignment.attemptPolicy?.attemptsUsed ?? payload?.analytics.attemptsCount ?? 0} /
                  {' '}
                  {assignment.attemptPolicy?.maxAttempts ?? '-'}
                </p>
                <p className="text-xs text-slate-500">
                  Best {payload?.analytics.bestScore !== null && payload?.analytics.bestScore !== undefined
                    ? `${Math.round(payload.analytics.bestScore)}%`
                    : 'n/a'}
                </p>
              </div>
            </div>

            {assignment.attemptPolicy ? (
              <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50 px-3 py-3 text-xs text-sky-700 space-y-1">
                <p>
                  Retry policy: score below {assignment.attemptPolicy.lowScoreThreshold}% unlocks another attempt after {assignment.attemptPolicy.retryCooldownDays} day(s).
                </p>
                {assignment.attemptPolicy.needsRetry ? (
                  <p>
                    {assignment.attemptPolicy.canRetryNow
                      ? 'Retry is currently available.'
                      : `Retry available at ${assignment.attemptPolicy.retryAvailableAt ? new Date(assignment.attemptPolicy.retryAvailableAt).toLocaleString() : 'cooldown end'}.`}
                  </p>
                ) : (
                  <p>
                    Remaining attempts: {assignment.attemptPolicy.remainingAttempts}
                  </p>
                )}
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-slate-100 bg-white p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-800">Attempt Timeline</h2>

            {attempts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No attempts submitted yet.
              </div>
            ) : (
              <div className="space-y-5">
                {attempts.map((attempt, index) => {
                  const subScores = getSubScores(attempt);
                  const taskAnalytics = getTaskAnalyticsFromAttempt(attempt);

                  return (
                    <article key={attempt.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Attempt #{attempts.length - index}
                          </p>
                          <h3 className="mt-0.5 text-sm font-semibold text-slate-800">
                            Submitted {attempt.createdAt ? new Date(attempt.createdAt).toLocaleString() : 'Unknown'}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                            {attempt.score !== null && attempt.score !== undefined
                              ? `${Math.round(attempt.score)}%`
                              : 'No score'}
                          </span>
                          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
                            {getSupportLevelFromAttempt(attempt)}
                          </span>
                          {attempt.reviewedByTeacher ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 inline-flex items-center gap-1">
                              <CheckCircle2 size={12} /> Reviewed
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 md:grid-cols-4 text-xs">
                        <div className="rounded-lg bg-slate-50 px-3 py-2 text-slate-600">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">Condition</p>
                          <p className="mt-1 font-semibold text-slate-800">{attempt.inferredCondition ?? 'DEFAULT'}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 px-3 py-2 text-slate-600">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">Confidence</p>
                          <p className="mt-1 font-semibold text-slate-800">
                            {typeof attempt.confidence === 'number'
                              ? `${Math.round(attempt.confidence * 100)}%`
                              : 'Not available'}
                          </p>
                        </div>
                        <div className="rounded-lg bg-slate-50 px-3 py-2 text-slate-600">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">Duration</p>
                          <p className="mt-1 font-semibold text-slate-800">
                            {typeof attempt.durationSec === 'number'
                              ? `${Math.max(0, Math.round(attempt.durationSec / 60))} min`
                              : 'Not available'}
                          </p>
                        </div>
                        <div className="rounded-lg bg-slate-50 px-3 py-2 text-slate-600">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">Reviewed by</p>
                          <p className="mt-1 font-semibold text-slate-800">
                            {attempt.reviewedByTeacher?.fullName ?? 'Pending'}
                          </p>
                        </div>
                      </div>

                      {subScores.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-700">Sub-scores</p>
                          <div className="flex flex-wrap gap-1.5">
                            {subScores.map((entry) => (
                              <span
                                key={entry.key}
                                className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600"
                              >
                                {entry.key}: {Math.round(entry.value)}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {attempt.reviewerNotes ? (
                        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                          {attempt.reviewerNotes}
                        </p>
                      ) : null}

                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-slate-700">Question Analytics</p>

                        {taskAnalytics.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                            Task-level question analytics were not captured for this attempt.
                          </div>
                        ) : (
                          taskAnalytics.map((task) => (
                            <div key={task.taskId} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-slate-700">{task.title}</p>
                                <span className="text-[11px] text-slate-500">
                                  {task.questions.length} question(s)
                                </span>
                              </div>

                              <div className="mt-2 overflow-x-auto">
                                <table className="w-full min-w-[680px] text-xs">
                                  <thead>
                                    <tr className="border-b border-slate-200 text-left text-[10px] uppercase tracking-wide text-slate-400">
                                      <th className="px-2 py-1.5">Prompt</th>
                                      <th className="px-2 py-1.5">Expected</th>
                                      <th className="px-2 py-1.5">Selected</th>
                                      <th className="px-2 py-1.5">Result</th>
                                      <th className="px-2 py-1.5">Time</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {task.questions.map((question) => (
                                      <tr key={question.id}>
                                        <td className="px-2 py-1.5 font-medium text-slate-700">{question.prompt}</td>
                                        <td className="px-2 py-1.5">{question.expected ?? '-'}</td>
                                        <td className="px-2 py-1.5">
                                          {question.selected ?? (question.skipped ? 'Skipped' : '-')}
                                        </td>
                                        <td className="px-2 py-1.5">
                                          {question.correct === null
                                            ? 'n/a'
                                            : question.correct
                                              ? 'Correct'
                                              : 'Needs support'}
                                        </td>
                                        <td className="px-2 py-1.5">
                                          {typeof question.durationMs === 'number'
                                            ? `${Math.round(question.durationMs)} ms`
                                            : '-'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {topAttempt ? (
            <section className="rounded-xl border border-slate-100 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-800">Latest Attempt Raw Analysis</h2>
              <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">
                {JSON.stringify(topAttempt.analysisJson ?? {}, null, 2)}
              </pre>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
