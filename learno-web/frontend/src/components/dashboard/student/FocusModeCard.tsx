"use client";

import Link from "next/link";
import { useStudentThemeProfile } from "@/hooks/useStudentThemeProfile";

export function FocusModeCard() {
  const { profile } = useStudentThemeProfile();

  return (
    <section
      className="flex items-center justify-between gap-4 rounded-2xl p-6"
      style={{
        background: "var(--student-hero-gradient)",
        color: "#FFFFFF",
        borderRadius: "var(--student-card-radius, 16px)",
        boxShadow: "0 12px 30px var(--student-focus-glow, rgba(59,130,246,0.18))",
      }}
    >
      <div>
        <p className="text-base font-bold">Focus Mode 🎯</p>
        <p className="mt-0.5 text-sm text-white/80">{profile.focusHint}</p>
      </div>

      <Link
        href="/student/focus"
        className="whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-105"
        style={{
          color: "var(--color-surface)",
          background:
            "rgba(var(--student-primary-rgb, 44 62 80), 0.22)",
          border:
            "1px solid rgba(var(--student-primary-rgb, 44 62 80), 0.32)",
        }}
      >
        Start Focus
      </Link>
    </section>
  );
}
