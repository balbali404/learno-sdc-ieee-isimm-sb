'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Ban,
  Brain,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { ApiError, neuroApi, teacherApi } from '@/lib/api';
import type {
  NeuroAssignmentItem,
  NeuroTestItem,
  TeacherClassSummary,
  TeacherNeuroRecommendationsResponse,
  TeacherStudentEnrollment,
} from '@/lib/api/types';
import { useStoredAuth } from '@/hooks/useStoredAuth';

type AssignMode = 'single' | 'bulk';

type FeedbackState =
  | {
      type: 'success' | 'error';
      message: string;
    }
  | null;

type RecommendationItem = TeacherNeuroRecommendationsResponse['recommendations'][number];

const statusClassMap: Record<string, string> = {
  ASSIGNED: 'bg-sky-50 text-sky-700 border-sky-100',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  SUBMITTED: 'bg-amber-50 text-amber-700 border-amber-100',
  REVIEWED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
};

const conditionLabelMap: Record<string, string> = {
  ADHD: 'ADHD',
  ASD: 'ASD',
  DYSLEXIA: 'Dyslexia',
  DYSCALCULIA: 'Dyscalculia',
  ANXIETY: 'Anxiety',
  DEPRESSION: 'Depression',
  DEFAULT: 'Default',
};

