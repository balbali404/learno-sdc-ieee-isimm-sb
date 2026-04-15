"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useStudentDashboardContext } from "./StudentContext";

const subjectEmoji: Record<string, string> = {
  biology: "🌿",
  mathematics: "📐",
  math: "📐",
  history: "⚔️",
  cs: "🐍",
  physics: "⚡",
  english: "📖",
};

export function LessonSummaries() {
  const { recentProgress } = useStudentDashboardContext();

  const lessons = recentProgress
    .filter((entry) => entry.lesson)
    .slice(0, 4)
    .map((entry) => {
      const lesson = entry.lesson;
      const subject = lesson?.subject?.name ?? "General";
      const emoji = subjectEmoji[subject.toLowerCase()] ?? "📘";

      return {
        id: entry.id,
        title: lesson?.title ?? "Untitled lesson",
        subject,
        progress: Math.max(0, Math.min(100, entry.progressPercent ?? 0)),
        emoji,
      };
    });

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
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
          Recent Lessons
        </span>

        <Link href="/student/lessons" className="flex items-center gap-1 text-xs" style={{ color: "var(--color-accent)" }}>
          View all <ChevronRight size={12} />
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {lessons.length > 0 ? (
          lessons.map((lesson) => (
            <div key={lesson.id} className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base"
                style={{
                  background:
                    "rgba(var(--student-accent-rgb, 111 168 220), var(--student-accent-soft-opacity, 0.16))",
                }}
              >
                {lesson.emoji}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold" style={{ color: "var(--color-text)" }}>
                  {lesson.title}
                </p>
                <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                  {lesson.subject}
                </p>

                <div
                  className="mt-1 h-1.5 w-full overflow-hidden rounded-full"
                  style={{ background: "rgba(var(--student-primary-rgb, 44 62 80), 0.12)" }}
                >
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${lesson.progress}%`,
                      background: "linear-gradient(90deg, var(--color-accent), var(--color-primary))",
                      transition:
                        "width var(--student-motion-duration, 320ms) var(--student-motion-curve, ease)",
                    }}
                  />
                </div>
              </div>

              <span className="shrink-0 text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
                {lesson.progress}%
              </span>
            </div>
          ))
        ) : (
          <div className="rounded-xl p-6 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
            No lessons yet.
          </div>
        )}
      </div>
    </section>
  );
}
