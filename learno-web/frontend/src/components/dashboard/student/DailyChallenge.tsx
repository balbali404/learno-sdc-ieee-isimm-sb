"use client";

import { useState } from "react";
import { Brain } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { useStudentThemeProfile } from "@/hooks/useStudentThemeProfile";
import { useStudentDashboardContext } from "./StudentContext";

const questions = [
  {
    key: "bio-cell",
    question: "What is the powerhouse of the cell?",
    options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi Apparatus"],
    answer: 1,
    subject: "Biology",
    xp: 20,
  },
  {
    key: "math-percent",
    question: "What is 15% of 200?",
    options: ["25", "30", "35", "40"],
    answer: 1,
    subject: "Math",
    xp: 20,
  },
  {
    key: "history-ww2",
    question: "In which year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    answer: 2,
    subject: "History",
    xp: 20,
  },
];

const scoreMessageByCondition: Record<string, string> = {
  adhd: "Great lock-in. Keep the momentum.",
  asd: "Excellent steady progress.",
  dyslexia: "Clear reading, strong answer.",
  dyscalculia: "Good step-by-step reasoning.",
  anxiety: "Nice work. You handled it calmly.",
  depression: "That is a meaningful small win.",
  default: "Great work. Keep going.",
};

export function DailyChallenge() {
  const { completeBrainChallenge, refresh } = useStudentDashboardContext();
  const { condition, profile } = useStudentThemeProfile();

  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const question = questions[questionIndex % questions.length];

  const handleSelect = async (optionIndex: number) => {
    if (selected !== null || isSaving) {
      return;
    }

    setSelected(optionIndex);
    const isCorrect = optionIndex === question.answer;

    if (isCorrect) {
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.62 },
        colors: [...profile.celebrationColors],
      });
    }

    setIsSaving(true);
    try {
      await completeBrainChallenge({
        challengeKey: `dashboard-${question.key}-${Date.now()}`,
        subject: question.subject,
        isCorrect,
        xpEarned: question.xp,
      });

      await refresh();
    } catch {
      toast.error("Could not save challenge result.");
    } finally {
      setIsSaving(false);
    }
  };

  const nextQuestion = () => {
    setQuestionIndex((index) => index + 1);
    setSelected(null);
  };

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
      <div className="mb-3 flex items-center gap-2">
        <Brain size={18} style={{ color: "var(--color-accent)" }} />
        <span className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
          {profile.challengeLabel}
        </span>
        <span
          className="ml-auto rounded-full px-2 py-0.5 text-xs"
          style={{
            background:
              "rgba(var(--student-accent-rgb, 111 168 220), var(--student-accent-soft-opacity, 0.16))",
            color: "var(--color-primary)",
          }}
        >
          +{question.xp} XP
        </span>
      </div>

      <p className="mb-3 text-sm" style={{ color: "var(--color-text)" }}>
        {question.question}
      </p>

      <div className="flex flex-col gap-2">
        {question.options.map((option, index) => {
          const isCorrect = index === question.answer;
          const isSelected = selected === index;

          let background = "var(--color-surface)";
          let border = "var(--color-border)";

          if (selected !== null) {
            if (isCorrect) {
              background = "rgba(39, 174, 96, 0.13)";
              border = "rgba(39, 174, 96, 0.45)";
            } else if (isSelected) {
              background = "rgba(192, 112, 96, 0.14)";
              border = "rgba(192, 112, 96, 0.5)";
            }
          }

          return (
            <button
              key={option}
              type="button"
              disabled={selected !== null || isSaving}
              onClick={() => void handleSelect(index)}
              className="rounded-xl px-3 py-2 text-left text-sm"
              style={{
                background,
                border: `1px solid ${border}`,
                color: "var(--color-text)",
                transition:
                  "background var(--student-motion-duration, 320ms) var(--student-motion-curve, ease), border-color var(--student-motion-duration, 320ms) var(--student-motion-curve, ease)",
              }}
            >
              {option}
            </button>
          );
        })}
      </div>

      {selected !== null ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p
            className="text-xs"
            style={{
              color: selected === question.answer ? "var(--color-success)" : "var(--color-error)",
            }}
          >
            {selected === question.answer
              ? `Correct. +${question.xp} XP added. ${scoreMessageByCondition[condition] ?? scoreMessageByCondition.default}`
              : `Not quite. The answer is ${question.options[question.answer]}. ${profile.focusHint}`}
          </p>

          <button
            type="button"
            onClick={nextQuestion}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--student-hero-gradient)" }}
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}
