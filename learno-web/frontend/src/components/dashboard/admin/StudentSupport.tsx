import { useMemo, useState } from "react";
import { Heart, Activity, Clipboard, ChevronRight, User } from "lucide-react";

interface StudentSupportProps {
  data: {
    needsAttention: Array<{
      name: string;
      class: string;
      flag: string;
      avatar: string;
      avatarBg: string;
      avatarColor: string;
    }>;
    behavioralPatterns: Array<{
      label: string;
      value: string;
      icon: string;
    }>;
    interventions: Array<{
      student: string;
      type: string;
      status: "active" | "pending" | "done";
      date: string;
    }>;
  };
}

const statusStyle: Record<string, { bg: string; color: string }> = {
  active: { bg: "#F0FDF9", color: "#0D9488" },
  pending: { bg: "#FFFBEB", color: "#D97706" },
  done: { bg: "#F8FAFC", color: "#64748B" },
};

export function StudentSupport({ data }: StudentSupportProps) {
  const [showAllAttention, setShowAllAttention] = useState(false);
  const [showAllInterventions, setShowAllInterventions] = useState(false);

  const needsAttention = data.needsAttention;
  const behavioralPatterns = data.behavioralPatterns;
  const interventions = data.interventions;

  const visibleAttention = useMemo(() => {
    if (showAllAttention) {
      return needsAttention;
    }

    return needsAttention.slice(0, 3);
  }, [needsAttention, showAllAttention]);

  const visibleInterventions = useMemo(() => {
    if (showAllInterventions) {
      return interventions;
    }

    return interventions.slice(0, 3);
  }, [interventions, showAllInterventions]);
  const flagStyle = (flag: string) => {
    const lower = flag.toLowerCase();
    if (lower.includes("low") || lower.includes("drop")) {
      return { bg: "#FFF1F2", color: "#E11D48" };
    }
    if (lower.includes("attention") || lower.includes("intervention")) {
      return { bg: "#FFFBEB", color: "#D97706" };
    }
    return { bg: "#EEF2FF", color: "#4F46E5" };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Students needing attention */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #ECEEF4" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #ECEEF4" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#FFFBEB" }}>
                <Heart style={{ width: "15px", height: "15px", color: "#F59E0B" }} />
              </div>
              <div>
                <p className="text-slate-700" style={{ fontSize: "13.5px", fontWeight: 600 }}>Needs Attention</p>
                <p className="text-slate-400" style={{ fontSize: "12px" }}>{needsAttention.length} students flagged</p>
              </div>
            </div>
          {needsAttention.length > 3 ? (
            <button
              type="button"
              onClick={() => setShowAllAttention((current) => !current)}
              className="cursor-pointer px-2 py-1 rounded-lg transition-colors"
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
              {showAllAttention ? "Show less" : `Show all (${needsAttention.length})`}
            </button>
          ) : null}
        </div>
        <div>
          {visibleAttention.length === 0 ? (
            <p className="px-5 py-4 text-sm text-slate-500">No students need attention.</p>
          ) : null}

          {visibleAttention.map((s) => {
            const tone = flagStyle(s.flag);
            return (
            <div
              key={s.name}
              className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/50 transition-colors"
              style={{ borderTop: "1px solid #F4F5F8" }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: s.avatarBg }}
              >
                <span style={{ fontSize: "11px", fontWeight: 700, color: s.avatarColor }}>{s.avatar}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-700" style={{ fontSize: "13px", fontWeight: 600 }}>{s.name}</p>
                <p className="text-slate-400" style={{ fontSize: "12px" }}>Class {s.class}</p>
              </div>
              <span
                className="rounded-full px-2 py-0.5 max-w-[90px] truncate text-right"
                style={{ fontSize: "10.5px", fontWeight: 500, background: tone.bg, color: tone.color }}
              >
                {s.flag}
              </span>
            </div>
            );
          })}
        </div>
      </div>

      {/* Behavioral Patterns */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #ECEEF4" }}>
        <div className="px-5 py-4 flex items-center gap-2.5" style={{ borderBottom: "1px solid #ECEEF4" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#F5F3FF" }}>
            <Activity style={{ width: "15px", height: "15px", color: "#8B5CF6" }} />
          </div>
          <div>
            <p className="text-slate-700" style={{ fontSize: "13.5px", fontWeight: 600 }}>Behavioral Patterns</p>
            <p className="text-slate-400" style={{ fontSize: "12px" }}>AI-detected insights</p>
          </div>
        </div>
        <div className="px-5 py-4 space-y-2.5">
          {behavioralPatterns.map((p) => (
            <div
              key={p.label}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
              style={{ background: "#F8F9FB" }}
            >
              <span style={{ fontSize: "15px" }}>{p.icon}</span>
              <div className="flex-1">
                <p className="text-slate-400" style={{ fontSize: "11.5px" }}>{p.label}</p>
                <p className="text-slate-700 mt-0.5" style={{ fontSize: "13px", fontWeight: 600 }}>{p.value}</p>
              </div>
            </div>
          ))}

          <div
            className="mt-3 p-3 rounded-xl"
            style={{ background: "#F0FDF9", border: "1px solid #CCFBF1" }}
          >
            <p className="text-teal-700" style={{ fontSize: "12px", fontWeight: 600 }}>💡 Insight</p>
            <p className="text-teal-600 mt-1" style={{ fontSize: "12px", lineHeight: 1.5 }}>
              Environmental noise correlates with 68% of attention drops this week.
            </p>
          </div>
        </div>
      </div>

      {/* Intervention Tracking */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #ECEEF4" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #ECEEF4" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#F0FDF9" }}>
              <Clipboard style={{ width: "15px", height: "15px", color: "#14B8A6" }} />
            </div>
            <div>
              <p className="text-slate-700" style={{ fontSize: "13.5px", fontWeight: 600 }}>Intervention Tracking</p>
              <p className="text-slate-400" style={{ fontSize: "12px" }}>3 active cases</p>
            </div>
          </div>
          <button
            className="text-indigo-500 cursor-pointer hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
            style={{ fontSize: "12px", fontWeight: 600 }}
          >
            + New
          </button>
        </div>

        <div>
          {visibleInterventions.length === 0 ? (
            <p className="px-5 py-4 text-sm text-slate-500">No interventions created yet.</p>
          ) : null}

          {visibleInterventions.map((item) => {
            const s = statusStyle[item.status] ?? statusStyle.active;
            return (
              <div
                key={item.student}
                className="px-5 py-3.5 hover:bg-slate-50/50 transition-colors"
                style={{ borderTop: "1px solid #F4F5F8" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <User className="text-slate-400" style={{ width: "13px", height: "13px" }} />
                    <span className="text-slate-700" style={{ fontSize: "13px", fontWeight: 600 }}>{item.student}</span>
                  </div>
                  <span className="text-slate-400" style={{ fontSize: "12px" }}>{item.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-slate-500" style={{ fontSize: "12px" }}>{item.type}</p>
                  <span
                    className="rounded-full px-2 py-0.5"
                    style={{ fontSize: "11px", fontWeight: 600, background: s.bg, color: s.color }}
                  >
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-5 py-3.5" style={{ borderTop: "1px solid #ECEEF4", background: "#FAFBFC" }}>
          <button
            type="button"
            onClick={() => setShowAllInterventions((current) => !current)}
            className="w-full flex items-center justify-center gap-2 cursor-pointer transition-colors"
            style={{ fontSize: "13px", fontWeight: 600, color: "#0277BD" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#01579B"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#0277BD"}
          >
            {interventions.length > 3
              ? showAllInterventions
                ? "Show fewer interventions"
                : `View all interventions (${interventions.length})`
              : "View all interventions"}
            <ChevronRight style={{ width: "14px", height: "14px" }} />
          </button>
        </div>
      </div>
    </div>
  );
}
