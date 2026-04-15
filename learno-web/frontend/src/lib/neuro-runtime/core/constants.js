export const DEFAULT_STUDENT_ID = "learner-demo-001";
export const SUPPORT_SCHEMA_VERSION = 2;

export const TRACKED_DOMAINS = [
  "attention",
  "reading",
  "math",
  "sensory",
  "engagement",
];

export const DOMAIN_LABELS = {
  attention: "Attention and executive function",
  reading: "Reading access",
  math: "Math reasoning",
  sensory: "Sensory and classroom comfort",
  engagement: "Learning engagement",
};

export const SUPPORT_LEVEL_LABELS = {
  no_strong_concern: "No strong concern",
  monitor: "Monitor",
  repeated_difficulty_indicator: "Repeated difficulty indicator",
  support_review_recommended: "Support review recommended",
};

export const SUPPORT_LEVEL_BANDS = [
  {
    level: "no_strong_concern",
    min: 0,
    max: 39,
  },
  {
    level: "monitor",
    min: 40,
    max: 59,
  },
  {
    level: "repeated_difficulty_indicator",
    min: 60,
    max: 79,
  },
  {
    level: "support_review_recommended",
    min: 80,
    max: 100,
  },
];

export const ROLE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "support", label: "Support team" },
];

export const THEME_OPTIONS = [
  { value: "adaptive-sanctuary", label: "Adaptive Sanctuary" },
  { value: "adhd-support", label: "ADHD support palette" },
  { value: "autism-support", label: "Autism support palette" },
  { value: "dyslexia-support", label: "Dyslexia support palette" },
  { value: "anxiety-support", label: "Anxiety support palette" },
  { value: "depression-support", label: "Warm encouragement palette" },
];

export const LONGITUDINAL_FUSION_WEIGHTS = {
  current: 0.3,
  recentTrend: 0.4,
  classroomAnalytics: 0.2,
  teacherObservation: 0.1,
};

export const INDICATORS = {
  attention: [
    "repeated attention difficulty indicators",
    "difficulty sustaining performance across structured tasks",
    "difficulty handling multi-step academic instructions",
  ],
  reading: [
    "possible reading-access difficulty",
    "repeated decoding or word-discrimination difficulty",
  ],
  math: [
    "possible math-processing difficulty",
    "repeated difficulty with symbolic numerical tasks",
  ],
  sensory: [
    "repeated sensory discomfort indicators",
    "possible classroom overstimulation",
  ],
  engagement: [
    "repeated disengagement indicators",
    "repeated emotional strain indicators",
  ],
};

export const SUPPORT_ADVISORIES = {
  reading: ["reading support may be beneficial"],
  math: ["guided math support may help"],
  sensory: ["environmental adjustment may help"],
  engagement: ["learner may benefit from additional support"],
};

export const GENERIC_STUDENT_FEEDBACK = {
  attention: [
    "Thanks. This helps personalize your support.",
    "Focus Mode is available for your next activity.",
    "A step-by-step version can be offered next time.",
  ],
  reading: [
    "Thanks. This helps personalize your support.",
    "Audio-supported reading can be offered next time.",
    "Extra guided reading practice is available.",
  ],
  math: [
    "Thanks. This helps personalize your support.",
    "Extra guided practice is available.",
    "Worked examples can be offered next time.",
  ],
  sensory: [
    "Thanks. This helps personalize your support.",
    "A quieter or simpler follow-up can be offered next time.",
    "Comfort settings can be adjusted when needed.",
  ],
  engagement: [
    "Thanks. This helps personalize your support.",
    "A step-by-step version can be offered next time.",
    "Extra explanation can be prepared for the next lesson.",
  ],
};

export const DEFAULT_UI_PREFERENCES = {
  role: "student",
  theme: "adaptive-sanctuary",
  language: "en",
  age: 14,
  schoolCycle: "",
};
