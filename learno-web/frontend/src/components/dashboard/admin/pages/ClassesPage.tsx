'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { BookPlus, CalendarPlus, Clock3, Layers, Users } from 'lucide-react';
import { ApiError, schoolApi } from '@/lib/api';
import { useStoredAuth } from '@/hooks/useStoredAuth';

type TeacherItem = Awaited<ReturnType<typeof schoolApi.getTeachers>>['teachers'][number];
type ClassItem = Awaited<ReturnType<typeof schoolApi.getClasses>>['classes'][number];
type SubjectItem = Awaited<ReturnType<typeof schoolApi.getSubjects>>['subjects'][number];
type TimetableItem = Awaited<ReturnType<typeof schoolApi.getTimetable>>['timetable'][number];

const DAY_OPTIONS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

const toDayLabel = (day: string) => {
  const lower = day.toLowerCase();
  return `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
};

const toTimeLabel = (value: string) => {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    const hours = String(parsed.getUTCHours()).padStart(2, '0');
    const minutes = String(parsed.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  if (value.length >= 5) {
    return value.slice(0, 5);
  }

  return value;
};

export function ClassesPage() {
  const { user } = useStoredAuth();
  const isSchoolAdmin = user?.role === 'SCHOOL_ADMIN';

  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [timetable, setTimetable] = useState<TimetableItem[]>([]);

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

  const teacherById = useMemo(() => {
    return new Map(teachers.map((teacher) => [teacher.id, teacher.fullName]));
  }, [teachers]);

  const visibleTimetable = useMemo(() => timetable.slice(0, 12), [timetable]);

  const loadData = useCallback(async () => {
    if (!isSchoolAdmin) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [teachersRes, classesRes, subjectsRes, timetableRes] = await Promise.all([
        schoolApi.getTeachers(),
        schoolApi.getClasses(),
        schoolApi.getSubjects(),
        schoolApi.getTimetable(),
      ]);

      setTeachers(teachersRes.teachers);
      setClasses(classesRes.classes);
      setSubjects(subjectsRes.subjects);
      setTimetable(timetableRes.timetable);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load class management data.');
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

      setSuccess('Timetable entry created and teacher assigned to class.');
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

  if (!isSchoolAdmin) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-slate-800 text-lg font-semibold">Classes</h2>
        <p className="mt-2 text-sm text-slate-500">
          This section is available for School Admin accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Classes', value: String(classes.length), sub: 'Registered classes', color: '#6366F1', bg: '#EEF0FD' },
          { label: 'Subjects', value: String(subjects.length), sub: 'Available subjects', color: '#14B8A6', bg: '#F0FDF9' },
          { label: 'Teachers', value: String(teachers.length), sub: 'Assignable teachers', color: '#F59E0B', bg: '#FFFBEB' },
          { label: 'Timetable Slots', value: String(timetable.length), sub: 'Class schedule entries', color: '#3B82F6', bg: '#EFF6FF' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #ECEEF4' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
            </div>
            <p className="text-slate-800" style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>{s.value}</p>
            <p className="text-slate-600 mt-1" style={{ fontSize: '13px', fontWeight: 500 }}>{s.label}</p>
            <p className="text-slate-400 mt-0.5" style={{ fontSize: '12px' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          Loading classes...
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <form onSubmit={onCreateClass} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #ECEEF4' }}>
          <div className="flex items-center gap-2 text-slate-700 mb-4">
            <CalendarPlus size={16} />
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Add Class & Term</h3>
          </div>

          <div className="space-y-3">
            <input
              value={newClassName}
              onChange={(event) => setNewClassName(event.target.value)}
              placeholder="Class name (e.g. Grade 7A)"
              className="w-full rounded-xl px-3 py-2 text-sm"
              style={{ border: '1px solid #ECEEF4', background: '#F8FAFC' }}
              required
            />
            <input
              value={newTermName}
              onChange={(event) => setNewTermName(event.target.value)}
              placeholder="Term (optional, e.g. Term 1)"
              className="w-full rounded-xl px-3 py-2 text-sm"
              style={{ border: '1px solid #ECEEF4', background: '#F8FAFC' }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 rounded-xl px-3.5 py-2 text-white text-sm font-semibold disabled:opacity-60"
            style={{ background: '#81D4FA' }}
          >
            Create Class
          </button>
        </form>

        <form onSubmit={onCreateSubject} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #ECEEF4' }}>
          <div className="flex items-center gap-2 text-slate-700 mb-4">
            <BookPlus size={16} />
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Add Subject</h3>
          </div>

          <input
            value={newSubjectName}
            onChange={(event) => setNewSubjectName(event.target.value)}
            placeholder="Subject name"
            className="w-full rounded-xl px-3 py-2 text-sm"
            style={{ border: '1px solid #ECEEF4', background: '#F8FAFC' }}
            required
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 rounded-xl px-3.5 py-2 text-white text-sm font-semibold disabled:opacity-60"
            style={{ background: '#81D4FA' }}
          >
            Create Subject
          </button>
        </form>
      </div>

      <form onSubmit={onCreateTimetable} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #ECEEF4' }}>
        <h3 className="text-slate-700 mb-4" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
          Assign Teacher to Class + Timetable
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={teacherId}
            onChange={(event) => setTeacherId(event.target.value)}
            className="rounded-xl px-3 py-2 text-sm"
            style={{ border: '1px solid #ECEEF4', background: '#F8FAFC' }}
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
            className="rounded-xl px-3 py-2 text-sm"
            style={{ border: '1px solid #ECEEF4', background: '#F8FAFC' }}
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
            className="rounded-xl px-3 py-2 text-sm"
            style={{ border: '1px solid #ECEEF4', background: '#F8FAFC' }}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          <select
            value={day}
            onChange={(event) => setDay(event.target.value as (typeof DAY_OPTIONS)[number])}
            className="rounded-xl px-3 py-2 text-sm"
            style={{ border: '1px solid #ECEEF4', background: '#F8FAFC' }}
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
            className="rounded-xl px-3 py-2 text-sm"
            style={{ border: '1px solid #ECEEF4', background: '#F8FAFC' }}
            required
          />

          <input
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            className="rounded-xl px-3 py-2 text-sm"
            style={{ border: '1px solid #ECEEF4', background: '#F8FAFC' }}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 rounded-xl px-3.5 py-2 text-white text-sm font-semibold disabled:opacity-60"
          style={{ background: '#81D4FA' }}
        >
          Save Timetable Entry
        </button>
      </form>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #ECEEF4' }}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #ECEEF4' }}>
          <h3 className="text-slate-700" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
            Recent Timetable Entries
          </h3>
        </div>

        {visibleTimetable.length === 0 ? (
          <p className="px-6 py-4 text-sm text-slate-500">No timetable entries yet.</p>
        ) : (
          <div className="divide-y" style={{ borderColor: '#F4F5F8' }}>
            {visibleTimetable.map((entry) => (
              <div key={entry.id} className="px-6 py-3 flex flex-wrap items-center gap-3 justify-between">
                <div className="flex items-center gap-2 text-slate-700">
                  <Layers size={14} className="text-slate-400" />
                  <span className="text-sm font-medium">{entry.class?.name ?? 'Class'}</span>
                  <span className="text-xs text-slate-400">{entry.subject?.name ?? 'Subject'}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Users size={12} />
                    {teacherById.get(entry.teacherId ?? '') ?? 'Teacher'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 size={12} />
                    {toDayLabel(entry.day)} {toTimeLabel(entry.startTime)}-{toTimeLabel(entry.endTime)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
