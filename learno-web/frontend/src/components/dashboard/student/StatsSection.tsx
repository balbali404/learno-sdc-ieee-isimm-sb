"use client";

import { BookOpen, Clock, Flame, Zap } from "lucide-react";
import { useStudentDashboardContext } from "./StudentContext";

export function StatsSection() {
  const { allProgress, completedLessons, xp } = useStudentDashboardContext();

  const totalMinutes = allProgress.reduce((sum, lesson) => sum + (lesson.timeSpentMin ?? 0), 0);
  const studyHours = Math.max(0, Number((totalMinutes / 60).toFixed(1)));

  const cards = [
    {
      icon: Flame,
      label: "Day Streak",
      value: `${Math.max(0, xp.currentStreak ?? 0)}`,
      unit: "days",
      tone: "rgba(var(--student-accent-rgb, 111 168 220), 0.2)",
    },
    {
      icon: Zap,
      label: "XP Earned",
      value: `${Math.max(0, xp.totalXP ?? 0)}`,
      unit: "XP",
      tone: "rgba(var(--student-primary-rgb, 44 62 80), 0.18)",
    },
    {
      icon: BookOpen,
      label: "Lessons Done",
      value: `${completedLessons}`,
      unit: "this week",
      tone: "rgba(var(--student-accent-rgb, 111 168 220), 0.14)",
    },
    {
      icon: Clock,
      label: "Study Time",
      value: `${studyHours}`,
      unit: "hrs today",
      tone: "rgba(var(--student-primary-rgb, 44 62 80), 0.12)",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map(({ icon: Icon, label, value, unit, tone }) => (
        <article
          key={label}
          className="rounded-2xl p-4"
          style={{
            background:
              "linear-gradient(155deg, var(--student-card-gradient-a, rgba(59,130,246,0.1)) 0%, var(--student-card-gradient-b, rgba(30,58,138,0.06)) 100%), var(--color-surface)",
            border: "var(--student-card-border-width, 1px) solid var(--color-border)",
            borderRadius: "var(--student-card-radius, 16px)",
            boxShadow: "var(--student-card-shadow)",
            transition:
              "transform var(--student-motion-duration, 320ms) var(--student-motion-curve, ease), box-shadow var(--student-motion-duration, 320ms) var(--student-motion-curve, ease)",
          }}
        >
          <div className="mb-2 flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: tone }}
            >
              <Icon size={16} style={{ color: "var(--color-accent)" }} />
            </div>
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {label}
            </span>
          </div>

          <p className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
            {value}
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {unit}
          </p>
        </article>
      ))}
    </div>
  );
}
