import { useMemo, useState } from "react";
import { AlertTriangle, Wind, Sun, Thermometer, Clock, ChevronRight } from "lucide-react";

interface AlertItem {
  id: string;
  title: string;
  desc: string;
  type: string;
  room: string;
  time: string;
  priority: "high" | "medium" | "low";
}

const borderColors: Record<string, string> = {
  high: "#FCA5A5",
  medium: "#FCD34D",
  low: "#E2E8F0",
};

const iconForType = (type: string) => {
  const normalized = type.toLowerCase();
  if (normalized.includes("co2")) {
    return {
      icon: Wind,
      iconBg: "#EFF6FF",
      iconColor: "#3B82F6",
      badgeBg: "#EFF6FF",
      badgeColor: "#2563EB",
    };
  }

  if (normalized.includes("light")) {
    return {
      icon: Sun,
      iconBg: "#FEFCE8",
      iconColor: "#EAB308",
      badgeBg: "#FEFCE8",
      badgeColor: "#CA8A04",
    };
  }

  if (normalized.includes("temperature") || normalized.includes("silence")) {
    return {
      icon: Thermometer,
      iconBg: "#FEF3C7",
      iconColor: "#F59E0B",
      badgeBg: "#FEF3C7",
      badgeColor: "#D97706",
    };
  }

  return {
    icon: AlertTriangle,
    iconBg: "#FFF1F2",
    iconColor: "#F43F5E",
    badgeBg: "#FFF1F2",
    badgeColor: "#E11D48",
  };
};

interface AlertsPanelProps {
  alerts: AlertItem[];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const [showAll, setShowAll] = useState(false);

  const visibleAlerts = useMemo(() => {
    if (showAll) {
      return alerts;
    }

    return alerts.slice(0, 3);
  }, [alerts, showAll]);

  const hasMore = alerts.length > 3;

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #ECEEF4" }}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #ECEEF4" }}>
        <div>
          <h3 className="text-slate-700" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
            Alerts & Insights
          </h3>
          <p className="text-slate-400 mt-0.5" style={{ fontSize: "12px" }}>Real-time classroom monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-emerald-600" style={{ fontSize: "12px", fontWeight: 500 }}>Live</span>
          {hasMore ? (
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className="ml-1 flex items-center gap-0.5 cursor-pointer px-2 py-1 rounded-lg transition-colors"
              style={{ fontSize: "12px", color: "#0277BD" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#01579B";
                e.currentTarget.style.background = "#E1F5FE";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#0277BD";
                e.currentTarget.style.background = "transparent";
              }}
            >
              {showAll ? "Show less" : `Show all (${alerts.length})`}
              <ChevronRight style={{ width: "13px", height: "13px" }} />
            </button>
          ) : null}
        </div>
      </div>

      {/* Alert list */}
      <div>
        {visibleAlerts.length === 0 ? (
          <p className="px-5 py-4 text-sm text-slate-500">No alerts right now.</p>
        ) : null}

        {visibleAlerts.map((alert) => {
          const iconMeta = iconForType(alert.type);
          const Icon = iconMeta.icon;
          return (
            <div
              key={alert.id}
              className="px-5 py-3.5 hover:bg-slate-50/50 transition-colors border-l-2"
              style={{ borderTop: "1px solid #F4F5F8", borderLeftColor: borderColors[alert.priority] }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: iconMeta.iconBg }}
                >
                  <Icon style={{ width: "15px", height: "15px", color: iconMeta.iconColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="rounded-full px-2 py-0.5"
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        background: iconMeta.badgeBg,
                        color: iconMeta.badgeColor,
                      }}
                    >
                      {alert.type}
                    </span>
                    <span className="text-slate-300" style={{ fontSize: "11px" }}>·</span>
                    <span className="text-slate-400" style={{ fontSize: "11px" }}>{alert.room}</span>
                    <span className="text-slate-400 flex items-center gap-1" style={{ fontSize: "11px" }}>
                      <Clock style={{ width: "10px", height: "10px" }} />
                      {alert.time}
                    </span>
                  </div>
                  <p className="text-slate-700" style={{ fontSize: "13px", fontWeight: 600 }}>{alert.title}</p>
                  <p className="text-slate-400 mt-0.5" style={{ fontSize: "12px", lineHeight: 1.5 }}>{alert.desc}</p>
                </div>
                <button
                  className="transition-colors cursor-pointer whitespace-nowrap px-2 py-1 rounded-lg"
                  style={{ fontSize: "12px", fontWeight: 600, color: "#0277BD" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#01579B";
                    e.currentTarget.style.background = "#E1F5FE";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#0277BD";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  Review
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
