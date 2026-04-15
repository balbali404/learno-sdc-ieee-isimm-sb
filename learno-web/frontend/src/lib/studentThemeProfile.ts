import type { Condition } from "@/lib/themes";

export interface StudentThemeProfile {
  heroTagline: string;
  heroButton: string;
  heroPhrases: readonly string[];
  heroRibbon: string;
  moodPrompt: string;
  moodFeedbackPrefix: string;
  moodTone: "steady" | "calm" | "warm";
  challengeLabel: string;
  focusHint: string;
  pathLabel: string;
  celebrationColors: readonly string[];
}

const baseProfile: StudentThemeProfile = {
  heroTagline: "You are building momentum at your pace.",
  heroButton: "Continue Learning",
  heroPhrases: [
    "Ready for today's learning mission?",
    "Small steps build strong progress.",
    "You are doing better than you think.",
    "Let's make this session count.",
  ],
  heroRibbon: "Balanced Flow",
  moodPrompt: "How are you feeling before you start?",
  moodFeedbackPrefix: "Feeling",
  moodTone: "steady",
  challengeLabel: "Daily Brain Challenge",
  focusHint: "Try one focused block, then pause and reflect.",
  pathLabel: "Learning Path",
  celebrationColors: ["#6FA8DC", "#8FB8E0", "#A7C7E7", "#C2DFF5"],
};

export const studentThemeProfiles: Record<Condition, StudentThemeProfile> = {
  default: baseProfile,
  adhd: {
    heroTagline: "One clear target at a time. We keep the noise low.",
    heroButton: "Start Focus Sprint",
    heroPhrases: [
      "Pick one target and lock in.",
      "Fast start, clean finish.",
      "You only need the next step.",
      "Focus first, then celebrate.",
    ],
    heroRibbon: "Priority Focus",
    moodPrompt: "Energy check before your next focus sprint:",
    moodFeedbackPrefix: "Energy",
    moodTone: "steady",
    challengeLabel: "Focus Anchor Challenge",
    focusHint: "Use a short burst, then a brief reset break.",
    pathLabel: "Focus Path",
    celebrationColors: ["#E67E22", "#F39B45", "#6FA8DC", "#A7C7E7"],
  },
  asd: {
    heroTagline: "A calm, predictable workspace for steady progress.",
    heroButton: "Continue Quietly",
    heroPhrases: [
      "Today follows a clear routine.",
      "Predictable steps support progress.",
      "Your calm pace is a strength.",
      "Structure helps your focus stay steady.",
    ],
    heroRibbon: "Calm Routine",
    moodPrompt: "Comfort check before your session:",
    moodFeedbackPrefix: "Comfort",
    moodTone: "calm",
    challengeLabel: "Calm Practice",
    focusHint: "Stay with one gentle rhythm for this session.",
    pathLabel: "Structured Path",
    celebrationColors: ["#7A9E87", "#A2BFAF", "#C4A882", "#D8DDD8"],
  },
  dyslexia: {
    heroTagline: "Readable spacing and clear hierarchy are now active.",
    heroButton: "Continue Reading",
    heroPhrases: [
      "Clear text, clear thinking.",
      "Read in chunks, then move forward.",
      "Steady pace beats rushed pace.",
      "Understanding matters more than speed.",
    ],
    heroRibbon: "Reading Support",
    moodPrompt: "Reading comfort check for today:",
    moodFeedbackPrefix: "Reading mood",
    moodTone: "steady",
    challengeLabel: "Reading Focus Challenge",
    focusHint: "Use chunked reading and short reflection pauses.",
    pathLabel: "Reading Path",
    celebrationColors: ["#3A9E6A", "#8BBF8A", "#E6C77C", "#B7D8A0"],
  },
  dyscalculia: {
    heroTagline: "Numbers are grouped clearly to reduce overload.",
    heroButton: "Continue Step by Step",
    heroPhrases: [
      "One operation at a time.",
      "Visual grouping helps clarity.",
      "Slow math is smart math.",
      "Pattern first, speed later.",
    ],
    heroRibbon: "Number Clarity",
    moodPrompt: "Number confidence check before practice:",
    moodFeedbackPrefix: "Math mood",
    moodTone: "steady",
    challengeLabel: "Number Clarity Challenge",
    focusHint: "Work in chunks and verify each step calmly.",
    pathLabel: "Numeracy Path",
    celebrationColors: ["#E8905A", "#F3B17F", "#5AAE80", "#F6D4BC"],
  },
  anxiety: {
    heroTagline: "Low-pressure pacing with clear, reassuring guidance.",
    heroButton: "Start Calm Session",
    heroPhrases: [
      "Breathe in, then begin.",
      "Progress without pressure.",
      "You are safe to go slowly.",
      "Gentle consistency wins.",
    ],
    heroRibbon: "Calm Support",
    moodPrompt: "How calm do you feel right now?",
    moodFeedbackPrefix: "Calm level",
    moodTone: "calm",
    challengeLabel: "Gentle Confidence Check",
    focusHint: "Keep this block short and controlled.",
    pathLabel: "Calm Path",
    celebrationColors: ["#7B8FD4", "#A8B4E8", "#C4CCF3", "#E6EAFE"],
  },
  depression: {
    heroTagline: "Warm encouragement and manageable goals for today.",
    heroButton: "Take the Next Step",
    heroPhrases: [
      "One step is enough for now.",
      "Small wins still count.",
      "Show up gently for yourself.",
      "You are moving forward.",
    ],
    heroRibbon: "Warm Support",
    moodPrompt: "How heavy or light does today feel?",
    moodFeedbackPrefix: "Mood",
    moodTone: "warm",
    challengeLabel: "Small-Win Challenge",
    focusHint: "Aim for one achievable task, then rest.",
    pathLabel: "Recovery Path",
    celebrationColors: ["#E8B86D", "#F1CB8D", "#F4A460", "#F7D7A8"],
  },
};

export const getStudentThemeProfile = (condition: Condition): StudentThemeProfile => {
  return studentThemeProfiles[condition] ?? studentThemeProfiles.default;
};
