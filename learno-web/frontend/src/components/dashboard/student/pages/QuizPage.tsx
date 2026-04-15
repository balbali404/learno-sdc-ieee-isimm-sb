"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Trophy,
  XCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { ApiError, studentApi } from "@/lib/api";
import type { LessonItem } from "@/lib/api/types";
import { useStudentDashboardContext } from "../StudentContext";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizTemplate {
  id: string;
  title: string;
  subject: string;
  xpReward: number;
  questions: QuizQuestion[];
}


const SUBJECT_DECOYS = ["Biology", "Mathematics", "History", "Physics", "English", "General"];

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const normalized = value.trim();
    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    result.push(normalized);
  });

  return result;
}

function toDifficultyLabel(value?: string | null): "Beginner" | "Intermediate" | "Advanced" {
  const normalized = (value ?? "").toUpperCase();

  if (normalized === "BEGINNER") {
    return "Beginner";
  }

  if (normalized === "ADVANCED") {
    return "Advanced";
  }

  return "Intermediate";
}

function buildSubjectOptions(correctSubject: string, allSubjects: string[]): string[] {
  const options = uniqueStrings([
    correctSubject,
    ...allSubjects,
    ...SUBJECT_DECOYS,
  ]).slice(0, 4);

  while (options.length < 4) {
    options.push(`Subject ${options.length + 1}`);
  }

  return options;
}

function buildChapterCountOptions(chapterCount: number): string[] {
  const safeCount = Math.max(1, chapterCount);
  const options = uniqueStrings([
    `${safeCount}`,
    `${Math.max(1, safeCount - 1)}`,
    `${safeCount + 1}`,
    `${safeCount + 2}`,
  ]).slice(0, 4);

  while (options.length < 4) {
    options.push(`${safeCount + options.length}`);
  }

  return options;
}

function buildQuizFromLesson(lesson: LessonItem, allSubjects: string[]): QuizTemplate {
  const subject = lesson.subject?.name ?? "General";
  const chapterCount = Math.max(1, lesson.chapters?.length ?? 1);
  const difficulty = toDifficultyLabel(lesson.difficulty);

  const subjectOptions = buildSubjectOptions(subject, allSubjects);
  const chapterOptions = buildChapterCountOptions(chapterCount);
  const difficultyOptions = ["Beginner", "Intermediate", "Advanced"];

  const xpReward = Math.max(
    20,
    Math.min(120, Math.round((lesson.totalXP ?? chapterCount * 20) * 0.6)),
  );

  return {
    id: `lesson-${lesson.id}`,
    title: `${lesson.title} Quiz`,
    subject,
    xpReward,
    questions: [
      {
        id: `${lesson.id}-subject`,
        question: `Which subject does \"${lesson.title}\" belong to?`,
        options: subjectOptions,
        correctAnswer: Math.max(0, subjectOptions.indexOf(subject)),
      },
      {
        id: `${lesson.id}-chapters`,
        question: `How many chapters are included in this lesson?`,
        options: chapterOptions,
        correctAnswer: Math.max(0, chapterOptions.indexOf(String(chapterCount))),
      },
      {
        id: `${lesson.id}-difficulty`,
        question: `What is the difficulty level of this lesson?`,
        options: difficultyOptions,
        correctAnswer: Math.max(0, difficultyOptions.indexOf(difficulty)),
      },
    ],
  };
}

function buildQuizTemplatesFromLessons(lessons: LessonItem[]): QuizTemplate[] {
  if (lessons.length === 0) {
    return [];
  }

  const subjects = uniqueStrings(lessons.map((lesson) => lesson.subject?.name ?? "General"));

  return lessons
    .slice()
    .sort((a, b) => {
      const aProgress = a.studentProgress?.progressPercent ?? 0;
      const bProgress = b.studentProgress?.progressPercent ?? 0;
      return bProgress - aProgress;
    })
    .slice(0, 8)
    .map((lesson) => buildQuizFromLesson(lesson, subjects));
}

type QuizState = "selection" | "inProgress" | "results";

