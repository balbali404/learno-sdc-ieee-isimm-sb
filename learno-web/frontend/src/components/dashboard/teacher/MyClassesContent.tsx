'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Clock3, Loader2, Users } from 'lucide-react';
import { ApiError, teacherApi } from '@/lib/api';
import type { TeacherClassSummary } from '@/lib/api/types';
import { useStoredAuth } from '@/hooks/useStoredAuth';
import { connectLearnoSocket } from '@/lib/realtime/socket';

const formatTime = (isoDate: string): string => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoDate));
  } catch {
    return '--:--';
  }
};

const formatSchedule = (
  schedule: TeacherClassSummary['schedules'][number] | undefined,
): string => {
  if (!schedule) {
    return 'No schedule';
  }

  return `${schedule.day} · ${formatTime(schedule.startTime)}-${formatTime(schedule.endTime)}`;
};

interface EnvironmentSocketPayload {
  classId?: string | null;
  co2Ppm?: number | null;
  lightLux?: number | null;
  receivedAt?: string;
}

interface ClassEnvironmentSnapshot {
  co2: number;
  light: number;
  updatedAt: string | null;
}

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

const normalizeCo2 = (value: number | null | undefined): number | null => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }

  return clamp(Math.round(value), 400, 2200);
};

const normalizeLight = (value: number | null | undefined): number | null => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }

  const asPercent = value <= 100 ? value : (value / 800) * 100;
  return clamp(Math.round(asPercent), 0, 100);
};

const formatUpdatedTime = (value?: string | null): string => {
  if (!value) {
    return 'just now';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'just now';
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export function MyClassesContent() {
  const { token } = useStoredAuth();
  const [classes, setClasses] = useState<TeacherClassSummary[]>([]);
  const [environmentByClass, setEnvironmentByClass] = useState<Record<string, ClassEnvironmentSnapshot>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<ReturnType<typeof connectLearnoSocket> | null>(null);
  const joinedClassIdsRef = useRef<Set<string>>(new Set());

  const classIds = useMemo(() => classes.map((item) => item.id), [classes]);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const loadClasses = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await teacherApi.getClasses();
        const nextClasses = response ?? [];
        setClasses(nextClasses);

        const environmentResults = await Promise.allSettled(
          nextClasses.map(async (item) => {
            const response = await teacherApi.getClassEnvironmentLatest(item.id);
            return { classId: item.id, reading: response.reading };
          }),
        );

        const nextEnvironmentByClass: Record<string, ClassEnvironmentSnapshot> = {};
        environmentResults.forEach((result) => {
          if (result.status !== 'fulfilled') {
            return;
          }

          const { classId, reading } = result.value;
          if (!reading) {
            return;
          }

          nextEnvironmentByClass[classId] = {
            co2: normalizeCo2(reading.co2Ppm) ?? 0,
            light: normalizeLight(reading.lightLux) ?? 0,
            updatedAt: reading.receivedAt,
          };
        });

        setEnvironmentByClass(nextEnvironmentByClass);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Failed to load classes.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadClasses().catch(() => null);
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = connectLearnoSocket(token);
    socketRef.current = socket;

    const onConnect = () => {
      joinedClassIdsRef.current.forEach((classId) => {
        socket.emit('class:join', classId);
      });
    };

    const onEnvironmentUpdate = (payload: EnvironmentSocketPayload) => {
      if (!payload.classId) {
        return;
      }

      const nextCo2 = normalizeCo2(payload.co2Ppm);
      const nextLight = normalizeLight(payload.lightLux);
      if (nextCo2 === null && nextLight === null) {
        return;
      }

      setEnvironmentByClass((prev) => {
        const current = prev[payload.classId!];
        const updatedAt = payload.receivedAt ?? new Date().toISOString();

        return {
          ...prev,
          [payload.classId!]: {
            co2: nextCo2 ?? current?.co2 ?? 0,
            light: nextLight ?? current?.light ?? 0,
            updatedAt,
          },
        };
      });
    };

    socket.on('connect', onConnect);
    socket.on('environment:update', onEnvironmentUpdate);

    return () => {
      socket.off('connect', onConnect);
      socket.off('environment:update', onEnvironmentUpdate);

      joinedClassIdsRef.current.forEach((classId) => {
        socket.emit('class:leave', classId);
      });
      joinedClassIdsRef.current = new Set();

      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = socketRef.current;
    if (!socket) {
      return;
    }

    const nextClassIds = new Set(classIds);

    nextClassIds.forEach((classId) => {
      if (!joinedClassIdsRef.current.has(classId)) {
        socket.emit('class:join', classId);
      }
    });

    joinedClassIdsRef.current.forEach((classId) => {
      if (!nextClassIds.has(classId)) {
        socket.emit('class:leave', classId);
      }
    });

    joinedClassIdsRef.current = nextClassIds;
  }, [classIds, token]);

  if (!token) {
    return (
      <div className="p-6 max-w-screen-xl mx-auto">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h1 className="text-xl font-bold text-slate-800">My Classes</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in first to load your classes.</p>
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
      <div>
        <h1 className="text-xl font-bold text-slate-800">My Classes</h1>
        <p className="text-sm text-slate-500 mt-1">Live data from `/teacher/classes`.</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" />
          Loading classes...
        </div>
      ) : null}

      {!isLoading && classes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No classes assigned yet.
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classes.map((item) => (
          <article
            key={item.id}
            className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:border-slate-200 transition-all"
          >
            <div className="bg-[#54C3EF] px-5 py-4 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">{item.name}</h2>
                  <p className="text-white/80 text-sm mt-0.5">
                    {item.subjects.length > 0 ? item.subjects.join(', ') : 'No subjects yet'}
                  </p>
                </div>
                <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
                  Active
                </span>
              </div>

              <div className="mt-3 flex items-center gap-4 text-sm text-white/90">
                <span className="inline-flex items-center gap-1.5">
                  <Users size={13} className="text-white/80" />
                  {item.studentCount ?? 0} students
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 size={13} className="text-white/80" />
                  {formatSchedule(item.schedules[0])}
                </span>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <p className="text-xs text-slate-400">Environment</p>
                <p className="mt-1 text-sm text-slate-600">
                  CO2 {environmentByClass[item.id]?.co2 ?? 0} ppm · Light {environmentByClass[item.id]?.light ?? 0}%
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Updated {formatUpdatedTime(environmentByClass[item.id]?.updatedAt)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Weekly Schedules</p>
                <ul className="mt-1 space-y-1 text-sm text-slate-600">
                  {item.schedules.length === 0 ? (
                    <li>No schedules configured.</li>
                  ) : null}
                  {item.schedules.map((schedule, index) => (
                    <li key={`${schedule.day}-${index}`}>
                      {formatSchedule(schedule)}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs text-slate-400">Subjects</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {item.subjects.length === 0 ? (
                    <span className="text-xs text-slate-400">No subjects</span>
                  ) : null}
                  {item.subjects.map((subject) => (
                    <span
                      key={`${item.id}-${subject}`}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
