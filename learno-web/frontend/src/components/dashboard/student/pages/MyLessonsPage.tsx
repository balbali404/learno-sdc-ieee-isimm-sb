"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { ApiError, studentApi } from "@/lib/api";
import { LessonDetail as LessonDetailView, type Lesson, type LessonBlock } from "../lessons/LessonDetail";
import type { LessonChapter, LessonItem } from "@/lib/api/types";
import { useStudentDashboardContext } from "../StudentContext";

interface LessonCardItem {
  id: string;
  title: string;
  subject: string;
  durationMin: number;
  progress: number;
  description: string;
  tags: string[];
  xp: number;
}

interface LessonDetailItem extends LessonCardItem {
  chapters: LessonChapter[];
  completedChapterIds: string[];
  isCompleted: boolean;
  rating: number | null;
  difficulty?: string;
  pdfPath?: string | null;
  keyVocabulary?: Array<{ term: string; definition?: string }>;
}

interface SubjectTheme {
  emoji: string;
  gradient: string;
  cardGradient: string;
  accentBorder: string;
  accentText: string;
  accentBg: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

interface ConditionThemeAccent {
  focusBannerBg: string;
  focusBannerBorder: string;
  focusBannerDot: string;
  focusBannerText: string;
  focusBannerSubtext: string;
  keyInsightColor: "sky" | "teal" | "violet" | "green" | "rose";
}

const subjectThemes: Record<string, SubjectTheme> = {
  Biology: {
    emoji: "BI",
    gradient: "from-emerald-500 to-teal-400",
    cardGradient: "from-emerald-50 to-teal-50",
    accentBorder: "border-emerald-200",
    accentText: "text-emerald-700",
    accentBg: "bg-emerald-50",
    badgeBg: "#EAFBF4",
    badgeText: "#2F855A",
    badgeBorder: "#CBE7DA",
  },
  Mathematics: {
    emoji: "MA",
    gradient: "from-sky-500 to-blue-500",
    cardGradient: "from-sky-50 to-blue-50",
    accentBorder: "border-sky-200",
    accentText: "text-sky-700",
    accentBg: "bg-sky-50",
    badgeBg: "#EAF4FB",
    badgeText: "#4A8CC0",
    badgeBorder: "#D6EAF8",
  },
  History: {
    emoji: "HI",
    gradient: "from-sky-500 to-cyan-500",
    cardGradient: "from-sky-50 to-cyan-50",
    accentBorder: "border-sky-200",
    accentText: "text-sky-700",
    accentBg: "bg-sky-50",
    badgeBg: "#EAF4FB",
    badgeText: "#4A8CC0",
    badgeBorder: "#D6EAF8",
  },
  Physics: {
    emoji: "PH",
    gradient: "from-indigo-500 to-violet-500",
    cardGradient: "from-indigo-50 to-violet-50",
    accentBorder: "border-indigo-200",
    accentText: "text-indigo-700",
    accentBg: "bg-indigo-50",
    badgeBg: "#EEF2FF",
    badgeText: "#4338CA",
    badgeBorder: "#C7D2FE",
  },
  English: {
    emoji: "EN",
    gradient: "from-rose-500 to-pink-400",
    cardGradient: "from-rose-50 to-pink-50",
    accentBorder: "border-rose-200",
    accentText: "text-rose-700",
    accentBg: "bg-rose-50",
    badgeBg: "#FCE7F3",
    badgeText: "#BE185D",
    badgeBorder: "#FBCFE8",
  },
  General: {
    emoji: "GE",
    gradient: "from-slate-500 to-slate-400",
    cardGradient: "from-slate-50 to-slate-100",
    accentBorder: "border-slate-200",
    accentText: "text-slate-700",
    accentBg: "bg-slate-50",
    badgeBg: "#F3F4F6",
    badgeText: "#475569",
    badgeBorder: "#E2E8F0",
  },
};

const conditionThemeAccents: Record<
  "default" | "adhd" | "asd" | "dyslexia" | "dyscalculia" | "anxiety" | "depression",
  ConditionThemeAccent
> = {
  default: {
    focusBannerBg: "from-slate-500/20 to-cyan-500/20",
    focusBannerBorder: "border-cyan-500/30",
    focusBannerDot: "bg-cyan-400",
    focusBannerText: "text-cyan-300",
    focusBannerSubtext: "text-cyan-200/70",
    keyInsightColor: "teal",
  },
  adhd: {
    focusBannerBg: "from-sky-500/20 to-blue-500/20",
    focusBannerBorder: "border-sky-500/30",
    focusBannerDot: "bg-sky-400",
    focusBannerText: "text-sky-300",
    focusBannerSubtext: "text-sky-200/70",
    keyInsightColor: "sky",
  },
  asd: {
    focusBannerBg: "from-emerald-500/18 to-teal-500/18",
    focusBannerBorder: "border-emerald-500/25",
    focusBannerDot: "bg-emerald-400",
    focusBannerText: "text-emerald-300",
    focusBannerSubtext: "text-emerald-200/70",
    keyInsightColor: "green",
  },
  dyslexia: {
    focusBannerBg: "from-cyan-500/20 to-indigo-500/20",
    focusBannerBorder: "border-cyan-500/30",
    focusBannerDot: "bg-cyan-300",
    focusBannerText: "text-cyan-200",
    focusBannerSubtext: "text-cyan-100/70",
    keyInsightColor: "sky",
  },
  dyscalculia: {
    focusBannerBg: "from-sky-500/18 to-emerald-500/18",
    focusBannerBorder: "border-emerald-500/25",
    focusBannerDot: "bg-emerald-400",
    focusBannerText: "text-emerald-300",
    focusBannerSubtext: "text-emerald-200/70",
    keyInsightColor: "green",
  },
  anxiety: {
    focusBannerBg: "from-indigo-500/18 to-sky-500/18",
    focusBannerBorder: "border-indigo-500/25",
    focusBannerDot: "bg-indigo-300",
    focusBannerText: "text-indigo-200",
    focusBannerSubtext: "text-indigo-100/70",
    keyInsightColor: "violet",
  },
  depression: {
    focusBannerBg: "from-sky-500/18 to-teal-500/18",
    focusBannerBorder: "border-emerald-500/25",
    focusBannerDot: "bg-emerald-300",
    focusBannerText: "text-emerald-200",
    focusBannerSubtext: "text-emerald-100/70",
    keyInsightColor: "green",
  },
};

const resolveConditionThemeAccent = (): ConditionThemeAccent => {
  if (typeof document === "undefined") {
    return conditionThemeAccents.default;
  }

  const rawCondition =
    document.documentElement.getAttribute("data-student-condition") ?? "default";
  const normalized = rawCondition.trim().toLowerCase();

  if (normalized in conditionThemeAccents) {
    return conditionThemeAccents[
      normalized as keyof typeof conditionThemeAccents
    ];
  }

  return conditionThemeAccents.default;
};

function mapLesson(item: LessonItem): LessonCardItem {
    const subject = item.subject?.name ?? "General";
  const objectives =
    item.learningObjectives
      ?.filter((entry) => typeof entry === "string" && entry.trim().length > 0)
      .slice(0, 3) ?? [];

    return {
      id: item.id,
      title: item.title,
      subject: titleCase(subject),
      durationMin: item.totalDurationMin ?? 20,
    progress: Math.max(0, Math.min(100, item.studentProgress?.progressPercent ?? 0)),
    description:
      item.description ??
      "Open this lesson to read chapter summaries and continue your progress.",
    tags: objectives.length > 0 ? objectives : [titleCase(subject), "Lesson", "Practice"],
    xp: item.totalXP ?? 35,
  };
}

const normalizeKeyPoints = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return [value];
  }
  return [];
};

