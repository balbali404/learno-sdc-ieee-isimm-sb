"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Loader2, Pause, Play, X } from "lucide-react";
import type { NeuroAssignmentItem } from "@/lib/api/types";
import {
  buildRuntimeTaskAnalytics,
  cleanupRuntimeSession,
  estimateRuntimeConfidence,
  getRuntimeScreener,
  getRuntimeSupportLevel,
  inferConditionFromRuntime,
  type NeuroRuntimeHelpers,
  type NeuroRuntimeInterpretation,
  type NeuroRuntimeSession,
} from "@/lib/neuro-runtime/runtime";
import styles from "./NeuroScreenerRunner.module.css";

type NeuroScreenerSubmissionPayload = {
  answersJson: Record<string, unknown>;
  analysisJson: Record<string, unknown>;
  score: number;
  inferredCondition:
    | "ADHD"
    | "ASD"
    | "DYSLEXIA"
    | "DYSCALCULIA"
    | "ANXIETY"
    | "DEPRESSION"
    | "DEFAULT";
  confidence: number;
  durationSec: number;
};

type KeyBinding = {
  keys: string[];
  handler: () => void;
};

const getTaskCount = (key: string | undefined): number => {
  if (key === "learning-reflection") {
    return 5;
  }

  return 4;
};

