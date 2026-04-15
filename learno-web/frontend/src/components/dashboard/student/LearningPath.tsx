"use client";

import { CheckCircle, Lock, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { useStudentThemeProfile } from "@/hooks/useStudentThemeProfile";
import { useStudentDashboardContext } from "./StudentContext";

interface PathStep {
  title: string;
  done: boolean;
  current?: boolean;
}

function buildPath(progressTitles: string[]): PathStep[] {
  if (progressTitles.length >= 5) {
    return [
      { title: progressTitles[0], done: true },
      { title: progressTitles[1], done: true },
      { title: progressTitles[2], done: false, current: true },
      { title: progressTitles[3], done: false },
      { title: progressTitles[4], done: false },
    ];
  }

  return [
    { title: "Intro to Cells", done: true },
    { title: "Photosynthesis", done: true },
    { title: "Cell Division", done: false, current: true },
    { title: "Genetics", done: false },
    { title: "Evolution", done: false },
  ];
}

export function LearningPath() {
  const { allProgress } = useStudentDashboardContext();
  const { profile } = useStudentThemeProfile();

  const pathSteps = useMemo(() => {
    const titles = allProgress
      .map((item) => item.lesson?.title)
      .filter((value): value is string => Boolean(value));

    return buildPath(Array.from(new Set(titles)));
  }, [allProgress]);

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
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp size={16} style={{ color: "var(--color-accent)" }} />
        <span className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
          {profile.pathLabel}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {pathSteps.map((step, index) => (
          <div key={step.title + index} className="flex items-center gap-3">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style={{
                background: step.done
                  ? "var(--color-accent)"
                  : step.current
                    ? "rgba(var(--student-accent-rgb, 111 168 220), var(--student-accent-soft-opacity, 0.16))"
                    : "rgba(var(--student-primary-rgb, 44 62 80), 0.08)",
                border: step.current
                  ? "2px solid var(--student-attention-ring, rgba(59,130,246,0.24))"
                  : "2px solid rgba(var(--student-primary-rgb, 44 62 80), 0.12)",
                transition:
                  "background var(--student-motion-duration, 320ms) var(--student-motion-curve, ease), border-color var(--student-motion-duration, 320ms) var(--student-motion-curve, ease)",
              }}
            >
              {step.done ? (
                <CheckCircle size={14} color="white" />
              ) : step.current ? (
                <div className="h-2 w-2 rounded-full" style={{ background: "var(--color-accent)" }} />
              ) : (
                <Lock size={10} style={{ color: "rgba(var(--student-primary-rgb, 44 62 80), 0.35)" }} />
              )}
            </div>

            <span
              className="text-xs"
              style={{
                color: step.done
                  ? "var(--color-accent)"
                  : step.current
                    ? "var(--color-text)"
                    : "var(--color-text-muted)",
                fontWeight: step.current ? 600 : 400,
                textDecoration: step.done ? "line-through" : "none",
              }}
            >
              {step.title}
            </span>

            {step.current ? (
              <span
                className="ml-auto rounded-full px-2 py-0.5 text-[10px]"
                style={{
                  background:
                    "rgba(var(--student-accent-rgb, 111 168 220), var(--student-accent-soft-opacity, 0.16))",
                  color: "var(--color-primary)",
                }}
              >
                In Progress
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