const normalizeVocabulary = (
  value: LessonItem["keyVocabulary"],
): Array<{ term: string; definition?: string }> => {
  if (!value) return [];
  return value
    .map((entry) => {
      if (typeof entry === "string") {
        return { term: entry };
      }
      if (entry && typeof entry.term === "string") {
        return { term: entry.term, definition: entry.definition };
      }
      return null;
    })
    .filter((entry): entry is { term: string; definition?: string } => Boolean(entry?.term));
};

const buildLessonBlocks = (
  chapter: LessonChapter | undefined,
  keyInsightColor: ConditionThemeAccent["keyInsightColor"],
): LessonBlock[] => {
  if (!chapter) return [];

  const blocks: LessonBlock[] = [];
  if (chapter.title) {
    blocks.push({ type: "heading", text: chapter.title });
  }
  if (chapter.summary) {
    blocks.push({
      type: "callout",
      icon: "S",
      title: "Chapter summary",
      text: chapter.summary,
      color: "teal",
    });
  }
  if (chapter.keyInsight) {
    blocks.push({
      type: "callout",
      icon: "!",
      title: "Key insight",
      text: chapter.keyInsight,
      color: keyInsightColor,
    });
  }
  const keyPoints = normalizeKeyPoints(chapter.keyPoints);
  if (keyPoints.length > 0) {
    blocks.push({ type: "list", items: keyPoints });
  }
  if (chapter.content) {
    blocks.push({ type: "paragraph", text: chapter.content });
  }
  return blocks.length > 0 ? blocks : [{ type: "paragraph", text: "Content will be available soon." }];
};

