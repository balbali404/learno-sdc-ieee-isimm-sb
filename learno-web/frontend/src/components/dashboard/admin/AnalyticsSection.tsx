'use client';

import { type AdminDashboardResponse } from "@/lib/api/admin";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";
import { RefreshCw, Wifi, AlertTriangle } from "lucide-react";
import { useId } from "react";

interface TooltipEntry {
  color?: string;
  name?: string;
  value?: string | number;
}

interface TooltipRenderProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}

const CustomTooltip = ({ active, payload, label }: TooltipRenderProps) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="bg-white rounded-xl px-4 py-3"
        style={{ border: "1px solid #ECEEF4", boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }}
      >
        <p className="text-slate-500 mb-2" style={{ fontSize: "11px", fontWeight: 600 }}>{label}</p>
        {payload.map((entry, idx: number) => (
          <div key={`${entry.name}-${idx}`} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-slate-500" style={{ fontSize: "12px" }}>{entry.name}: </span>
            <span className="text-slate-700" style={{ fontSize: "12px", fontWeight: 600 }}>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface AnalyticsSectionProps {
  analytics: AdminDashboardResponse["analytics"];
}

export function AnalyticsSection({ analytics }: AnalyticsSectionProps) {
  const uid = useId().replace(/:/g, "");
  const engGradId = `engGrad-${uid}`;
  const attGradId = `attGrad-${uid}`;

const engagementData = analytics.engagementTrend;
  const environmentData = analytics.environmentTrend;
  const environmentAverage = analytics.environmentAverage;
  const liveSessionEnvironment = analytics.liveSessionEnvironment ?? [];
  const avgNoise = environmentAverage?.noise ?? 0;
  const avgCo2 = environmentAverage?.co2 ?? 0;
  const avgLight = environmentAverage?.light ?? 0;

  const avgUpdated = environmentAverage?.updatedAt
    ? new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(
        new Date(environmentAverage.updatedAt),
      )
    : "--:--";

  const statusByMetric = (value: number, metric: "noise" | "co2" | "light") => {
    if (metric === "noise") {
      if (value >= 75) return { label: "High", color: "text-rose-600", bg: "bg-rose-50" };
      if (value >= 60) return { label: "Elevated", color: "text-amber-600", bg: "bg-amber-50" };
      return { label: "Normal", color: "text-emerald-600", bg: "bg-emerald-50" };
    }

    if (metric === "co2") {
      if (value >= 1200) return { label: "High", color: "text-rose-600", bg: "bg-rose-50" };
      if (value >= 900) return { label: "Moderate", color: "text-amber-600", bg: "bg-amber-50" };
      return { label: "Good", color: "text-emerald-600", bg: "bg-emerald-50" };
    }

    if (value <= 30) return { label: "Low", color: "text-amber-600", bg: "bg-amber-50" };
    if (value <= 55) return { label: "Balanced", color: "text-emerald-600", bg: "bg-emerald-50" };
    return { label: "Bright", color: "text-sky-600", bg: "bg-sky-50" };
  };
  const attentionData = analytics.attentionByClass;

  const formatLiveUpdated = (value?: string | null) => {
    if (!value) {
      return "just now";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "just now";
    }
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Engagement Trends */}
      <div className="xl:col-span-2 bg-white rounded-2xl p-6" style={{ border: "1px solid #ECEEF4" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-slate-700" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
              Student Engagement Trends
            </h3>
            <p className="text-slate-400 mt-0.5" style={{ fontSize: "12px" }}>Weekly engagement & attention scores</p>
          </div>
          <button
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-50"
            style={{ fontSize: "12px" }}
          >
            <RefreshCw style={{ width: "13px", height: "13px" }} />
            Refresh
          </button>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#6366F1" }} />
            <span className="text-slate-500" style={{ fontSize: "12px" }}>Engagement</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#CBD5E1" }} />
            <span className="text-slate-500" style={{ fontSize: "12px" }}>Attention</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={engagementData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={engGradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id={attGradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.10} />
                <stop offset="95%" stopColor="#94A3B8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F7" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} domain={[40, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="engagement" name="Engagement" stroke="#6366F1" strokeWidth={2} fill={`url(#${engGradId})`} dot={{ r: 3, fill: "#6366F1", strokeWidth: 0 }} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="attention" name="Attention" stroke="#CBD5E1" strokeWidth={2} fill={`url(#${attGradId})`} dot={{ r: 3, fill: "#CBD5E1", strokeWidth: 0 }} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Attention Score by Class */}
      <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #ECEEF4" }}>
        <div className="mb-5">
          <h3 className="text-slate-700" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
            Attention Score
          </h3>
          <p className="text-slate-400 mt-0.5" style={{ fontSize: "12px" }}>By classroom — today</p>
        </div>

        <div className="space-y-3.5">
          {attentionData.map((item) => {
            const color =
              item.score >= 85
                ? { bar: "#6366F1", text: "#4F46E5", bg: "#EEF0FD" }
                : item.score >= 70
                ? { bar: "#14B8A6", text: "#0D9488", bg: "#F0FDF9" }
                : { bar: "#F59E0B", text: "#D97706", bg: "#FFFBEB" };
            return (
              <div key={item.class}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-600" style={{ fontSize: "12.5px", fontWeight: 500 }}>{item.class}</span>
                  <span
                    className="rounded-full px-2 py-0.5"
                    style={{ fontSize: "11px", fontWeight: 600, background: color.bg, color: color.text }}
                  >
                    {item.score}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F1F3F7" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.score}%`, background: color.bar }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Classroom Environment */}
      <div className="xl:col-span-3 bg-white rounded-2xl p-6" style={{ border: "1px solid #ECEEF4" }}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-slate-700" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
              Classroom Environment
            </h3>
            <p className="text-slate-400 mt-0.5" style={{ fontSize: "12px" }}>
              Live sensor snapshot with trends from recent sessions
            </p>
          </div>
<div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="text-amber-600 font-medium">Avg</span>
            Updated {avgUpdated}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { label: "Noise", value: avgNoise, unit: "dB", metric: "noise" as const },
            { label: "CO₂", value: avgCo2, unit: "ppm", metric: "co2" as const },
            { label: "Light", value: avgLight, unit: "%", metric: "light" as const },
          ].map((item) => {
            const status = statusByMetric(item.value, item.metric);
            return (
              <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {item.label}
                  </p>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.bg} ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <p className="mt-2 text-3xl font-semibold text-slate-800">
                  {item.value}
                  <span className="ml-1 text-sm font-medium text-slate-500">{item.unit}</span>
                </p>
                <div className="mt-3 h-1.5 w-full rounded-full bg-slate-200">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(10, item.metric === "co2" ? (item.value / 1500) * 100 : item.value))}%`,
                      background: item.metric === "noise" ? "#06B6D4" : item.metric === "co2" ? "#6366F1" : "#FBBF24",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Live Session Environment
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
              <AlertTriangle size={11} /> {liveSessionEnvironment.length} live
            </span>
          </div>

          {liveSessionEnvironment.length === 0 ? (
            <p className="text-sm text-slate-500">No active sessions right now.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {liveSessionEnvironment.map((session) => {
                const co2Status = statusByMetric(session.co2, "co2");
                const lightStatus = statusByMetric(session.light, "light");
                const noiseStatus = statusByMetric(session.noise, "noise");

                return (
                  <div key={session.sessionId} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{session.className}</p>
                        <p className="text-xs text-slate-500">{session.teacherName}</p>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {session.status}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
                        <p className="text-[11px] text-slate-400">CO₂</p>
                        <p className="text-sm font-semibold text-slate-800">{session.co2} ppm</p>
                        <p className={`text-[11px] font-medium ${co2Status.color}`}>{co2Status.label}</p>
                      </div>

                      <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
                        <p className="text-[11px] text-slate-400">Light</p>
                        <p className="text-sm font-semibold text-slate-800">{session.light}%</p>
                        <p className={`text-[11px] font-medium ${lightStatus.color}`}>{lightStatus.label}</p>
                      </div>

                      <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
                        <p className="text-[11px] text-slate-400">Noise</p>
                        <p className="text-sm font-semibold text-slate-800">{session.noise} dB</p>
                        <p className={`text-[11px] font-medium ${noiseStatus.color}`}>{noiseStatus.label}</p>
                      </div>
                    </div>

                    <p className="mt-2 text-[11px] text-slate-400">Updated {formatLiveUpdated(session.updatedAt)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-slate-100 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Recent Environment Trend
            </p>
            <div className="flex items-center gap-4">
              {[
                { color: "#06B6D4", label: "Noise (dB)" },
                { color: "#6366F1", label: "CO₂ (ppm)" },
                { color: "#FBBF24", label: "Light (%)" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                  <span className="text-slate-400" style={{ fontSize: "12px" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={environmentData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F7" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="noise" name="Noise (dB)" stroke="#06B6D4" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="co2" name="CO₂ (ppm)" stroke="#6366F1" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="light" name="Light (%)" stroke="#FBBF24" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
