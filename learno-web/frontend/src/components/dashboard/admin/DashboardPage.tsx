'use client';

import { useEffect, useRef, useState } from "react";
import { adminApi } from "@/lib/api/admin";
import type { AdminDashboardResponse } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/http";
import { useStoredAuth } from "@/hooks/useStoredAuth";
import { connectLearnoSocket } from "@/lib/realtime/socket";
import { SummaryCards } from "./SummaryCards";
import { AnalyticsSection } from "./AnalyticsSection";
import { TeachersTable } from "./TeachersTable";
import { AlertsPanel } from "./AlertsPanel";
import { StudentSupport } from "./StudentSupport";
import { Sparkles } from "lucide-react";

const emptyData: AdminDashboardResponse = {
  greeting: {
    adminName: "Administrator",
    dateLabel: "",
    schoolName: "School",
    alertsCount: 0,
  },
  summary: {
    totalStudents: 0,
    activeClasses: 0,
    alertsToday: 0,
    teachersActive: 0,
    totalStudentsTrend: 0,
    activeClassesTrend: 0,
    alertsTrend: 0,
    teachersTrend: 0,
    avgEngagement: 0,
    avgAttention: 0,
  },
  analytics: {
    engagementTrend: [],
    environmentTrend: [],
    environmentSnapshot: { noise: 45, co2: 420, light: 55, updatedAt: new Date().toISOString() },
    environmentAverage: { noise: 45, co2: 420, light: 55, updatedAt: new Date().toISOString() },
    attentionByClass: [],
  },
  teachers: [],
  alerts: [],
  support: {
    needsAttention: [],
    behavioralPatterns: [],
    interventions: [],
  },
};

const DASHBOARD_REFRESH_MS = 5_000;

interface EnvironmentSocketPayload {
  classId?: string | null;
  sessionId?: string | null;
  co2Ppm?: number | null;
  lightLux?: number | null;
  receivedAt?: string;
}

interface LiveSessionEnvironmentItem {
  sessionId: string;
  classId?: string | null;
  className: string;
  teacherId: string;
  teacherName: string;
  status: string;
  startedAt: string;
  co2: number;
  light: number;
  noise: number;
  updatedAt?: string | null;
}

interface EnvironmentAverage {
  noise: number;
  co2: number;
  light: number;
  updatedAt: string;
}

type EnvironmentMetric = "co2" | "light";

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

const normalizeCo2 = (value: number | null | undefined): number | null => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return clamp(Math.round(value), 400, 2200);
};

const normalizeLight = (value: number | null | undefined): number | null => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  const asPercent = value <= 100 ? value : (value / 800) * 100;
  return clamp(Math.round(asPercent), 0, 100);
};

const formatTrendTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "Now";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const classifyPriority = (
  metric: EnvironmentMetric,
  value: number,
): "high" | "medium" | "low" => {
  if (metric === "co2") {
    if (value >= 1200) {
      return "high";
    }
    if (value >= 900) {
      return "medium";
    }
    return "low";
  }

  if (value <= 20 || value >= 90) {
    return "high";
  }
  if (value <= 30 || value >= 75) {
    return "medium";
  }
  return "low";
};

const buildEnvironmentAlert = (
  metric: EnvironmentMetric,
  value: number,
  className: string,
  sessionId: string,
  updatedAt: string,
): AdminDashboardResponse["alerts"][number] | null => {
  const priority = classifyPriority(metric, value);
  if (priority === "low") {
    return null;
  }

  if (metric === "co2") {
    const title = value >= 1200 ? "High CO2" : "Elevated CO2";
    return {
      id: `env-live-${sessionId}-${metric}`,
      title,
      desc: `Current CO2 is ${value} ppm. (${className})`,
      type: "CO2",
      room: className,
      time: formatTrendTime(updatedAt),
      priority,
      status: "open",
      metric,
      value,
      unit: "ppm",
      className,
      sessionId,
    };
  }

  let title = "Light Imbalance";
  if (value <= 20) {
    title = "Low Light";
  }
  if (value >= 90) {
    title = "Excessive Light";
  }

  return {
    id: `env-live-${sessionId}-${metric}`,
    title,
    desc: `Current light level is ${value}%. (${className})`,
    type: "LIGHT",
    room: className,
    time: formatTrendTime(updatedAt),
    priority,
    status: "open",
    metric,
    value,
    unit: "%",
    className,
    sessionId,
  };
};

