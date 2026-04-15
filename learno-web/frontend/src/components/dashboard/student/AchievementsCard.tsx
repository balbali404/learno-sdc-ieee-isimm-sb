"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { useStudentDashboardContext } from "./StudentContext";

export function AchievementsCard() {
  const { achievements, unlockedAchievements } = useStudentDashboardContext();

  const unlocked = achievements.filter((item) => item.unlocked);
  const newOnes = unlocked.filter((item) => item.isNew);
  const remaining = achievements.filter((item) => !item.unlocked);
  const top = [...newOnes, ...unlocked.filter((item) => !item.isNew), ...remaining].slice(0, 3);

  return (
    <section
      className="rounded-2xl p-5"
      style={{
        background:
          "linear-gradient(155deg, var(--student-card-gradient-a, rgba(59,130,246,0.1)) 0%, var(--student-card-gradient-b, rgba(30,58,138,0.06)) 100%), var(--color-surface)",
        border: "var(--student-card-border-width, 1px) solid var(--color-border)",
        borderRadius: "var(--student-card-radius, 16px)",
        boxShadow: "var(--student-card-shadow)",
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={16} style={{ color: "var(--color-accent)" }} />
          <span className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
            Achievements
          </span>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{
            background:
              "rgba(var(--student-accent-rgb, 111 168 220), var(--student-accent-soft-opacity, 0.16))",
            color: "var(--color-primary)",
          }}
        >
          {unlockedAchievements} / {achievements.length}
        </span>
      </div>

      <div className="space-y-2">
        {top.length > 0 ? (
          top.map((achievement) => (
            <div
              key={achievement.id}
              className="flex items-center gap-3 rounded-xl border px-3 py-2"
              style={{
                borderColor: "var(--color-border)",
                background: achievement.unlocked
                  ? "var(--color-surface)"
                  : "rgba(var(--student-accent-rgb, 111 168 220), 0.08)",
                opacity: achievement.unlocked ? 1 : 0.65,
              }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[11px] font-semibold"
                style={{
                  background:
                    "rgba(var(--student-accent-rgb, 111 168 220), var(--student-accent-soft-opacity, 0.16))",
                  color: "var(--color-primary)",
                }}
              >
                {achievement.unlocked ? achievement.icon ?? "BADGE" : "LOCK"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold" style={{ color: "var(--color-text)" }}>
                  {achievement.name}
                </p>
                <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                  {achievement.description}
                </p>
              </div>
              {achievement.isNew && achievement.unlocked ? (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: "var(--color-accent)", color: "var(--color-surface)" }}
                >
                  New
                </span>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed px-4 py-6 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
            No achievements yet.
          </div>
        )}
      </div>

      <Link
        href="/student/progress"
        className="mt-3 inline-flex text-xs font-semibold"
        style={{ color: "var(--color-accent)" }}
      >
        View all achievements
      </Link>
    </section>
  );
}
