"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  Brain,
  Clock3,
  Coffee,
  Loader2,
  Pause,
  Play,
  RefreshCcw,
  Sparkles,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { useStudentDashboardContext } from "../StudentContext";
import { AttentionTracker, preloadAttentionModels } from "../lessons/AttentionTracker";

const PRESETS = [
  { label: "Quick", minutes: 15 },
  { label: "Classic", minutes: 25 },
  { label: "Deep", minutes: 45 },
];

const BREAK_MINUTES = 5;

const AMBIENT_TRACKS = [
  { id: "off", label: "Silent Room" },
  { id: "rain", label: "Rain" },
  { id: "forest", label: "Forest" },
  { id: "lofi", label: "Lo-fi" },
];

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (safe % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function FocusPage() {
  const {
    allProgress,
    xp,
    isLoading,
    engagementOverview,
    completeBrainChallenge,
    refresh,
  } = useStudentDashboardContext();

  const [selectedPreset, setSelectedPreset] = useState(PRESETS[1]);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [remainingSeconds, setRemainingSeconds] = useState(PRESETS[1].minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsDone, setSessionsDone] = useState(0);
  const [ambientTrack, setAmbientTrack] = useState(AMBIENT_TRACKS[0].id);
  const [showAttention, setShowAttention] = useState(false);

  useEffect(() => {
    void preloadAttentionModels();
  }, []);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((previous) => {
        if (previous > 1) {
          return previous - 1;
        }

        if (mode === "focus") {
          setSessionsDone((value) => value + 1);
          setMode("break");
          return BREAK_MINUTES * 60;
        }

        setMode("focus");
        return selectedPreset.minutes * 60;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, mode, selectedPreset.minutes]);

  useEffect(() => {
    if (mode === "focus" && !isRunning) {
      setRemainingSeconds(selectedPreset.minutes * 60);
    }
  }, [selectedPreset.minutes, mode, isRunning]);

  const progress = useMemo(() => {
    const total = mode === "focus" ? selectedPreset.minutes * 60 : BREAK_MINUTES * 60;
    if (total <= 0) return 0;
    const done = total - remainingSeconds;
    return Math.round((done / total) * 100);
  }, [mode, remainingSeconds, selectedPreset.minutes]);

  const recommendedTasks = useMemo(() => {
    const inProgress = allProgress
      .filter((item) => !item.isCompleted)
      .sort((a, b) => (b.progressPercent ?? 0) - (a.progressPercent ?? 0))
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        title: item.lesson?.title ?? "Continue lesson",
        progress: item.progressPercent ?? 0,
      }));

    if (inProgress.length > 0) {
      return inProgress;
    }

    return [
      { id: "focus-1", title: "Review one lesson summary", progress: 0 },
      { id: "focus-2", title: "Complete one chapter", progress: 0 },
      { id: "focus-3", title: "Take a short quiz", progress: 0 },
    ];
  }, [allProgress]);

  const focusMinutesLogged =
    allProgress.reduce((sum, item) => sum + (item.timeSpentMin ?? 0), 0) +
    sessionsDone * selectedPreset.minutes;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/student"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D6EAF8] bg-white text-[#6FA8DC] transition-colors hover:bg-[#F7FBFF]"
          >
            <ArrowLeft size={16} />
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-[#2F3A4A]">Focus Mode</h1>
            <p className="text-sm text-[#8FB8E0]">
              Distraction-free study sprints with attention support.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-[#D6EAF8] bg-[#EAF4FB] px-3 py-2 text-xs font-semibold text-[#4A8CC0]">
          <Sparkles size={14} />
          Streak {xp.currentStreak ?? 0} days
        </div>
      </div>

      <section className="relative overflow-hidden rounded-2xl border border-[#D6EAF8] bg-gradient-to-br from-[#A7C7E7] to-[#6FA8DC] p-6 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15" />
        <div className="absolute right-10 top-20 h-20 w-20 rounded-full bg-white/10" />

        <div className="relative grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/25 px-3 py-1 text-xs font-semibold">
              <Clock3 size={13} /> {mode === "focus" ? "Focus Session" : "Break Session"}
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight">
              {formatClock(remainingSeconds)}
            </h2>

            <p className="mt-2 text-sm text-white/90">
              {mode === "focus"
                ? "Stay on one objective until this timer ends."
                : "Take a short reset and come back sharper."}
            </p>

            <div className="mt-4 h-2 w-full max-w-md overflow-hidden rounded-full bg-white/35">
              <motion.div
                className="h-full rounded-full bg-white"
                animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                transition={{ duration: 0.35 }}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {PRESETS.map((preset) => {
                const active = selectedPreset.label === preset.label;

                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(preset);
                      setMode("focus");
                      setIsRunning(false);
                      setRemainingSeconds(preset.minutes * 60);
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? "border-white bg-white text-[#4A8CC0]"
                        : "border-white/40 bg-white/15 text-white hover:bg-white/25"
                    }`}
                  >
                    {preset.label} ({preset.minutes}m)
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border border-white/35 bg-white/15 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/90">
                Session Controls
              </p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRunning((value) => !value)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#4A8CC0] transition-colors hover:bg-[#F7FBFF]"
                >
                  {isRunning ? <Pause size={14} /> : <Play size={14} />}
                  {isRunning ? "Pause" : "Start"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("focus");
                    setIsRunning(false);
                    setRemainingSeconds(selectedPreset.minutes * 60);
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/50 bg-white/15 text-white transition-colors hover:bg-white/25"
                >
                  <RefreshCcw size={14} />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-white/35 bg-white/15 px-3 py-2">
                  <p className="text-white/90">Sessions done</p>
                  <p className="mt-0.5 text-lg font-bold text-white">{sessionsDone}</p>
                </div>

                <div className="rounded-lg border border-white/35 bg-white/15 px-3 py-2">
                  <p className="text-white/90">Focus logged</p>
                  <p className="mt-0.5 text-lg font-bold text-white">{focusMinutesLogged}m</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg border border-white/35 bg-white/15 px-2 py-2 text-center">
                  <p className="text-white/85">Engagement</p>
                  <p className="mt-0.5 font-bold text-white">{engagementOverview.averageEngagement}%</p>
                </div>

                <div className="rounded-lg border border-white/35 bg-white/15 px-2 py-2 text-center">
                  <p className="text-white/85">Concentration</p>
                  <p className="mt-0.5 font-bold text-white">{engagementOverview.averageConcentration}%</p>
                </div>

                <div className="rounded-lg border border-white/35 bg-white/15 px-2 py-2 text-center">
                  <p className="text-white/85">Consistency</p>
                  <p className="mt-0.5 font-bold text-white">{engagementOverview.focusConsistency}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <section className="rounded-xl border border-[#D6EAF8] bg-white p-5 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#2F3A4A]">Recommended Focus Tasks</h3>
            <Link href="/student/lessons" className="text-xs font-semibold text-[#6FA8DC]">
              Open Lessons
            </Link>
          </div>

          <div className="mt-4 space-y-2.5">
            {recommendedTasks.map((task) => (
              <div key={task.id} className="rounded-lg border border-[#EAF4FB] bg-[#F7FBFF] px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium text-[#2F3A4A]">{task.title}</p>
                  <span className="text-xs font-semibold text-[#8FB8E0]">{task.progress}%</span>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EAF4FB]">
                  <div
                    className="h-full rounded-full bg-[#6FA8DC]"
                    style={{ width: `${Math.max(0, Math.min(100, task.progress))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 lg:col-span-5">
          <div className="rounded-xl border border-[#D6EAF8] bg-white p-5">
            <h3 className="text-sm font-semibold text-[#2F3A4A]">Ambient Sound</h3>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {AMBIENT_TRACKS.map((track) => {
                const active = ambientTrack === track.id;
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => setAmbientTrack(track.id)}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                      active
                        ? "border-[#8FB8E0] bg-[#EAF4FB] text-[#4A8CC0]"
                        : "border-[#D6EAF8] bg-white text-[#6FA8DC] hover:bg-[#F7FBFF]"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Volume2 size={12} />
                      {track.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-[#D6EAF8] bg-[#EAF4FB] p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-white p-2 text-[#6FA8DC]">
                <Brain size={16} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-[#2F3A4A]">Smart Attention</h3>
                <p className="mt-1 text-xs text-[#6FA8DC]">
                  Enable camera-based focus tracking with local-only processing.
                </p>

                <button
                  type="button"
                  onClick={() => setShowAttention(true)}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#6FA8DC] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#5D98CF]"
                >
                  Enable Tracking
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#D6EAF8] bg-white p-4 text-xs text-[#6FA8DC]">
            <p className="inline-flex items-center gap-1.5 font-semibold">
              <Coffee size={13} /> Break hint
            </p>
            <p className="mt-1">
              Stand up, stretch your shoulders, and drink water for 2-3 minutes between sessions.
            </p>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {showAttention ? (
          <AttentionTracker
            onSessionSummary={(summary) => {
              const focusScore =
                summary.totalTimeSec > 0
                  ? Math.round((summary.focusedTimeSec / summary.totalTimeSec) * 100)
                  : summary.averageEngagement;

              const xpEarned = Math.max(
                10,
                Math.min(120, Math.round(summary.averageEngagement * 0.45 + focusScore * 0.35)),
              );

              const isCorrect =
                summary.averageEngagement >= 60 &&
                focusScore >= 60 &&
                summary.distractedByPhoneCount <= 3;

              void (async () => {
                try {
                  await completeBrainChallenge({
                    challengeKey: `focus-session-${Date.now()}`,
                    subject: "Focus Mode",
                    isCorrect,
                    xpEarned,
                    durationSec: Math.min(600, Math.max(0, summary.totalTimeSec)),
                    engagementScore: summary.averageEngagement,
                    concentrationScore: Math.round((summary.averageEngagement + focusScore) / 2),
                    source: "FOCUS_MODE",
                  });

                  await refresh();

                  if (isCorrect) {
                    toast.success(
                      `Focus session saved (+${xpEarned} XP). Engagement ${summary.averageEngagement}%`,
                    );
                  } else {
                    toast.warning(
                      `Session saved with low focus (${summary.averageEngagement}%). Keep improving.`,
                    );
                  }
                } catch {
                  toast.error("Could not save focus session result.");
                }
              })();
            }}
            onClose={() => {
              setShowAttention(false);
            }}
          />
        ) : null}
      </AnimatePresence>

      {isLoading ? (
        <div className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-lg border border-[#D6EAF8] bg-white px-3 py-2 text-xs font-semibold text-[#6FA8DC] shadow-sm">
          <Loader2 size={14} className="animate-spin" /> Syncing progress
        </div>
      ) : null}
    </div>
  );
}
