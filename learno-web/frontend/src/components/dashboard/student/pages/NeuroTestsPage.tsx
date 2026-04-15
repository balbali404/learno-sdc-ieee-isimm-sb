"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Play,
  RotateCcw,
} from "lucide-react";
import { ApiError, neuroApi, studentApi } from "@/lib/api";
import type {
  NeuroAssignmentItem,
  NeuroTestAttemptItem,
  StudentNeuroResultsResponse,
} from "@/lib/api/types";
import {
  getRuntimeSupportLevel,
  isRuntimeScreenerKey,
} from "@/lib/neuro-runtime/runtime";
import { useStudentDashboardContext } from "../StudentContext";
import { NeuroScreenerRunner } from "./NeuroScreenerRunner";

type ActiveTab = "assigned" | "results";

type SupportLevelKey =
  | "no_strong_concern"
  | "monitor"
  | "repeated_difficulty_indicator"
  | "support_review_recommended";

const supportLevelStyles: Record<
  SupportLevelKey,
  { label: string; chipClassName: string }
> = {
  no_strong_concern: {
    label: "No strong concern",
    chipClassName: "bg-emerald-50 text-emerald-700",
  },
  monitor: {
    label: "Monitor",
    chipClassName: "bg-amber-50 text-amber-700",
  },
  repeated_difficulty_indicator: {
    label: "Repeated difficulty indicator",
    chipClassName: "bg-orange-50 text-orange-700",
  },
  support_review_recommended: {
    label: "Support review recommended",
    chipClassName: "bg-rose-50 text-rose-700",
  },
};

const conditionBadgeClassName: Record<string, string> = {
  ADHD: "bg-sky-50 text-sky-700",
  ASD: "bg-emerald-50 text-emerald-700",
  DYSLEXIA: "bg-cyan-50 text-cyan-700",
  DYSCALCULIA: "bg-orange-50 text-orange-700",
  ANXIETY: "bg-indigo-50 text-indigo-700",
  DEPRESSION: "bg-rose-50 text-rose-700",
  DEFAULT: "bg-slate-100 text-slate-700",
};

const parsePlainObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const parseAttemptPolicy = (value: unknown): {
  needsRetry: boolean;
  canRetryNow: boolean;
  retryAvailableAt: string | null;
} | null => {
  const parsed = parsePlainObject(value);
  if (!parsed) {
    return null;
  }

  return {
    needsRetry: Boolean(parsed.needsRetry),
    canRetryNow: Boolean(parsed.canRetryNow),
    retryAvailableAt:
      typeof parsed.retryAvailableAt === "string" ? parsed.retryAvailableAt : null,
  };
};

const resolveSupportLevel = (attempt?: NeuroTestAttemptItem): SupportLevelKey => {
  const analysis = parsePlainObject(attempt?.analysisJson);
  const supportLevel =
    typeof analysis?.supportLevel === "string"
      ? analysis.supportLevel
      : typeof attempt?.score === "number"
        ? getRuntimeSupportLevel(attempt.score)
        : null;

  if (
    supportLevel === "support_review_recommended" ||
    supportLevel === "repeated_difficulty_indicator" ||
    supportLevel === "monitor"
  ) {
    return supportLevel;
  }

  return "no_strong_concern";
};

const getSupportLevelLabel = (attempt?: NeuroTestAttemptItem): string => {
  const key = resolveSupportLevel(attempt);
  return supportLevelStyles[key].label;
};

const getSupportLevelClassName = (attempt?: NeuroTestAttemptItem): string => {
  const key = resolveSupportLevel(attempt);
  return supportLevelStyles[key].chipClassName;
};

const getConditionBadgeClassName = (condition: string | null | undefined): string => {
  if (!condition) {
    return conditionBadgeClassName.DEFAULT;
  }

  return conditionBadgeClassName[condition] ?? conditionBadgeClassName.DEFAULT;
};

const conditionLabelMap: Record<string, string> = {
  ADHD: "ADHD",
  ASD: "ASD",
  DYSLEXIA: "Dyslexia",
  DYSCALCULIA: "Dyscalculia",
  ANXIETY: "Anxiety",
  DEPRESSION: "Depression",
  DEFAULT: "Default",
};

const formatRetryAvailableAt = (retryAvailableAt?: string | null): string => {
  if (!retryAvailableAt) {
    return "Retry becomes available after cooldown.";
  }

  const date = new Date(retryAvailableAt);
  if (Number.isNaN(date.getTime())) {
    return "Retry becomes available after cooldown.";
  }

  return `Retry available ${date.toLocaleString()}`;
};

