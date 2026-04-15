'use client';

import { useEffect, useState } from "react";
import { AlertTriangle, Wind, Sun, Thermometer, Clock, CheckCircle, RefreshCw } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/http";

type AlertRow = {
  id: string;
  title: string;
  desc: string;
  type: string;
  room: string;
  time: string;
  priority: "high" | "medium" | "low";
  status: "open" | "resolved";
};

const emptyStats = {
  totalAlerts: 0,
  open: 0,
  resolved: 0,
  avgResponseMin: 0,
};

const priorityBorderColor: Record<string, string> = {
  high: "#FCA5A5",
  medium: "#FCD34D",
  low: "#E2E8F0",
};

const tabs = ["All", "Open", "Resolved"];
const filters = ["All Priority", "Urgent", "Medium", "Low"];
const PAGE_SIZE = 10;

export function AlertsPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [activeFilter, setActiveFilter] = useState("All Priority");
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [stats, setStats] = useState(emptyStats);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const load = async () => {
    try {
      const response = await adminApi.getAlerts();
      setAlerts(response.alerts);
      setStats(response.stats);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load alerts.");
      }
    }
  };

  useEffect(() => {
    load().catch(() => null);
  }, []);

  const resolve = async (id: string) => {
    try {
      await adminApi.resolveAlert(id);
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to resolve alert.");
      }
    }
  };

  const alertVisuals = (type: string) => {
    const normalized = type.toLowerCase();
    if (normalized.includes("engagement") || normalized.includes("attention")) {
      return {
        icon: AlertTriangle,
        iconBg: "#FFF1F2",
        iconColor: "#F43F5E",
        badge: { bg: "#FFF1F2", color: "#E11D48", label: "Urgent" },
      };
    }
    if (normalized.includes("temp")) {
      return {
        icon: Thermometer,
        iconBg: "#FEF3C7",
        iconColor: "#F59E0B",
        badge: { bg: "#FEF3C7", color: "#D97706", label: "Temperature" },
      };
    }
    if (normalized.includes("co2")) {
      return {
        icon: Wind,
        iconBg: "#EFF6FF",
        iconColor: "#3B82F6",
        badge: { bg: "#EFF6FF", color: "#2563EB", label: "CO₂ Alert" },
      };
    }
    if (normalized.includes("light")) {
      return {
        icon: Sun,
        iconBg: "#FEFCE8",
        iconColor: "#EAB308",
        badge: { bg: "#FEFCE8", color: "#CA8A04", label: "Lighting" },
      };
    }
    return {
      icon: AlertTriangle,
      iconBg: "#EEF2FF",
      iconColor: "#4F46E5",
      badge: { bg: "#EEF2FF", color: "#4338CA", label: "System" },
    };
  };

  const filtered = alerts.filter((a) => {
    const isResolved = a.status === "resolved";
    const matchTab =
      activeTab === "All" ||
      (activeTab === "Open" && !isResolved) ||
      (activeTab === "Resolved" && isResolved);
    const matchPriority =
      activeFilter === "All Priority" ||
      (activeFilter === "Urgent" && a.priority === "high") ||
      (activeFilter === "Medium" && a.priority === "medium") ||
      (activeFilter === "Low" && a.priority === "low");
    return matchTab && matchPriority;
  });

  const openCount = stats.open;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedAlerts = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [activeTab, activeFilter]);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Alerts", value: stats.totalAlerts.toString(), sub: "All time today", color: "#6366F1", bg: "#EEF0FD" },
          { label: "Open", value: openCount.toString(), sub: "Require action", color: "#F43F5E", bg: "#FFF1F2" },
          { label: "Resolved", value: stats.resolved.toString(), sub: "Handled today", color: "#16A34A", bg: "#F0FDF4" },
          { label: "Avg. Response", value: `${stats.avgResponseMin} min`, sub: "Resolution time", color: "#F59E0B", bg: "#FFFBEB" },
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

      {/* Alert list */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #ECEEF4" }}>
        {/* Toolbar */}
        <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: "1px solid #ECEEF4" }}>
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-1.5 rounded-xl transition-all cursor-pointer"
                style={{
                  fontSize: "13px",
                  fontWeight: activeTab === tab ? 600 : 500,
                  background: activeTab === tab ? "#EEF0FD" : "transparent",
                  color: activeTab === tab ? "#6366F1" : "#64748B",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "#F4F5F8" }}>
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className="px-3 py-1 rounded-lg transition-all cursor-pointer"
                  style={{
                    fontSize: "12px",
                    fontWeight: activeFilter === f ? 600 : 500,
                    background: activeFilter === f ? "#fff" : "transparent",
                    color: activeFilter === f ? "#1E293B" : "#94A3B8",
                    boxShadow: activeFilter === f ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-50" style={{ fontSize: "12px" }} onClick={() => load().catch(() => null)}>
              <RefreshCw style={{ width: "13px", height: "13px" }} />
              Refresh
            </button>
          </div>
        </div>

        {/* Alerts */}
        <div>
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <CheckCircle className="mx-auto mb-3 text-slate-300" style={{ width: "32px", height: "32px" }} />
              <p className="text-slate-400" style={{ fontSize: "14px" }}>No alerts in this category</p>
            </div>
          )}
          {pagedAlerts.map((alert) => {
            const isResolved = alert.status === "resolved";
            const visual = alertVisuals(alert.type);
            const Icon = visual.icon;
            return (
              <div
                key={alert.id}
                className="px-6 py-4 hover:bg-slate-50/40 transition-colors border-l-2 flex items-start gap-4"
                style={{ borderTop: "1px solid #F4F5F8", borderLeftColor: isResolved ? "#E2E8F0" : priorityBorderColor[alert.priority], opacity: isResolved ? 0.6 : 1 }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: isResolved ? "#F8FAFC" : visual.iconBg }}
                >
                  <Icon style={{ width: "16px", height: "16px", color: isResolved ? "#94A3B8" : visual.iconColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded-full px-2 py-0.5" style={{ fontSize: "11px", fontWeight: 600, background: visual.badge.bg, color: visual.badge.color }}>
                      {visual.badge.label}
                    </span>
                    <span className="text-slate-300" style={{ fontSize: "12px" }}>·</span>
                    <span className="text-slate-400" style={{ fontSize: "12px" }}>{alert.room}</span>
                    <span className="text-slate-300" style={{ fontSize: "12px" }}>·</span>
                    <span className="text-slate-400 flex items-center gap-1" style={{ fontSize: "12px" }}>
                      <Clock style={{ width: "11px", height: "11px" }} />
                      {alert.time}
                    </span>
                    {isResolved && (
                      <span className="rounded-full px-2 py-0.5" style={{ fontSize: "11px", fontWeight: 600, background: "#F0FDF4", color: "#16A34A" }}>
                        Resolved
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700" style={{ fontSize: "13.5px", fontWeight: 600 }}>{alert.title}</p>
                  <p className="text-slate-400 mt-0.5" style={{ fontSize: "12.5px", lineHeight: 1.5 }}>{alert.desc}</p>
                </div>
                {!isResolved && (
                  <button
                    onClick={() => resolve(alert.id)}
                    className="flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                    style={{ fontSize: "12.5px", fontWeight: 600, color: "#0277BD" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#01579B";
                      e.currentTarget.style.background = "#E1F5FE";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#0277BD";
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <CheckCircle style={{ width: "14px", height: "14px" }} />
                    Resolve
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length > PAGE_SIZE ? (
          <div className="px-6 py-3 flex items-center justify-between" style={{ borderTop: "1px solid #ECEEF4", background: "#FAFBFC" }}>
            <p className="text-slate-400" style={{ fontSize: "12px" }}>
              Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold border border-slate-200 bg-white text-slate-600 disabled:opacity-50"
              >
                Prev
              </button>

              {Array.from({ length: totalPages }).slice(0, 7).map((_, index) => {
                const pageNumber = index + 1;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    className="rounded-lg px-2.5 py-1 text-xs font-semibold border"
                    style={{
                      borderColor: currentPage === pageNumber ? "#BFDBFE" : "#E2E8F0",
                      background: currentPage === pageNumber ? "#EFF6FF" : "#fff",
                      color: currentPage === pageNumber ? "#1D4ED8" : "#475569",
                    }}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold border border-slate-200 bg-white text-slate-600 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
