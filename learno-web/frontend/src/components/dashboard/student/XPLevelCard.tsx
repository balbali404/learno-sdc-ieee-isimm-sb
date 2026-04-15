"use client";

import { Star } from "lucide-react";
import { useStudentDashboardContext } from "./StudentContext";

export function XPLevelCard() {
  const { xp } = useStudentDashboardContext();

  const level = Math.max(1, xp.currentLevel ?? 1);
  const currentXP = Math.max(0, xp.totalXP ?? 0);
  const xpToNextLevel = Math.max(0, xp.xpToNextLevel ?? 120);
  const levelStep = Math.max(1, Math.round((currentXP + xpToNextLevel) / level));
  const xpIntoLevel = Math.max(0, currentXP - levelStep * (level - 1));
  const progress = levelStep > 0 ? Math.round((xpIntoLevel / levelStep) * 100) : 0;

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
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{
              background: "var(--student-hero-gradient)",
              boxShadow: "0 8px 24px var(--student-focus-glow, rgba(59,130,246,0.18))",
            }}
          >
            <Star size={18} fill="white" color="white" />
          </div>

          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
              Current Level
            </p>
            <p className="font-bold" style={{ color: "var(--color-text)" }}>
              Level {level} - Scholar
            </p>
          </div>
        </div>

        <span
          className="rounded-full px-2 py-1 text-xs"
          style={{
            background:
              "rgba(var(--student-accent-rgb, 111 168 220), var(--student-accent-soft-opacity, 0.16))",
            color: "var(--color-primary)",
            border: "var(--student-card-border-width, 1px) solid var(--color-border)",
          }}
        >
          {xpIntoLevel} / {levelStep} XP
        </span>
      </div>

      <div
        className="relative h-2.5 w-full overflow-hidden rounded-full"
        style={{ background: "rgba(var(--student-primary-rgb, 44 62 80), 0.12)" }}
      >
        <div
          className="h-2.5 rounded-full"
          style={{
            width: `${Math.max(0, Math.min(100, progress))}%`,
            background: "linear-gradient(90deg, var(--color-accent), var(--color-primary))",
            transition: "width var(--student-motion-duration, 320ms) var(--student-motion-curve, ease)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(120deg, transparent 0, transparent 16px, var(--student-progress-stripe, rgba(255,255,255,0.32)) 16px, var(--student-progress-stripe, rgba(255,255,255,0.32)) 24px)",
            opacity: 0.35,
          }}
        />
      </div>

      <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
        {xpToNextLevel} XP to reach Level {level + 1} - Master
      </p>
    </section>
  );
}