export function NeuroTestsPage() {
  const { refresh } = useStudentDashboardContext();

  const [tab, setTab] = useState<ActiveTab>("assigned");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [activeAssignments, setActiveAssignments] = useState<NeuroAssignmentItem[]>([]);
  const [resultSummary, setResultSummary] = useState<StudentNeuroResultsResponse["summary"]>({
    totalAssignments: 0,
    reviewedCount: 0,
    averageScore: 0,
  });
  const [resultAssignments, setResultAssignments] = useState<NeuroAssignmentItem[]>([]);

  const [activeAttemptAssignment, setActiveAttemptAssignment] = useState<NeuroAssignmentItem | null>(
    null,
  );
  const [activeAttemptAge, setActiveAttemptAge] = useState<number | null>(null);
  const [studentAge, setStudentAge] = useState<number | null>(null);
  const [attemptStartedAt, setAttemptStartedAt] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [assignedResponse, resultsResponse] = await Promise.all([
        neuroApi.getMyAssignments({ scope: "active", limit: 80 }),
        neuroApi.getMyResults({ limit: 80 }),
      ]);

      setActiveAssignments(assignedResponse ?? []);
      setResultSummary(resultsResponse.summary);
      setResultAssignments(resultsResponse.assignments ?? []);

      try {
        const profile = await studentApi.getProfile();
        setStudentAge(typeof profile.age === "number" ? profile.age : null);
      } catch {
        setStudentAge(null);
      }
    } catch (loadError) {
      const message =
        loadError instanceof ApiError
          ? loadError.message
          : "Could not load neuro assignments right now.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData().catch(() => null);
  }, [loadData]);

  const startAssignment = async (assignment: NeuroAssignmentItem) => {
    try {
      setError(null);
      setSuccess(null);

      let resolvedAge = studentAge;
      if (resolvedAge === null) {
        const profile = await studentApi.getProfile();
        resolvedAge = typeof profile.age === "number" ? profile.age : null;
        setStudentAge(resolvedAge);
      }

      if (resolvedAge === null) {
        setError(
          "Your age is missing in your profile. Ask your school to set your date of birth before taking this test.",
        );
        return;
      }

      if (assignment.status === "ASSIGNED" || assignment.status === "SUBMITTED") {
        await neuroApi.startMyAssignment(assignment.id);
      }

      const detail = await neuroApi.getMyAssignmentDetail(assignment.id);
      if (!isRuntimeScreenerKey(detail.test?.key)) {
        setError(
          "This test is not linked to an interactive screener yet. Please contact your teacher.",
        );
        return;
      }

      setActiveAttemptAssignment(detail);
      setActiveAttemptAge(resolvedAge);
      setAttemptStartedAt(Date.now());
      setTab("assigned");
    } catch (startError) {
      const message =
        startError instanceof ApiError ? startError.message : "Could not start this assignment.";
      setError(message);
    }
  };

  const cancelAttempt = () => {
    setActiveAttemptAssignment(null);
    setActiveAttemptAge(null);
    setAttemptStartedAt(null);
  };

  const submitRuntimeAttempt = useCallback(
    async (payload: {
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
    }) => {
      if (!activeAttemptAssignment) {
        return;
      }

      try {
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        const fallbackDurationSec =
          attemptStartedAt !== null
            ? Math.max(0, Math.round((Date.now() - attemptStartedAt) / 1000))
            : undefined;

        const submitResponse = await neuroApi.submitMyAssignment(activeAttemptAssignment.id, {
          answersJson: payload.answersJson,
          analysisJson: payload.analysisJson,
          score: payload.score,
          inferredCondition: payload.inferredCondition,
          confidence: payload.confidence,
          durationSec: payload.durationSec ?? fallbackDurationSec,
        });

        const attemptPolicy = parseAttemptPolicy(submitResponse.attemptPolicy);

        await refresh();
        await loadData();

        if (attemptPolicy?.needsRetry) {
          setSuccess(
            attemptPolicy.canRetryNow
              ? "Attempt submitted. Your next retry is now available."
              : `Attempt submitted. Your next retry opens on ${attemptPolicy.retryAvailableAt ? new Date(attemptPolicy.retryAvailableAt).toLocaleString() : "after cooldown"}.`,
          );
          setTab("assigned");
        } else {
          setSuccess("Your test result was submitted successfully.");
          setTab("results");
        }
        cancelAttempt();
      } catch (submitError) {
        const message =
          submitError instanceof ApiError
            ? submitError.message
            : "Could not submit this test right now.";
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [activeAttemptAssignment, attemptStartedAt, loadData, refresh],
  );

  return (
    <div className="flex flex-col gap-6 pb-20 md:pb-24">
      <div className="flex items-center gap-3">
        <Link
          href="/student"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D6EAF8] bg-white text-[#6FA8DC] hover:bg-[#F7FBFF]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-[#2F3A4A]">Neuro Tests</h1>
          <p className="mt-0.5 text-sm text-[#8FB8E0]">
            Complete assigned support screeners and review your submitted results.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 inline-flex items-center gap-2">
          <AlertCircle size={15} />
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 inline-flex items-center gap-2">
          <CheckCircle2 size={15} />
          {success}
        </div>
      ) : null}

      {activeAttemptAssignment && activeAttemptAssignment.test && activeAttemptAge !== null
        ? (
          <NeuroScreenerRunner
            assignment={activeAttemptAssignment}
            studentAge={activeAttemptAge}
            isSubmitting={isSubmitting}
            onCancelAssignment={cancelAttempt}
            onSubmitAttempt={submitRuntimeAttempt}
          />
        )
        : (
          <>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTab("assigned")}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                  tab === "assigned"
                    ? "border-[#8FB8E0] bg-[#EAF4FB] text-[#2F3A4A]"
                    : "border-[#D6EAF8] bg-white text-[#6FA8DC]"
                }`}
              >
                Assigned Tests ({activeAssignments.length})
              </button>
              <button
                type="button"
                onClick={() => setTab("results")}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                  tab === "results"
                    ? "border-[#8FB8E0] bg-[#EAF4FB] text-[#2F3A4A]"
                    : "border-[#D6EAF8] bg-white text-[#6FA8DC]"
                }`}
              >
                Results ({resultSummary.totalAssignments})
              </button>
              <button
                type="button"
                onClick={() => loadData().catch(() => null)}
                className="rounded-lg border border-[#D6EAF8] bg-white px-3 py-1.5 text-xs font-semibold text-[#6FA8DC] inline-flex items-center gap-1"
              >
                <RotateCcw size={13} /> Refresh
              </button>
            </div>

            {isLoading ? (
              <div className="rounded-xl border border-[#D6EAF8] bg-white px-4 py-8 text-center text-sm text-[#8FB8E0]">
                <Loader2 size={16} className="mx-auto mb-2 animate-spin" />
                Loading neuro assignments...
              </div>
            ) : null}

            {!isLoading && tab === "assigned" ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {activeAssignments.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#D6EAF8] bg-white px-4 py-8 text-center text-sm text-[#8FB8E0]">
                    You do not have active neuro assignments right now.
                  </div>
                ) : (
                  activeAssignments.map((assignment) => (
                    <div key={assignment.id} className="rounded-xl border border-[#D6EAF8] bg-white p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-[#8FB8E0] uppercase tracking-wide">
                            {assignment.test?.key ?? "neuro-test"}
                          </p>
                          <h3 className="mt-0.5 text-sm font-semibold text-[#2F3A4A]">
                            {assignment.test?.title ?? "Assigned Neuro Test"}
                          </h3>
                        </div>
                        <span className="rounded-full bg-[#EAF4FB] px-2 py-0.5 text-[11px] font-semibold text-[#4A8CC0]">
                          {assignment.status}
                        </span>
                      </div>

                      <p className="mt-3 text-xs text-[#8FB8E0]">
                        {assignment.dueAt
                          ? `Due ${new Date(assignment.dueAt).toLocaleDateString()}`
                          : "No due date"}
                      </p>

                      {assignment.attemptPolicy ? (
                        <div className="mt-2 rounded-lg bg-[#F7FBFF] px-3 py-2 text-xs text-[#6FA8DC] space-y-1">
                          <p>
                            Attempts: {assignment.attemptPolicy.attemptsUsed} / {assignment.attemptPolicy.maxAttempts}
                          </p>
                          {assignment.attemptPolicy.needsRetry ? (
                            <p>
                              {assignment.attemptPolicy.canRetryNow
                                ? "Retry unlocked. You can take the next attempt now."
                                : formatRetryAvailableAt(assignment.attemptPolicy.retryAvailableAt)}
                            </p>
                          ) : assignment.attemptPolicy.latestScore !== null ? (
                            <p>
                              Latest score {Math.round(assignment.attemptPolicy.latestScore)}% - no retry required.
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      {assignment.notes ? (
                        <p className="mt-2 rounded-lg bg-[#F7FBFF] px-3 py-2 text-xs text-[#6FA8DC]">
                          {assignment.notes}
                        </p>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => startAssignment(assignment)}
                        disabled={
                          isSubmitting ||
                          (assignment.status === "SUBMITTED" &&
                            (assignment.attemptPolicy?.needsRetry
                              ? assignment.attemptPolicy.canRetryNow === false
                              : true))
                        }
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#2D6FA3] to-[#1E4F75] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:from-[#245C89] hover:to-[#173E5B] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Play size={14} />
                        {assignment.status === "IN_PROGRESS"
                          ? "Continue Test"
                          : assignment.status === "SUBMITTED"
                            ? assignment.attemptPolicy?.needsRetry
                              ? assignment.attemptPolicy.canRetryNow
                                ? "Start Retry Attempt"
                                : "Retry Locked"
                              : "Completed"
                            : "Start Test"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : null}

            {!isLoading && tab === "results" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-[#D6EAF8] bg-white p-4">
                    <p className="text-[10px] uppercase tracking-wide text-[#8FB8E0]">Total Results</p>
                    <p className="mt-1 text-xl font-bold text-[#2F3A4A]">{resultSummary.totalAssignments}</p>
                  </div>
                  <div className="rounded-xl border border-[#D6EAF8] bg-white p-4">
                    <p className="text-[10px] uppercase tracking-wide text-[#8FB8E0]">Reviewed</p>
                    <p className="mt-1 text-xl font-bold text-[#2F3A4A]">{resultSummary.reviewedCount}</p>
                  </div>
                  <div className="rounded-xl border border-[#D6EAF8] bg-white p-4">
                    <p className="text-[10px] uppercase tracking-wide text-[#8FB8E0]">Average Score</p>
                    <p className="mt-1 text-xl font-bold text-[#2F3A4A]">
                      {Math.round(resultSummary.averageScore)}%
                    </p>
                  </div>
                </div>

                {resultAssignments.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#D6EAF8] bg-white px-4 py-8 text-center text-sm text-[#8FB8E0]">
                    No submitted results yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {resultAssignments.map((assignment) => {
                      const latestAttempt = assignment.attempts?.[0];

                      return (
                        <div key={assignment.id} className="rounded-xl border border-[#D6EAF8] bg-white p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-[#8FB8E0]">
                                {assignment.test?.title ?? "Neuro Test"}
                              </p>
                              <p className="text-sm font-semibold text-[#2F3A4A]">
                                {latestAttempt?.score !== null && latestAttempt?.score !== undefined
                                  ? `${Math.round(latestAttempt.score)}% score`
                                  : "No score available"}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-[#EAF4FB] px-2 py-0.5 text-[11px] font-semibold text-[#4A8CC0]">
                                {assignment.status}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${getSupportLevelClassName(latestAttempt)}`}
                              >
                                {getSupportLevelLabel(latestAttempt)}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-[#6FA8DC] md:grid-cols-3">
                            <div
                              className={`rounded-lg px-3 py-2 ${getConditionBadgeClassName(
                                latestAttempt?.inferredCondition,
                              )}`}
                            >
                              <p className="text-[10px] uppercase tracking-wide text-[#8FB8E0]">Condition</p>
                              <p className="mt-1 font-semibold text-[#2F3A4A]">
                                {conditionLabelMap[latestAttempt?.inferredCondition ?? "DEFAULT"] ??
                                  "Default"}
                              </p>
                            </div>
                            <div className="rounded-lg bg-[#F7FBFF] px-3 py-2">
                              <p className="text-[10px] uppercase tracking-wide text-[#8FB8E0]">Confidence</p>
                              <p className="mt-1 font-semibold text-[#2F3A4A]">
                                {typeof latestAttempt?.confidence === "number"
                                  ? `${Math.round(latestAttempt.confidence * 100)}%`
                                  : "Not available"}
                              </p>
                            </div>
                            <div className="rounded-lg bg-[#F7FBFF] px-3 py-2">
                              <p className="text-[10px] uppercase tracking-wide text-[#8FB8E0]">Teacher review</p>
                              <p className="mt-1 font-semibold text-[#2F3A4A]">
                                {latestAttempt?.reviewedByTeacher
                                  ? latestAttempt.reviewedByTeacher.fullName
                                  : "Pending"}
                              </p>
                            </div>
                          </div>

                          {latestAttempt?.reviewerNotes ? (
                            <p className="mt-3 rounded-lg bg-[#F7FBFF] px-3 py-2 text-xs text-[#6FA8DC]">
                              {latestAttempt.reviewerNotes}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
          </>
        )}
    </div>
  );
}