export function NeuroTestsContent() {
  const { token } = useStoredAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const [tests, setTests] = useState<NeuroTestItem[]>([]);
  const [students, setStudents] = useState<TeacherStudentEnrollment[]>([]);
  const [classes, setClasses] = useState<TeacherClassSummary[]>([]);
  const [assignments, setAssignments] = useState<NeuroAssignmentItem[]>([]);
  const [recommendationSummary, setRecommendationSummary] =
    useState<TeacherNeuroRecommendationsResponse['summary'] | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);

  const [mode, setMode] = useState<AssignMode>('single');
  const [selectedTestId, setSelectedTestId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [bulkClassId, setBulkClassId] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [lowEngagementOnly, setLowEngagementOnly] = useState(true);
  const [engagementThreshold, setEngagementThreshold] = useState(60);
  const [maxStudents, setMaxStudents] = useState(80);
  const [visibleToStudent, setVisibleToStudent] = useState(true);
  const [dueAtLocal, setDueAtLocal] = useState('');
  const [notes, setNotes] = useState('');

  const activeTests = useMemo(() => {
    return tests.filter((test) => test.lifecycle === 'ACTIVE');
  }, [tests]);

  const activeAssignments = useMemo(() => {
    return assignments.filter(
      (assignment) =>
        assignment.status === 'ASSIGNED' ||
        assignment.status === 'IN_PROGRESS' ||
        (assignment.status === 'SUBMITTED' && assignment.attemptPolicy?.needsRetry),
    );
  }, [assignments]);

  const loadRecommendations = useCallback(async () => {
    const response = await neuroApi.getTeacherRecommendations({
      engagementThreshold,
      includeAssigned: false,
      limit: 30,
    });

    setRecommendationSummary(response.summary);
    setRecommendations(response.recommendations ?? []);
  }, [engagementThreshold]);

  const loadData = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      const [testsResponse, studentsResponse, classesResponse, assignmentsResponse] = await Promise.all([
        neuroApi.listTests({ bootstrapDefaults: true }),
        teacherApi.getStudents(),
        teacherApi.getClasses(),
        neuroApi.getTeacherAssignments(),
      ]);

      setTests(testsResponse ?? []);
      setStudents(studentsResponse ?? []);
      setClasses(classesResponse ?? []);
      setAssignments(assignmentsResponse ?? []);

      if (!selectedTestId && testsResponse.length > 0) {
        const firstActive = testsResponse.find((test) => test.lifecycle === 'ACTIVE');
        setSelectedTestId(firstActive?.id ?? testsResponse[0].id);
      }

      if (!selectedStudentId && studentsResponse.length > 0) {
        setSelectedStudentId(studentsResponse[0].student.id);
      }

      await loadRecommendations();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Could not load neuro test dashboard data.';
      setFeedback({ type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  }, [loadRecommendations, selectedStudentId, selectedTestId, token]);

  useEffect(() => {
    loadData().catch(() => null);
  }, [loadData]);

  const handleAssign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedTestId) {
      setFeedback({ type: 'error', message: 'Select a test first.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (mode === 'single') {
        if (!selectedStudentId) {
          setFeedback({ type: 'error', message: 'Select a student for single assignment mode.' });
          return;
        }

        await neuroApi.assignToStudent({
          testId: selectedTestId,
          studentId: selectedStudentId,
          visibleToStudent,
          dueAt: dueAtLocal ? new Date(dueAtLocal).toISOString() : null,
          notes: notes.trim() || null,
        });

        setFeedback({ type: 'success', message: 'Test assigned to student.' });
      } else {
        await neuroApi.assignByCriteria({
          testId: selectedTestId,
          classId: bulkClassId || null,
          minAge: minAge ? Number(minAge) : null,
          maxAge: maxAge ? Number(maxAge) : null,
          lowEngagementOnly,
          engagementThreshold: lowEngagementOnly ? engagementThreshold : null,
          maxStudents,
          visibleToStudent,
          dueAt: dueAtLocal ? new Date(dueAtLocal).toISOString() : null,
          notes: notes.trim() || null,
        });

        setFeedback({ type: 'success', message: 'Bulk assignment completed.' });
      }

      await loadData();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not assign test.';
      setFeedback({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAssign = async (recommendation: RecommendationItem) => {
    const topRecommendation = recommendation.recommendedTests[0];
    if (!topRecommendation) {
      setFeedback({ type: 'error', message: 'No recommended test available for this student.' });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);
      await neuroApi.assignToStudent({
        testId: topRecommendation.id,
        studentId: recommendation.student.id,
        visibleToStudent: true,
      });
      setFeedback({
        type: 'success',
        message: `Assigned ${topRecommendation.title} to ${recommendation.student.fullName}.`,
      });
      await loadData();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not assign recommended test.';
      setFeedback({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAssignmentVisibility = async (assignment: NeuroAssignmentItem) => {
    try {
      setIsSubmitting(true);
      await neuroApi.updateAssignment(assignment.id, {
        visibleToStudent: !assignment.visibleToStudent,
      });
      await loadData();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not update assignment visibility.';
      setFeedback({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAssignmentStatus = async (assignment: NeuroAssignmentItem) => {
    const nextStatus = assignment.status === 'CANCELLED' ? 'ASSIGNED' : 'CANCELLED';

    try {
      setIsSubmitting(true);
      await neuroApi.updateAssignment(assignment.id, {
        status: nextStatus,
      });
      await loadData();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not update assignment status.';
      setFeedback({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="p-6 max-w-screen-xl mx-auto">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h1 className="text-xl font-bold text-slate-800">Neuro Tests</h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in as a teacher to manage neuro test assignments.
          </p>
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
    <div className="p-6 max-w-screen-xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Neuro Tests</h1>
          <p className="mt-1 text-sm text-slate-500">
            Assign, monitor, and review support screeners for students.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadData().catch(() => null)}
          disabled={isLoading || isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
          Refresh
        </button>
      </div>

      {feedback ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400">Available tests</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{activeTests.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400">Active assignments</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{activeAssignments.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400">Low engagement students</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">
            {recommendationSummary?.lowEngagementStudents ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-slate-400">Recommendation threshold</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{engagementThreshold}</p>
        </div>
      </div>

      <section className="rounded-xl border border-slate-100 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Brain size={16} className="text-sky-500" />
          <h2 className="text-sm font-semibold text-slate-800">Test Catalog</h2>
        </div>

        {isLoading ? (
          <div className="py-8 text-sm text-slate-500 flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            Loading tests...
          </div>
        ) : activeTests.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No active tests are available yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {activeTests.map((test) => (
              <div key={test.id} className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">{test.key}</p>
                <h3 className="mt-1 text-sm font-semibold text-slate-800">{test.title}</h3>
                <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                  {test.description ?? 'No description provided.'}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-700">
                    {conditionLabelMap[test.targetCondition] ?? test.targetCondition}
                  </span>
                  <span className="text-slate-500">~{test.estimatedMin ?? 4} min</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-100 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={16} className="text-sky-500" />
          <h2 className="text-sm font-semibold text-slate-800">Create Assignment</h2>
        </div>

        <form onSubmit={handleAssign} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                mode === 'single'
                  ? 'border-sky-200 bg-sky-50 text-sky-700'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              Single Student
            </button>
            <button
              type="button"
              onClick={() => setMode('bulk')}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                mode === 'bulk'
                  ? 'border-sky-200 bg-sky-50 text-sky-700'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              Bulk by Criteria
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">
              Test
              <select
                value={selectedTestId}
                onChange={(event) => setSelectedTestId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                <option value="">Select a test...</option>
                {activeTests.map((test) => (
                  <option key={test.id} value={test.id}>
                    {test.title}
                  </option>
                ))}
              </select>
            </label>

            {mode === 'single' ? (
              <label className="text-xs font-semibold text-slate-600">
                Student
                <select
                  value={selectedStudentId}
                  onChange={(event) => setSelectedStudentId(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <option value="">Select a student...</option>
                  {students.map((entry) => (
                    <option key={entry.student.id} value={entry.student.id}>
                      {entry.student.fullName} - {entry.class?.name ?? 'No class'}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="text-xs font-semibold text-slate-600">
                Class (optional)
                <select
                  value={bulkClassId}
                  onChange={(event) => setBulkClassId(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <option value="">All your classes</option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {mode === 'bulk' ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <label className="text-xs font-semibold text-slate-600">
                Min age
                <input
                  type="number"
                  min={3}
                  max={30}
                  value={minAge}
                  onChange={(event) => setMinAge(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Max age
                <input
                  type="number"
                  min={3}
                  max={30}
                  value={maxAge}
                  onChange={(event) => setMaxAge(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Max students
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={maxStudents}
                  onChange={(event) => setMaxStudents(Number(event.target.value) || 1)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Engagement threshold
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={engagementThreshold}
                  onChange={(event) => setEngagementThreshold(Number(event.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  disabled={!lowEngagementOnly}
                />
              </label>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">
              Due date (optional)
              <input
                type="datetime-local"
                value={dueAtLocal}
                onChange={(event) => setDueAtLocal(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Notes (optional)
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                placeholder="Add assignment context for the student"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={visibleToStudent}
                  onChange={(event) => setVisibleToStudent(event.target.checked)}
                />
                Visible to student
              </label>

              {mode === 'bulk' ? (
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={lowEngagementOnly}
                    onChange={(event) => setLowEngagementOnly(event.target.checked)}
                  />
                  Low engagement only
                </label>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              {mode === 'single' ? 'Assign Test' : 'Assign by Criteria'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-100 bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-800">Low Engagement Recommendations</h2>
          </div>
          <button
            type="button"
            onClick={() => loadRecommendations().catch(() => null)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw size={14} />
            Refresh Recommendations
          </button>
        </div>

        {recommendations.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No students are currently below the engagement threshold.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-2">Student</th>
                  <th className="px-3 py-2">Class</th>
                  <th className="px-3 py-2">Engagement</th>
                  <th className="px-3 py-2">Suggested Tests</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {recommendations.map((item) => (
                  <tr key={item.student.id}>
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-700">{item.student.fullName}</p>
                      <p className="text-xs text-slate-500">{item.student.email}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{item.class?.name ?? 'No class'}</td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-slate-700">
                        {item.metrics.averageEngagement} / {item.metrics.averageConcentration}
                      </p>
                      <p className="text-xs text-slate-500">{item.riskBand.toUpperCase()} risk</p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {item.recommendedTests.slice(0, 2).map((test) => (
                          <span
                            key={test.id}
                            className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600"
                          >
                            {test.title}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => handleQuickAssign(item)}
                        disabled={isSubmitting || item.recommendedTests.length === 0}
                        className="inline-flex items-center gap-1 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Sparkles size={13} />
                        Quick Assign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-100 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-800">Recent Assignments</h2>

        {assignments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No assignments yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-2">Test</th>
                  <th className="px-3 py-2">Student</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Due</th>
                  <th className="px-3 py-2">Latest Score</th>
                  <th className="px-3 py-2">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {assignments.map((assignment) => {
                  const latestAttempt = assignment.attempts?.[0];
                  const canToggleStatus =
                    assignment.status === 'ASSIGNED' || assignment.status === 'IN_PROGRESS' || assignment.status === 'CANCELLED';

                  return (
                    <tr key={assignment.id}>
                      <td className="px-3 py-3">
                        <p className="font-medium text-slate-700">{assignment.test?.title ?? assignment.testId}</p>
                        <p className="text-xs text-slate-500">{assignment.test?.key}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-slate-700">{assignment.student?.fullName ?? 'Student'}</p>
                        <p className="text-xs text-slate-500">{assignment.student?.email}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                            statusClassMap[assignment.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {assignment.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {assignment.dueAt ? new Date(assignment.dueAt).toLocaleDateString() : 'No due date'}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        <p>
                          {typeof latestAttempt?.score === 'number'
                            ? `${Math.round(latestAttempt.score)}%`
                            : 'Not submitted'}
                        </p>
                        {assignment.attemptPolicy ? (
                          <p className="text-[11px] text-slate-500">
                            Attempt {assignment.attemptPolicy.attemptsUsed}/{assignment.attemptPolicy.maxAttempts}
                            {assignment.attemptPolicy.needsRetry
                              ? assignment.attemptPolicy.canRetryNow
                                ? ' - retry available'
                                : ' - retry waiting'
                              : ''}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/teacher/neuro-tests/assignments/${assignment.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            <Brain size={13} /> Analytics
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggleAssignmentVisibility(assignment)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            disabled={isSubmitting}
                          >
                            {assignment.visibleToStudent ? <EyeOff size={13} /> : <Eye size={13} />}
                            {assignment.visibleToStudent ? 'Hide' : 'Show'}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleAssignmentStatus(assignment)}
                            disabled={!canToggleStatus || isSubmitting}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {assignment.status === 'CANCELLED' ? (
                              <>
                                <RotateCcw size={13} /> Restore
                              </>
                            ) : (
                              <>
                                <Ban size={13} /> Cancel
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
