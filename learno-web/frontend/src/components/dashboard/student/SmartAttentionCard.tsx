"use client";

import { useStudentThemeProfile } from "@/hooks/useStudentThemeProfile";
import { useStudentDashboardContext } from "./StudentContext";

export function SmartAttentionCard() {
  const { engagementOverview } = useStudentDashboardContext();
  const { profile } = useStudentThemeProfile();

  const focusScore = Math.max(0, Math.min(100, Math.round(engagementOverview.averageConcentration ?? 72)));

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
      <div className="mb-2 flex items-center gap-2">
        <span className="text-lg">👁️</span>
        <span className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
          Smart Attention Tracker
        </span>
      </div>

      <p className="mb-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
        Monitors your focus while studying and suggests breaks at the right moment.
      </p>

      <div className="flex items-center gap-3">
        <div
          className="h-2 flex-1 rounded-full"
          style={{
            background: "rgba(var(--student-primary-rgb, 44 62 80), 0.12)",
            boxShadow: `0 0 0 1px var(--student-attention-ring, rgba(59,130,246,0.24)) inset`,
          }}
        >
          <div
            className="h-2 rounded-full"
            style={{
              width: `${focusScore}%`,
              background: "linear-gradient(90deg, var(--color-accent), var(--color-primary))",
              boxShadow: "0 0 18px var(--student-focus-glow, rgba(59,130,246,0.18))",
              transition:
                "width var(--student-motion-duration, 320ms) var(--student-motion-curve, ease), box-shadow var(--student-motion-duration, 320ms) var(--student-motion-curve, ease)",
            }}
          />
        </div>
        <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
          {focusScore}% Focus
        </span>
      </div>

      <p className="mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
        {profile.focusHint}
      </p>
    </section>
  );
}