export function DashboardPage() {
  const { token } = useStoredAuth();
  const [data, setData] = useState(emptyData);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);
  const socketRef = useRef<ReturnType<typeof connectLearnoSocket> | null>(null);
  const joinedClassIdsRef = useRef<Set<string>>(new Set());
  const joinedSessionIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!token) {
      return;
    }

    const load = async () => {
      if (inFlightRef.current) {
        return;
      }

      inFlightRef.current = true;
      try {
        const response = await adminApi.getDashboard();
        setData(response);
        setError(null);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Failed to load admin dashboard data.");
        }
      } finally {
        inFlightRef.current = false;
      }
    };

    load().catch(() => null);

    const intervalId = window.setInterval(() => {
      load().catch(() => null);
    }, DASHBOARD_REFRESH_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = connectLearnoSocket(token);
    socketRef.current = socket;

    const onConnect = () => {
      joinedClassIdsRef.current.forEach((classId) => {
        socket.emit("class:join", classId);
      });
      joinedSessionIdsRef.current.forEach((sessionId) => {
        socket.emit("session:join", sessionId);
      });
    };

    const onEnvironmentUpdate = (payload: EnvironmentSocketPayload) => {
      const nextCo2 = normalizeCo2(payload.co2Ppm);
      const nextLight = normalizeLight(payload.lightLux);
      if (nextCo2 === null && nextLight === null) {
        return;
      }

      const updatedAt = payload.receivedAt ?? new Date().toISOString();

      setData((prev) => {
        const liveSessions: LiveSessionEnvironmentItem[] =
          prev.analytics.liveSessionEnvironment ?? [];
        const matchesSession = (session: LiveSessionEnvironmentItem): boolean => {
          const bySession = Boolean(payload.sessionId) && session.sessionId === payload.sessionId;
          const byClass = Boolean(payload.classId) && session.classId === payload.classId;
          return bySession || byClass;
        };

        const hasMatchingSession = liveSessions.some(matchesSession);
        if (!hasMatchingSession) {
          return prev;
        }

        const nextLiveSessions = liveSessions.map((session) => {
          if (!matchesSession(session)) {
            return session;
          }

          return {
            ...session,
            co2: nextCo2 ?? session.co2,
            light: nextLight ?? session.light,
            updatedAt,
          };
        });

        const matchedSession = nextLiveSessions.find(matchesSession) ?? null;

        const avgLiveCo2 = nextLiveSessions.length
          ? Math.round(
              nextLiveSessions.reduce((sum, item) => sum + item.co2, 0) /
                nextLiveSessions.length,
            )
          : 0;
        const avgLiveLight = nextLiveSessions.length
          ? Math.round(
              nextLiveSessions.reduce((sum, item) => sum + item.light, 0) /
                nextLiveSessions.length,
            )
          : 0;
        const avgLiveNoise = nextLiveSessions.length
          ? Math.round(
              nextLiveSessions.reduce((sum, item) => sum + item.noise, 0) /
                nextLiveSessions.length,
            )
          : 0;

        const currentSnapshot = prev.analytics.environmentSnapshot ?? {
          noise: 0,
          co2: avgLiveCo2,
          light: avgLiveLight,
          updatedAt,
        };

        const nextSnapshot = {
          ...currentSnapshot,
          co2: nextCo2 ?? avgLiveCo2,
          light: nextLight ?? avgLiveLight,
          updatedAt,
        };

        const nextTrend = [
          ...prev.analytics.environmentTrend,
          {
            time: formatTrendTime(updatedAt),
            noise: nextSnapshot.noise,
            co2: nextSnapshot.co2,
            light: nextSnapshot.light,
          },
        ].slice(-12);

        let nextAlerts = prev.alerts;
        if (matchedSession) {
          const alertSessionId = matchedSession.sessionId;
          const alertClassName = matchedSession.className;

          const filtered = prev.alerts.filter((alert) => {
            if (!alert.metric) {
              return true;
            }

            if (alert.metric !== "co2" && alert.metric !== "light") {
              return true;
            }

            const sameSession = alert.sessionId === alertSessionId;
            const sameClass = alert.className === alertClassName;
            return !(sameSession || sameClass);
          });

          const generated = [
            buildEnvironmentAlert(
              "co2",
              matchedSession.co2,
              alertClassName,
              alertSessionId,
              updatedAt,
            ),
            buildEnvironmentAlert(
              "light",
              matchedSession.light,
              alertClassName,
              alertSessionId,
              updatedAt,
            ),
          ].filter(
            (
              alert,
            ): alert is AdminDashboardResponse["alerts"][number] =>
              Boolean(alert),
          );

          nextAlerts = [...generated, ...filtered].slice(0, 10);
        }

        return {
          ...prev,
          summary: {
            ...prev.summary,
            liveSessions: nextLiveSessions.length,
            avgLiveCo2,
            avgLiveLight,
            avgLiveNoise,
          },
          analytics: {
            ...prev.analytics,
            liveSessionEnvironment: nextLiveSessions,
            environmentSnapshot: nextSnapshot,
            environmentTrend: nextTrend,
          },
          alerts: nextAlerts,
        };
      });
    };

    socket.on("connect", onConnect);
    socket.on("environment:update", onEnvironmentUpdate);

    return () => {
      socket.off("connect", onConnect);
      socket.off("environment:update", onEnvironmentUpdate);

      joinedClassIdsRef.current.forEach((classId) => {
        socket.emit("class:leave", classId);
      });
      joinedSessionIdsRef.current.forEach((sessionId) => {
        socket.emit("session:leave", sessionId);
      });

      joinedClassIdsRef.current = new Set();
      joinedSessionIdsRef.current = new Set();

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

    const liveSessions = data.analytics.liveSessionEnvironment ?? [];
    const nextClassIds = new Set<string>();
    const nextSessionIds = new Set<string>();

    liveSessions.forEach((session) => {
      if (session.classId) {
        nextClassIds.add(session.classId);
      }
      if (session.sessionId) {
        nextSessionIds.add(session.sessionId);
      }
    });

    nextClassIds.forEach((classId) => {
      if (!joinedClassIdsRef.current.has(classId)) {
        socket.emit("class:join", classId);
      }
    });

    joinedClassIdsRef.current.forEach((classId) => {
      if (!nextClassIds.has(classId)) {
        socket.emit("class:leave", classId);
      }
    });

    nextSessionIds.forEach((sessionId) => {
      if (!joinedSessionIdsRef.current.has(sessionId)) {
        socket.emit("session:join", sessionId);
      }
    });

    joinedSessionIdsRef.current.forEach((sessionId) => {
      if (!nextSessionIds.has(sessionId)) {
        socket.emit("session:leave", sessionId);
      }
    });

    joinedClassIdsRef.current = nextClassIds;
    joinedSessionIdsRef.current = nextSessionIds;
  }, [data.analytics.liveSessionEnvironment, token]);

  return (
    <div className="space-y-6">
      {/* Welcome banner — light & airy */}
      <div
        className="rounded-2xl px-6 py-5 flex items-center justify-between"
        style={{
          background: "linear-gradient(135deg, #EEF0FD 0%, #F7F8FF 60%, #F0F4FF 100%)",
          border: "1px solid #E0E3F8",
        }}
        >
          <div>
            <p className="text-slate-500" style={{ fontSize: "13px" }}>Good morning,</p>
            <h2 className="text-slate-800 mt-0.5" style={{ fontSize: "1.15rem", fontWeight: 700 }}>
              Welcome back, {data.greeting.adminName} 👋
            </h2>
            <p className="text-slate-500 mt-1" style={{ fontSize: "13px" }}>
              {data.greeting.dateLabel || "Today"} · {data.greeting.alertsCount} new alerts require your attention.
            </p>
          </div>
        <div
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ background: "rgba(129,212,250,0.12)", border: "1px solid rgba(129,212,250,0.25)" }}
        >
          <Sparkles style={{ width: "16px", height: "16px", color: "#0277BD" }} />
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#0277BD" }}>
            AI Insights ready
          </span>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Summary cards */}
      <SummaryCards summary={data.summary} />

      {/* Analytics */}
      <div>
        <h2 className="text-slate-700 mb-4" style={{ fontWeight: 600, fontSize: "0.95rem" }}>
          Analytics Overview
        </h2>
        <AnalyticsSection analytics={data.analytics} />
      </div>

      {/* Teachers + Alerts side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <TeachersTable teachers={data.teachers} />
        </div>
        <div className="xl:col-span-1">
          <AlertsPanel alerts={data.alerts} />
        </div>
      </div>

      {/* Student Support */}
      <div>
        <h2 className="text-slate-700 mb-4" style={{ fontWeight: 600, fontSize: "0.95rem" }}>
          Student Support Insights
        </h2>
        <StudentSupport data={data.support} />
      </div>
    </div>
  );
}
