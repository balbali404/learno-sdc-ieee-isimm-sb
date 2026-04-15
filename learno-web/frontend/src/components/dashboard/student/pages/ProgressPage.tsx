"use client";

import { useMemo, useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Trophy } from "lucide-react";
import type { StudentLessonProgress } from "@/lib/api/types";
import { formatNumber } from "../ui/utils";
import { useStudentDashboardContext } from "../StudentContext";

type ProgressTab = "overview" | "leaderboard" | "achievements";

function toDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function buildWeeklyData(progressRows: StudentLessonProgress[]) {
  const buckets = new Map<
    string,
    {
      date: Date;
      day: string;
      lessons: number;
      xp: number;
    }
  >();

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);

    buckets.set(toDateKey(date), {
      date,
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      lessons: 0,
      xp: 0,
    });
  }

  progressRows.forEach((item) => {
    const source = item.lastAccessedAt ?? item.updatedAt ?? item.createdAt;
    if (!source) {
      return;
    }

    const date = new Date(source);
    if (Number.isNaN(date.getTime())) {
      return;
    }

    const bucket = buckets.get(toDateKey(date));
    if (!bucket) {
      return;
    }

    bucket.lessons += item.isCompleted ? 1 : 0;
    bucket.xp += Math.max(0, item.xpEarned ?? 0);
  });

  return Array.from(buckets.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

function buildRadarData(progressRows: StudentLessonProgress[]) {
  const grouped = new Map<string, number[]>();

  progressRows.forEach((item) => {
    const subject = item.lesson?.subject?.name ?? "General";
    const values = grouped.get(subject) ?? [];
    values.push(item.progressPercent ?? 0);
    grouped.set(subject, values);
  });

  const data = Array.from(grouped.entries())
    .map(([subject, values]) => ({
      subject: subject.length > 11 ? `${subject.slice(0, 10)}.` : subject,
      value: Math.max(
        10,
        Math.round(values.reduce((sum, score) => sum + score, 0) / values.length),
      ),
    }))
    .slice(0, 6);

  if (data.length > 0) {
    return data;
  }

  return [
    { subject: "General", value: 35 },
    { subject: "Focus", value: 30 },
    { subject: "Quiz", value: 28 },
  ];
}

export function ProgressPage() {
  const [activeTab, setActiveTab] = useState<ProgressTab>("overview");

  const {
    allProgress,
    xp,
    quizzesSummary,
    completedLessons,
    achievements,
    recentQuizResults,
    markAchievementSeen,
  } = useStudentDashboardContext();

  const totalStudyMinutes = useMemo(
    () => allProgress.reduce((sum, lesson) => sum + (lesson.timeSpentMin ?? 0), 0),
    [allProgress],
  );

  const weeklyData = useMemo(() => buildWeeklyData(allProgress), [allProgress]);
  const radarData = useMemo(() => buildRadarData(allProgress), [allProgress]);

  const maxWeeklyXP = Math.max(1, ...weeklyData.map((item) => item.xp));

  const leaderboard = useMemo(() => {
    return recentQuizResults
      .slice(0, 8)
      .sort((a, b) => {
        const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
        if (scoreDiff !== 0) {
          return scoreDiff;
        }

        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      })
      .map((entry, index) => ({
        rank: index + 1,
        title: entry.title,
        subject: entry.subject,
        score: Math.max(0, Math.round(entry.score ?? 0)),
        attempts: Math.max(1, entry.attempts ?? 1),
      }));
  }, [recentQuizResults]);

  return (
    <div className="relative z-10 flex flex-col gap-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-[#2F3A4A]">Progress</h1>
        <p className="mt-1 text-sm text-[#8FB8E0]">
          Track your real learning performance from lessons, quizzes, and XP.
        </p>
      </div>

      <div className="inline-flex w-fit gap-2 rounded-2xl border border-[#D6EAF8] bg-[#EAF4FB] p-1">
        {(["overview", "leaderboard", "achievements"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className="rounded-xl px-4 py-1.5 text-sm font-medium capitalize transition-all"
            style={{
              background: activeTab === tab ? "var(--color-surface)" : "transparent",
              color: activeTab === tab ? "var(--color-text)" : "var(--color-text-muted)",
              boxShadow:
                activeTab === tab
                  ? "0 2px 10px rgba(var(--student-accent-rgb, 111 168 220), 0.16)"
                  : "none",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Lessons Completed", value: formatNumber(completedLessons), icon: "Learn" },
              { label: "Total XP", value: formatNumber(xp.totalXP ?? 0), icon: "XP" },
              {
                label: "Avg Quiz Score",
                value: `${Math.round(quizzesSummary.avgScore ?? 0)}%`,
                icon: "Score",
              },
              {
                label: "Study Hours",
                value: `${(totalStudyMinutes / 60).toFixed(1)}h`,
                icon: "Time",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-[#D6EAF8] bg-white p-4 text-center"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6FA8DC]">
                  {stat.icon}
                </p>
                <p className="mt-1 text-xl font-bold text-[#2F3A4A]">{stat.value}</p>
                <p className="mt-0.5 text-[10px] text-[#8FB8E0]">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-[#D6EAF8] bg-white p-5">
            <p className="mb-4 text-sm font-semibold text-[#2F3A4A]">This Week&apos;s Activity</p>
            <div className="flex h-32 items-end gap-2">
              {weeklyData.map((item) => (
                <div key={item.day + item.date.toISOString()} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-[#51B8B8] to-[#A7C7E7]"
                    style={{
                      height: `${item.xp > 0 ? Math.max((item.xp / maxWeeklyXP) * 100, 5) : 4}%`,
                      opacity: item.xp > 0 ? 1 : 0.35,
                      background:
                        "linear-gradient(to top, var(--color-accent), var(--color-highlight))",
                    }}
                    title={`${item.day}: ${item.lessons} lessons, ${item.xp} XP`}
                  />
                  <span className="text-[10px] text-[#8FB8E0]">{item.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#D6EAF8] bg-white p-5">
            <p className="mb-4 text-sm font-semibold text-[#2F3A4A]">Subject Mastery</p>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#D6EAF8" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#6FA8DC", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#FFFFFF",
                      border: "1px solid #D6EAF8",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                  />
                  <Radar
                    name="Mastery"
                    dataKey="value"
                    stroke="#51B8B8"
                    fill="#51B8B8"
                    fillOpacity={0.2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : null}

      {activeTab === "leaderboard" ? (
        <div className="rounded-2xl border border-[#D6EAF8] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Trophy size={16} className="text-[#51B8B8]" />
            <span className="text-sm font-semibold text-[#2F3A4A]">Quiz Rankings</span>
            <span className="ml-auto rounded-full bg-[#EAF4FB] px-2 py-0.5 text-xs text-[#6FA8DC]">
              From API
            </span>
          </div>

          {leaderboard.length > 0 ? (
            <div className="space-y-3">
              {leaderboard.map((entry) => (
                <div
                  key={`${entry.title}-${entry.rank}`}
                  className="flex items-center gap-3 rounded-xl border border-[#D6EAF8] bg-[#F7FBFF] px-4 py-3"
                >
                  <span className="inline-flex w-5 items-center justify-center text-xs font-semibold text-[#8FB8E0]">
                    #{entry.rank}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#2F3A4A]">{entry.title}</p>
                    <p className="text-[11px] text-[#8FB8E0]">
                      {entry.subject} - {entry.attempts} attempt{entry.attempts > 1 ? "s" : ""}
                    </p>
                  </div>

                  <span className="rounded-full bg-[#EAF4FB] px-2 py-1 text-xs font-semibold text-[#4A8CC0]">
                    {entry.score}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#D6EAF8] bg-white px-4 py-8 text-center text-sm text-[#8FB8E0]">
              No quiz ranking data yet. Complete a quiz to see results.
            </div>
          )}
        </div>
      ) : null}

      {activeTab === "achievements" ? (
        <div>
          <p className="mb-4 text-xs text-[#8FB8E0]">
            {achievements.filter((item) => item.unlocked).length} / {achievements.length} achievements unlocked
          </p>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {achievements.map((achievement) => (
              <button
                key={achievement.id}
                type="button"
                onClick={() => {
                  if (achievement.unlocked && achievement.isNew) {
                    markAchievementSeen(achievement.id).catch(() => null);
                  }
                }}
                className="rounded-2xl border p-4 text-left"
                style={{
                  background: achievement.unlocked
                    ? "var(--color-surface)"
                    : "rgba(var(--student-accent-rgb, 111 168 220), 0.08)",
                  borderColor: "var(--color-border)",
                  opacity: achievement.unlocked ? 1 : 0.6,
                }}
              >
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF4FB] text-[11px] font-semibold text-[#4A8CC0]">
                  {achievement.unlocked ? achievement.icon ?? "BADGE" : "LOCK"}
                </div>

                <p className="text-xs font-bold text-[#2F3A4A]">{achievement.name}</p>
                <p className="mt-1 text-[11px] text-[#8FB8E0]">{achievement.description}</p>

                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded-full bg-[#EAF4FB] px-2 py-0.5 text-[10px] text-[#6FA8DC]">
                    +{achievement.xpReward} XP
                  </span>

                  {achievement.isNew && achievement.unlocked ? (
                    <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[10px] text-white">
                      New
                    </span>
                  ) : null}
                </div>
              </button>
            ))}
          </div>

          {achievements.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D6EAF8] bg-white px-4 py-8 text-center text-sm text-[#8FB8E0]">
              No achievements yet. Keep learning to unlock your first badge.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
