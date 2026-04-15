'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  CalendarDays,
  Loader2,
  PlayCircle,
  RefreshCw,
  Square,
  Waves,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { FASTAPI_WS_BASE_URL } from '@/lib/config';
import { ApiError, learnoApi, studentApi, teacherApi } from '@/lib/api';
import type { LearnoSession, LessonItem, TeacherDashboard, TimetableEntry } from '@/lib/api/types';
import { useStoredAuth } from '@/hooks/useStoredAuth';
import { connectLearnoSocket } from '@/lib/realtime/socket';

type ConnectionState = 'connected' | 'connecting' | 'disconnected';
type FeedType = 'info' | 'success' | 'warning' | 'error';

interface FeedItem {
  id: string;
  type: FeedType;
  message: string;
  timestamp: string;
}

interface AutoStartPrompt {
  subject: string;
  className: string;
  countdown: number;
}

interface EnvironmentSocketPayload {
  classId?: string | null;
  sessionId?: string | null;
  co2Ppm?: number | null;
  lightLux?: number | null;
  receivedAt?: string;
}

interface LiveEnvironmentState {
  classId: string | null;
  sessionId: string | null;
  co2: number;
  light: number;
  noise: number;
  updatedAt: string | null;
}

const emptyDashboard: TeacherDashboard = {
  teacher: null,
  unreadMessages: 0,
  unreadNotifications: 0,
  nextSession: null,
  totalClasses: 0,
};

const statusClass: Record<ConnectionState, string> = {
  connected: 'bg-green-50 text-green-700 border-green-100',
  connecting: 'bg-amber-50 text-amber-700 border-amber-100',
  disconnected: 'bg-slate-100 text-slate-600 border-slate-200',
};

const feedClass: Record<FeedType, string> = {
  info: 'border-slate-200 bg-slate-50 text-slate-700',
  success: 'border-green-100 bg-green-50 text-green-700',
  warning: 'border-amber-100 bg-amber-50 text-amber-700',
  error: 'border-red-100 bg-red-50 text-red-700',
};

const statusBadgeClass = (status: string) => {
  if (status === 'RECORDING') return 'bg-red-50 text-red-700 border-red-100';
  if (status === 'PROCESSING') return 'bg-amber-50 text-amber-700 border-amber-100';
  if (status === 'WAITING_UPLOAD') return 'bg-sky-50 text-sky-700 border-sky-100';
  if (status === 'COMPLETED') return 'bg-green-50 text-green-700 border-green-100';
  if (status === 'FAILED') return 'bg-red-50 text-red-700 border-red-100';
  return 'bg-slate-100 text-slate-600 border-slate-200';
};

const formatClock = (isoDate?: string | null): string => {
  if (!isoDate) return '--:--';
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoDate));
  } catch {
    return '--:--';
  }
};

const formatDay = (day?: string): string => {
  if (!day) return 'Unknown day';
  const lower = day.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const formatDate = (isoDate?: string | null): string => {
  if (!isoDate) return 'No date';
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoDate));
  } catch {
    return 'No date';
  }
};

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

