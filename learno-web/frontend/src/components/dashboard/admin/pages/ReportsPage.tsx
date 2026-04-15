'use client';

import { useEffect, useState } from "react";
import { Download, FileText, Calendar, BarChart2, Users, GraduationCap, Clock, ChevronRight, Plus } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/http";

const iconMap = {
  Users,
  GraduationCap,
  BarChart2,
  FileText,
  Calendar,
};

const iconStyleMap: Record<string, { iconBg: string; iconColor: string }> = {
  "Student Progress Report": { iconBg: "#EEF0FD", iconColor: "#6366F1" },
  "Teacher Performance Summary": { iconBg: "#F5F3FF", iconColor: "#8B5CF6" },
  "Monthly Analytics Report": { iconBg: "#F0FDF9", iconColor: "#14B8A6" },
  "Alert & Incident Log": { iconBg: "#FFFBEB", iconColor: "#F59E0B" },
  "Attendance Summary": { iconBg: "#EFF6FF", iconColor: "#3B82F6" },
};

const emptyStats = {
  reportsGenerated: 0,
  scheduledReports: 0,
  totalDownloads: 0,
  lastExportLabel: "—",
};

type ReportCard = {
  id: string;
  title: string;
  desc: string;
  lastGenerated: string;
  size: string;
  type: "PDF" | "CSV" | "XLSX";
};

type ScheduledReport = {
  title: string;
  schedule: string;
  nextRun: string;
  status: "active" | "paused";
};

const typeColors: Record<string, { bg: string; color: string }> = {
  PDF: { bg: "#FFF1F2", color: "#E11D48" },
  CSV: { bg: "#F0FDF9", color: "#0D9488" },
  XLSX: { bg: "#F0FDF4", color: "#16A34A" },
};

export function ReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [stats, setStats] = useState(emptyStats);
  const [reportCategories, setReportCategories] = useState<ReportCard[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await adminApi.getReports();
        setStats(response.stats);
        setReportCategories(response.availableReports);
        setScheduledReports(response.scheduledReports);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Failed to load reports.");
        }
      }
    };

    load().catch(() => null);
  }, []);

  const handleDownload = (id: string) => {
    setDownloading(id);
    setTimeout(() => setDownloading(null), 1500);
  };

  return (
    <div className="space-y-5">
      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Reports Generated", value: String(stats.reportsGenerated), sub: "This month", color: "#6366F1", bg: "#EEF0FD" },
          { label: "Scheduled Reports", value: String(stats.scheduledReports), sub: "Auto-delivery active", color: "#14B8A6", bg: "#F0FDF9" },
          { label: "Total Downloads", value: String(stats.totalDownloads), sub: "By all admins", color: "#8B5CF6", bg: "#F5F3FF" },
          { label: "Last Export", value: stats.lastExportLabel, sub: "Latest export", color: "#F59E0B", bg: "#FFFBEB" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: "1px solid #ECEEF4" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
            </div>
            <p className="text-slate-800" style={{ fontSize: "1.5rem", fontWeight: 700, lineHeight: 1 }}>{s.value}</p>
            <p className="text-slate-600 mt-1" style={{ fontSize: "13px", fontWeight: 500 }}>{s.label}</p>
            <p className="text-slate-400 mt-0.5" style={{ fontSize: "12px" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Report cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-700" style={{ fontWeight: 600, fontSize: "0.9rem" }}>Available Reports</h3>
          <button
            className="flex items-center gap-1.5 text-white px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
            style={{ fontSize: "13px", fontWeight: 600, background: "#81D4FA" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#4FC3F7"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#81D4FA"}
          >
            <Plus style={{ width: "14px", height: "14px" }} />
            Generate New
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {reportCategories.map((report) => {
            const lowerTitle = report.title.toLowerCase();
            const Icon =
              lowerTitle.includes("student")
                ? iconMap.Users
                : lowerTitle.includes("teacher")
                  ? iconMap.GraduationCap
                  : lowerTitle.includes("analytics")
                    ? iconMap.BarChart2
                    : lowerTitle.includes("attendance")
                      ? iconMap.Calendar
                      : iconMap.FileText;
            const iconStyle = iconStyleMap[report.title] ?? { iconBg: "#EEF2FF", iconColor: "#4F46E5" };
            const typeColor = typeColors[report.type];
            const isDownloading = downloading === report.id;
            return (
              <div
                key={report.id}
                className="bg-white rounded-2xl p-5 hover:shadow-sm transition-all duration-200"
                style={{ border: "1px solid #ECEEF4" }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconStyle.iconBg }}>
                    <Icon style={{ width: "18px", height: "18px", color: iconStyle.iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700" style={{ fontSize: "13.5px", fontWeight: 600 }}>{report.title}</p>
                    <span className="inline-block rounded-full px-2 py-0.5 mt-1" style={{ fontSize: "10.5px", fontWeight: 600, background: typeColor.bg, color: typeColor.color }}>
                      {report.type}
                    </span>
                  </div>
                </div>
                <p className="text-slate-400 mb-4" style={{ fontSize: "12.5px", lineHeight: 1.6 }}>{report.desc}</p>
                <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid #F4F5F8" }}>
                  <div>
                    <p className="text-slate-400" style={{ fontSize: "11px" }}>Last generated</p>
                    <p className="text-slate-600" style={{ fontSize: "12.5px", fontWeight: 500 }}>{report.lastGenerated} · {report.size}</p>
                  </div>
                  <button
                    onClick={() => handleDownload(report.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                    style={{
                      fontSize: "12.5px",
                      fontWeight: 600,
                      background: isDownloading ? "#F0FDF4" : "#EEF0FD",
                      color: isDownloading ? "#16A34A" : "#6366F1",
                    }}
                  >
                    <Download style={{ width: "13px", height: "13px" }} />
                    {isDownloading ? "Downloading..." : "Download"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scheduled reports */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #ECEEF4" }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #ECEEF4" }}>
          <div>
            <h3 className="text-slate-700" style={{ fontWeight: 600, fontSize: "0.9rem" }}>Scheduled Reports</h3>
            <p className="text-slate-400 mt-0.5" style={{ fontSize: "12px" }}>Automated delivery to your inbox</p>
          </div>
          <button className="flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-lg transition-colors" style={{ fontSize: "13px", fontWeight: 600, color: "#0277BD" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#01579B";
              e.currentTarget.style.background = "#E1F5FE";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#0277BD";
              e.currentTarget.style.background = "transparent";
            }}
          >
            Manage
            <ChevronRight style={{ width: "14px", height: "14px" }} />
          </button>
        </div>
        <div>
          {scheduledReports.map((r, i) => (
            <div
              key={r.title}
              className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
              style={{ borderTop: i > 0 ? "1px solid #F4F5F8" : "none" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#EEF0FD" }}>
                  <Clock style={{ width: "15px", height: "15px", color: "#6366F1" }} />
                </div>
                <div>
                  <p className="text-slate-700" style={{ fontSize: "13px", fontWeight: 600 }}>{r.title}</p>
                  <p className="text-slate-400" style={{ fontSize: "12px" }}>{r.schedule}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-slate-400" style={{ fontSize: "11px" }}>Next run</p>
                  <p className="text-slate-600" style={{ fontSize: "12.5px", fontWeight: 500 }}>{r.nextRun}</p>
                </div>
                <span
                  className="rounded-full px-2.5 py-1"
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 600,
                    background: r.status === "active" ? "#F0FDF4" : "#F8FAFC",
                    color: r.status === "active" ? "#16A34A" : "#94A3B8",
                  }}
                >
                  {r.status === "active" ? "Active" : "Paused"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
