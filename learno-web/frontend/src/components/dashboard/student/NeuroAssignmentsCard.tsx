"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight, Brain, Clock3 } from "lucide-react";
import { useStudentDashboardContext } from "./StudentContext";

const statusTone: Record<string, string> = {
  ASSIGNED: "border-sky-100 bg-sky-50 text-sky-700",
  IN_PROGRESS: "border-indigo-100 bg-indigo-50 text-indigo-700",
  SUBMITTED: "border-amber-100 bg-amber-50 text-amber-700",
  REVIEWED: "border-emerald-100 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-slate-200 bg-slate-100 text-slate-700",
};

const supportTone: Record<string, string> = {
  support_review_recommended: "border-rose-100 bg-rose-50 text-rose-700",
  repeated_difficulty_indicator: "border-amber-100 bg-amber-50 text-amber-700",
  monitor: "border-sky-100 bg-sky-50 text-sky-700",
  no_strong_concern: "border-emerald-100 bg-emerald-50 text-emerald-700",
};

const supportLabel = (value?: string | null) => {
  if (!value) return null;
  if (value === "support_review_recommended") return "Support review recommended";
  if (value === "repeated_difficulty_indicator") return "Repeated difficulty";
  if (value === "monitor") return "Monitor";
  if (value === "no_strong_concern") return "No strong concern";
  return value;
};

const formatDue = (value?: string | null) => {
  if (!value) return "No due date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No due date";
  return parsed.toLocaleDateString();
};

const latestScore = (score?: number | null) => {
  if (typeof score !== "number") return "Not submitted";
  return `${Math.round(score)}%`;
};

export function NeuroAssignmentsCard() {
  const { neuroAssignments } = useStudentDashboardContext();
  const pending = neuroAssignments.pending ?? [];
  const recent = neuroAssignments.recent ?? [];

  const nextDueLabel = formatDue(neuroAssignments.nextDueAt);

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
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Brain size={16} style={{ color: "var(--color-accent)" }} />
            <span className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
              Neuro Tests
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Keep track of pending and recently reviewed neuro assignments.
          </p>
        </div>

        <Link
          href="/student/neuro-tests"
          className="inline-flex items-center gap-1 text-xs font-semibold"
          style={{ color: "var(--color-accent)" }}
        >
          Open <ArrowRight size={12} />
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Pending</p>
          <p className="text-sm font-semibold text-slate-800">{neuroAssignments.pendingCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">In Progress</p>
          <p className="text-sm font-semibold text-slate-800">{neuroAssignments.inProgressCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Next Due</p>
          <p className="text-sm font-semibold text-slate-800">{nextDueLabel}</p>
        </div>
      </div>

      {neuroAssignments.hasPending ? (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          You have pending neuro tests. Complete them to unlock updated support guidance.
        </div>
      ) : (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <Clock3 size={14} className="mt-0.5 shrink-0" />
          No pending neuro tests right now.
        </div>
      )}

      <div className="space-y-2">
        {(pending.length > 0 ? pending : recent).slice(0, 3).map((assignment) => (
          <div
            key={assignment.id}
            className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  {assignment.test?.title ?? assignment.testId}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Due: {formatDue(assignment.dueAt)}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                  statusTone[assignment.status] ?? "border-slate-200 bg-slate-100 text-slate-700"
                }`}
              >
                {assignment.status}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
              <span>Latest score: {latestScore(assignment.attemptPolicy?.latestScore)}</span>
              {assignment.attemptPolicy?.latestSupportLevel ? (
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 font-semibold ${
                    supportTone[assignment.attemptPolicy.latestSupportLevel] ??
                    "border-slate-200 bg-slate-100 text-slate-700"
                  }`}
                >
                  {supportLabel(assignment.attemptPolicy.latestSupportLevel)}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
