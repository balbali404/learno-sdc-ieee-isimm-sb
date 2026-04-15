export interface SubjectVisual {
  emoji: string;
  gradient: string;
  cardGradient: string;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  barColor: string;
  badgeColor: string;
  coverImage: string;
}

const SUBJECT_VISUALS: Record<string, SubjectVisual> = {
  biology: {
    emoji: "🧬",
    gradient: "from-teal-400 to-emerald-500",
    cardGradient: "from-teal-50 to-emerald-50",
    accentBg: "bg-teal-100",
    accentText: "text-teal-700",
    accentBorder: "border-teal-200",
    barColor: "bg-teal-500",
    badgeColor: "bg-teal-50 text-teal-700",
    coverImage: "/student/covers/biology.svg",
  },
  mathematics: {
    emoji: "📐",
    gradient: "from-sky-400 to-blue-500",
    cardGradient: "from-sky-50 to-blue-50",
    accentBg: "bg-sky-100",
    accentText: "text-sky-700",
    accentBorder: "border-sky-200",
    barColor: "bg-blue-500",
    badgeColor: "bg-blue-50 text-blue-700",
    coverImage: "/student/covers/mathematics.svg",
  },
  history: {
    emoji: "📜",
    gradient: "from-amber-400 to-orange-500",
    cardGradient: "from-amber-50 to-orange-50",
    accentBg: "bg-amber-100",
    accentText: "text-amber-700",
    accentBorder: "border-amber-200",
    barColor: "bg-amber-500",
    badgeColor: "bg-amber-50 text-amber-700",
    coverImage: "/student/covers/history.svg",
  },
  physics: {
    emoji: "⚡",
    gradient: "from-violet-500 to-purple-600",
    cardGradient: "from-violet-50 to-purple-50",
    accentBg: "bg-violet-100",
    accentText: "text-violet-700",
    accentBorder: "border-violet-200",
    barColor: "bg-violet-500",
    badgeColor: "bg-violet-50 text-violet-700",
    coverImage: "/student/covers/physics.svg",
  },
  english: {
    emoji: "📖",
    gradient: "from-rose-400 to-pink-500",
    cardGradient: "from-rose-50 to-pink-50",
    accentBg: "bg-rose-100",
    accentText: "text-rose-700",
    accentBorder: "border-rose-200",
    barColor: "bg-rose-500",
    badgeColor: "bg-rose-50 text-rose-700",
    coverImage: "/student/covers/english.svg",
  },
  general: {
    emoji: "📘",
    gradient: "from-slate-500 to-slate-700",
    cardGradient: "from-slate-50 to-slate-100",
    accentBg: "bg-slate-100",
    accentText: "text-slate-700",
    accentBorder: "border-slate-200",
    barColor: "bg-slate-500",
    badgeColor: "bg-slate-50 text-slate-700",
    coverImage: "/student/covers/general.svg",
  },
};

export function getSubjectVisual(subject?: string | null): SubjectVisual {
  const normalized = (subject ?? "").toLowerCase();

  if (normalized.includes("bio")) {
    return SUBJECT_VISUALS.biology;
  }
  if (normalized.includes("math")) {
    return SUBJECT_VISUALS.mathematics;
  }
  if (normalized.includes("hist")) {
    return SUBJECT_VISUALS.history;
  }
  if (normalized.includes("phys")) {
    return SUBJECT_VISUALS.physics;
  }
  if (normalized.includes("eng")) {
    return SUBJECT_VISUALS.english;
  }

  return SUBJECT_VISUALS.general;
}
