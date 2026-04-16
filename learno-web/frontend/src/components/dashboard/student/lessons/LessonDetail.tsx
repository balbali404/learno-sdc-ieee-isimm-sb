import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Brain, BookOpen, Clock, Star,
  ChevronRight, Play, CheckCircle2, Circle,
  Sparkles, Volume2, VolumeX, Maximize2, Minimize2,
  Zap, FileText, Lock,
} from "lucide-react";
export type LessonBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; icon: string; title: string; text: string; color: string }
  | { type: "keyterm"; term: string; definition: string }
  | { type: "diagram"; label: string; nodes: string[]; color: string };

interface Chapter {
  id: string;
  title: string;
  duration: number;
  content: LessonBlock[];
  completed: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  subject: string;
  emoji: string;
  gradient: string;
  cardGradient: string;
  accentBorder: string;
  accentText: string;
  accentBg: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  rating: number;
  keyPoints: string[];
  keyTerms: Array<{ term: string; definition: string }>;
  chapters: Chapter[];
  progress: number;
  xp?: number;
}
import { AttentionTracker } from "./AttentionTracker";
import { studentApi } from "@/lib/api";
import { toast } from "sonner";

interface LessonDetailProps {
  lesson: Lesson;
  onBack: () => void;
  chapterRewards?: Record<string, number>;
  onProgressSaved?: () => void;
  onContinue?: () => void;
  onOpenPdf?: () => void;
  pdfAvailable?: boolean;
  fullScreen?: boolean;
  focusThemeAccent?: {
    focusBannerBg: string;
    focusBannerBorder: string;
    focusBannerDot: string;
    focusBannerText: string;
    focusBannerSubtext: string;
  };
}

const defaultFocusThemeAccent = {
  focusBannerBg: "from-slate-500/20 to-cyan-500/20",
  focusBannerBorder: "border-cyan-500/30",
  focusBannerDot: "bg-cyan-400",
  focusBannerText: "text-cyan-300",
  focusBannerSubtext: "text-cyan-200/70",
};

interface StoredLessonSessionState {
  activeChapter: number;
  readTime: number;
  chapterElapsedById: Record<string, number>;
  chapterId?: string;
}

const buildLessonSessionStorageKey = (lessonId: string) => `learno:lesson-session:${lessonId}`;

const readStoredLessonSessionState = (lessonId: string): StoredLessonSessionState | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(buildLessonSessionStorageKey(lessonId));
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredLessonSessionState>;

    if (
      typeof parsed.activeChapter !== "number" ||
      typeof parsed.readTime !== "number" ||
      !parsed.chapterElapsedById ||
      typeof parsed.chapterElapsedById !== "object"
    ) {
      return null;
    }

    return {
      activeChapter: Math.max(0, Math.floor(parsed.activeChapter)),
      readTime: Math.max(0, Math.floor(parsed.readTime)),
      chapterId: typeof parsed.chapterId === "string" ? parsed.chapterId : undefined,
      chapterElapsedById: Object.entries(parsed.chapterElapsedById).reduce<Record<string, number>>(
        (acc, [chapterId, value]) => {
          if (typeof value === "number" && Number.isFinite(value)) {
            acc[chapterId] = Math.max(0, Math.floor(value));
          }
          return acc;
        },
        {},
      ),
    };
  } catch {
    return null;
  }
};

const writeStoredLessonSessionState = (lessonId: string, state: StoredLessonSessionState) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(buildLessonSessionStorageKey(lessonId), JSON.stringify(state));
};

const clearStoredLessonSessionState = (lessonId: string) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(buildLessonSessionStorageKey(lessonId));
};

