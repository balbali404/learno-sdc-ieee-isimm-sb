"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useStoredAuth } from "@/hooks/useStoredAuth";
import { useStudentThemeProfile } from "@/hooks/useStudentThemeProfile";
import { useStudentDashboardContext } from "./StudentContext";

function TypewriterHero({ phrases }: { phrases: readonly string[] }) {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (phrases.length === 0) {
      return;
    }

    const phrase = phrases[phraseIdx] ?? phrases[0];
    let timeoutId: ReturnType<typeof setTimeout>;

    if (!deleting && displayed.length < phrase.length) {
      timeoutId = setTimeout(() => setDisplayed(phrase.slice(0, displayed.length + 1)), 55);
    } else if (!deleting && displayed.length === phrase.length) {
      timeoutId = setTimeout(() => setDeleting(true), 1700);
    } else if (deleting && displayed.length > 0) {
      timeoutId = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 30);
    } else {
      timeoutId = setTimeout(() => {
        setDeleting(false);
        setPhraseIdx((index) => (index + 1) % phrases.length);
      }, 220);
    }

    return () => clearTimeout(timeoutId);
  }, [deleting, displayed, phraseIdx, phrases]);

  useEffect(() => {
    setDisplayed("");
    setPhraseIdx(0);
    setDeleting(false);
  }, [phrases]);

  return (
    <span>
      {displayed}
      <span className="animate-pulse">|</span>
    </span>
  );
}

export function HeroSection() {
  const { user } = useStoredAuth();
  const { xp, neuroAssignments } = useStudentDashboardContext();
  const { profile } = useStudentThemeProfile();

  const firstName = useMemo(() => {
    const fullName = user?.fullName?.trim();
    if (!fullName) {
      return "Alex";
    }

    return fullName.split(/\s+/)[0] || "Alex";
  }, [user?.fullName]);

  const streak = Math.max(0, xp.currentStreak ?? 0);
  const hasPendingNeuro = neuroAssignments.hasPending;
  const pendingLabel =
    neuroAssignments.pendingCount === 1
      ? "1 neuro test pending"
      : `${neuroAssignments.pendingCount} neuro tests pending`;

  return (
    <section
      className="relative overflow-hidden rounded-3xl p-8"
      style={{
        background: "var(--student-hero-gradient)",
        borderRadius: "var(--student-card-radius, 18px)",
        boxShadow: "0 14px 34px var(--student-hero-glow, rgba(59,130,246,0.24))",
        transition:
          "background var(--student-motion-duration, 320ms) var(--student-motion-curve, ease), box-shadow var(--student-motion-duration, 320ms) var(--student-motion-curve, ease)",
      }}
    >
      <div className="relative z-10">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm text-white/80">Good morning, {firstName} 👋</p>
          <span className="rounded-full border border-white/35 bg-white/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/90">
            {profile.heroRibbon}
          </span>
        </div>

        <h1 className="min-h-[36px] text-2xl font-bold text-white">
          <TypewriterHero phrases={profile.heroPhrases} />
        </h1>

        <p className="mt-2 text-sm text-white/85">{profile.heroTagline}</p>
        <p className="mt-1 text-xs text-white/75">You are on a {streak}-day streak. Keep your rhythm.</p>

        {hasPendingNeuro ? (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-amber-100/90 px-3 py-1.5 text-[11px] font-semibold text-amber-900">
            ⚠ {pendingLabel}. Complete it from Neuro Tests.
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/student/lessons"
            className="inline-flex rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-105"
            style={{ background: "var(--color-surface)", color: "var(--color-text)" }}
          >
            {profile.heroButton} →
          </Link>

          {hasPendingNeuro ? (
            <Link
              href="/student/neuro-tests"
              className="inline-flex rounded-full border border-white/35 bg-white/20 px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-105"
            >
              Open Neuro Tests →
            </Link>
          ) : null}
        </div>
      </div>

      <div
        className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.4), transparent 68%)",
        }}
      />
      <div
        className="pointer-events-none absolute -right-2 top-20 h-24 w-24 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.28), transparent 72%)",
        }}
      />
    </section>
  );
}
