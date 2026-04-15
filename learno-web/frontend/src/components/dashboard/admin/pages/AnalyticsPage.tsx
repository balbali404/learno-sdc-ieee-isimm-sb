'use client';

import {
  AreaChart, Area, BarChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useEffect, useId, useState } from "react";
import { Download, Calendar } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/http";

const emptyKpis = {
  avgEngagement: 0,
  avgAttendance: 0,
  avgAttention: 0,
  interventions: 0,
};

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
      <div className="bg-white rounded-xl px-4 py-3" style={{ border: "1px solid #ECEEF4", boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }}>
        <p className="text-slate-500 mb-1.5" style={{ fontSize: "11px", fontWeight: 600 }}>{label}</p>
        {payload.map((entry, idx: number) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-slate-500" style={{ fontSize: "12px" }}>{entry.name}: </span>
            <span className="text-slate-700" style={{ fontSize: "12px", fontWeight: 600 }}>{entry.value}{typeof entry.value === "number" && entry.value < 200 ? "%" : ""}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function AnalyticsPage() {
  const uid = useId().replace(/:/g, "");
  const [kpis, setKpis] = useState(emptyKpis);
  const [weeklyData, setWeeklyData] = useState<Array<{ day: string; engagement: number; attendance: number; attention: number }>>([]);
  const [monthlyAttendance, setMonthlyAttendance] = useState<Array<{ month: string; rate: number }>>([]);
  const [subjectEngagement, setSubjectEngagement] = useState<Array<{ subject: string; score: number }>>([]);
  const [riskDistribution, setRiskDistribution] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await adminApi.getAnalytics();
        setKpis(response.kpis);
        setWeeklyData(response.weeklyData);
        setMonthlyAttendance(response.monthlyAttendance);
        setSubjectEngagement(response.subjectEngagement);
        setRiskDistribution(response.riskDistribution);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Failed to load analytics.");
        }
      }
    };

    load().catch(() => null);
  }, []);

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Avg. Engagement", value: `${kpis.avgEngagement}%`, change: "Live", up: true, color: "#6366F1", bg: "#EEF0FD" },
          { label: "Avg. Attendance", value: `${kpis.avgAttendance}%`, change: "Live", up: true, color: "#14B8A6", bg: "#F0FDF9" },
          { label: "Avg. Attention", value: `${kpis.avgAttention}%`, change: "Live", up: true, color: "#F59E0B", bg: "#FFFBEB" },
          { label: "Interventions", value: String(kpis.interventions), change: "Live", up: false, color: "#F43F5E", bg: "#FFF1F2" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl p-5" style={{ border: "1px solid #ECEEF4" }}>
            <p className="text-slate-400 mb-2" style={{ fontSize: "12px" }}>{k.label}</p>
            <p className="text-slate-800" style={{ fontSize: "1.7rem", fontWeight: 700, lineHeight: 1 }}>{k.value}</p>
            <span
              className="inline-block mt-2 rounded-full px-2 py-0.5"
              style={{
                fontSize: "11px",
                fontWeight: 600,
                background: k.up ? "#F0FDF4" : "#FFF1F2",
                color: k.up ? "#16A34A" : "#E11D48",
              }}
            >
              {k.change} this week
            </span>
          </div>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Main charts grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Weekly trends — wide */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-6" style={{ border: "1px solid #ECEEF4" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-slate-700" style={{ fontWeight: 600, fontSize: "0.9rem" }}>Weekly Trends</h3>
              <p className="text-slate-400 mt-0.5" style={{ fontSize: "12px" }}>Engagement, attendance & attention this week</p>
            </div>
            <div className="flex items-center gap-3">
              {[
                { color: "#6366F1", label: "Engagement" },
                { color: "#14B8A6", label: "Attendance" },
                { color: "#CBD5E1", label: "Attention" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                  <span className="text-slate-400" style={{ fontSize: "11.5px" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`g1-${uid}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id={`g2-${uid}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F7" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} domain={[40, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="engagement" name="Engagement" stroke="#6366F1" strokeWidth={2} fill={`url(#g1-${uid})`} dot={{ r: 3, fill: "#6366F1", strokeWidth: 0 }} />
              <Area type="monotone" dataKey="attendance" name="Attendance" stroke="#14B8A6" strokeWidth={2} fill={`url(#g2-${uid})`} dot={{ r: 3, fill: "#14B8A6", strokeWidth: 0 }} />
              <Line type="monotone" dataKey="attention" name="Attention" stroke="#CBD5E1" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Donut chart */}
        <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #ECEEF4" }}>
          <h3 className="text-slate-700 mb-1" style={{ fontWeight: 600, fontSize: "0.9rem" }}>Student Status</h3>
          <p className="text-slate-400 mb-4" style={{ fontSize: "12px" }}>Distribution overview</p>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {riskDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2.5 mt-2">
            {riskDistribution.map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-slate-500" style={{ fontSize: "13px" }}>{d.name}</span>
                </div>
                <span className="text-slate-700" style={{ fontSize: "13px", fontWeight: 600 }}>{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Monthly attendance */}
        <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #ECEEF4" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-slate-700" style={{ fontWeight: 600, fontSize: "0.9rem" }}>Monthly Attendance</h3>
              <p className="text-slate-400 mt-0.5" style={{ fontSize: "12px" }}>Rate (%) · School year 2025–26</p>
            </div>
            <button className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-50" style={{ fontSize: "12px" }}>
              <Calendar style={{ width: "13px", height: "13px" }} />
              This year
            </button>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyAttendance} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F7" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} domain={[60, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rate" name="Attendance %" fill="#6366F1" radius={[6, 6, 0, 0]} fillOpacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Subject engagement */}
        <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #ECEEF4" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-slate-700" style={{ fontWeight: 600, fontSize: "0.9rem" }}>Engagement by Subject</h3>
              <p className="text-slate-400 mt-0.5" style={{ fontSize: "12px" }}>Average score across all classes</p>
            </div>
            <button className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 cursor-pointer px-2 py-1.5 rounded-lg hover:bg-slate-50" style={{ fontSize: "12px" }}>
              <Download style={{ width: "13px", height: "13px" }} />
              Export
            </button>
          </div>
          <div className="space-y-3.5">
            {subjectEngagement.map((s) => {
              const color = s.score >= 85 ? "#6366F1" : s.score >= 70 ? "#14B8A6" : "#F59E0B";
              return (
                <div key={s.subject}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-600" style={{ fontSize: "13px", fontWeight: 500 }}>{s.subject}</span>
                    <span className="text-slate-700" style={{ fontSize: "13px", fontWeight: 600 }}>{s.score}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F1F3F7" }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.score}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
