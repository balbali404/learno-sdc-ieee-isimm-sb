'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { ApiError, learnoApi } from '@/lib/api';
import type { LearnoSession } from '@/lib/api/types';
import { useStoredAuth } from '@/hooks/useStoredAuth';

interface DayAnalytics {
  day: string;
  engagement: number;
  alerts: number;
}

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toDate = (session: LearnoSession): Date | null => {
  const raw = session.actualStart ?? session.createdAt;
  if (!raw) {
    return null;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const roundedAverage = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
};

export function SessionAnalyticsContent() {
  const { token } = useStoredAuth();
  const [sessions, setSessions] = useState<LearnoSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const loadSessions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await learnoApi.getSessions();
        setSessions(response ?? []);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Failed to load session analytics.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions().catch(() => null);
  }, [token]);

  const completedSessions = sessions.filter((session) => session.status === 'COMPLETED');

  const weeklyData = useMemo<DayAnalytics[]>(() => {
    const grouped = new Map<number, { engagements: number[]; alerts: number }>();

    completedSessions.forEach((session) => {
      const date = toDate(session);
      if (!date) {
        return;
      }

      const dayIndex = date.getDay();
      if (!grouped.has(dayIndex)) {
        grouped.set(dayIndex, { engagements: [], alerts: 0 });
      }

      const dayData = grouped.get(dayIndex)!;
      dayData.engagements.push(session.engagementScore ?? 0);
      dayData.alerts += session._count?.alerts ?? 0;
    });

    return dayLabels.map((day, index) => {
      const data = grouped.get(index);
      return {
        day,
        engagement: roundedAverage(data?.engagements ?? []),
        alerts: data?.alerts ?? 0,
      };
    });
  }, [completedSessions]);

  const avgEngagement = roundedAverage(
    completedSessions.map((session) => session.engagementScore ?? 0),
  );
  const avgDuration = roundedAverage(
    completedSessions.map((session) => session.durationMinutes ?? 0),
  );
  const avgTeacherRatio = roundedAverage(
    completedSessions.map((session) => {
      const ratio = session.teacherRatio;
      if (ratio === null || ratio === undefined) {
        return 0;
      }

      return ratio <= 1 ? ratio * 100 : ratio;
    }),
  );
  const totalAlerts = completedSessions.reduce(
    (sum, session) => sum + (session._count?.alerts ?? 0),
    0,
  );

  if (!token) {
    return (
      <div className="p-6 max-w-screen-xl mx-auto">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h1 className="text-xl font-bold text-slate-800">Session Analytics</h1>
          <p className="mt-2 text-sm text-slate-500">Sign in first to load analytics.</p>
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
        <h1 className="text-xl font-bold text-slate-800">Session Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">
          Aggregated from `/learno/sessions` with safe zero defaults.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-slate-400">Completed Sessions</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{completedSessions.length}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-slate-400">Avg Engagement</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{avgEngagement}%</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-slate-400">Avg Duration</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{avgDuration} min</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-xs text-slate-400">Teacher Talk Ratio</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{avgTeacherRatio}%</p>
        </div>
      </div>

      <section className="rounded-xl border border-slate-100 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800">Weekly Overview</h2>
            <p className="text-xs text-slate-500 mt-0.5">Engagement and alert totals by day</p>
          </div>
          <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            {totalAlerts} alerts total
          </span>
        </div>

        {isLoading ? (
          <div className="h-56 text-sm text-slate-500 flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Loading chart data...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="engagement" fill="#54C3EF" radius={[4, 4, 0, 0]} name="Engagement" />
              <Bar dataKey="alerts" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Alerts" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      <section className="rounded-xl border border-slate-100 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Recent Sessions</h2>
          <p className="text-xs text-slate-500 mt-0.5">Latest 10 sessions with key metrics</p>
        </div>

        {isLoading ? (
          <div className="px-5 py-4 text-sm text-slate-500 flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Loading sessions...
          </div>
        ) : null}

        {!isLoading && sessions.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">No sessions yet.</div>
        ) : null}

        {!isLoading && sessions.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Date', 'Class', 'Subject', 'Status', 'Engagement', 'Alerts'].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {sessions.slice(0, 10).map((session) => (
                <tr key={session.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 text-sm text-slate-600">
                    {new Intl.DateTimeFormat(undefined, {
                      month: 'short',
                      day: 'numeric',
                    }).format(toDate(session) ?? new Date())}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">
                    {session.class?.name ?? 'N/A'}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">
                    {session.subject?.name ?? 'N/A'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {session.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">
                    {session.engagementScore ?? 0}%
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">
                    {session._count?.alerts ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </div>
  );
}
