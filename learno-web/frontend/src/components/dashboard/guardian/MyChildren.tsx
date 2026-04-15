'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Brain,
  Calendar,
  Clock4,
  Loader2,
  Pencil,
  Plus,
  Save,
  SendHorizontal,
  UserRound,
} from 'lucide-react';
import { ApiError, guardianApi } from '@/lib/api';
import type { GuardianStudent, NeuroAssignmentItem, NeuroTestItem } from '@/lib/api/types';
import { useStoredAuth } from '@/hooks/useStoredAuth';
import { useRealtimeDashboard } from '@/components/dashboard/shared/RealtimeDashboardProvider';
import { formatBadgeCount } from '@/lib/dashboard/format';

interface SchoolOption {
  id: string;
  name: string;
}

interface ClassOption {
  id: string;
  name: string;
}

interface NeuroAssignmentPanelState {
  isOpen: boolean;
  selectedTestId: string;
  dueAtLocal: string;
  notes: string;
  isLoadingAssignments: boolean;
  isAssigning: boolean;
  tests: NeuroTestItem[];
  assignments: NeuroAssignmentItem[];
  loadError: string | null;
  assignFeedback: string | null;
}

const initialNeuroPanelState = (): NeuroAssignmentPanelState => ({
  isOpen: false,
  selectedTestId: '',
  dueAtLocal: '',
  notes: '',
  isLoadingAssignments: false,
  isAssigning: false,
  tests: [],
  assignments: [],
  loadError: null,
  assignFeedback: null,
});

const neuroSupportLevelTone: Record<string, string> = {
  support_review_recommended: 'border-rose-100 bg-rose-50 text-rose-700',
  repeated_difficulty_indicator: 'border-amber-100 bg-amber-50 text-amber-700',
  monitor: 'border-sky-100 bg-sky-50 text-sky-700',
  no_strong_concern: 'border-emerald-100 bg-emerald-50 text-emerald-700',
};

const toSupportLevelLabel = (value?: string | null) => {
  if (!value) return null;

  if (value === 'support_review_recommended') return 'Support review recommended';
  if (value === 'repeated_difficulty_indicator') return 'Repeated difficulty';
  if (value === 'monitor') return 'Monitor';
  if (value === 'no_strong_concern') return 'No strong concern';

  return value;
};

const toConditionLabel = (value?: string | null) => {
  const normalized = (value ?? 'DEFAULT').toUpperCase();
  if (normalized === 'ADHD') return 'ADHD';
  if (normalized === 'ASD') return 'ASD';
  if (normalized === 'DYSLEXIA') return 'Dyslexia';
  if (normalized === 'DYSCALCULIA') return 'Dyscalculia';
  if (normalized === 'ANXIETY') return 'Anxiety';
  if (normalized === 'DEPRESSION') return 'Depression';
  return 'Default';
};

const formatDueDate = (isoDate?: string | null) => {
  if (!isoDate) return 'No due date';

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'No due date';
  return date.toLocaleDateString();
};

const neuroAssignmentStatusTone: Record<string, string> = {
  ASSIGNED: 'border-sky-100 bg-sky-50 text-sky-700',
  IN_PROGRESS: 'border-indigo-100 bg-indigo-50 text-indigo-700',
  SUBMITTED: 'border-amber-100 bg-amber-50 text-amber-700',
  REVIEWED: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  CANCELLED: 'border-slate-200 bg-slate-100 text-slate-700',
};

const getLatestScore = (assignment: NeuroAssignmentItem) => {
  const score = assignment.attempts?.[0]?.score;
  if (typeof score === 'number') {
    return `${Math.round(score)}%`;
  }

  return 'Not submitted';
};

const toAge = (isoDate?: string | null): number => {
  if (!isoDate) return 0;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const month = today.getMonth() - date.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return Math.max(age, 0);
};

const toDateInputValue = (isoDate?: string | null): string => {
  if (!isoDate) {
    return '';
  }

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
};