const fallbackBlocks: LessonBlock[] = [
  { type: "heading", text: "Lesson overview" },
  {
    type: "paragraph",
    text: "This lesson is being prepared. Check back soon for the full chapter content.",
  },
];

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

function mapLessonDetail(item: LessonItem, rating: number | null): LessonDetailItem {
  const base = mapLesson(item);
  const completedChapterIds = item.studentProgress?.completedChapterIds ?? [];

  return {
    ...base,
    chapters: item.chapters ?? [],
    completedChapterIds,
    isCompleted: Boolean(item.studentProgress?.isCompleted),
    rating,
    difficulty: item.difficulty ?? undefined,
    pdfPath: item.pdfPath ?? null,
    keyVocabulary: normalizeVocabulary(item.keyVocabulary),
  };
}

interface MyLessonsPageProps {
  lessonId?: string;
  standalone?: boolean;
}

export function MyLessonsPage({ lessonId, standalone = false }: MyLessonsPageProps) {
  const router = useRouter();
  const { refresh, allProgress } = useStudentDashboardContext();
  const [conditionAccent, setConditionAccent] = useState<ConditionThemeAccent>(
    conditionThemeAccents.default,
  );

  const [lessons, setLessons] = useState<LessonCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(!standalone);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeSubject, setActiveSubject] = useState("All");
  const [search, setSearch] = useState("");

  const [selectedLesson, setSelectedLesson] = useState<LessonDetailItem | null>(null);
  const [isLoadingLessonDetail, setIsLoadingLessonDetail] = useState(Boolean(lessonId));

  const loadLessons = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await studentApi.getLessons({ page: 1, limit: 50 });
      setLessons((response.lessons ?? []).map(mapLesson));
      setLoadError(null);
    } catch (error) {
      if (error instanceof ApiError) {
        setLoadError(error.message);
      } else {
        setLoadError("Could not load lessons.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadLessonDetail = useCallback(
    async (lessonId: string) => {
      setIsLoadingLessonDetail(true);

      try {
        const detail = await studentApi.getLessonDetail(lessonId);
        const progressRow = allProgress.find((item) => item.lessonId === lessonId);
        setSelectedLesson(mapLessonDetail(detail, progressRow?.rating ?? null));
        setLoadError(null);
      } catch (error) {
        if (error instanceof ApiError) {
          setLoadError(error.message);
          toast.error(error.message);
        } else {
          setLoadError("Could not load lesson details.");
          toast.error("Could not load lesson details.");
        }

        if (!standalone) {
          setSelectedLesson(null);
        }
      } finally {
        setIsLoadingLessonDetail(false);
      }
    },
    [allProgress, standalone],
  );

  useEffect(() => {
    if (standalone) {
      return;
    }

    loadLessons().catch(() => null);
  }, [loadLessons, standalone]);

  useEffect(() => {
    if (!standalone || !lessonId) {
      return;
    }

    void loadLessonDetail(lessonId);
  }, [lessonId, loadLessonDetail, standalone]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const updateConditionAccent = () => {
      setConditionAccent(resolveConditionThemeAccent());
    };

    updateConditionAccent();

    const observer = new MutationObserver(updateConditionAccent);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-student-condition"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const subjects = useMemo(() => {
    const options = Array.from(new Set(lessons.map((lesson) => lesson.subject))).sort();
    return ["All", ...options];
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchesSubject = activeSubject === "All" || lesson.subject === activeSubject;
      const query = search.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        lesson.title.toLowerCase().includes(query) ||
        lesson.subject.toLowerCase().includes(query);

      return matchesSubject && matchesSearch;
    });
  }, [activeSubject, lessons, search]);

  const completedLessonsCount = useMemo(
    () => lessons.filter((lesson) => lesson.progress >= 100).length,
    [lessons],
  );

  const openLesson = (nextLessonId: string) => {
    router.push(`/student/lessons/${nextLessonId}`);
  };

  const closeLesson = () => {
    router.push("/student/lessons");
  };

  const startLesson = async (lessonId: string) => {
    try {
      await studentApi.startLesson({ lessonId });
      toast.success("Lesson started.");

      await refresh();
      if (!standalone) {
        await loadLessons();
      }
      await loadLessonDetail(lessonId);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Could not start lesson right now.");
      }
    }
  };

  const openLessonPdf = async () => {
    if (!selectedLesson) {
      return;
    }

    if (!selectedLesson.pdfPath) {
      toast.error("PDF not available for this lesson yet.");
      return;
    }

    try {
      const blob = await studentApi.getLessonPdf(selectedLesson.id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Unable to open lesson PDF.");
      }
    }
  };

  const renderSelectedLessonDetail = () => {
    if (!selectedLesson) {
      return null;
    }

    const normalizedSubject = titleCase(selectedLesson.subject);
    const subjectTheme = subjectThemes[normalizedSubject] ?? subjectThemes.General;
    const chapters = selectedLesson.chapters ?? [];
    const chapterRewards = Object.fromEntries(
      chapters.map((chapter) => [chapter.id, Math.max(5, chapter.xpReward ?? 20)]),
    );

    const lessonView: Lesson = {
      id: selectedLesson.id,
      title: selectedLesson.title,
      subject: normalizedSubject,
      emoji: subjectTheme.emoji,
      gradient: subjectTheme.gradient,
      cardGradient: subjectTheme.cardGradient,
      accentBorder: subjectTheme.accentBorder,
      accentText: subjectTheme.accentText,
      accentBg: subjectTheme.accentBg,
      difficulty: ((): Lesson["difficulty"] => {
        if (typeof selectedLesson?.difficulty === "string" && selectedLesson.difficulty.length > 0) {
          const normalized = selectedLesson.difficulty.toUpperCase();
          if (normalized === "BEGINNER") return "Beginner";
          if (normalized === "ADVANCED") return "Advanced";
          if (normalized === "INTERMEDIATE") return "Intermediate";
          return titleCase(selectedLesson.difficulty) as Lesson["difficulty"];
        }
        return "Intermediate";
      })(),
      rating: selectedLesson.rating ?? 0,
      keyPoints: normalizeKeyPoints(chapters[0]?.keyPoints),
      keyTerms: (selectedLesson.keyVocabulary ?? []).slice(0, 6).map((entry) => ({
        term: entry.term,
        definition: entry.definition ?? "",
      })),
      chapters: chapters.length > 0
        ? chapters.map((chapter) => ({
            id: chapter.id,
            title: chapter.title,
            duration: Math.max(1, chapter.durationMin ?? 5),
            content: buildLessonBlocks(chapter, conditionAccent.keyInsightColor),
            completed: selectedLesson.completedChapterIds.includes(chapter.id),
          }))
        : [
            {
              id: `${selectedLesson.id}-chapter-1`,
              title: "Lesson Overview",
              duration: Math.max(1, selectedLesson.durationMin ?? 5),
              content: fallbackBlocks,
              completed: false,
            },
          ],
      progress: Math.max(0, Math.min(100, selectedLesson.progress)),
      xp: selectedLesson.xp,
    };

    return (
      <LessonDetailView
        lesson={lessonView}
        onBack={closeLesson}
        chapterRewards={chapterRewards}
        onProgressSaved={async () => {
          await refresh();
          if (!standalone) {
            await loadLessons();
          }
          await loadLessonDetail(selectedLesson.id);
        }}
        onContinue={() => void startLesson(selectedLesson.id)}
        onOpenPdf={() => void openLessonPdf()}
        pdfAvailable={Boolean(selectedLesson.pdfPath)}
        fullScreen={true}
        focusThemeAccent={conditionAccent}
      />
    );
  };

  if (standalone && lessonId) {
    if (loadError && !selectedLesson) {
      return (
        <div
          className="relative z-10 rounded-xl px-4 py-8 text-center text-sm"
          style={{
            background:
              "linear-gradient(155deg, var(--student-card-gradient-a, rgba(59,130,246,0.1)) 0%, var(--student-card-gradient-b, rgba(30,58,138,0.06)) 100%), var(--color-surface)",
            border: "var(--student-card-border-width, 1px) solid var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          <p>{loadError}</p>
          <button
            type="button"
            onClick={closeLesson}
            className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-accent)",
            }}
          >
            Back to lessons
          </button>
        </div>
      );
    }

    if (isLoadingLessonDetail || !selectedLesson) {
      return (
        <div
          className="relative z-10 rounded-xl px-4 py-8 text-center text-sm"
          style={{
            background:
              "linear-gradient(155deg, var(--student-card-gradient-a, rgba(59,130,246,0.1)) 0%, var(--student-card-gradient-b, rgba(30,58,138,0.06)) 100%), var(--color-surface)",
            border: "var(--student-card-border-width, 1px) solid var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          <Loader2 size={16} className="mx-auto mb-2 animate-spin" />
          Loading lesson details...
        </div>
      );
    }

    return <>{renderSelectedLessonDetail()}</>;
  }

  return (
    <div className="relative z-10 flex flex-col gap-6 pb-20 md:pb-24">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
          My Lessons
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
          {lessons.length} lessons • {completedLessonsCount} completed
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div
          className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl px-3 py-2.5"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <Search size={15} style={{ color: "var(--color-text-muted)" }} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search lessons..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--color-text)" }}
          />
        </div>

        <div
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm"
          style={{
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            color: "var(--color-accent)",
          }}
        >
          <Filter size={15} />
          Filter
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {subjects.map((subject) => (
          <button
            key={subject}
            type="button"
            onClick={() => setActiveSubject(subject)}
            className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
            style={{
              background: activeSubject === subject ? "var(--color-accent)" : "var(--color-surface)",
              color: activeSubject === subject ? "var(--color-surface)" : "var(--color-text)",
              border: `1px solid ${
                activeSubject === subject
                  ? "rgba(var(--student-accent-rgb, 111 168 220), 0.9)"
                  : "var(--color-border)"
              }`,
            }}
          >
            {subject}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div
          className="rounded-xl px-4 py-8 text-center text-sm"
          style={{
            background:
              "linear-gradient(155deg, var(--student-card-gradient-a, rgba(59,130,246,0.1)) 0%, var(--student-card-gradient-b, rgba(30,58,138,0.06)) 100%), var(--color-surface)",
            border: "var(--student-card-border-width, 1px) solid var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          <Loader2 size={16} className="mx-auto mb-2 animate-spin" />
          Loading lessons...
        </div>
      ) : loadError ? (
        <div
          className="rounded-xl px-4 py-8 text-center text-sm"
          style={{
            background:
              "linear-gradient(155deg, var(--student-card-gradient-a, rgba(59,130,246,0.1)) 0%, var(--student-card-gradient-b, rgba(30,58,138,0.06)) 100%), var(--color-surface)",
            border: "var(--student-card-border-width, 1px) solid var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          {loadError}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLessons.map((lesson) => {
            const accent = subjectThemes[titleCase(lesson.subject)] ?? subjectThemes.General;

            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => openLesson(lesson.id)}
                className="rounded-2xl p-4 text-left transition-all hover:scale-[1.01]"
                style={{
                  background:
                    "linear-gradient(155deg, var(--student-card-gradient-a, rgba(59,130,246,0.1)) 0%, var(--student-card-gradient-b, rgba(30,58,138,0.06)) 100%), var(--color-surface)",
                  border: "var(--student-card-border-width, 1px) solid var(--color-border)",
                  boxShadow: "var(--student-card-shadow)",
                }}
              >
                <div className="mb-3 flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-semibold"
                    style={{ background: accent.badgeBg, color: accent.badgeText, border: `1px solid ${accent.badgeBorder}` }}
                  >
                    {accent.emoji}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold" style={{ color: "var(--color-text)" }}>
                      {lesson.title}
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                      {lesson.subject}
                    </p>
                  </div>

                  <span className="text-[10px]" style={{ color: accent.badgeText }}>+{lesson.xp} XP</span>
                </div>

                <p className="mb-3 line-clamp-2 text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                  {lesson.description}
                </p>

                <div className="mb-1 flex items-center justify-between text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                  <span>{lesson.durationMin} min</span>
                  <span>{lesson.progress}%</span>
                </div>

                <div
                  className="h-1.5 rounded-full"
                  style={{ background: "rgba(var(--student-primary-rgb, 44 62 80), 0.12)" }}
                >
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${lesson.progress}%`,
                      background: "linear-gradient(90deg, var(--color-accent), var(--color-primary))",
                    }}
                  />
                </div>
              </button>
            );
          })}

          {filteredLessons.length === 0 ? (
            <div
              className="col-span-full rounded-2xl border border-dashed px-4 py-8 text-center text-sm"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
            >
              No lessons match your filters.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