const formatEnvironmentUpdated = (isoDate?: string | null): string => {
  if (!isoDate) {
    return 'just now';
  }

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return 'just now';
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const statusForCo2 = (value: number): string => {
  if (value >= 1200) {
    return 'High';
  }
  if (value >= 900) {
    return 'Moderate';
  }
  return 'Good';
};

const statusForLight = (value: number): string => {
  if (value <= 20 || value >= 90) {
    return 'Alert';
  }
  if (value <= 30 || value >= 75) {
    return 'Watch';
  }
  return 'Balanced';
};

const hashString = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const buildDemoEnvironmentSample = (
  seedKey: string,
  referenceDate: Date = new Date(),
): { co2: number; light: number; noise: number; updatedAt: string } => {
  const seed = hashString(seedKey);
  const minuteWave = Math.sin(referenceDate.getTime() / 180000 + (seed % 31));
  const secondWave = Math.cos(referenceDate.getTime() / 19000 + (seed % 17));

  const co2Base = 760 + (seed % 170);
  const lightBase = 52 + (seed % 14) - 7;
  const noiseBase = 44 + (seed % 10);

  return {
    co2: clamp(Math.round(co2Base + minuteWave * 120 + secondWave * 24), 520, 1480),
    light: clamp(Math.round(lightBase + minuteWave * 13 + secondWave * 4), 18, 94),
    noise: clamp(Math.round(noiseBase + minuteWave * 7 + secondWave * 2), 34, 75),
    updatedAt: referenceDate.toISOString(),
  };
};

const buildEnvironmentState = (
  classId?: string | null,
  sessionId?: string | null,
  values?: {
    co2?: number | null;
    light?: number | null;
    updatedAt?: string | null;
  },
): LiveEnvironmentState => {
  const sample = buildDemoEnvironmentSample(`${sessionId ?? 'no-session'}:${classId ?? 'no-class'}`);

  return {
    classId: classId ?? null,
    sessionId: sessionId ?? null,
    co2: values?.co2 ?? sample.co2,
    light: values?.light ?? sample.light,
    noise: sample.noise,
    updatedAt: values?.updatedAt ?? sample.updatedAt,
  };
};

const randomId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const defaultErrorMessage = 'Something went wrong while loading dashboard data.';

export function DashboardOverview() {
  const { token, user } = useStoredAuth();

  const [dashboard, setDashboard] = useState<TeacherDashboard>(emptyDashboard);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [sessions, setSessions] = useState<LearnoSession[]>([]);
  const [draftLessons, setDraftLessons] = useState<LessonItem[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socketState, setSocketState] = useState<ConnectionState>('disconnected');
  const [fastApiState, setFastApiState] = useState<ConnectionState>('disconnected');
  const [autoStartPrompt, setAutoStartPrompt] = useState<AutoStartPrompt | null>(null);
  const [liveEnvironment, setLiveEnvironment] = useState<LiveEnvironmentState | null>(null);

  const fastApiSocketRef = useRef<WebSocket | null>(null);
  const fastApiPingRef = useRef<number | null>(null);
  const fastApiReconnectRef = useRef<number | null>(null);
  const backendSocketRef = useRef<ReturnType<typeof connectLearnoSocket> | null>(null);
  const joinedClassIdsRef = useRef<Set<string>>(new Set());
  const joinedSessionIdsRef = useRef<Set<string>>(new Set());

  const activeSession = useMemo(() => {
    const statusPriority: Array<LearnoSession['status']> = [
      'RECORDING',
      'WAITING_UPLOAD',
      'PROCESSING',
    ];

    for (const status of statusPriority) {
      const session = sessions.find((item) => item.status === status);
      if (session) {
        return session;
      }
    }

    return null;
  }, [sessions]);

  const hasRecordingSession = activeSession?.status === 'RECORDING';
  const hasStuckSession =
    activeSession?.status === 'WAITING_UPLOAD' || activeSession?.status === 'PROCESSING';

  const addFeed = useCallback((type: FeedType, message: string) => {
    const item: FeedItem = {
      id: randomId(),
      type,
      message,
      timestamp: new Date().toISOString(),
    };

    setFeed((prev) => [item, ...prev].slice(0, 40));
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [dashboardResult, timetableResult, sessionsResult, draftResult] =
      await Promise.allSettled([
        teacherApi.getDashboard(),
        teacherApi.getTimetable(),
        learnoApi.getSessions(),
        studentApi.getDraftLessons(),
      ]);

    if (dashboardResult.status === 'fulfilled') {
      setDashboard({
        teacher: dashboardResult.value.teacher,
        unreadMessages: dashboardResult.value.unreadMessages ?? 0,
        unreadNotifications: dashboardResult.value.unreadNotifications ?? 0,
        totalClasses: dashboardResult.value.totalClasses ?? 0,
        nextSession: dashboardResult.value.nextSession ?? null,
      });
    } else {
      setDashboard(emptyDashboard);
      setError(dashboardResult.reason instanceof ApiError ? dashboardResult.reason.message : defaultErrorMessage);
    }

    if (timetableResult.status === 'fulfilled') {
      setTimetable(timetableResult.value ?? []);
    } else {
      setTimetable([]);
    }

    if (sessionsResult.status === 'fulfilled') {
      setSessions(sessionsResult.value ?? []);
    } else {
      setSessions([]);
    }

    if (draftResult.status === 'fulfilled') {
      setDraftLessons((draftResult.value ?? []).filter((lesson) => lesson.status === 'DRAFT'));
    } else {
      setDraftLessons([]);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!token || !user) {
      setIsLoading(false);
      return;
    }

    loadData().catch((err) => {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(defaultErrorMessage);
      }
      setIsLoading(false);
    });
  }, [loadData, token, user]);

  useEffect(() => {
    if (!token) {
      return;
    }

    setSocketState('connecting');

    const socket = connectLearnoSocket(token);
    backendSocketRef.current = socket;

    const onConnect = () => {
      setSocketState('connected');
      addFeed('success', 'Backend realtime connected.');

      joinedClassIdsRef.current.forEach((classId) => {
        socket.emit('class:join', classId);
      });
      joinedSessionIdsRef.current.forEach((sessionId) => {
        socket.emit('session:join', sessionId);
      });
    };

    const onDisconnect = () => {
      setSocketState('disconnected');
      addFeed('warning', 'Backend realtime disconnected.');
    };

    const onConnectError = () => {
      setSocketState('disconnected');
      addFeed('error', 'Backend realtime connection error.');
    };

    const onSessionComplete = (payload: {
      sessionId: string;
      engagementBand?: string;
      engagementScore?: number;
    }) => {
      addFeed(
        'success',
        `Session complete (${payload.engagementBand ?? 'N/A'} - ${payload.engagementScore ?? 0}/100).`,
      );
      loadData().catch(() => null);
    };

    const onSessionFailed = (payload: { error?: string }) => {
      addFeed('error', `Session failed: ${payload.error ?? 'Unknown error'}`);
      loadData().catch(() => null);
    };

    const onLearnoAlert = (payload: { message?: string; severity?: string }) => {
      const severity = (payload.severity ?? 'INFO').toUpperCase();
      const type: FeedType =
        severity === 'CRITICAL'
          ? 'error'
          : severity === 'WARNING'
            ? 'warning'
            : 'info';
      addFeed(type, payload.message ?? 'New classroom alert received.');
    };

    const onLessonApproved = (payload: { title?: string }) => {
      addFeed('success', `Lesson approved: ${payload.title ?? 'Untitled lesson'}`);
      loadData().catch(() => null);
    };

    const onEnvironmentUpdate = (payload: EnvironmentSocketPayload) => {
      const nextCo2 = normalizeCo2(payload.co2Ppm);
      const nextLight = normalizeLight(payload.lightLux);

      if (nextCo2 === null && nextLight === null) {
        return;
      }

      setLiveEnvironment((prev) => {
        const updatedAt = payload.receivedAt ?? new Date().toISOString();

        if (!prev) {
          return buildEnvironmentState(payload.classId, payload.sessionId, {
            co2: nextCo2,
            light: nextLight,
            updatedAt,
          });
        }

        const sameSession =
          payload.sessionId && prev.sessionId
            ? payload.sessionId === prev.sessionId
            : false;
        const sameClass =
          payload.classId && prev.classId ? payload.classId === prev.classId : false;

        if (!sameSession && !sameClass) {
          return prev;
        }

        return {
          ...prev,
          classId: payload.classId ?? prev.classId,
          sessionId: payload.sessionId ?? prev.sessionId,
          co2: nextCo2 ?? prev.co2,
          light: nextLight ?? prev.light,
          updatedAt,
        };
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('learno:session_complete', onSessionComplete);
    socket.on('learno:session_failed', onSessionFailed);
    socket.on('learno:alert', onLearnoAlert);
    socket.on('lesson:approved', onLessonApproved);
    socket.on('environment:update', onEnvironmentUpdate);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('learno:session_complete', onSessionComplete);
      socket.off('learno:session_failed', onSessionFailed);
      socket.off('learno:alert', onLearnoAlert);
      socket.off('lesson:approved', onLessonApproved);
      socket.off('environment:update', onEnvironmentUpdate);

      joinedClassIdsRef.current.forEach((classId) => {
        socket.emit('class:leave', classId);
      });
      joinedSessionIdsRef.current.forEach((sessionId) => {
        socket.emit('session:leave', sessionId);
      });

      joinedClassIdsRef.current = new Set();
      joinedSessionIdsRef.current = new Set();

      socket.disconnect();
      backendSocketRef.current = null;
      setSocketState('disconnected');
    };
  }, [addFeed, loadData, token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = backendSocketRef.current;
    if (!socket) {
      return;
    }

    const nextClassIds = new Set<string>();
    const nextSessionIds = new Set<string>();

    if (activeSession?.classId) {
      nextClassIds.add(activeSession.classId);
    }
    if (activeSession?.id) {
      nextSessionIds.add(activeSession.id);
    }

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

    nextSessionIds.forEach((sessionId) => {
      if (!joinedSessionIdsRef.current.has(sessionId)) {
        socket.emit('session:join', sessionId);
      }
    });

    joinedSessionIdsRef.current.forEach((sessionId) => {
      if (!nextSessionIds.has(sessionId)) {
        socket.emit('session:leave', sessionId);
      }
    });

    joinedClassIdsRef.current = nextClassIds;
    joinedSessionIdsRef.current = nextSessionIds;
  }, [activeSession?.classId, activeSession?.id, token]);

  useEffect(() => {
    if (!token || !activeSession?.classId) {
      setLiveEnvironment(null);
      return;
    }

    let cancelled = false;

    teacherApi
      .getClassEnvironmentLatest(activeSession.classId)
      .then((response) => {
        if (cancelled) {
          return;
        }

        const reading = response.reading;
        if (!reading) {
          setLiveEnvironment(
            buildEnvironmentState(activeSession.classId ?? null, activeSession.id, {
              updatedAt: null,
            }),
          );
          return;
        }

        setLiveEnvironment(
          buildEnvironmentState(reading.classId ?? activeSession.classId ?? null, reading.sessionId ?? activeSession.id, {
            co2: normalizeCo2(reading.co2Ppm),
            light: normalizeLight(reading.lightLux),
            updatedAt: reading.receivedAt,
          }),
        );
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setLiveEnvironment(
          buildEnvironmentState(activeSession.classId ?? null, activeSession.id, {
            updatedAt: null,
          }),
        );
      });

    return () => {
      cancelled = true;
    };
  }, [activeSession?.classId, activeSession?.id, token]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    let cancelled = false;

    const clearFastApiTimers = () => {
      if (fastApiPingRef.current) {
        window.clearInterval(fastApiPingRef.current);
        fastApiPingRef.current = null;
      }

      if (fastApiReconnectRef.current) {
        window.clearTimeout(fastApiReconnectRef.current);
        fastApiReconnectRef.current = null;
      }
    };

    const connectFastApi = () => {
      if (cancelled) {
        return;
      }

      setFastApiState('connecting');

      const socket = new WebSocket(`${FASTAPI_WS_BASE_URL}/ws/teacher/${user.id}`);
      fastApiSocketRef.current = socket;

      socket.onopen = () => {
        if (cancelled) {
          return;
        }

        setFastApiState('connected');
        addFeed('success', 'FastAPI realtime connected.');

        fastApiPingRef.current = window.setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30_000);
      };

      socket.onmessage = (event) => {
        if (cancelled) {
          return;
        }

        try {
          const payload = JSON.parse(event.data) as {
            type?: string;
            message?: string;
            seconds?: number;
            countdown?: number;
            timetable?: {
              class?: { name?: string };
              subject?: { name?: string };
            };
          };

          const countdown =
            typeof payload.countdown === 'number'
              ? payload.countdown
              : typeof payload.seconds === 'number'
                ? payload.seconds
                : 0;

          switch (payload.type) {
            case 'connected':
              addFeed('info', payload.message ?? 'FastAPI connected.');
              break;
            case 'upcoming_session':
              addFeed('warning', payload.message ?? 'Upcoming session detected.');
              break;
            case 'auto_start_alert':
              setAutoStartPrompt({
                subject: payload.timetable?.subject?.name ?? 'Scheduled Session',
                className: payload.timetable?.class?.name ?? 'Your class',
                countdown: countdown || 5,
              });
              addFeed('warning', payload.message ?? 'Auto-start alert received.');
              break;
            case 'auto_start_countdown':
              setAutoStartPrompt((prev) =>
                prev
                  ? { ...prev, countdown }
                  : {
                      subject: 'Scheduled Session',
                      className: 'Your class',
                      countdown,
                    },
              );
              addFeed('warning', `Auto-start in ${countdown}s.`);
              break;
            case 'session_auto_started':
              setAutoStartPrompt(null);
              addFeed('success', payload.message ?? 'Session auto-started.');
              loadData().catch(() => null);
              break;
            case 'auto_start_cancelled':
              setAutoStartPrompt(null);
              addFeed('info', payload.message ?? 'Auto-start cancelled.');
              break;
            case 'auto_start_failed':
              setAutoStartPrompt(null);
              addFeed('error', payload.message ?? 'Auto-start failed.');
              break;
            case 'auto_stop_alert':
              addFeed('warning', payload.message ?? 'Auto-stop alert received.');
              break;
            case 'auto_stop_countdown':
              addFeed('warning', `Auto-stop in ${payload.seconds ?? 0}s.`);
              break;
            case 'session_auto_stopped':
              addFeed('info', payload.message ?? 'Session auto-stopped.');
              loadData().catch(() => null);
              break;
            case 'session_missed':
              addFeed('warning', payload.message ?? 'Scheduled session missed.');
              break;
            case 'session_extended':
              addFeed('success', payload.message ?? 'Session extended.');
              break;
            case 'error':
              addFeed('error', payload.message ?? 'FastAPI error.');
              break;
            default:
              break;
          }
        } catch {
          addFeed('warning', 'Received invalid FastAPI realtime payload.');
        }
      };

      socket.onerror = () => {
        if (cancelled) {
          return;
        }

        setFastApiState('disconnected');
        addFeed('error', 'FastAPI realtime connection error.');
      };

      socket.onclose = () => {
        if (cancelled) {
          return;
        }

        setFastApiState('disconnected');
        setAutoStartPrompt(null);
        clearFastApiTimers();
        addFeed('warning', 'FastAPI realtime disconnected. Reconnecting...');
        fastApiReconnectRef.current = window.setTimeout(connectFastApi, 5_000);
      };
    };

    connectFastApi();

    return () => {
      cancelled = true;
      clearFastApiTimers();
      setAutoStartPrompt(null);
      fastApiSocketRef.current?.close();
      fastApiSocketRef.current = null;
      setFastApiState('disconnected');
    };
  }, [addFeed, loadData, user?.id]);

  const startSession = async (entry: TimetableEntry) => {
    setIsMutating(true);
    setError(null);

    try {
      const courseName = entry.subject?.name ?? entry.class?.name ?? 'Class Session';
      const response = await learnoApi.startSession({
        timetableId: entry.id,
        classId: entry.classId,
        subjectId: entry.subjectId,
        courseName,
        scheduledDurationMinutes: 60,
        autoStart: false,
        forceStopPrevious: true,
        now: new Date().toISOString(),
      });

      const fastApiNote = response.fastApiForwarded === false
        ? ` (${response.warning ?? 'FastAPI not reachable'})`
        : '';
      addFeed('success', `Session started (${response.session.id.slice(0, 8)}...)${fastApiNote}.`);
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to start session.');
      }
    } finally {
      setIsMutating(false);
    }
  };

  const stopSession = async () => {
    if (!activeSession || activeSession.status !== 'RECORDING') {
      return;
    }

    setIsMutating(true);
    setError(null);

    try {
      await learnoApi.stopSession({
        sessionId: activeSession.id,
        reason: 'manual_stop',
      });
      addFeed('info', 'Active session stopped. Waiting for upload.');
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to stop session.');
      }
    } finally {
      setIsMutating(false);
    }
  };

  const forceStopStuckSession = async () => {
    if (!activeSession || !hasStuckSession) {
      return;
    }

    const confirmed = window.confirm(
      `Force-stop this stuck session (${activeSession.status})? This marks it as failed.`,
    );
    if (!confirmed) {
      return;
    }

    setIsMutating(true);
    setError(null);

    try {
      await learnoApi.stopSession({
        sessionId: activeSession.id,
        reason: 'force_stop_stuck',
        force: true,
      });
      addFeed('warning', `Session ${activeSession.id.slice(0, 8)} force-stopped.`);
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to force-stop session.');
      }
    } finally {
      setIsMutating(false);
    }
  };

  const approveDraft = async (lessonId: string) => {
    setIsMutating(true);
    setError(null);

    try {
      await studentApi.approveLesson({ lessonId });
      addFeed('success', 'Draft lesson approved and published.');
      await loadData();
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

  const rejectDraft = async (lessonId: string) => {
    const reason = window.prompt('Reason for rejection:', 'Needs revision');
    if (!reason) {
      return;
    }

    setIsMutating(true);
    setError(null);

    try {
      await studentApi.rejectLesson({ lessonId, reason });
      addFeed('warning', 'Draft lesson rejected for revision.');
      await loadData();
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

  const requestFastApiAction = (payload: Record<string, unknown>) => {
    const socket = fastApiSocketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      addFeed('warning', 'FastAPI realtime is not connected.');
      return;
    }

    socket.send(JSON.stringify(payload));
  };

  const cancelAutoStart = () => {
    requestFastApiAction({ type: 'cancel_auto_start' });
    setAutoStartPrompt(null);
  };

  if (!token || !user) {
    return (
      <div className="p-6 max-w-screen-xl mx-auto">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h1 className="text-xl font-bold text-slate-800">Teacher Dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in first to load backend APIs and websocket data.
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
    <div className="p-6 max-w-screen-xl mx-auto space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Live Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Session controls, realtime events, and lesson approvals.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData()}
          disabled={isLoading || isMutating}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-xs text-slate-400">Total Classes</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{dashboard.totalClasses ?? 0}</p>
          <p className="mt-1 text-xs text-slate-500">Across your timetable</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-xs text-slate-400">Unread Messages</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{dashboard.unreadMessages ?? 0}</p>
          <p className="mt-1 text-xs text-slate-500">Guardian conversations</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-xs text-slate-400">Unread Notifications</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{dashboard.unreadNotifications ?? 0}</p>
          <p className="mt-1 text-xs text-slate-500">System + AI alerts</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-xs text-slate-400">Draft Lessons</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{draftLessons.length}</p>
          <p className="mt-1 text-xs text-slate-500">Awaiting your approval</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${statusClass[socketState]}`}>
          {socketState === 'connected' ? <Wifi size={12} /> : <WifiOff size={12} />}
          Backend Socket: {socketState}
        </span>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${statusClass[fastApiState]}`}>
          <Waves size={12} />
          FastAPI WS: {fastApiState}
        </span>
      </div>

      {activeSession ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Live Classroom Environment</p>
              <p className="text-xs text-slate-500">
                {activeSession.class?.name ?? 'Current class'} · Updated {formatEnvironmentUpdated(liveEnvironment?.updatedAt)}
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              {activeSession.status}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-[11px] text-slate-400">CO2</p>
              <p className="text-sm font-semibold text-slate-800">{liveEnvironment?.co2 ?? 0} ppm</p>
              <p className="text-[11px] text-slate-500">{statusForCo2(liveEnvironment?.co2 ?? 0)}</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-[11px] text-slate-400">Light</p>
              <p className="text-sm font-semibold text-slate-800">{liveEnvironment?.light ?? 0}%</p>
              <p className="text-[11px] text-slate-500">{statusForLight(liveEnvironment?.light ?? 0)}</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-[11px] text-slate-400">Noise</p>
              <p className="text-sm font-semibold text-slate-800">{liveEnvironment?.noise ?? 0} dB</p>
              <p className="text-[11px] text-slate-500">Normal</p>
            </div>
          </div>
        </div>
      ) : null}

      {dashboard.nextSession ? (
        <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 flex items-start gap-3">
          <CalendarDays size={16} className="text-sky-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-sky-800">Next Session</p>
            <p className="text-sm text-sky-700">
              {dashboard.nextSession.class?.name ?? 'Class'} · {dashboard.nextSession.subject?.name ?? 'Subject'}
            </p>
            <p className="text-xs text-sky-600 mt-1">
              {formatDay(dashboard.nextSession.day)} · {formatClock(dashboard.nextSession.startTime)} - {formatClock(dashboard.nextSession.endTime)}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="xl:col-span-2 bg-white rounded-xl border border-slate-100 overflow-hidden">
          <header className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800">Today&apos;s Timetable</h2>
              <p className="text-xs text-slate-500 mt-0.5">Start sessions directly from your schedule</p>
            </div>
            <span className="text-xs text-slate-400">{timetable.length} entries</span>
          </header>

          <div className="divide-y divide-slate-100">
            {isLoading ? (
              <div className="px-5 py-4 text-sm text-slate-500 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Loading timetable...
              </div>
            ) : null}

            {!isLoading && timetable.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                No timetable entries found.
              </div>
            ) : null}

            {timetable.map((entry) => (
              <div key={entry.id} className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {entry.subject?.name ?? 'Subject'} · {entry.class?.name ?? 'Class'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatDay(entry.day)} · {formatClock(entry.startTime)} - {formatClock(entry.endTime)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => startSession(entry)}
                  disabled={isMutating || isLoading || hasRecordingSession}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PlayCircle size={13} />
                  Start Session
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-100 p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-slate-800">Active Session</h2>
            <p className="text-xs text-slate-500 mt-0.5">Monitor current recording state</p>
          </div>

          {activeSession ? (
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {activeSession.subject?.name ?? 'Session'} · {activeSession.class?.name ?? 'Class'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Started {formatDate(activeSession.actualStart)}
                  </p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClass(activeSession.status)}`}>
                  {activeSession.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <p className="text-slate-400">Engagement</p>
                  <p className="font-semibold text-slate-700">{activeSession.engagementScore ?? 0}/100</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <p className="text-slate-400">Duration</p>
                  <p className="font-semibold text-slate-700">{activeSession.durationMinutes ?? 0} min</p>
                </div>
              </div>

              {activeSession.status === 'RECORDING' ? (
                <button
                  type="button"
                  onClick={stopSession}
                  disabled={isMutating}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Square size={13} />
                  Stop Active Session
                </button>
              ) : null}

              {hasStuckSession ? (
                <button
                  type="button"
                  onClick={forceStopStuckSession}
                  disabled={isMutating}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Square size={13} />
                  Force Stop Stuck Session
                </button>
              ) : null}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={cancelAutoStart}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel Auto-start
                </button>
                <button
                  type="button"
                  onClick={() =>
                    requestFastApiAction({
                      type: 'extend_session',
                      session_id: activeSession.id,
                      minutes: 15,
                    })
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Extend +15 min
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No active session right now.
            </div>
          )}

          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">Pending Drafts</h3>
            <div className="mt-2 space-y-2">
              {draftLessons.length === 0 ? (
                <p className="text-xs text-slate-500">No pending lesson drafts.</p>
              ) : null}

              {draftLessons.slice(0, 3).map((lesson) => (
                <div key={lesson.id} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                  <p className="text-sm font-medium text-slate-700 line-clamp-2">
                    {lesson.title || 'Untitled draft lesson'}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => approveDraft(lesson.id)}
                      disabled={isMutating}
                      className="flex-1 rounded-md bg-green-500 px-2 py-1.5 text-xs font-semibold text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectDraft(lesson.id)}
                      disabled={isMutating}
                      className="flex-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <header className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800">Realtime Feed</h2>
            <p className="text-xs text-slate-500 mt-0.5">Socket + FastAPI events</p>
          </div>
          <Activity size={16} className="text-slate-400" />
        </header>

        <div className="max-h-72 overflow-y-auto px-4 py-3 space-y-2">
          {feed.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              Events will appear here once sessions and sockets are active.
            </div>
          ) : null}

          {feed.map((item) => (
            <div
              key={item.id}
              className={`rounded-lg border px-3 py-2 ${feedClass[item.type]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{item.message}</p>
                <span className="text-[11px] opacity-70 whitespace-nowrap">
                  {formatClock(item.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {autoStartPrompt ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-sky-200 bg-white p-5 shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">Auto-start alert</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {autoStartPrompt.subject}
            </p>
            <p className="mt-1 text-sm text-slate-600">{autoStartPrompt.className}</p>
            <p className="mt-4 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-center text-sm font-medium text-sky-700">
              Starts in {autoStartPrompt.countdown}s
            </p>
            <button
              type="button"
              onClick={cancelAutoStart}
              className="mt-4 w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              Cancel Auto-start
            </button>
          </div>
        </div>
      ) : null}

      {isMutating ? (
        <div className="fixed bottom-5 right-5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-lg flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" />
          Updating...
        </div>
      ) : null}
    </div>
  );
}
