import type { NeuroConditionCode } from "@prisma/client";

type NeuroRuntimeTemplate = {
  key: string;
  title: string;
  description: string;
  instructionText: string;
  targetCondition: NeuroConditionCode;
  lifecycle: "ACTIVE";
  version: number;
  estimatedMin: number;
  configJson: {
    source: "tests-master";
    runtime: "interactive-screener-v1";
    screenerId: string;
    domain: string;
    attemptPolicy: {
      maxAttempts: number;
      lowScoreThreshold: number;
      retryCooldownDays: number;
    };
  };
  questionSetJson: {
    format: "screener-runtime-v1";
    source: "tests-master";
    screenerId: string;
    version: number;
  };
  scoringJson: {
    engine: "screener-runtime-v1";
    inferredCondition: NeuroConditionCode;
    indicatorKeys: string[];
    anxietySensitivityThreshold?: number;
    depressionSensitivityThreshold?: number;
  };
};

export const DEFAULT_NEURO_TEST_TEMPLATES: NeuroRuntimeTemplate[] = [
  {
    key: "focus-check",
    title: "Focus Check",
    description:
      "CPT-style sustained attention, Go/No-Go inhibition, working-memory sequencing, and multi-step instruction handling.",
    instructionText:
      "Complete the full Focus Check interactive flow. This screener supports classroom planning and is not a medical diagnosis.",
    targetCondition: "ADHD",
    lifecycle: "ACTIVE",
    version: 2,
    estimatedMin: 5,
    configJson: {
      source: "tests-master",
      runtime: "interactive-screener-v1",
      screenerId: "focus-check",
      domain: "attention",
      attemptPolicy: {
        maxAttempts: 3,
        lowScoreThreshold: 60,
        retryCooldownDays: 3,
      },
    },
    questionSetJson: {
      format: "screener-runtime-v1",
      source: "tests-master",
      screenerId: "focus-check",
      version: 2,
    },
    scoringJson: {
      engine: "screener-runtime-v1",
      inferredCondition: "ADHD",
      indicatorKeys: [
        "repeated attention difficulty indicators",
        "difficulty sustaining performance across structured tasks",
        "difficulty handling multi-step academic instructions",
      ],
    },
  },
  {
    key: "reading-support-check",
    title: "Reading Support Check",
    description:
      "Decoding, word recognition, comprehension, sentence reconstruction, and text-only versus audio-supported comparison.",
    instructionText:
      "Complete the full Reading Support Check interactive flow to identify classroom reading-support needs.",
    targetCondition: "DYSLEXIA",
    lifecycle: "ACTIVE",
    version: 2,
    estimatedMin: 5,
    configJson: {
      source: "tests-master",
      runtime: "interactive-screener-v1",
      screenerId: "reading-support-check",
      domain: "reading",
      attemptPolicy: {
        maxAttempts: 3,
        lowScoreThreshold: 60,
        retryCooldownDays: 3,
      },
    },
    questionSetJson: {
      format: "screener-runtime-v1",
      source: "tests-master",
      screenerId: "reading-support-check",
      version: 2,
    },
    scoringJson: {
      engine: "screener-runtime-v1",
      inferredCondition: "DYSLEXIA",
      indicatorKeys: [
        "possible reading-access difficulty",
        "repeated decoding or word-discrimination difficulty",
        "reading support may be beneficial",
      ],
    },
  },
  {
    key: "math-reasoning-check",
    title: "Math Reasoning Check",
    description:
      "Symbolic comparison, number sense, representation matching, sequence logic, and arithmetic fluency.",
    instructionText:
      "Complete the full Math Reasoning Check interactive flow to identify numeracy-support needs.",
    targetCondition: "DYSCALCULIA",
    lifecycle: "ACTIVE",
    version: 2,
    estimatedMin: 5,
    configJson: {
      source: "tests-master",
      runtime: "interactive-screener-v1",
      screenerId: "math-reasoning-check",
      domain: "math",
      attemptPolicy: {
        maxAttempts: 3,
        lowScoreThreshold: 60,
        retryCooldownDays: 3,
      },
    },
    questionSetJson: {
      format: "screener-runtime-v1",
      source: "tests-master",
      screenerId: "math-reasoning-check",
      version: 2,
    },
    scoringJson: {
      engine: "screener-runtime-v1",
      inferredCondition: "DYSCALCULIA",
      indicatorKeys: [
        "possible math-processing difficulty",
        "repeated difficulty with symbolic numerical tasks",
        "guided math support may help",
      ],
    },
  },
  {
    key: "comfort-check",
    title: "Comfort Check",
    description:
      "Private sensory self-report with classroom context matching for noise, light, air, and concentration comfort.",
    instructionText:
      "Complete the full Comfort Check interactive flow to guide sensory and environmental classroom adjustments.",
    targetCondition: "ASD",
    lifecycle: "ACTIVE",
    version: 2,
    estimatedMin: 2,
    configJson: {
      source: "tests-master",
      runtime: "interactive-screener-v1",
      screenerId: "comfort-check",
      domain: "sensory",
      attemptPolicy: {
        maxAttempts: 3,
        lowScoreThreshold: 60,
        retryCooldownDays: 3,
      },
    },
    questionSetJson: {
      format: "screener-runtime-v1",
      source: "tests-master",
      screenerId: "comfort-check",
      version: 2,
    },
    scoringJson: {
      engine: "screener-runtime-v1",
      inferredCondition: "ASD",
      indicatorKeys: [
        "repeated sensory discomfort indicators",
        "possible classroom overstimulation",
        "environmental adjustment may help",
      ],
    },
  },
  {
    key: "learning-reflection",
    title: "Learning Reflection",
    description:
      "School engagement self-report with focus, confidence, difficulty, help-seeking, and mental effort prompts.",
    instructionText:
      "Complete the full Learning Reflection interactive flow to support confidence and engagement planning.",
    targetCondition: "ANXIETY",
    lifecycle: "ACTIVE",
    version: 2,
    estimatedMin: 3,
    configJson: {
      source: "tests-master",
      runtime: "interactive-screener-v1",
      screenerId: "learning-reflection",
      domain: "engagement",
      attemptPolicy: {
        maxAttempts: 3,
        lowScoreThreshold: 60,
        retryCooldownDays: 3,
      },
    },
    questionSetJson: {
      format: "screener-runtime-v1",
      source: "tests-master",
      screenerId: "learning-reflection",
      version: 2,
    },
    scoringJson: {
      engine: "screener-runtime-v1",
      inferredCondition: "ANXIETY",
      indicatorKeys: [
        "repeated disengagement indicators",
        "repeated emotional strain indicators",
        "learner may benefit from additional support",
      ],
      anxietySensitivityThreshold: 64,
      depressionSensitivityThreshold: 76,
    },
  },
];