function BlockRenderer({
  block,
  focusMode = false,
}: {
  block: LessonBlock;
  focusMode?: boolean;
}) {
  const diagramColors: Record<string, { bg: string; accent: string; connector: string }> = {
    teal: { bg: "bg-teal-50 border-teal-200", accent: "bg-teal-500 text-white", connector: "bg-teal-200" },
    blue: { bg: "bg-sky-50 border-sky-200", accent: "bg-sky-500 text-white", connector: "bg-sky-200" },
    purple: { bg: "bg-violet-50 border-violet-200", accent: "bg-violet-500 text-white", connector: "bg-violet-200" },
    orange: { bg: "bg-cyan-50 border-cyan-200", accent: "bg-cyan-500 text-white", connector: "bg-cyan-200" },
    green: { bg: "bg-green-50 border-green-200", accent: "bg-green-500 text-white", connector: "bg-green-200" },
    rose: { bg: "bg-rose-50 border-rose-200", accent: "bg-rose-500 text-white", connector: "bg-rose-200" },
  };

  const calloutColors: Record<string, { bg: string; border: string; icon: string; title: string; text: string }> = {
    sky: { bg: "bg-sky-50", border: "border-sky-200", icon: "text-sky-500", title: "text-sky-800", text: "text-sky-700" },
    amber: { bg: "bg-sky-50", border: "border-sky-200", icon: "text-sky-500", title: "text-sky-800", text: "text-sky-700" },
    teal: { bg: "bg-teal-50", border: "border-teal-200", icon: "text-teal-500", title: "text-teal-800", text: "text-teal-700" },
    violet: { bg: "bg-violet-50", border: "border-violet-200", icon: "text-violet-500", title: "text-violet-800", text: "text-violet-700" },
    purple: { bg: "bg-purple-50", border: "border-purple-200", icon: "text-purple-500", title: "text-purple-800", text: "text-purple-700" },
    orange: { bg: "bg-cyan-50", border: "border-cyan-200", icon: "text-cyan-500", title: "text-cyan-800", text: "text-cyan-700" },
    pink: { bg: "bg-pink-50", border: "border-pink-200", icon: "text-pink-500", title: "text-pink-800", text: "text-pink-700" },
    green: { bg: "bg-green-50", border: "border-green-200", icon: "text-green-500", title: "text-green-800", text: "text-green-700" },
    rose: { bg: "bg-rose-50", border: "border-rose-200", icon: "text-rose-500", title: "text-rose-800", text: "text-rose-700" },
  };

  switch (block.type) {
    case "heading":
      return (
        <h3 className={`text-xl font-semibold mt-6 mb-3 flex items-center gap-2 ${focusMode ? "text-white" : "text-gray-900"}`}>
          <span className={`w-0.5 h-5 rounded-full inline-block shrink-0 ${focusMode ? "bg-sky-300" : "bg-blue-500"}`} />
          {block.text}
        </h3>
      );
    case "paragraph":
      return <p className={`text-sm leading-relaxed my-3 ${focusMode ? "text-slate-100" : "text-gray-600"}`}>{block.text}</p>;
    case "list":
      return (
        <ul className="my-4 space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className={`flex items-start gap-3 text-sm ${focusMode ? "text-slate-100" : "text-gray-600"}`}>
              <span className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${focusMode ? "bg-sky-300" : "bg-blue-400"}`} />
              {item}
            </li>
          ))}
        </ul>
      );
    case "callout": {
      const c = calloutColors[block.color] || calloutColors.sky;
      return (
        <div
          className={`${focusMode ? "bg-slate-800/80" : c.bg} border-l-4 ${c.border} rounded-r-2xl p-4 my-4 flex items-start gap-3`}
        >
          <span className="text-2xl">{block.icon}</span>
          <div>
            <p className={`text-sm font-black mb-1 ${focusMode ? "text-white" : c.title}`}>{block.title}</p>
            <p className={`text-sm font-semibold ${focusMode ? "text-slate-100" : c.text}`}>{block.text}</p>
          </div>
        </div>
      );
    }
    case "keyterm":
      return (
        <div className={`${focusMode ? "bg-slate-800 border-slate-600" : "bg-gray-50 border-gray-200"} border rounded-xl p-4 my-3`}>
          <div className="flex items-start gap-3">
            <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${focusMode ? "bg-sky-500/20" : "bg-blue-50"}`}>
              <BookOpen size={13} className={focusMode ? "text-sky-300" : "text-blue-600"} strokeWidth={2} />
            </div>
            <div>
              <span className={`text-sm font-semibold ${focusMode ? "text-white" : "text-gray-800"}`}>{block.term}</span>
              <p className={`text-sm mt-0.5 ${focusMode ? "text-slate-100" : "text-gray-500"}`}>{block.definition}</p>
            </div>
          </div>
        </div>
      );
    case "diagram": {
      const d = diagramColors[block.color] || diagramColors.blue;
      return (
        <div className={`${d.bg} border rounded-2xl p-5 my-5`}>
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">{block.label}</p>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {block.nodes.map((node, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`${d.accent} px-4 py-2.5 rounded-2xl text-[13px] font-black text-center shadow-sm whitespace-pre-line`}>
                  {node}
                </div>
                {i < block.nodes.length - 1 && (
                  <ChevronRight size={16} className="text-slate-400 shrink-0" strokeWidth={2.5} />
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}

export function LessonDetail({
  lesson,
  onBack,
  chapterRewards,
  onProgressSaved,
  onContinue,
  onOpenPdf,
  pdfAvailable = false,
  fullScreen = false,
  focusThemeAccent,
}: LessonDetailProps) {
  const [activeChapter, setActiveChapter] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const [showAttentionSetup, setShowAttentionSetup] = useState(false);
  const [attentionActive, setAttentionActive] = useState(false);
  const [ambientSound, setAmbientSound] = useState(false);
  const [readTime, setReadTime] = useState(0);
  const [fullContent, setFullContent] = useState(false);
  const [showCameraPrompt, setShowCameraPrompt] = useState(false);
  const [isSavingChapter, setIsSavingChapter] = useState(false);
  const [lessonProgress, setLessonProgress] = useState(lesson.progress);
  const [sessionXP, setSessionXP] = useState(0);
  const [hasRestoredSession, setHasRestoredSession] = useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);
  const [chapterElapsedById, setChapterElapsedById] = useState<Record<string, number>>(() =>
    Object.fromEntries(lesson.chapters.map((chapterItem) => [chapterItem.id, 0])),
  );
  const [completedChapterIds, setCompletedChapterIds] = useState<string[]>(
    lesson.chapters.filter((chapterItem) => chapterItem.completed).map((chapterItem) => chapterItem.id),
  );
  const resolvedFocusThemeAccent = focusThemeAccent ?? defaultFocusThemeAccent;
  const contentRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lessonFrameStyle = fullScreen
    ? {
        left: isDesktopViewport ? "var(--student-sidebar-width, 240px)" : "0px",
        width: isDesktopViewport
          ? "calc(100vw - var(--student-sidebar-width, 240px))"
          : "100vw",
      }
    : {
        width: "100%",
      };

  const chapter: Chapter = lesson.chapters[activeChapter];
  const completedCount = completedChapterIds.length;
  const chapterCompleted = completedChapterIds.includes(chapter.id);
  const isChapterUnlocked = (index: number) => {
    if (index <= 0) return true;
    return lesson.chapters
      .slice(0, index)
      .every((chapterItem) => completedChapterIds.includes(chapterItem.id));
  };
  const fallbackChapterXP = Math.max(
    5,
    Math.round((lesson.xp || 100) / Math.max(1, lesson.chapters.length)),
  );
  const chapterXP = chapterRewards?.[chapter.id] ?? fallbackChapterXP;
  const computedProgress =
    lesson.chapters.length > 0
      ? Math.round((completedCount / lesson.chapters.length) * 100)
      : 0;
  const progressDisplay = Math.max(lessonProgress, computedProgress);
  const chapterElapsedSec = chapterElapsedById[chapter.id] ?? 0;
  const requiredChapterSeconds = Math.max(60, Math.round(chapter.duration * 60));
  const chapterRemainingSec = Math.max(0, requiredChapterSeconds - chapterElapsedSec);
  const chapterReadyForXP = chapterRemainingSec <= 0;

  useEffect(() => {
    setHasRestoredSession(false);

    const nextElapsedById = Object.fromEntries(
      lesson.chapters.map((chapterItem) => [chapterItem.id, 0]),
    );
    const storedState = readStoredLessonSessionState(lesson.id);

    setLessonProgress(lesson.progress);
    setCompletedChapterIds(
      lesson.chapters.filter((chapterItem) => chapterItem.completed).map((chapterItem) => chapterItem.id),
    );
    setSessionXP(0);

    if (!storedState) {
      setReadTime(0);
      setActiveChapter(0);
      setChapterElapsedById(nextElapsedById);
      setHasRestoredSession(true);
      return;
    }

    const mergedElapsedById = lesson.chapters.reduce<Record<string, number>>((acc, chapterItem) => {
      acc[chapterItem.id] = storedState.chapterElapsedById[chapterItem.id] ?? 0;
      return acc;
    }, {});

    const restoredChapterIndex = storedState.chapterId
      ? lesson.chapters.findIndex((chapterItem) => chapterItem.id === storedState.chapterId)
      : -1;
    const fallbackIndex = Math.min(storedState.activeChapter, Math.max(0, lesson.chapters.length - 1));
    const nextChapterIndex = restoredChapterIndex >= 0 ? restoredChapterIndex : fallbackIndex;

    setReadTime(storedState.readTime);
    setActiveChapter(nextChapterIndex);
    setChapterElapsedById(mergedElapsedById);
    setHasRestoredSession(true);
  }, [lesson]);

  useEffect(() => {
    if (!hasRestoredSession || !lesson.chapters[activeChapter]) {
      return;
    }

    writeStoredLessonSessionState(lesson.id, {
      activeChapter,
      readTime,
      chapterId: lesson.chapters[activeChapter].id,
      chapterElapsedById,
    });
  }, [activeChapter, chapterElapsedById, hasRestoredSession, lesson.chapters, lesson.id, readTime]);

  useEffect(() => {
    const activeChapterId = chapter.id;

    timerRef.current = setInterval(() => {
      setReadTime((t) => t + 1);
      setChapterElapsedById((current) => ({
        ...current,
        [activeChapterId]: (current[activeChapterId] ?? 0) + 1,
      }));
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [chapter.id]);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setFullContent(false);
  }, [activeChapter]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(min-width: 768px)");
    const updateViewport = () => {
      setIsDesktopViewport(media.matches);
    };

    updateViewport();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", updateViewport);
      return () => media.removeEventListener("change", updateViewport);
    }

    media.addListener(updateViewport);
    return () => media.removeListener(updateViewport);
  }, []);

  const handleCompleteChapter = async () => {
    if (chapterCompleted || isSavingChapter) {
      return;
    }

    if (!chapterReadyForXP) {
      toast.warning(`Keep reading this chapter for ${formatReadTime(chapterRemainingSec)} to unlock XP.`);
      return;
    }

    setIsSavingChapter(true);
    try {
      await studentApi.startLesson({ lessonId: lesson.id });
      const durationMin = Math.max(1, Math.round(chapterElapsedSec / 60));
      const response = await studentApi.completeChapter({
        chapterId: chapter.id,
        timeSpentMin: durationMin,
      });

      setCompletedChapterIds((current) =>
        current.includes(chapter.id) ? current : [...current, chapter.id],
      );
      setLessonProgress(response.progressPercent ?? computedProgress);

      if (response.xpEarned > 0) {
        setSessionXP((value) => value + response.xpEarned);
        toast.success(`+${response.xpEarned} XP earned`);
      }

      if (response.lessonCompleted) {
        clearStoredLessonSessionState(lesson.id);
        toast.success("Lesson completed. Great work!");
      }

      onProgressSaved?.();
    } catch {
      toast.error("Could not save chapter completion.");
    } finally {
      setIsSavingChapter(false);
    }
  };

  const formatReadTime = (sec: number) =>
    sec < 60 ? `${sec}s` : `${Math.floor(sec / 60)}m ${sec % 60}s`;

  const difficultyColors = {
    Beginner: "bg-teal-100 text-teal-700 border-teal-200",
    Intermediate: "bg-sky-100 text-sky-700 border-sky-200",
    Advanced: "bg-rose-100 text-rose-700 border-rose-200",
  };

  const themedPanelStyle = {
    background:
      "linear-gradient(155deg, var(--student-card-gradient-a, rgba(59,130,246,0.1)) 0%, var(--student-card-gradient-b, rgba(30,58,138,0.06)) 100%), var(--color-surface)",
    borderColor: "var(--color-border)",
    boxShadow: "var(--student-card-shadow)",
  } as const;

  const themedSoftPanelStyle = {
    background: "var(--color-surface)",
    borderColor: "var(--color-border)",
  } as const;

  return (
    <div
      className={`flex flex-col ${
        fullScreen
          ? "fixed top-0 bottom-0 right-0 z-[80] overflow-auto"
          : "relative min-h-[calc(100vh-3rem)]"
      }`}
      style={{
        background: "var(--color-bg)",
        ...lessonFrameStyle,
      }}
    >
      {/* ── Focus mode overlay ── */}
      <AnimatePresence>
        {focusMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 pointer-events-none"
            style={{ background: "rgba(8,20,45,0.82)", backdropFilter: "blur(12px) saturate(60%)" }}
          />
        )}
      </AnimatePresence>

      {/* ── Camera prompt banner ── */}
      <AnimatePresence>
        {showCameraPrompt && !attentionActive && !showAttentionSetup && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`relative z-50 mx-0 mb-0 ${focusMode ? "z-50" : ""}`}
          >
            <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-white/20 rounded-xl shrink-0">
                  <Brain size={18} className="text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-white font-black text-sm leading-none">Enable Smart Attention Tracking?</p>
                  <p className="text-sky-100 text-xs font-semibold mt-0.5">Camera tracks if you're looking at screen. No data saved. Ever.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowCameraPrompt(false)}
                  className="text-white/60 hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
                >
                  Skip
                </button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { setShowAttentionSetup(true); setShowCameraPrompt(false); }}
                  className="flex items-center gap-2 bg-white text-sky-600 font-black text-sm px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  <span className="text-base">📷</span> Enable Camera
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Attention Tracker Modal/PiP ── */}
      <AnimatePresence>
        {showAttentionSetup && (
          <AttentionTracker
            onClose={() => {
              setShowAttentionSetup(false);
              setAttentionActive(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Main Layout ── */}
        <div
          className={`relative flex flex-1 min-h-0 ${focusMode ? "z-50" : "z-10"}`}
          style={
            focusMode
              ? {
                  background:
                    "radial-gradient(circle at 12% 18%, rgba(var(--student-accent-rgb, 111 168 220), 0.24), transparent 55%), radial-gradient(circle at 88% 12%, rgba(var(--student-primary-rgb, 44 62 80), 0.18), transparent 48%), radial-gradient(circle at 50% 85%, rgba(var(--student-accent-rgb, 111 168 220), 0.12), transparent 54%), #0b111a",
                }
              : undefined
          }
        >
        {/* LEFT: Chapter Nav */}
        <aside
          className={`hidden lg:flex flex-col w-72 shrink-0 border-r transition-all duration-300 ${
            focusMode
              ? "bg-transparent border-white/10 backdrop-blur-xl"
              : "backdrop-blur-xl"
          }`}
          style={focusMode ? undefined : themedPanelStyle}
        >
          {/* Back + title */}
          <div
            className={`p-5 border-b ${focusMode ? "border-slate-700/60" : ""}`}
            style={focusMode ? undefined : { borderColor: "var(--color-border)" }}
          >
            <button
              onClick={onBack}
              className={`flex items-center gap-2 text-sm font-bold mb-4 transition-colors ${
                focusMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-sky-600"
              }`}
            >
              <ArrowLeft size={16} strokeWidth={2.5} />
              Back to Lessons
            </button>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black border mb-3 bg-gradient-to-r ${lesson.gradient} text-white border-transparent shadow-sm`}>
              <span>{lesson.emoji}</span>
              {lesson.subject}
            </div>
            <h2 className={`font-black leading-snug ${focusMode ? "text-white" : "text-slate-800"}`}>
              {lesson.title}
            </h2>
            {/* Progress */}
            <div className="mt-3">
              <div className="flex justify-between mb-1.5">
                <span className={`text-[10px] font-black uppercase tracking-wider ${focusMode ? "text-slate-400" : "text-slate-400"}`}>Progress</span>
                <span className={`text-[11px] font-black ${focusMode ? "text-sky-400" : "text-sky-600"}`}>{progressDisplay}%</span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${focusMode ? "bg-slate-700" : "bg-slate-100"}`}>
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${lesson.gradient}`}
                  style={{ width: `${progressDisplay}%` }}
                />
              </div>
              <p className={`text-[10px] font-semibold mt-1 ${focusMode ? "text-slate-500" : "text-slate-400"}`}>
                {completedCount}/{lesson.chapters.length} chapters done
              </p>
            </div>
          </div>

          {/* Chapters */}
          <div className="flex-1 overflow-y-auto py-3 px-3" style={{ scrollbarWidth: "none" }}>
            <p className={`text-[10px] font-black uppercase tracking-widest px-2 mb-2 ${focusMode ? "text-slate-500" : "text-slate-400"}`}>
              Chapters
            </p>
            {lesson.chapters.map((ch, i) => {
              const unlocked = isChapterUnlocked(i);

              return (
              <button
                key={ch.id}
                onClick={() => {
                  if (unlocked) {
                    setActiveChapter(i);
                    return;
                  }

                  toast.warning("Complete previous chapter first.");
                }}
                className={`w-full text-left px-3 py-3 rounded-2xl mb-1.5 transition-all group ${
                  activeChapter === i
                    ? focusMode
                      ? "bg-sky-500/20 border border-sky-500/30 text-sky-300"
                      : `bg-gradient-to-r ${lesson.cardGradient} border ${lesson.accentBorder} ${lesson.accentText}`
                    : focusMode
                    ? unlocked
                      ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      : "text-slate-600/70"
                    : unlocked
                      ? "text-slate-600 hover:bg-slate-50 hover:text-sky-700"
                      : "text-slate-400 bg-slate-50/70"
                }`}
              >
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                    {completedChapterIds.includes(ch.id) ? (
                      <CheckCircle2 size={16} className={activeChapter === i ? "" : "text-teal-400"} strokeWidth={2.5} />
                    ) : !unlocked ? (
                      <Lock size={14} className="opacity-60" strokeWidth={2.2} />
                    ) : (
                      <Circle size={16} className="opacity-50" strokeWidth={2} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black leading-snug">{ch.title}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock size={10} strokeWidth={2.5} className="opacity-60" />
                      <span className="text-[10px] font-semibold opacity-60">{ch.duration} min</span>
                    </div>
                  </div>
                  {activeChapter === i && <ChevronRight size={14} strokeWidth={2.5} className="shrink-0 mt-0.5 opacity-70" />}
                </div>
              </button>
              );
            })}
          </div>

          {/* Key terms quick ref */}
          <div
            className={`p-4 border-t ${focusMode ? "border-slate-700/60" : ""}`}
            style={focusMode ? undefined : { borderColor: "var(--color-border)" }}
          >
            <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${focusMode ? "text-slate-500" : "text-slate-400"}`}>
              Key Terms
            </p>
            <div className="space-y-2">
              {lesson.keyTerms.slice(0, 3).map((kt) => (
                <div key={kt.term} className={`text-[11px] px-3 py-2 rounded-xl font-bold ${focusMode ? "bg-slate-800 text-slate-300" : `${lesson.accentBg} ${lesson.accentText}`}`}>
                  {kt.term}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* CENTER: Content */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          {/* Top Toolbar */}
          <header
            className={`shrink-0 px-6 py-4 border-b flex items-center justify-between gap-4 ${
              focusMode ? "bg-transparent border-white/10 backdrop-blur-xl" : "backdrop-blur-xl"
            }`}
            style={focusMode ? undefined : themedPanelStyle}
          >
            {/* Left: chapter title + info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 lg:hidden">
                <button
                  onClick={onBack}
                  className={`flex items-center gap-1 text-xs font-bold ${focusMode ? "text-slate-400" : ""}`}
                  style={focusMode ? undefined : { color: "var(--color-text-muted)" }}
                >
                  <ArrowLeft size={13} /> Back
                </button>
              </div>
              <h4
                className={`font-black truncate ${focusMode ? "text-white" : ""}`}
                style={focusMode ? undefined : { color: "var(--color-text)" }}
              >
                {chapter.title}
              </h4>
              <div className="flex items-center gap-3 mt-0.5">
                <span className={`text-[11px] font-bold flex items-center gap-1 ${focusMode ? "text-slate-400" : "text-slate-400"}`}>
                  <Clock size={10} strokeWidth={2.5} /> {chapter.duration} min
                </span>
                <span className={`text-[11px] font-bold flex items-center gap-1 ${focusMode ? "text-slate-400" : "text-slate-400"}`}>
                  <FileText size={10} strokeWidth={2.5} /> Chapter {activeChapter + 1}/{lesson.chapters.length}
                </span>
                {readTime > 0 && (
                  <span className={`text-[11px] font-bold flex items-center gap-1 ${focusMode ? "text-sky-400" : "text-sky-500"}`}>
                    <Zap size={10} strokeWidth={2.5} /> {formatReadTime(readTime)} reading
                  </span>
                )}
                {!chapterCompleted && (
                  <span className={`text-[11px] font-bold flex items-center gap-1 ${chapterReadyForXP ? "text-teal-500" : focusMode ? "text-sky-300" : "text-sky-600"}`}>
                    <Clock size={10} strokeWidth={2.5} />
                    {chapterReadyForXP ? "XP unlocked" : `${formatReadTime(chapterRemainingSec)} to unlock XP`}
                  </span>
                )}
              </div>
            </div>

             {/* Right: controls */}
             <div className="flex items-center gap-2 shrink-0">
                 {onOpenPdf ? (
                   <motion.button
                     whileHover={{ scale: 1.04 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={onOpenPdf}
                     disabled={!pdfAvailable}
                     title={pdfAvailable ? "Open lesson PDF" : "PDF not available"}
                     className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all border text-xs font-black ${
                       focusMode
                         ? pdfAvailable
                           ? "bg-white/10 text-white border-white/20 hover:bg-white/20"
                           : "bg-white/5 text-white/40 border-white/10"
                         : pdfAvailable
                           ? "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                           : "bg-slate-50 text-slate-300 border-slate-200"
                     }`}
                   >
                     <FileText size={14} strokeWidth={2.5} />
                     PDF
                   </motion.button>
                 ) : null}
              {/* Ambient sound */}
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setAmbientSound(!ambientSound)}
                title="Ambient sound"
                className={`p-2.5 rounded-xl transition-all border ${
                  ambientSound
                    ? "bg-teal-500 text-white border-teal-500 shadow-md shadow-teal-400/30"
                    : focusMode
                    ? "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                    : "bg-white text-slate-500 border-sky-100 hover:text-teal-600 hover:bg-teal-50"
                }`}
              >
                {ambientSound ? <Volume2 size={16} strokeWidth={2.5} /> : <VolumeX size={16} strokeWidth={2.5} />}
              </motion.button>

               {/* Attention tracker toggle */}
               <motion.button
                 whileHover={{ scale: 1.06 }}
                 whileTap={{ scale: 0.94 }}
                 onClick={() => {
                   setShowAttentionSetup(true);
                   setShowCameraPrompt(false);
                   setAttentionActive(true);
                 }}
                 title="Smart Attention"
                 className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all border text-sm font-black ${
                   attentionActive
                     ? "bg-violet-500 text-white border-violet-500 shadow-md shadow-violet-400/30"
                     : focusMode
                     ? "bg-white/10 text-white border-white/20 hover:bg-white/20"
                     : "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100"
                 }`}
               >
                 <Brain size={16} strokeWidth={2.5} />
                 <span className="hidden sm:inline">Attention</span>
               </motion.button>

               {/* Focus mode toggle */}
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setFocusMode(!focusMode)}
                  title="Focus Mode"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all border text-sm font-black ${
                    focusMode
                      ? "bg-white/15 text-white border-white/30 shadow-md shadow-white/10"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {focusMode ? <Minimize2 size={16} strokeWidth={2.5} /> : <Maximize2 size={16} strokeWidth={2.5} />}
                 <span className="hidden sm:inline">{focusMode ? "Exit Focus" : "Focus Mode"}</span>
               </motion.button>
               {onContinue ? (
                 <motion.button
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={onContinue}
                   className={`hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all border text-sm font-black ${
                     focusMode
                       ? "bg-gradient-to-r from-emerald-400/90 to-teal-400/90 text-white border-transparent shadow-lg"
                       : `bg-gradient-to-r ${lesson.gradient} text-white border-transparent shadow-lg`
                   }`}
                 >
                   <Play size={16} strokeWidth={2.5} /> Continue
                 </motion.button>
               ) : null}
            </div>
          </header>

          {/* Focus Mode Banner */}
          <AnimatePresence>
            {focusMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`bg-gradient-to-r ${resolvedFocusThemeAccent.focusBannerBg} border-b ${resolvedFocusThemeAccent.focusBannerBorder} px-6 py-2 flex items-center gap-2`}
              >
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`w-2 h-2 rounded-full ${resolvedFocusThemeAccent.focusBannerDot}`}
                />
                <span className={`text-[12px] font-black ${resolvedFocusThemeAccent.focusBannerText}`}>Focus Mode Active</span>
                <span className={`text-[11px] font-semibold ${resolvedFocusThemeAccent.focusBannerSubtext}`}>· Distractions are blocked · Stay in the zone</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scrollable content */}
          <div
            ref={contentRef}
            className={`flex-1 min-h-0 overflow-y-auto ${
              focusMode ? "bg-slate-900/80" : "bg-transparent"
            }`}
          >
            <div className="w-full px-6 py-8 lg:px-10">
              {/* Chapter header */}
              <div className={`mb-8 pb-6 border-b ${focusMode ? "border-slate-700/60" : "border-slate-100"}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${lesson.gradient} shadow-lg`}>
                    <span className="text-2xl">{lesson.emoji}</span>
                  </div>
                  <div>
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${focusMode ? "text-slate-500" : "text-slate-400"}`}>
                      {lesson.subject} · Chapter {activeChapter + 1}
                    </div>
                    <h1 className={`text-2xl font-black ${focusMode ? "text-white" : "text-slate-900"}`}>
                      {chapter.title}
                    </h1>
                  </div>
                </div>
                <div className={`flex flex-wrap items-center gap-3`}>
                  <span className={`flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full border ${difficultyColors[lesson.difficulty]}`}>
                    <Star size={11} strokeWidth={2.5} /> {lesson.difficulty}
                  </span>
                  <span className={`flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full border ${focusMode ? "bg-slate-800 border-slate-600 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                    <Clock size={11} strokeWidth={2.5} /> {chapter.duration} min
                  </span>
                  <span className={`flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full border ${focusMode ? "bg-teal-900/40 border-teal-700 text-teal-400" : "bg-teal-50 border-teal-200 text-teal-700"}`}>
                    <Zap size={11} strokeWidth={2.5} /> +{chapterXP} chapter XP
                  </span>
                </div>
              </div>

              {/* Lesson blocks */}
              <div className={focusMode ? "text-slate-100" : ""}>
                {chapter.content.map((block, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <BlockRenderer block={block} focusMode={focusMode} />
                  </motion.div>
                ))}
              </div>

              {/* Bottom nav */}
              <div className={`mt-12 pt-6 border-t flex items-center justify-between ${focusMode ? "border-slate-700/60" : "border-slate-100"}`}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveChapter(Math.max(0, activeChapter - 1))}
                  disabled={activeChapter === 0}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm transition-all disabled:opacity-30 ${
                    focusMode
                      ? "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 shadow-sm"
                  }`}
                >
                  <ArrowLeft size={16} strokeWidth={2.5} /> Previous
                </motion.button>

                {activeChapter < lesson.chapters.length - 1 ? (
                  <div className="flex items-center gap-2">
                    {!chapterCompleted ? (
                      <motion.button
                        whileHover={{ scale: 1.04, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => void handleCompleteChapter()}
                        disabled={isSavingChapter || !chapterReadyForXP}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all disabled:opacity-60 bg-gradient-to-r from-teal-400 to-emerald-500 text-white shadow-lg`}
                      >
                        {isSavingChapter
                          ? "Saving..."
                          : chapterReadyForXP
                            ? `Complete Chapter (+${chapterXP} XP)`
                            : `Read ${formatReadTime(chapterRemainingSec)} more`}
                      </motion.button>
                    ) : null}

                    <motion.button
                      whileHover={{ scale: 1.04, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setActiveChapter(activeChapter + 1)}
                      disabled={!chapterCompleted}
                      className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all ${
                        chapterCompleted
                          ? `bg-gradient-to-r ${lesson.gradient} text-white shadow-lg`
                          : focusMode
                            ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                            : "bg-slate-200 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      {chapterCompleted ? "Next Chapter" : "Complete chapter first"}
                      <ChevronRight size={16} strokeWidth={2.5} />
                    </motion.button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {!chapterCompleted ? (
                      <motion.button
                        whileHover={{ scale: 1.04, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => void handleCompleteChapter()}
                        disabled={isSavingChapter || !chapterReadyForXP}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm bg-gradient-to-r from-teal-400 to-emerald-500 text-white shadow-lg disabled:opacity-60"
                      >
                        {isSavingChapter
                          ? "Saving..."
                          : chapterReadyForXP
                            ? `Complete Chapter (+${chapterXP} XP)`
                            : `Read ${formatReadTime(chapterRemainingSec)} more`}
                      </motion.button>
                    ) : null}

                    <motion.button
                      whileHover={{ scale: 1.04, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm bg-gradient-to-r from-teal-400 to-green-500 text-white shadow-lg"
                    >
                      <CheckCircle2 size={16} strokeWidth={2.5} />
                      {completedCount >= lesson.chapters.length ? "Lesson Completed" : "Complete all chapters"}
                    </motion.button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT: Tools Panel */}
        <aside
          className={`hidden xl:flex flex-col w-64 shrink-0 border-l p-4 gap-4 ${
            focusMode ? "bg-transparent border-white/10 backdrop-blur-xl" : "backdrop-blur-xl"
          }`}
          style={focusMode ? undefined : themedPanelStyle}
        >
          {/* Quick stats */}
          <div
            className={`rounded-2xl p-4 border ${focusMode ? "bg-white/5 border-white/10" : ""}`}
            style={focusMode ? undefined : themedSoftPanelStyle}
          >
            <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${focusMode ? "text-slate-500" : "text-slate-400"}`}>
              Session
            </p>
            <div className="space-y-3">
                {[
                  { label: "Reading time", value: formatReadTime(readTime), icon: "⏱️" },
                  { label: "Chapters done", value: `${completedCount}/${lesson.chapters.length}`, icon: "📖" },
                  { label: "XP this session", value: `+${sessionXP}`, icon: "⚡" },
                  { label: "Rating", value: `${lesson.rating}★`, icon: "⭐" },
                ].map((s) => (
                <div key={s.label} className={`flex items-center justify-between text-[12px] ${focusMode ? "text-slate-300" : "text-slate-600"}`}>
                  <span className="font-semibold flex items-center gap-1.5">
                    <span>{s.icon}</span>{s.label}
                  </span>
                  <span className="font-black">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key points */}
          <div
            className={`rounded-2xl p-4 border flex-1 ${focusMode ? "bg-white/5 border-white/10" : ""}`}
            style={focusMode ? undefined : themedSoftPanelStyle}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className={focusMode ? "text-sky-400" : "text-sky-500"} strokeWidth={2.5} />
              <p className={`text-[10px] font-black uppercase tracking-widest ${focusMode ? "text-slate-400" : "text-slate-400"}`}>Key Points</p>
            </div>
            <div className="space-y-2">
              {lesson.keyPoints.map((pt, i) => (
                <div
                  key={i}
                  className={`text-[11px] font-semibold p-2.5 rounded-xl border flex items-start gap-2 leading-snug ${
                    focusMode
                      ? "bg-slate-700/60 border-slate-600 text-slate-300"
                      : `${lesson.accentBg} ${lesson.accentBorder} ${lesson.accentText}`
                  }`}
                >
                  <span className="shrink-0 mt-0.5 text-[9px] font-black opacity-60">0{i + 1}</span>
                  {pt}
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setFocusMode(!focusMode)}
              className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                focusMode
                  ? "bg-white/15 text-white border border-white/25 shadow-lg shadow-white/10 hover:bg-white/25"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {focusMode ? <Minimize2 size={15} strokeWidth={2.5} /> : <Maximize2 size={15} strokeWidth={2.5} />}
              {focusMode ? "Exit Focus" : "Focus Mode"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setShowAttentionSetup(true);
                setShowCameraPrompt(false);
                setAttentionActive(true);
              }}
              className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                focusMode
                  ? "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                  : "bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100"
              }`}
            >
              <Brain size={15} strokeWidth={2.5} />
              Smart Attention
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onContinue}
              className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                focusMode
                  ? "bg-gradient-to-r from-emerald-400/90 to-teal-400/90 text-white border border-white/5 shadow-lg"
                  : `bg-gradient-to-r ${lesson.gradient} text-white shadow-md`
              }`}
            >
              <Play size={15} strokeWidth={2.5} fill="currentColor" />
              Continue
            </motion.button>
          </div>
        </aside>
      </div>
    </div>
  );
}