const getElapsedSecondsLabel = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const sec = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${sec}`;
};

const normalizeScore = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
};

type NeuroScreenerRunnerProps = {
  assignment: NeuroAssignmentItem;
  studentAge: number;
  isSubmitting: boolean;
  onCancelAssignment: () => void;
  onSubmitAttempt: (payload: NeuroScreenerSubmissionPayload) => Promise<void>;
};

export function NeuroScreenerRunner(props: NeuroScreenerRunnerProps) {
  const { assignment, studentAge, isSubmitting, onCancelAssignment, onSubmitAttempt } = props;

  const screener = useMemo(() => {
    return getRuntimeScreener(assignment.test?.key);
  }, [assignment.test?.key]);

  const totalTasks = useMemo(() => {
    return getTaskCount(screener?.id);
  }, [screener?.id]);

  const slotRef = useRef<HTMLDivElement | null>(null);
  const sessionRef = useRef<NeuroRuntimeSession | null>(null);
  const helpersRef = useRef<NeuroRuntimeHelpers | null>(null);
  const keyBindingsRef = useRef<KeyBinding[]>([]);

  const startedAtMsRef = useRef<number | null>(null);
  const pauseMsRef = useRef(0);
  const pauseStartedAtRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);
  const isCompletingRef = useRef(false);

  const [elapsedSec, setElapsedSec] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [taskLabel, setTaskLabel] = useState("Task");
  const [taskText, setTaskText] = useState("Task 1");
  const [taskPercent, setTaskPercent] = useState(0);
  const [runnerError, setRunnerError] = useState<string | null>(null);

  const computeElapsedMs = useCallback((): number => {
    if (startedAtMsRef.current === null) {
      return 0;
    }

    const pausedAt = pauseStartedAtRef.current;
    const now = pausedAt !== null ? pausedAt : performance.now();
    return Math.max(0, now - startedAtMsRef.current - pauseMsRef.current);
  }, []);

  const clearKeyBindings = useCallback(() => {
    keyBindingsRef.current = [];
  }, []);

  const syncTaskMeta = useCallback(() => {
    if (!screener || !sessionRef.current) {
      return;
    }

    const meta = screener.getTaskMeta(sessionRef.current);
    setTaskLabel(meta.label);
    setTaskText(meta.text);
    setTaskPercent(Math.max(0, Math.min(100, Number(meta.percent) || 0)));
  }, [screener]);

  const renderCurrentStep = useCallback(() => {
    if (!screener || !sessionRef.current || !slotRef.current || !helpersRef.current) {
      return;
    }

    const session = sessionRef.current;
    session.language = "en";
    session.rtl = false;

    clearKeyBindings();
    screener.render(session, slotRef.current, helpersRef.current);
    syncTaskMeta();
  }, [clearKeyBindings, screener, syncTaskMeta]);

  const completeCurrentScreener = useCallback(async () => {
    if (!screener || !sessionRef.current || isSubmitting || isCompletingRef.current) {
      return;
    }

    isCompletingRef.current = true;

    try {
      const interpretation = screener.finalize(
        sessionRef.current,
      ) as NeuroRuntimeInterpretation;
      const score = normalizeScore(Number(interpretation?.finalScore ?? 0));
      const supportLevel = getRuntimeSupportLevel(score);
      const inferredCondition = inferConditionFromRuntime({
        testKey: screener.id,
        score,
        interpretation,
      });

      const confidence = estimateRuntimeConfidence({
        score,
        completedSteps: totalTasks,
        totalSteps: totalTasks,
      });
      const durationSec = Math.max(0, Math.round(computeElapsedMs() / 1000));
      const taskAnalytics = buildRuntimeTaskAnalytics({
        screenerId: screener.id,
        session: sessionRef.current,
      });

      const analysisJson: Record<string, unknown> = {
        engine: "tests-master-screener-v1",
        screenerId: screener.id,
        studentAge,
        taskAnalytics,
        supportLevel,
        finalScore: score,
        rawMetrics: interpretation?.rawMetrics ?? null,
        subScores: interpretation?.subScores ?? null,
        indicators: interpretation?.indicators ?? [],
        contextSignals: interpretation?.contextSignals ?? null,
        studentSafeFeedback: interpretation?.studentSafeFeedback ?? [],
        teacherMetrics: interpretation?.teacherMetrics ?? null,
        blueprintMeta:
          sessionRef.current.blueprintMeta ?? interpretation?.blueprintMeta ?? null,
      };

      const answersJson: Record<string, unknown> = {
        engine: "tests-master-screener-v1",
        screenerId: screener.id,
        studentAge,
        taskAnalytics,
        finalScore: score,
        rawMetrics: interpretation?.rawMetrics ?? null,
        subScores: interpretation?.subScores ?? null,
        indicators: interpretation?.indicators ?? [],
        contextSignals: interpretation?.contextSignals ?? null,
        blueprintMeta:
          sessionRef.current.blueprintMeta ?? interpretation?.blueprintMeta ?? null,
      };

      await onSubmitAttempt({
        answersJson,
        analysisJson,
        score,
        inferredCondition,
        confidence,
        durationSec,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not finalize this screener right now.";
      setRunnerError(message);
    } finally {
      isCompletingRef.current = false;
    }
  }, [computeElapsedMs, isSubmitting, onSubmitAttempt, screener, studentAge, totalTasks]);

  const togglePause = useCallback(() => {
    if (!screener || !sessionRef.current || !helpersRef.current) {
      return;
    }

    if (isPausedRef.current) {
      const pauseStartedAt = pauseStartedAtRef.current;
      if (pauseStartedAt !== null) {
        pauseMsRef.current += performance.now() - pauseStartedAt;
      }
      pauseStartedAtRef.current = null;
      isPausedRef.current = false;
      setIsPaused(false);

      screener.onResume?.(sessionRef.current, helpersRef.current);
      renderCurrentStep();
      return;
    }

    isPausedRef.current = true;
    pauseStartedAtRef.current = performance.now();
    setIsPaused(true);
    screener.onPause?.(sessionRef.current);
  }, [renderCurrentStep, screener]);

  const cancelAttempt = useCallback(() => {
    cleanupRuntimeSession(sessionRef.current);
    clearKeyBindings();
    onCancelAssignment();
  }, [clearKeyBindings, onCancelAssignment]);

  useEffect(() => {
    if (!screener) {
      return;
    }

    cleanupRuntimeSession(sessionRef.current);
    clearKeyBindings();

    const session = screener.createSession({
      age: studentAge,
      language: "en",
    });

    session.language = "en";
    session.rtl = false;

    sessionRef.current = session;
    startedAtMsRef.current = performance.now();
    pauseMsRef.current = 0;
    pauseStartedAtRef.current = null;
    isPausedRef.current = false;
    isCompletingRef.current = false;

    setIsPaused(false);
    setRunnerError(null);
    setElapsedSec(0);

    helpersRef.current = {
      update: renderCurrentStep,
      softUpdate: renderCurrentStep,
      next: () => {
        if (!sessionRef.current) {
          return;
        }
        sessionRef.current.stepIndex += 1;
        renderCurrentStep();
      },
      complete: () => {
        void completeCurrentScreener();
      },
      cancelToHome: cancelAttempt,
      announce: () => {
        return;
      },
      isPaused: () => isPausedRef.current,
      bindKey: (keys, handler) => {
        keyBindingsRef.current.push({ keys, handler });
      },
    };

    renderCurrentStep();

    return () => {
      cleanupRuntimeSession(sessionRef.current);
      clearKeyBindings();
    };
  }, [
    cancelAttempt,
    clearKeyBindings,
    completeCurrentScreener,
    renderCurrentStep,
    screener,
    studentAge,
  ]);

  useEffect(() => {
    const onWindowKeyDown = (event: KeyboardEvent) => {
      if (isPausedRef.current) {
        return;
      }

      keyBindingsRef.current.forEach((binding) => {
        if (binding.keys.includes(event.code)) {
          event.preventDefault();
          binding.handler();
        }
      });
    };

    window.addEventListener("keydown", onWindowKeyDown);
    return () => {
      window.removeEventListener("keydown", onWindowKeyDown);
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setElapsedSec(Math.round(computeElapsedMs() / 1000));
    }, 200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [computeElapsedMs]);

  if (!screener) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 inline-flex items-center gap-2">
        <AlertCircle size={15} />
        This assignment is not linked to an interactive screener runtime yet.
      </div>
    );
  }

  return (
    <div className={styles.runtimeRoot}>
      <div className={styles.chromeCard}>
        <div className={styles.headerRow}>
          <div>
            <p className={styles.kicker}>{screener.studentSafeName}</p>
            <h3>{assignment.test?.title ?? screener.name}</h3>
            <p className={styles.metaText}>
              {taskLabel} - Age {studentAge}
            </p>
          </div>

          <div className={styles.headerActions}>
            <span className={styles.timeChip}>Elapsed {getElapsedSecondsLabel(elapsedSec)}</span>
            <button
              type="button"
              onClick={togglePause}
              disabled={isSubmitting}
              className={styles.secondaryButton}
            >
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
              {isPaused ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              onClick={cancelAttempt}
              disabled={isSubmitting}
              className={styles.secondaryButton}
            >
              <X size={14} /> Cancel
            </button>
          </div>
        </div>

        <div className={styles.progressCopy}>
          <span>{taskText}</span>
          <span>{Math.round(taskPercent)}%</span>
        </div>
        <div className={styles.progressTrack}>
          <span style={{ width: `${taskPercent}%` }} />
        </div>
      </div>

      {runnerError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 inline-flex items-center gap-2">
          <AlertCircle size={15} />
          {runnerError}
        </div>
      ) : null}

      <div className={styles.slotWrapper}>
        {isSubmitting ? (
          <div className={styles.submittingOverlay}>
            <Loader2 size={18} className="animate-spin" />
            Submitting your result...
          </div>
        ) : null}

        {isPaused ? (
          <div className={styles.pausedOverlay}>
            <div className={styles.pauseCard}>
              <h4>Session paused</h4>
              <p>You can resume when you are ready.</p>
              <button type="button" onClick={togglePause} className={styles.primaryButton}>
                <Play size={14} /> Continue
              </button>
            </div>
          </div>
        ) : null}

        <div ref={slotRef} className={styles.slot} />
      </div>
    </div>
  );
}
