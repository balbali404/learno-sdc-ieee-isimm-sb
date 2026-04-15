'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookPlus, CalendarPlus, UserMinus, UserRoundCheck, XCircle } from 'lucide-react';
import { ApiError, schoolApi } from '@/lib/api';
import { useStoredAuth } from '@/hooks/useStoredAuth';

type TeacherItem = Awaited<ReturnType<typeof schoolApi.getTeachers>>['teachers'][number];
type ClassItem = Awaited<ReturnType<typeof schoolApi.getClasses>>['classes'][number];
type SubjectItem = Awaited<ReturnType<typeof schoolApi.getSubjects>>['subjects'][number];
type StudentItem = Awaited<ReturnType<typeof schoolApi.getStudents>>['students'][number];
type PendingEnrollment = Awaited<ReturnType<typeof schoolApi.getPendingEnrollments>>['enrollments'][number];

const DAY_OPTIONS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export function AdminManagementPanel() {
  const { user } = useStoredAuth();

  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<PendingEnrollment[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newClassName, setNewClassName] = useState('');
  const [newTermName, setNewTermName] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');

  const [teacherId, setTeacherId] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [day, setDay] = useState<(typeof DAY_OPTIONS)[number]>('MONDAY');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');

  const [studentIdToRemove, setStudentIdToRemove] = useState('');
  const [seatNumbers, setSeatNumbers] = useState<Record<string, string>>({});

  const isSchoolAdmin = user?.role === 'SCHOOL_ADMIN';

  const visiblePending = useMemo(() => pendingEnrollments.slice(0, 3), [pendingEnrollments]);

  const loadData = useCallback(async () => {
    if (!isSchoolAdmin) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [teachersRes, classesRes, subjectsRes, studentsRes, pendingRes] = await Promise.all([
        schoolApi.getTeachers(),
        schoolApi.getClasses(),
        schoolApi.getSubjects(),
        schoolApi.getStudents(),
        schoolApi.getPendingEnrollments(),
      ]);

      setTeachers(teachersRes.teachers);
      setClasses(classesRes.classes);
      setSubjects(subjectsRes.subjects);
      setStudents(studentsRes.students);
      setPendingEnrollments(pendingRes.enrollments);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load management data.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isSchoolAdmin]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onCreateClass = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newClassName.trim()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const composedName = newTermName.trim()
        ? `${newClassName.trim()} - ${newTermName.trim()}`
        : newClassName.trim();

      await schoolApi.createClass({ name: composedName });
      setSuccess('Class created successfully.');
      setNewClassName('');
      setNewTermName('');
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create class.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCreateSubject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newSubjectName.trim()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await schoolApi.createSubject({ name: newSubjectName.trim() });
      setSuccess('Subject created successfully.');
      setNewSubjectName('');
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create subject.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCreateTimetable = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!teacherId || !classId || !subjectId) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await schoolApi.createTimetable({
        teacherId,
        classId,
        subjectId,
        day,
        startTime,
        endTime,
      });

      setSuccess('Timetable entry created and teacher assigned.');
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create timetable entry.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRemoveStudent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!studentIdToRemove) {
      return;
    }

    if (!window.confirm('Remove this student account? This cannot be undone.')) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await schoolApi.removeStudent(studentIdToRemove);
      setSuccess('Student removed successfully.');
      setStudentIdToRemove('');
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to remove student.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEnrollmentAction = async (enrollmentId: string, action: 'APPROVED' | 'REJECTED') => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      let seatNumber: number | undefined;
      if (action === 'APPROVED') {
        const seatRaw = seatNumbers[enrollmentId] ?? '1';
        const parsedSeat = Number(seatRaw);
        if (!Number.isFinite(parsedSeat) || parsedSeat < 1) {
          setError('Seat number must be at least 1.');
          setIsSubmitting(false);
          return;
        }

        seatNumber = Math.floor(parsedSeat);
      }

      await schoolApi.handleEnrollment({ enrollmentId, action, seatNumber });
      setSuccess(action === 'APPROVED' ? 'Enrollment approved.' : 'Enrollment rejected.');
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to process enrollment action.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isSchoolAdmin) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-slate-800" style={{ fontSize: '0.95rem', fontWeight: 700 }}>
          School Operations
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Direct class and timetable actions are available for School Admin accounts.
        </p>
        <div className="mt-3">
          <Link href="/admin/teachers" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
            Open teachers page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-slate-800" style={{ fontSize: '0.95rem', fontWeight: 700 }}>
            Quick School Operations
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Add class/term, create subjects, assign teachers with timetable, and manage students.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      {isLoading ? <p className="text-sm text-slate-500">Loading operations data...</p> : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <form onSubmit={onCreateClass} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-slate-800">
            <CalendarPlus size={16} />
            <p className="text-sm font-semibold">Add Class & Term</p>
          </div>

          <input
            value={newClassName}
            onChange={(event) => setNewClassName(event.target.value)}
            placeholder="Class name (e.g. Grade 7A)"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            required
          />
          <input
            value={newTermName}
            onChange={(event) => setNewTermName(event.target.value)}
            placeholder="Term (optional, e.g. Term 1)"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Create Class
          </button>
        </form>

        <form onSubmit={onCreateSubject} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-slate-800">
            <BookPlus size={16} />
            <p className="text-sm font-semibold">Add Subject</p>
          </div>

          <input
            value={newSubjectName}
            onChange={(event) => setNewSubjectName(event.target.value)}
            placeholder="Subject name"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            required
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Create Subject
          </button>
        </form>
      </div>

      <form onSubmit={onCreateTimetable} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
        <p className="text-sm font-semibold text-slate-800">Assign Teacher to Class (Timetable)</p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <select
            value={teacherId}
            onChange={(event) => setTeacherId(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            required
          >
            <option value="">Select teacher</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.fullName}
              </option>
            ))}
          </select>

          <select
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            required
          >
            <option value="">Select class</option>
            {classes.map((klass) => (
              <option key={klass.id} value={klass.id}>
                {klass.name}
              </option>
            ))}
          </select>

          <select
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            required
          >
            <option value="">Select subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <select
            value={day}
            onChange={(event) => setDay(event.target.value as (typeof DAY_OPTIONS)[number])}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {DAY_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <input
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            required
          />

          <input
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-3 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Save Timetable Entry
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <form onSubmit={onRemoveStudent} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-slate-800">
            <UserMinus size={16} />
            <p className="text-sm font-semibold">Student Management</p>
          </div>

          <select
            value={studentIdToRemove}
            onChange={(event) => setStudentIdToRemove(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Select student to remove</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.fullName} ({student.email})
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={isSubmitting || !studentIdToRemove}
            className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Remove Student
          </button>

          <Link href="/admin/students" className="block text-xs font-semibold text-sky-700 hover:text-sky-800">
            Open full student management
          </Link>
        </form>

        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <div className="flex items-center gap-2 text-slate-800">
            <UserRoundCheck size={16} />
            <p className="text-sm font-semibold">Pending Enrollments</p>
          </div>

          {visiblePending.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No pending enrollments.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {visiblePending.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-sm font-semibold text-slate-800">{item.student.fullName}</p>
                  <p className="text-xs text-slate-500">{item.class.name} · {item.student.email}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={seatNumbers[item.id] ?? '1'}
                      onChange={(event) =>
                        setSeatNumbers((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                    />

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => void onEnrollmentAction(item.id, 'APPROVED')}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      Approve
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => void onEnrollmentAction(item.id, 'REJECTED')}
                      className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link href="/admin/students" className="mt-3 block text-xs font-semibold text-sky-700 hover:text-sky-800">
            Open full enrollment management
          </Link>
        </div>
      </div>
    </div>
  );
}