export function QuizPage() {
  const { completeBrainChallenge, refresh } = useStudentDashboardContext();

  const [state, setState] = useState<QuizState>("selection");
  const [quizTemplates, setQuizTemplates] = useState<QuizTemplate[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    attempts: 0,
    avgScore: 0,
    bestScore: 0,
  });

  const [selectedQuiz, setSelectedQuiz] = useState<QuizTemplate | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [attemptStartedAt, setAttemptStartedAt] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadCatalog = async () => {
      setIsLoadingCatalog(true);
      setCatalogError(null);

      const [lessonsResult, statsResult] = await Promise.allSettled([
        studentApi.getLessons({ page: 1, limit: 50 }),
        studentApi.getQuizStats(),
      ]);

      if (cancelled) {
        return;
      }

      if (statsResult.status === "fulfilled") {
        setSummary({
          attempts: statsResult.value.summary.attempts ?? 0,
          avgScore: Math.round(statsResult.value.summary.avgScore ?? 0),
          bestScore: Math.round(statsResult.value.summary.bestScore ?? 0),
        });
      }

      if (lessonsResult.status === "fulfilled") {
        const templates = buildQuizTemplatesFromLessons(lessonsResult.value.lessons ?? []);
        setQuizTemplates(templates);
      } else {
        setQuizTemplates([]);
      }

      if (lessonsResult.status === "rejected" && statsResult.status === "rejected") {
        if (lessonsResult.reason instanceof ApiError) {
          setCatalogError(lessonsResult.reason.message);
        } else if (statsResult.reason instanceof ApiError) {
          setCatalogError(statsResult.reason.message);
        } else {
          setCatalogError("Could not load quiz catalog right now.");
        }
      }

      setIsLoadingCatalog(false);
    };

    loadCatalog().catch(() => {
      if (!cancelled) {
        setQuizTemplates([]);
        setCatalogError("Could not load quiz catalog right now.");
        setIsLoadingCatalog(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const score = useMemo(() => {
    if (!selectedQuiz) return 0;

    return answers.filter(
      (answer, index) => answer === selectedQuiz.questions[index].correctAnswer,
    ).length;
  }, [answers, selectedQuiz]);

  const percentage = useMemo(() => {
    if (!selectedQuiz || selectedQuiz.questions.length === 0) return 0;

    return Math.round((score / selectedQuiz.questions.length) * 100);
  }, [score, selectedQuiz]);

  const startQuiz = (quiz: QuizTemplate) => {
    setSelectedQuiz(quiz);
    setCurrentQuestionIndex(0);
    setAnswers(new Array(quiz.questions.length).fill(null));
    setAttemptStartedAt(Date.now());
    setSubmitError(null);
    setState("inProgress");
  };

  const answerCurrent = (answerIndex: number) => {
    if (!selectedQuiz) return;

    const next = [...answers];
    next[currentQuestionIndex] = answerIndex;
    setAnswers(next);
  };

  const goNext = () => {
    if (!selectedQuiz) {
      return;
    }

    if (currentQuestionIndex < selectedQuiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }

    void finishQuiz();
  };

  const finishQuiz = async () => {
    if (!selectedQuiz) {
      return;
    }

    const correctAnswers = answers.filter(
      (answer, index) => answer === selectedQuiz.questions[index].correctAnswer,
    ).length;
    const pct = Math.round((correctAnswers / selectedQuiz.questions.length) * 100);
    const earnedXp = Math.max(10, Math.round((selectedQuiz.xpReward * pct) / 100));
    const durationSec =
      attemptStartedAt !== null
        ? Math.min(600, Math.max(0, Math.round((Date.now() - attemptStartedAt) / 1000)))
        : undefined;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await completeBrainChallenge({
        challengeKey: `quiz-${selectedQuiz.id}-${Date.now()}`,
        subject: selectedQuiz.subject,
        isCorrect: pct >= 60,
        xpEarned: earnedXp,
        durationSec,
        engagementScore: pct,
        concentrationScore: Math.max(0, Math.min(100, Math.round(pct * 0.85 + 10))),
        source: "QUIZ",
      });
      await refresh();

      if (pct >= 60) {
        confetti({
          particleCount: 110,
          spread: 65,
          origin: { y: 0.6 },
          colors: ["#1ABC9C", "#7CD6C6", "#2C3E50", "#6FA8DC"],
        });
      }

      setState("results");
    } catch {
      setSubmitError("Could not save quiz result. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setState("selection");
    setSelectedQuiz(null);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setAttemptStartedAt(null);
    setSubmitError(null);
  };

  if (state === "selection") {
    return (
      <div className="flex flex-col gap-6 pb-24">
        <div className="flex items-center gap-3">
          <Link
            href="/student"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D6EAF8] bg-white text-[#6FA8DC] transition-colors hover:bg-[#F7FBFF]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-[#2F3A4A]">Quizzes</h1>
            <p className="mt-0.5 text-sm text-[#8FB8E0]">
              Complete quizzes and save XP to your profile.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-[#D6EAF8] bg-white p-4">
            <p className="text-[10px] uppercase tracking-wide text-[#8FB8E0]">Attempts</p>
            <p className="mt-1 text-xl font-bold text-[#2F3A4A]">{summary.attempts}</p>
          </div>
          <div className="rounded-xl border border-[#D6EAF8] bg-white p-4">
            <p className="text-[10px] uppercase tracking-wide text-[#8FB8E0]">Average Score</p>
            <p className="mt-1 text-xl font-bold text-[#2F3A4A]">{summary.avgScore}%</p>
          </div>
          <div className="rounded-xl border border-[#D6EAF8] bg-white p-4">
            <p className="text-[10px] uppercase tracking-wide text-[#8FB8E0]">Best Score</p>
            <p className="mt-1 text-xl font-bold text-[#2F3A4A]">{summary.bestScore}%</p>
          </div>
        </div>

        {isLoadingCatalog ? (
          <div className="rounded-xl border border-[#D6EAF8] bg-white px-4 py-8 text-center text-sm text-[#8FB8E0]">
            <Loader2 size={16} className="mx-auto mb-2 animate-spin" />
            Loading quiz catalog...
          </div>
        ) : null}

        {catalogError ? (
          <div className="rounded-xl border border-[#D6EAF8] bg-white px-4 py-3 text-sm text-[#6FA8DC]">
            {catalogError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {quizTemplates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D6EAF8] bg-white px-4 py-6 text-center text-sm text-[#8FB8E0]">
              No quizzes available yet. Complete lessons to unlock quizzes.
            </div>
          ) : (
            quizTemplates.map((quiz) => (
              <div key={quiz.id} className="rounded-xl border border-[#D6EAF8] bg-white p-5">
                <p className="text-xs text-[#8FB8E0]">{quiz.subject}</p>
                <h3 className="mt-0.5 text-sm font-semibold text-[#2F3A4A]">{quiz.title}</h3>

                <div className="mt-3 flex items-center justify-between text-xs text-[#8FB8E0]">
                  <span>{quiz.questions.length} questions</span>
                  <span className="font-semibold text-[#4A8CC0]">+{quiz.xpReward} XP max</span>
                </div>

                <button
                  type="button"
                  onClick={() => startQuiz(quiz)}
                  disabled={isLoadingCatalog}
                  className="mt-4 w-full rounded-lg bg-gradient-to-br from-[#A7C7E7] to-[#6FA8DC] px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Start Quiz
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (state === "inProgress" && selectedQuiz) {
    const question = selectedQuiz.questions[currentQuestionIndex];
    const selectedAnswer = answers[currentQuestionIndex];

    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-24">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#2F3A4A]">{selectedQuiz.title}</h2>
            <p className="text-xs text-[#8FB8E0]">
              Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}
            </p>
          </div>

          <button
            type="button"
            onClick={resetQuiz}
            className="rounded-lg border border-[#D6EAF8] bg-white px-3 py-2 text-xs text-[#6FA8DC] transition-colors hover:bg-[#F7FBFF]"
          >
            Exit
          </button>
        </div>

        {submitError ? (
          <div className="rounded-lg border border-[#D6EAF8] bg-white px-4 py-3 text-sm text-[#6FA8DC]">
            {submitError}
          </div>
        ) : null}

        <div className="rounded-xl border border-[#D6EAF8] bg-white p-6">
          <h3 className="mb-4 text-base font-semibold text-[#2F3A4A]">{question.question}</h3>

          <div className="space-y-2">
            {question.options.map((option, index) => {
              const active = selectedAnswer === index;
              return (
                <button
                  key={`${question.id}-${index}`}
                  type="button"
                  onClick={() => answerCurrent(index)}
                  className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    active
                      ? "border-[#8FB8E0] bg-[#EAF4FB] text-[#2F3A4A]"
                      : "border-[#D6EAF8] bg-white text-[#2F3A4A] hover:bg-[#F7FBFF]"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={goNext}
            disabled={selectedAnswer === null || isSubmitting}
            className="mt-4 w-full rounded-lg bg-gradient-to-br from-[#A7C7E7] to-[#6FA8DC] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Saving result...
              </span>
            ) : currentQuestionIndex < selectedQuiz.questions.length - 1 ? (
              "Next Question"
            ) : (
              "Finish Quiz"
            )}
          </button>
        </div>
      </div>
    );
  }

  if (state === "results" && selectedQuiz) {
    const passed = percentage >= 60;
    const earnedXp = Math.max(10, Math.round((selectedQuiz.xpReward * percentage) / 100));

    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6 pb-24">
        <div className="rounded-xl border border-[#D6EAF8] bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#A7C7E7] to-[#6FA8DC]">
            <Trophy className="h-8 w-8 text-white" strokeWidth={2} />
          </div>

          <h2 className="mb-1 text-2xl font-bold text-[#2F3A4A]">
            {passed ? "Great Job" : "Keep Practicing"}
          </h2>
          <p className="mb-6 text-sm text-[#8FB8E0]">
            Your quiz result was saved to your student XP profile.
          </p>

          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-[#D6EAF8] bg-[#F7FBFF] p-3">
              <p className="text-xl font-bold text-[#2F3A4A]">
                {score}/{selectedQuiz.questions.length}
              </p>
              <p className="text-[11px] text-[#8FB8E0]">Correct</p>
            </div>

            <div className="rounded-lg border border-[#D6EAF8] bg-[#F7FBFF] p-3">
              <p className="text-xl font-bold text-[#2F3A4A]">{percentage}%</p>
              <p className="text-[11px] text-[#8FB8E0]">Score</p>
            </div>

            <div className="rounded-lg border border-[#D6EAF8] bg-[#EAF4FB] p-3">
              <p className="text-xl font-bold text-[#4A8CC0]">+{earnedXp}</p>
              <p className="text-[11px] text-[#8FB8E0]">XP</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => startQuiz(selectedQuiz)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#D6EAF8] bg-white px-4 py-2.5 text-sm font-semibold text-[#6FA8DC] transition-colors hover:bg-[#F7FBFF]"
            >
              <RotateCcw size={14} /> Retake
            </button>

            <button
              type="button"
              onClick={resetQuiz}
              className="flex-1 rounded-lg bg-gradient-to-br from-[#A7C7E7] to-[#6FA8DC] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              More Quizzes
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[#D6EAF8] bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-[#2F3A4A]">Review Answers</h3>

          <div className="space-y-3">
            {selectedQuiz.questions.map((question, index) => {
              const userAnswer = answers[index];
              const correct = userAnswer === question.correctAnswer;

              return (
                <div key={question.id} className="rounded-lg border border-[#D6EAF8] p-3">
                  <div className="flex items-start gap-2">
                    {correct ? (
                      <CheckCircle2 size={16} className="mt-0.5 text-[#51B8B8]" />
                    ) : (
                      <XCircle size={16} className="mt-0.5 text-[#8FB8E0]" />
                    )}

                    <div>
                      <p className="text-sm font-medium text-[#2F3A4A]">{question.question}</p>
                      <p className="mt-1 text-xs text-[#8FB8E0]">
                        Your answer: {userAnswer !== null ? question.options[userAnswer] : "Not answered"}
                      </p>
                      {!correct ? (
                        <p className="mt-0.5 text-xs text-[#4A8CC0]">
                          Correct: {question.options[question.correctAnswer]}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
