import { Users, BookOpen, AlertTriangle, GraduationCap, TrendingUp, TrendingDown } from "lucide-react";

interface SummaryCardsProps {
  summary: {
    totalStudents: number;
    activeClasses: number;
    alertsToday: number;
    teachersActive: number;
    totalStudentsTrend: number;
    activeClassesTrend: number;
    alertsTrend: number;
    teachersTrend: number;
    liveSessions?: number;
    avgLiveCo2?: number;
    avgLiveLight?: number;
    avgLiveNoise?: number;
    avgAllCo2?: number | null;
    avgAllLight?: number | null;
  };
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      label: "Total Students",
      value: summary.totalStudents.toLocaleString(),
      trend: `${summary.totalStudentsTrend >= 0 ? "+" : ""}${summary.totalStudentsTrend}%`,
      trendUp: summary.totalStudentsTrend >= 0,
      trendText: "from baseline",
      icon: Users,
      iconBg: "#EEF0FD",
      iconColor: "#6366F1",
      accentColor: "#6366F1",
    },
    {
      label: "Active Classes",
      value: String(summary.activeClasses),
      trend: `+${summary.activeClassesTrend}`,
      trendUp: true,
      trendText: "in timetable",
      icon: BookOpen,
      iconBg: "#F0FDF9",
      iconColor: "#14B8A6",
      accentColor: "#14B8A6",
    },
    {
      label: "Alerts Today",
      value: String(summary.alertsToday),
      trend: `${summary.alertsTrend >= 0 ? "+" : ""}${summary.alertsTrend}`,
      trendUp: summary.alertsTrend <= 0,
      trendText: "currently open",
      icon: AlertTriangle,
      iconBg: "#FFFBEB",
      iconColor: "#F59E0B",
      accentColor: "#F59E0B",
    },
    {
      label: "Teachers Active",
      value: String(summary.teachersActive),
      trend: `${summary.teachersTrend >= 0 ? "+" : ""}${summary.teachersTrend}%`,
      trendUp: summary.teachersTrend >= 0,
      trendText: "from baseline",
      icon: GraduationCap,
      iconBg: "#F5F3FF",
      iconColor: "#8B5CF6",
      accentColor: "#8B5CF6",
    },
{
      label: "Live Sessions",
      value: String(summary.liveSessions ?? 0),
      trend: `${summary.avgLiveCo2 ?? 0} ppm`,
      trendUp: (summary.avgLiveCo2 ?? 0) < 900,
      trendText: "avg live CO2",
      icon: AlertTriangle,
      iconBg: "#EFF6FF",
      iconColor: "#0EA5E9",
      accentColor: "#0EA5E9",
    },
    {
      label: "Avg CO2 (All)",
      value: summary.avgAllCo2 != null ? `${summary.avgAllCo2} ppm` : "-",
      trend: summary.avgAllLight != null ? `${summary.avgAllLight}%` : "-",
      trendUp: summary.avgAllCo2 != null ? summary.avgAllCo2 < 900 : true,
      trendText: "avg light",
      icon: BookOpen,
      iconBg: "#F0FDF9",
      iconColor: "#14B8A6",
      accentColor: "#14B8A6",
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white rounded-2xl p-5 hover:shadow-sm transition-shadow duration-200"
            style={{ border: "1px solid #ECEEF4" }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: card.iconBg }}
              >
                <Icon style={{ width: "18px", height: "18px", color: card.iconColor }} />
              </div>
              <div
                className="flex items-center gap-1 rounded-full px-2 py-1"
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  background: card.trendUp ? "#F0FDF4" : "#FFF1F2",
                  color: card.trendUp ? "#16A34A" : "#E11D48",
                }}
              >
                {card.trendUp ? (
                  <TrendingUp style={{ width: "11px", height: "11px" }} />
                ) : (
                  <TrendingDown style={{ width: "11px", height: "11px" }} />
                )}
                {card.trend}
              </div>
            </div>

            <div>
              <p className="text-slate-800 mb-0.5" style={{ fontSize: "1.65rem", fontWeight: 700, lineHeight: 1.1 }}>
                {card.value}
              </p>
              <p className="text-slate-600" style={{ fontSize: "13px", fontWeight: 500 }}>
                {card.label}
              </p>
              <p className="text-slate-400 mt-0.5" style={{ fontSize: "12px" }}>{card.trendText}</p>
            </div>

            {/* Bottom accent line */}
            <div
              className="mt-4 h-0.5 rounded-full opacity-40"
              style={{ background: card.accentColor }}
            />
          </div>
        );
      })}
    </div>
  );
}