export function MyChildren() {
  const { token } = useStoredAuth();
  const { guardianStats } = useRealtimeDashboard();

  const [students, setStudents] = useState<GuardianStudent[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [classId, setClassId] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingFullName, setEditingFullName] = useState('');
  const [editingAge, setEditingAge] = useState('');
  const [editingDateOfBirth, setEditingDateOfBirth] = useState('');
  const [isUpdatingStudent, setIsUpdatingStudent] = useState(false);
  const [updateSuccessMessage, setUpdateSuccessMessage] = useState<string | null>(null);
  const [neuroPanels, setNeuroPanels] = useState<
    Record<string, NeuroAssignmentPanelState>
  >({});

  const updateNeuroPanelState = useCallback(
    (
      studentId: string,
      updater: (previous: NeuroAssignmentPanelState) => NeuroAssignmentPanelState,
    ) => {
      setNeuroPanels((current) => {
        const previous = current[studentId] ?? initialNeuroPanelState();
        return {
          ...current,
          [studentId]: updater(previous),
        };
      });
    },
    [],
  );

  const getNeuroPanelState = useCallback(
    (studentId: string) => neuroPanels[studentId] ?? initialNeuroPanelState(),
    [neuroPanels],
  );

  const loadStudents = async () => {
    const response = await guardianApi.getStudents();
    setStudents(response.students ?? []);
  };

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [studentsResponse, schoolsResponse] = await Promise.all([
          guardianApi.getStudents(),
          guardianApi.getSchools(),
        ]);

        setStudents(studentsResponse.students ?? []);
        setSchools(schoolsResponse.schools ?? []);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Failed to load guardian students.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData().catch(() => null);
  }, [token]);

  useEffect(() => {
    if (!schoolId) {
      setClasses([]);
      setClassId('');
      return;
    }

    const loadClasses = async () => {
      try {
        const response = await guardianApi.getSchoolClasses(schoolId);
        setClasses(response.classes ?? []);
      } catch {
        setClasses([]);
      }
    };

    loadClasses().catch(() => null);
  }, [schoolId]);

  const loadStudentNeuroPanelData = useCallback(
    async (studentId: string) => {
      updateNeuroPanelState(studentId, (previous) => ({
        ...previous,
        isLoadingAssignments: true,
        loadError: null,
      }));

      try {
        const [testsResponse, assignmentsResponse] = await Promise.all([
          guardianApi.getAssignableNeuroTests({ limit: 120 }),
          guardianApi.getStudentNeuroAssignments(studentId, {
            scope: 'all',
            limit: 50,
          }),
        ]);

        updateNeuroPanelState(studentId, (previous) => ({
          ...previous,
          tests: testsResponse.tests ?? [],
          assignments: assignmentsResponse.assignments ?? [],
          selectedTestId:
            previous.selectedTestId || testsResponse.tests.length === 0
              ? previous.selectedTestId
              : testsResponse.tests[0].id,
          isLoadingAssignments: false,
          loadError: null,
        }));
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : 'Failed to load neuro tests and assignments for this student.';

        updateNeuroPanelState(studentId, (previous) => ({
          ...previous,
          isLoadingAssignments: false,
          loadError: message,
        }));
      }
    },
    [updateNeuroPanelState],
  );

  const toggleNeuroPanel = useCallback(
    (studentId: string) => {
      const panelState = getNeuroPanelState(studentId);
      const nextOpen = !panelState.isOpen;

      updateNeuroPanelState(studentId, (previous) => ({
        ...previous,
        isOpen: nextOpen,
        assignFeedback: nextOpen ? previous.assignFeedback : null,
      }));

      if (
        nextOpen &&
        panelState.tests.length === 0 &&
        !panelState.isLoadingAssignments
      ) {
        void loadStudentNeuroPanelData(studentId);
      }
    },
    [getNeuroPanelState, loadStudentNeuroPanelData, updateNeuroPanelState],
  );

  const assignNeuroTestToStudent = useCallback(
    async (studentId: string) => {
      const panelState = getNeuroPanelState(studentId);
      if (!panelState.selectedTestId) {
        updateNeuroPanelState(studentId, (previous) => ({
          ...previous,
          assignFeedback: 'Please select a neuro test first.',
        }));
        return;
      }

      updateNeuroPanelState(studentId, (previous) => ({
        ...previous,
        isAssigning: true,
        assignFeedback: null,
      }));

      try {
        await guardianApi.assignNeuroTestToChild({
          testId: panelState.selectedTestId,
          studentId,
          dueAt: panelState.dueAtLocal
            ? new Date(panelState.dueAtLocal).toISOString()
            : null,
          notes: panelState.notes.trim() ? panelState.notes.trim() : null,
          visibleToStudent: true,
        });

        updateNeuroPanelState(studentId, (previous) => ({
          ...previous,
          dueAtLocal: '',
          notes: '',
          isAssigning: false,
          assignFeedback: 'Neuro test assigned successfully.',
        }));

        await loadStudentNeuroPanelData(studentId);
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : 'Failed to assign neuro test.';

        updateNeuroPanelState(studentId, (previous) => ({
          ...previous,
          isAssigning: false,
          assignFeedback: message,
        }));
      }
    },
    [getNeuroPanelState, loadStudentNeuroPanelData, updateNeuroPanelState],
  );

  const onCreateStudent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setUpdateSuccessMessage(null);
    setGeneratedPassword(null);
    setIsSaving(true);

    try {
      const parsedAge = age.trim() ? Number.parseInt(age.trim(), 10) : undefined;
      const normalizedDateOfBirth = dateOfBirth.trim();

      if (!normalizedDateOfBirth && parsedAge === undefined) {
        setError('Please provide child age or date of birth.');
        setIsSaving(false);
        return;
      }

      if (parsedAge !== undefined && (!Number.isFinite(parsedAge) || parsedAge < 3 || parsedAge > 120)) {
        setError('Age must be between 3 and 120.');
        setIsSaving(false);
        return;
      }

      const response = await guardianApi.createStudent({
        fullName,
        email,
        dateOfBirth: normalizedDateOfBirth || undefined,
        age: parsedAge,
        schoolId,
        classId,
      });

      setGeneratedPassword(response.generatedPassword ?? null);
      await loadStudents();

      setFullName('');
      setEmail('');
      setAge('');
      setDateOfBirth('');
      setSchoolId('');
      setClassId('');
      setClasses([]);
      setShowForm(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create student.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const startEditingStudent = (student: GuardianStudent) => {
    setEditingStudentId(student.id);
    setEditingFullName(student.fullName ?? '');
    setEditingAge(toAge(student.dateOfBirth).toString());
    setEditingDateOfBirth(toDateInputValue(student.dateOfBirth));
    setError(null);
    setUpdateSuccessMessage(null);
  };

  const cancelEditingStudent = () => {
    setEditingStudentId(null);
    setEditingFullName('');
    setEditingAge('');
    setEditingDateOfBirth('');
  };

  const onUpdateStudent = async (studentId: string) => {
    setError(null);
    setUpdateSuccessMessage(null);
    setIsUpdatingStudent(true);

    try {
      const payload: {
        fullName?: string;
        dateOfBirth?: string;
        age?: number;
      } = {};

      const trimmedName = editingFullName.trim();
      if (trimmedName.length > 0) {
        payload.fullName = trimmedName;
      }

      const normalizedDateOfBirth = editingDateOfBirth.trim();
      const parsedAge = editingAge.trim() ? Number.parseInt(editingAge.trim(), 10) : undefined;

      if (normalizedDateOfBirth) {
        payload.dateOfBirth = normalizedDateOfBirth;
      } else if (parsedAge !== undefined) {
        if (!Number.isFinite(parsedAge) || parsedAge < 3 || parsedAge > 120) {
          setError('Age must be between 3 and 120.');
          setIsUpdatingStudent(false);
          return;
        }
        payload.age = parsedAge;
      }

      if (!payload.fullName && !payload.dateOfBirth && payload.age === undefined) {
        setError('Please change at least one field before saving.');
        setIsUpdatingStudent(false);
        return;
      }

      await guardianApi.updateStudent(studentId, payload);
      await loadStudents();
      setUpdateSuccessMessage('Child profile updated successfully.');
      cancelEditingStudent();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to update child profile.');
      }
    } finally {
      setIsUpdatingStudent(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-3xl font-semibold text-[#2C3E50]">My Children</h2>
          <p className="text-gray-600 mt-2">Sign in first to load your children and enrollment data.</p>
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-[#2C3E50]">My Children</h2>
          <p className="text-gray-600 mt-1">Connected to `/guardian/students` and enrollment APIs.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-lg border border-[#BFDBFE] bg-[#EBF4FF] px-3 py-1.5 text-xs font-semibold text-[#1D4ED8]">
              Total {formatBadgeCount(guardianStats.childCount, 999)}
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg border border-[#FEF3C7] bg-[#FFFBEB] px-3 py-1.5 text-xs font-semibold text-[#B45309]">
              Pending {formatBadgeCount(guardianStats.pendingEnrollments, 999)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((value) => !value)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-white hover:bg-[#1D4ED8]"
        >
          <Plus size={18} />
          {showForm ? 'Close Form' : 'Add Child'}
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {generatedPassword ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Student created successfully. Generated password: <span className="font-semibold">{generatedPassword}</span>
        </div>
      ) : null}

      {updateSuccessMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {updateSuccessMessage}
        </div>
      ) : null}

      {showForm ? (
        <form onSubmit={onCreateStudent} className="rounded-xl border border-gray-100 bg-white p-5 space-y-4">
          <h3 className="text-lg font-semibold text-[#2C3E50]">Register a New Child</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
              <input
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(event) => setDateOfBirth(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-[11px] text-gray-500">Optional if age is provided.</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Age</label>
              <input
                type="number"
                min={3}
                max={120}
                value={age}
                onChange={(event) => setAge(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="e.g. 10"
              />
              <p className="mt-1 text-[11px] text-gray-500">Optional if date of birth is provided.</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">School</label>
              <select
                required
                value={schoolId}
                onChange={(event) => setSchoolId(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">Select school</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Class</label>
              <select
                required
                value={classId}
                onChange={(event) => setClassId(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                disabled={!schoolId}
              >
                <option value="">Select class</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Create Student
          </button>
        </form>
      ) : null}

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500 flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Loading children...
          </div>
        ) : null}

        {!isLoading && students.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
            No children linked yet.
          </div>
        ) : null}

        {!isLoading
          ? students.map((student) => {
              const enrollmentStatus = student.enrollment?.status ?? 'PENDING';
              const className = student.enrollment?.class?.name ?? 'Unassigned';
              const seat = student.enrollment?.seatNumber ?? 0;
              const neuroPanel = getNeuroPanelState(student.id);

              const pendingAssignments = neuroPanel.assignments.filter(
                (assignment) =>
                  assignment.status === 'ASSIGNED' || assignment.status === 'IN_PROGRESS',
              );

              const reviewedAssignments = neuroPanel.assignments.filter(
                (assignment) =>
                  assignment.status === 'SUBMITTED' || assignment.status === 'REVIEWED',
              );

              const latestAssignment = neuroPanel.assignments[0] ?? null;
              const latestSupportLevel =
                latestAssignment?.attemptPolicy?.latestSupportLevel ?? null;
              const latestSupportLabel = toSupportLevelLabel(latestSupportLevel);
              const isAssignSuccess =
                typeof neuroPanel.assignFeedback === 'string' &&
                neuroPanel.assignFeedback.toLowerCase().includes('successfully');

              return (
                <article
                  key={student.id}
                  className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white flex items-center justify-center text-lg font-semibold">
                        {student.fullName.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-[#2C3E50]">{student.fullName}</h3>
                        <p className="text-sm text-gray-600">{student.email}</p>
                        <p className="text-xs text-gray-500 mt-1">Age {toAge(student.dateOfBirth)} years</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-2 lg:items-end">
                      <button
                        type="button"
                        onClick={() =>
                          editingStudentId === student.id
                            ? cancelEditingStudent()
                            : startEditingStudent(student)
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil size={13} />
                        {editingStudentId === student.id ? 'Cancel edit' : 'Edit child'}
                      </button>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                          enrollmentStatus === 'APPROVED'
                            ? 'bg-green-50 text-green-700 border-green-100'
                            : enrollmentStatus === 'REJECTED'
                              ? 'bg-red-50 text-red-700 border-red-100'
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}
                      >
                        {enrollmentStatus}
                      </span>

                      <button
                        type="button"
                        onClick={() => toggleNeuroPanel(student.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#BFDBFE] bg-[#EBF4FF] px-3 py-1.5 text-xs font-semibold text-[#1D4ED8] hover:bg-[#DBEAFE]"
                      >
                        <Brain size={14} />
                        {neuroPanel.isOpen ? 'Hide neuro tests' : 'Assign neuro test'}
                      </button>
                    </div>
                  </div>

                  {editingStudentId === student.id ? (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-800">Edit Child Profile</p>

                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            Full Name
                          </label>
                          <input
                            value={editingFullName}
                            onChange={(event) => setEditingFullName(event.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            value={editingDateOfBirth}
                            onChange={(event) => setEditingDateOfBirth(event.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            Age
                          </label>
                          <input
                            type="number"
                            min={3}
                            max={120}
                            value={editingAge}
                            onChange={(event) => setEditingAge(event.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void onUpdateStudent(student.id)}
                          disabled={isUpdatingStudent}
                          className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isUpdatingStudent ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Save size={13} />
                          )}
                          Save profile
                        </button>
                        <p className="text-[11px] text-slate-500">
                          Set DOB or age. If both are present, DOB is used.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-lg bg-gray-50 px-4 py-3">
                      <p className="text-xs text-gray-500">School</p>
                      <p className="text-sm font-medium text-gray-700 mt-1">
                        {student.school?.name ?? 'N/A'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-4 py-3">
                      <p className="text-xs text-gray-500">Class</p>
                      <p className="text-sm font-medium text-gray-700 mt-1">{className}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-4 py-3">
                      <p className="text-xs text-gray-500">Seat Number</p>
                      <p className="text-sm font-medium text-gray-700 mt-1">{seat}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={13} />
                      DOB: {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <UserRound size={13} />
                      Student ID: {student.id.slice(0, 8)}...
                    </span>
                  </div>

                  {neuroPanel.isOpen ? (
                    <div className="mt-5 rounded-xl border border-[#DBEAFE] bg-[#F8FBFF] p-4">
                      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Brain size={15} className="text-[#1D4ED8]" />
                            <p className="text-sm font-semibold text-[#1E3A8A]">
                              Assign Neuro Test to {student.fullName}
                            </p>
                          </div>

                          {neuroPanel.loadError ? (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                              {neuroPanel.loadError}
                            </div>
                          ) : null}

                          {neuroPanel.assignFeedback ? (
                            <div
                              className={`rounded-lg border px-3 py-2 text-xs ${
                                isAssignSuccess
                                  ? 'border-green-200 bg-green-50 text-green-700'
                                  : 'border-red-200 bg-red-50 text-red-700'
                              }`}
                            >
                              {neuroPanel.assignFeedback}
                            </div>
                          ) : null}

                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-700">
                                Neuro Test
                              </label>
                              {neuroPanel.tests.length > 0 ? (
                                <p className="mb-1 text-[11px] text-gray-500">
                                  {(() => {
                                    const selectedTest = neuroPanel.tests.find(
                                      (test) => test.id === neuroPanel.selectedTestId,
                                    );
                                    if (!selectedTest) {
                                      return 'Select a test to assign.';
                                    }

                                    const estimated = selectedTest.estimatedMin;
                                    return estimated
                                      ? `Estimated duration: ${estimated} min`
                                      : 'Estimated duration: not specified';
                                  })()}
                                </p>
                              ) : null}
                              <select
                                value={neuroPanel.selectedTestId}
                                onChange={(event) =>
                                  updateNeuroPanelState(student.id, (previous) => ({
                                    ...previous,
                                    selectedTestId: event.target.value,
                                    assignFeedback: null,
                                  }))
                                }
                                disabled={
                                  neuroPanel.isLoadingAssignments ||
                                  neuroPanel.tests.length === 0 ||
                                  neuroPanel.isAssigning
                                }
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                              >
                                {neuroPanel.tests.length === 0 ? (
                                  <option value="">No active neuro tests available</option>
                                ) : null}
                                {neuroPanel.tests.map((test) => (
                                  <option key={test.id} value={test.id}>
                                    {test.title} ({toConditionLabel(test.targetCondition)})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-700">
                                Due Date (optional)
                              </label>
                              <input
                                type="datetime-local"
                                value={neuroPanel.dueAtLocal}
                                onChange={(event) =>
                                  updateNeuroPanelState(student.id, (previous) => ({
                                    ...previous,
                                    dueAtLocal: event.target.value,
                                    assignFeedback: null,
                                  }))
                                }
                                disabled={neuroPanel.isAssigning}
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">
                              Notes for Student (optional)
                            </label>
                            <textarea
                              rows={2}
                              value={neuroPanel.notes}
                              onChange={(event) =>
                                updateNeuroPanelState(student.id, (previous) => ({
                                  ...previous,
                                  notes: event.target.value,
                                  assignFeedback: null,
                                }))
                              }
                              disabled={neuroPanel.isAssigning}
                              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                              placeholder="Example: Please complete this before Friday."
                            />
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() => void assignNeuroTestToStudent(student.id)}
                              disabled={
                                neuroPanel.isAssigning ||
                                neuroPanel.tests.length === 0 ||
                                !neuroPanel.selectedTestId
                              }
                              className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {neuroPanel.isAssigning ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <SendHorizontal size={14} />
                              )}
                              Assign Test
                            </button>

                            <button
                              type="button"
                              onClick={() => void loadStudentNeuroPanelData(student.id)}
                              disabled={
                                neuroPanel.isLoadingAssignments || neuroPanel.isAssigning
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {neuroPanel.isLoadingAssignments ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Clock4 size={13} />
                              )}
                              Refresh
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3 rounded-lg border border-[#E5E7EB] bg-white p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-[#BFDBFE] bg-[#EBF4FF] px-2 py-0.5 text-[11px] font-semibold text-[#1D4ED8]">
                              Pending {pendingAssignments.length}
                            </span>
                            <span className="rounded-full border border-[#DCFCE7] bg-[#F0FDF4] px-2 py-0.5 text-[11px] font-semibold text-[#15803D]">
                              Submitted/Reviewed {reviewedAssignments.length}
                            </span>
                          </div>

                          {latestSupportLabel ? (
                            <div
                              className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${
                                neuroSupportLevelTone[latestSupportLevel ?? ''] ??
                                'border-slate-200 bg-slate-100 text-slate-700'
                              }`}
                            >
                              Latest support signal: {latestSupportLabel}
                            </div>
                          ) : null}

                          {neuroPanel.isLoadingAssignments ? (
                            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-xs text-gray-600">
                              <Loader2 size={14} className="animate-spin" />
                              Loading assignments...
                            </div>
                          ) : neuroPanel.assignments.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-4 text-xs text-gray-500">
                              No neuro assignments for this child yet.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {neuroPanel.assignments.slice(0, 4).map((assignment) => (
                                <div
                                  key={assignment.id}
                                  className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className="text-xs font-semibold text-[#2C3E50]">
                                        {assignment.test?.title ?? assignment.testId}
                                      </p>
                                      <p className="mt-0.5 text-[11px] text-gray-500">
                                        {toConditionLabel(assignment.test?.targetCondition)}
                                      </p>
                                    </div>
                                    <span
                                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                        neuroAssignmentStatusTone[assignment.status] ??
                                        'border-slate-200 bg-slate-100 text-slate-700'
                                      }`}
                                    >
                                      {assignment.status}
                                    </span>
                                  </div>

                                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                                    <span>Due: {formatDueDate(assignment.dueAt)}</span>
                                    <span>Score: {getLatestScore(assignment)}</span>
                                  </div>

                                  {assignment.attemptPolicy?.latestSupportLevel ? (
                                    <div
                                      className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                        neuroSupportLevelTone[
                                          assignment.attemptPolicy.latestSupportLevel
                                        ] ?? 'border-slate-200 bg-slate-100 text-slate-700'
                                      }`}
                                    >
                                      {toSupportLevelLabel(
                                        assignment.attemptPolicy.latestSupportLevel,
                                      )}
                                    </div>
                                  ) : null}
                                </div>
                              ))}

                              {neuroPanel.assignments.length > 4 ? (
                                <p className="text-[11px] text-gray-500">
                                  +{neuroPanel.assignments.length - 4} more assignment(s)
                                </p>
                              ) : null}
                            </div>
                          )}

                          <div className="flex items-start gap-2 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-[11px] text-[#92400E]">
                            <AlertCircle size={13} className="mt-0.5 shrink-0" />
                            Student receives a notification when a new neuro test is assigned.
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })
          : null}
      </div>
    </div>
  );
}
