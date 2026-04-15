"use client";

import { useMemo, useState } from "react";
import { useStudentThemeProfile } from "@/hooks/useStudentThemeProfile";

const moods = ["😴", "😐", "🙂", "😊", "🤩"];
const moodLabels = ["Exhausted", "Meh", "Okay", "Good", "Amazing"];

const toneByMood: Record<"steady" | "calm" | "warm", string[]> = {
  steady: ["Set one clear task.", "You are centered.", "Keep this pace.", "Great momentum.", "Channel this energy."],
  calm: [
    "Slow start is okay.",
    "Keep a gentle pace.",
    "You are in a stable zone.",
    "This is calm progress.",
    "Breathe and continue.",
  ],
  warm: [
    "Tiny step is enough.",
    "Be kind to yourself.",
    "Good effort today.",
    "You are moving forward.",
    "Hold this positive spark.",
  ],
};

export function MoodCheckIn() {
  const [selected, setSelected] = useState<number | null>(null);
  const { profile } = useStudentThemeProfile();

  const moodHint = useMemo(() => {
    if (selected === null) {
      return "";
    }

    return toneByMood[profile.moodTone][selected] ?? "";
  }, [profile.moodTone, selected]);

  return (
    <section
      className="flex flex-wrap items-center gap-4 rounded-2xl p-4"
      style={{
        background:
          "linear-gradient(155deg, var(--student-card-gradient-a, rgba(59,130,246,0.1)) 0%, var(--student-card-gradient-b, rgba(30,58,138,0.06)) 100%), var(--color-surface)",
        border: "var(--student-card-border-width, 1px) solid var(--color-border)",
        borderRadius: "var(--student-card-radius, 16px)",
        boxShadow: "var(--student-card-shadow)",
      }}
    >
      <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
        {profile.moodPrompt}
      </span>

      <div className="flex gap-2">
        {moods.map((mood, index) => (
          <button
            key={mood + index}
            type="button"
            onClick={() => setSelected(index)}
            title={moodLabels[index]}
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl"
            style={{
              transform: selected === index ? `scale(var(--student-mood-scale, 1.05))` : "scale(1)",
              transition:
                "transform var(--student-motion-duration, 320ms) var(--student-motion-curve, ease), background var(--student-motion-duration, 320ms) var(--student-motion-curve, ease)",
              background:
                selected === index
                  ? "rgba(var(--student-accent-rgb, 111 168 220), var(--student-accent-soft-opacity, 0.16))"
                  : "transparent",
              border:
                selected === index
                  ? "2px solid var(--student-attention-ring, rgba(59,130,246,0.24))"
                  : "2px solid transparent",
            }}
          >
            {mood}
          </button>
        ))}
      </div>

      {selected !== null ? (
        <span className="ml-auto text-xs" style={{ color: "var(--color-text-muted)" }}>
          {profile.moodFeedbackPrefix} {moodLabels[selected]} - {moodHint}
        </span>
      ) : null}
    </section>
  );
}
