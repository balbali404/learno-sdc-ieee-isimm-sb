import { SCREENER_MAP } from "@/lib/neuro-runtime/screeners/index.js";

export type NeuroRuntimeSupportLevel =
  | "no_strong_concern"
  | "monitor"
  | "repeated_difficulty_indicator"
  | "support_review_recommended";

export type NeuroRuntimeConditionCode =
  | "ADHD"
  | "ASD"
  | "DYSLEXIA"
  | "DYSCALCULIA"
  | "ANXIETY"
  | "DEPRESSION"
  | "DEFAULT";

export type NeuroRuntimeTaskMeta = {
  label: string;
  text: string;
  percent: number;
};

export type NeuroRuntimeInterpretation = {
  rawMetrics?: Record<string, unknown>;
  subScores?: Record<string, unknown>;
  finalScore: number;
  indicators?: string[];
  contextSignals?: Record<string, unknown>;
  studentSafeFeedback?: string[];
  teacherMetrics?: Record<string, unknown>;
  blueprintMeta?: Record<string, unknown>;
};

export type NeuroRuntimeSession = {
  stepIndex: number;
  language?: string;
  rtl?: boolean;
  blueprintMeta?: Record<string, unknown>;
  goNoGo?: {
    timeouts?: {
      hide?: number | null;
      advance?: number | null;
    };
  };
  memory?: {
    memorizeTimeout?: number | null;
    countdownInterval?: number | null;
  };
};

export type NeuroRuntimeHelpers = {
  update: () => void;
  softUpdate: () => void;
  next: () => void;
  complete: () => void;
  cancelToHome: () => void;
  announce: (message: string) => void;
  isPaused: () => boolean;
  bindKey: (keys: string[], handler: () => void) => void;
};

export type NeuroRuntimeScreener = {
  id: string;
  name: string;
  studentSafeName: string;
  domain: string;
  createSession: (options?: {
    level?: string;
    age?: number;
    language?: string;
    seed?: number;
    recentHistory?: Array<Record<string, unknown>>;
  }) => NeuroRuntimeSession;
  getTaskMeta: (session: NeuroRuntimeSession) => NeuroRuntimeTaskMeta;
  render: (
    session: NeuroRuntimeSession,
    slot: HTMLElement,
    helpers: NeuroRuntimeHelpers,
  ) => void;
  finalize: (
    session: NeuroRuntimeSession,
    contextBundle?: unknown,
    profile?: unknown,
  ) => NeuroRuntimeInterpretation;
  onPause?: (session: NeuroRuntimeSession) => void;
  onResume?: (session: NeuroRuntimeSession, helpers: NeuroRuntimeHelpers) => void;
};

type RuntimeScreenerMap = Record<string, NeuroRuntimeScreener>;

const RUNTIME_SCREENER_MAP = SCREENER_MAP as RuntimeScreenerMap;

const DEFAULT_CONDITION_BY_KEY: Record<string, NeuroRuntimeConditionCode> = {
  "focus-check": "ADHD",
  "reading-support-check": "DYSLEXIA",
  "math-reasoning-check": "DYSCALCULIA",
  "comfort-check": "ASD",
  "learning-reflection": "ANXIETY",
};

const clampScore = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
};

export const getRuntimeScreener = (
  testKey: string | null | undefined,
): NeuroRuntimeScreener | null => {
  if (!testKey) {
    return null;
  }

  return RUNTIME_SCREENER_MAP[testKey] ?? null;
};

export const isRuntimeScreenerKey = (testKey: string | null | undefined): boolean => {
  return Boolean(getRuntimeScreener(testKey));
};

export const getRuntimeSupportLevel = (
  score: number,
): NeuroRuntimeSupportLevel => {
  const normalized = clampScore(score);

  if (normalized >= 80) {
    return "support_review_recommended";
  }
  if (normalized >= 60) {
    return "repeated_difficulty_indicator";
  }
  if (normalized >= 40) {
    return "monitor";
  }

  return "no_strong_concern";
};

export const inferConditionFromRuntime = (input: {
  testKey: string;
  score: number;
  interpretation?: NeuroRuntimeInterpretation | null;
}): NeuroRuntimeConditionCode => {
  const { testKey, score, interpretation } = input;
  const normalizedScore = clampScore(score);

  if (normalizedScore < 45) {
    return "DEFAULT";
  }

  if (testKey === "learning-reflection") {
    const confidencePattern = Number(interpretation?.subScores?.confidence_pattern_score ?? 0);
    const overwhelm = Number(interpretation?.subScores?.difficulty_overwhelm_score ?? 0);
    const supportRequest = Number(interpretation?.subScores?.support_request_score ?? 0);

    const depressionBlend = overwhelm * 0.55 + supportRequest * 0.45;
    const anxietyBlend = confidencePattern * 0.65 + overwhelm * 0.35;

    if (depressionBlend >= 76 && overwhelm >= anxietyBlend) {
      return "DEPRESSION";
    }
    if (anxietyBlend >= 64) {
      return "ANXIETY";
    }

    return "DEFAULT";
  }

  return DEFAULT_CONDITION_BY_KEY[testKey] ?? "DEFAULT";
};

export const estimateRuntimeConfidence = (input: {
  score: number;
  completedSteps: number;
  totalSteps: number;
}): number => {
  const completionRatio =
    input.totalSteps > 0
      ? Math.max(0, Math.min(1, input.completedSteps / input.totalSteps))
      : 0;
  const distanceFromCenter = Math.abs(clampScore(input.score) - 50) / 50;
  const confidence = completionRatio * 0.7 + distanceFromCenter * 0.3;

  return Math.round(Math.max(0, Math.min(1, confidence)) * 100) / 100;
};

export type NeuroRuntimeQuestionAnalytics = {
  id: string;
  prompt: string;
  expected?: string | number | null;
  selected?: string | number | null;
  correct?: boolean | null;
  skipped?: boolean;
  durationMs?: number | null;
  attempts?: number | null;
  details?: Record<string, unknown>;
};

export type NeuroRuntimeTaskAnalytics = {
  taskId: string;
  title: string;
  questions: NeuroRuntimeQuestionAnalytics[];
  summary?: Record<string, unknown>;
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
};

const asArray = <T>(value: unknown): T[] => {
  return Array.isArray(value) ? (value as T[]) : [];
};

const getRuntimeSet = (value: unknown): Set<string> => {
  if (value instanceof Set) {
    return new Set(Array.from(value).map((entry) => String(entry)));
  }

  if (Array.isArray(value)) {
    return new Set(value.map((entry) => String(entry)));
  }

  return new Set<string>();
};

const getResponseByIndex = <T>(responses: T[], index: number): T | null => {
  if (index < 0 || index >= responses.length) {
    return null;
  }

  return responses[index] ?? null;
};

const buildFocusTaskAnalytics = (session: NeuroRuntimeSession): NeuroRuntimeTaskAnalytics[] => {
  const source = session as unknown as Record<string, unknown>;
  const content = asRecord(source.content);

  const selective = asRecord(source.selective);
  const selectiveItems = asArray<Record<string, unknown>>(
    asRecord(content.selective).items ?? selective.terms,
  );
  const selectiveSelections = getRuntimeSet(selective.selections);

  const goNoGo = asRecord(source.goNoGo);
  const goNoGoTrials = asArray<Record<string, unknown>>(goNoGo.trials);

  const memory = asRecord(source.memory);
  const memorySequence = asArray<string>(memory.sequence);
  const memoryAnswer = asArray<string>(memory.answer);

  const multistep = asRecord(source.multistep);
  const scenario = asRecord(multistep.scenario);
  const mainIdeaOptions = asArray<Record<string, unknown>>(scenario.mainIdeaOptions);
  const orderOptions = asArray<Record<string, unknown>>(scenario.order);
  const titleOptions = asArray<Record<string, unknown>>(scenario.titleOptions);
  const selectedOrder = asArray<string>(multistep.order);

  return [
    {
      taskId: "selective-attention",
      title: "Selective Attention",
      summary: {
        selectedCount: selectiveSelections.size,
        totalItems: selectiveItems.length,
      },
      questions: selectiveItems.map((item, index) => {
        const id = String(item.id ?? `selective-${index + 1}`);
        const isTarget = Boolean(item.isTarget);

        return {
          id,
          prompt: String(item.label ?? `Term ${index + 1}`),
          expected: isTarget ? "Select target" : "Skip non-target",
          selected: selectiveSelections.has(id) ? "selected" : "not_selected",
          correct: selectiveSelections.has(id) === isTarget,
        };
      }),
    },
    {
      taskId: "go-no-go",
      title: "Go / No-Go",
      summary: {
        trials: goNoGoTrials.length,
      },
      questions: goNoGoTrials.map((trial, index) => ({
        id: `gng-${index + 1}`,
        prompt: `Stimulus ${String(trial.stimulus ?? "")}`,
        expected: Boolean(trial.is_target) ? "respond" : "do_not_respond",
        selected: Boolean(trial.responded) ? "responded" : "no_response",
        correct: typeof trial.correct === "boolean" ? trial.correct : null,
        durationMs:
          typeof trial.reaction_time_ms === "number" ? Number(trial.reaction_time_ms) : null,
      })),
    },
    {
      taskId: "working-memory-sequence",
      title: "Working Memory Sequence",
      summary: {
        retries: typeof memory.retries === "number" ? memory.retries : 0,
      },
      questions: memorySequence.map((expectedStep, index) => {
        const selectedStep = memoryAnswer[index] ?? null;
        return {
          id: `memory-${index + 1}`,
          prompt: `Step ${index + 1}`,
          expected: expectedStep,
          selected: selectedStep,
          correct: selectedStep === expectedStep,
        };
      }),
    },
    {
      taskId: "multi-step-instruction",
      title: "Multi-step Instruction",
      summary: {
        restarts: typeof multistep.restarts === "number" ? multistep.restarts : 0,
        outOfSequenceAttempts:
          typeof multistep.outOfSequenceAttempts === "number"
            ? multistep.outOfSequenceAttempts
            : 0,
      },
      questions: [
        {
          id: "multistep-main-idea",
          prompt: "Choose main idea",
          expected:
            String(mainIdeaOptions.find((option) => Boolean(option.isCorrect))?.id ?? "unknown"),
          selected:
            typeof multistep.mainIdea === "string" ? multistep.mainIdea : null,
          correct: Boolean(
            mainIdeaOptions.find(
              (option) =>
                option.id === multistep.mainIdea &&
                Boolean(option.isCorrect),
            ),
          ),
        },
        ...orderOptions.map((step, index) => {
          const expected = String(step.id ?? `step-${index + 1}`);
          const selected = selectedOrder[index] ?? null;

          return {
            id: `multistep-order-${index + 1}`,
            prompt: `Order step ${index + 1}`,
            expected,
            selected,
            correct: selected === expected,
          };
        }),
        {
          id: "multistep-title",
          prompt: "Choose best title",
          expected:
            String(titleOptions.find((option) => Boolean(option.isCorrect))?.id ?? "unknown"),
          selected: typeof multistep.title === "string" ? multistep.title : null,
          correct: Boolean(
            titleOptions.find(
              (option) =>
                option.id === multistep.title &&
                Boolean(option.isCorrect),
            ),
          ),
        },
      ],
    },
  ];
};

const buildReadingTaskAnalytics = (session: NeuroRuntimeSession): NeuroRuntimeTaskAnalytics[] => {
  const source = session as unknown as Record<string, unknown>;
  const content = asRecord(source.content);

  const word = asRecord(source.word);
  const wordItems = asArray<Record<string, unknown>>(asRecord(content.word).items ?? word.items);
  const wordResponses = asArray<Record<string, unknown>>(word.responses);

  const passage = asRecord(source.passage);
  const passageQuestions = asArray<Record<string, unknown>>(
    asRecord(content.passage).questions ?? passage.questions,
  );
  const passageAnswers = asArray<Record<string, unknown>>(passage.answers);

  const reconstruction = asRecord(source.reconstruction);
  const reconstructionWords = asArray<string>(reconstruction.words);
  const reconstructionAnswer = asArray<string>(reconstruction.answer);

  const modality = asRecord(source.modality);
  const modalityContent = asRecord(content.modality);
  const textOnly = asRecord(modalityContent.textOnly);
  const textQuestion = asRecord(textOnly.question);
  const audioSupported = asRecord(modalityContent.audioSupported);
  const audioQuestion = asRecord(audioSupported.question);

  return [
    {
      taskId: "word-discrimination",
      title: "Word Discrimination",
      summary: {
        retries: typeof word.retries === "number" ? word.retries : 0,
      },
      questions: wordItems.map((item, index) => {
        const itemId = String(item.id ?? `word-${index + 1}`);
        const response =
          wordResponses.find((entry) => entry.item_id === itemId) ??
          getResponseByIndex(wordResponses, index);

        return {
          id: itemId,
          prompt: String(item.sentence ?? `Word item ${index + 1}`),
          expected: String(item.correct ?? ""),
          selected:
            typeof response?.selected === "string" ? response.selected : null,
          correct:
            typeof response?.correct === "boolean" ? response.correct : null,
          durationMs:
            typeof response?.hesitation_ms === "number"
              ? response.hesitation_ms
              : null,
          attempts:
            typeof response?.attempts === "number" ? response.attempts : null,
        };
      }),
    },
    {
      taskId: "passage-comprehension",
      title: "Passage Comprehension",
      summary: {
        skipped: typeof passage.skipped === "number" ? passage.skipped : 0,
      },
      questions: passageQuestions.map((question, index) => {
        const response = getResponseByIndex(passageAnswers, index);
        return {
          id: `passage-${index + 1}`,
          prompt: String(question.prompt ?? `Passage question ${index + 1}`),
          expected: String(question.correct ?? ""),
          selected:
            typeof response?.selected === "string" ? response.selected : null,
          correct:
            typeof response?.correct === "boolean" ? response.correct : null,
          skipped: Boolean(response?.skipped),
          durationMs:
            typeof response?.time_ms === "number" ? response.time_ms : null,
        };
      }),
    },
    {
      taskId: "sentence-reconstruction",
      title: "Sentence Reconstruction",
      summary: {
        retries:
          typeof reconstruction.retries === "number" ? reconstruction.retries : 0,
        moves: typeof reconstruction.moves === "number" ? reconstruction.moves : 0,
      },
      questions: reconstructionWords.map((wordExpected, index) => {
        const selectedWord = reconstructionAnswer[index] ?? null;
        return {
          id: `reconstruction-${index + 1}`,
          prompt: `Sentence position ${index + 1}`,
          expected: wordExpected,
          selected: selectedWord,
          correct: selectedWord === wordExpected,
        };
      }),
    },
    {
      taskId: "modality-comparison",
      title: "Text vs Audio",
      summary: {
        audioPlayed: Boolean(modality.audioPlayed),
      },
      questions: [
        {
          id: "modality-text-only",
          prompt: String(textQuestion.prompt ?? "Text-only question"),
          expected: String(textQuestion.correct ?? ""),
          selected:
            typeof modality.textSelected === "string" ? modality.textSelected : null,
          correct:
            typeof modality.textScore === "number"
              ? modality.textScore >= 100
              : null,
          durationMs:
            typeof modality.textTimeMs === "number" ? modality.textTimeMs : null,
        },
        {
          id: "modality-audio-supported",
          prompt: String(audioQuestion.prompt ?? "Audio-supported question"),
          expected: String(audioQuestion.correct ?? ""),
          selected:
            typeof modality.audioSelected === "string" ? modality.audioSelected : null,
          correct:
            typeof modality.audioScore === "number"
              ? modality.audioScore >= 100
              : null,
          durationMs:
            typeof modality.audioTimeMs === "number" ? modality.audioTimeMs : null,
        },
      ],
    },
  ];
};

const buildMathTaskAnalytics = (session: NeuroRuntimeSession): NeuroRuntimeTaskAnalytics[] => {
  const source = session as unknown as Record<string, unknown>;
  const content = asRecord(source.content);

  const comparison = asRecord(source.comparison);
  const comparisonItems = asArray<Record<string, unknown>>(
    asRecord(content.comparison).items ?? comparison.items,
  );
  const comparisonResponses = asArray<Record<string, unknown>>(comparison.responses);

  const representation = asRecord(source.representation);
  const representationItems = asArray<Record<string, unknown>>(
    asRecord(content.representation).items ?? representation.items,
  );
  const representationResponses = asArray<Record<string, unknown>>(representation.responses);

  const sequence = asRecord(source.sequence);
  const sequenceItems = asArray<Record<string, unknown>>(
    asRecord(content.sequence).items ?? sequence.items,
  );
  const sequenceResponses = asArray<Record<string, unknown>>(sequence.responses);

  const fluency = asRecord(source.fluency);
  const fluencyItems = asArray<Record<string, unknown>>(
    asRecord(content.fluency).items ?? fluency.items,
  );
  const fluencyResponses = asArray<Record<string, unknown>>(fluency.responses);

  const mapChoiceItems = (
    taskId: string,
    title: string,
    items: Array<Record<string, unknown>>,
    responses: Array<Record<string, unknown>>,
  ): NeuroRuntimeTaskAnalytics => ({
    taskId,
    title,
    questions: items.map((item, index) => {
      const response = getResponseByIndex(responses, index);
      return {
        id: `${taskId}-${index + 1}`,
        prompt: String(item.prompt ?? `${title} item ${index + 1}`),
        expected: String(item.correct ?? ""),
        selected:
          typeof response?.selected === "string" ? response.selected : null,
        correct:
          typeof response?.correct === "boolean" ? response.correct : null,
        skipped: Boolean(response?.skipped),
        durationMs:
          typeof response?.time_ms === "number" ? response.time_ms : null,
      };
    }),
  });

  return [
    mapChoiceItems("value-comparison", "Value Comparison", comparisonItems, comparisonResponses),
    mapChoiceItems(
      "representation-matching",
      "Representation Matching",
      representationItems,
      representationResponses,
    ),
    mapChoiceItems("sequence-logic", "Sequence Logic", sequenceItems, sequenceResponses),
    {
      ...mapChoiceItems("fluency", "Mental Fluency", fluencyItems, fluencyResponses),
      summary: {
        skipped: typeof fluency.skipped === "number" ? fluency.skipped : 0,
      },
    },
  ];
};

const buildComfortTaskAnalytics = (session: NeuroRuntimeSession): NeuroRuntimeTaskAnalytics[] => {
  const source = session as unknown as Record<string, unknown>;
  const content = asRecord(source.content);
  const prompts = asRecord(source.prompts);

  const keys = ["noise", "light", "air", "concentration"];
  const questions: NeuroRuntimeQuestionAnalytics[] = keys.map((key) => {
    const promptState = asRecord(prompts[key]);
    const promptContent = asRecord(content[key]);

    return {
      id: `comfort-${key}`,
      prompt: String(promptContent.title ?? key),
      selected:
        typeof promptState.value === "number" ? promptState.value : null,
      details:
        key === "concentration"
          ? {
              supportPreference:
                typeof promptState.supportPreference === "string"
                  ? promptState.supportPreference
                  : null,
            }
          : undefined,
    };
  });

  return [
    {
      taskId: "comfort-prompts",
      title: "Comfort Prompts",
      questions,
    },
  ];
};

const buildReflectionTaskAnalytics = (session: NeuroRuntimeSession): NeuroRuntimeTaskAnalytics[] => {
  const source = session as unknown as Record<string, unknown>;
  const content = asRecord(source.content);
  const prompts = asRecord(source.prompts);

  const keys = ["focus", "confidence", "difficulty", "support", "effort"];
  const questions: NeuroRuntimeQuestionAnalytics[] = keys.map((key) => {
    const promptState = asRecord(prompts[key]);
    const promptContent = asRecord(content[key]);

    return {
      id: `reflection-${key}`,
      prompt: String(promptContent.title ?? key),
      selected:
        typeof promptState.value === "number" || typeof promptState.value === "string"
          ? (promptState.value as string | number)
          : null,
    };
  });

  return [
    {
      taskId: "learning-reflection-prompts",
      title: "Learning Reflection",
      questions,
    },
  ];
};

export const buildRuntimeTaskAnalytics = (input: {
  screenerId: string;
  session: NeuroRuntimeSession;
}): NeuroRuntimeTaskAnalytics[] => {
  const { screenerId, session } = input;

  if (screenerId === "focus-check") {
    return buildFocusTaskAnalytics(session);
  }
  if (screenerId === "reading-support-check") {
    return buildReadingTaskAnalytics(session);
  }
  if (screenerId === "math-reasoning-check") {
    return buildMathTaskAnalytics(session);
  }
  if (screenerId === "comfort-check") {
    return buildComfortTaskAnalytics(session);
  }
  if (screenerId === "learning-reflection") {
    return buildReflectionTaskAnalytics(session);
  }

  return [];
};

export const cleanupRuntimeSession = (session: NeuroRuntimeSession | null): void => {
  if (!session) {
    return;
  }

  if (typeof window !== "undefined") {
    const hideTimer = session.goNoGo?.timeouts?.hide;
    const advanceTimer = session.goNoGo?.timeouts?.advance;
    if (typeof hideTimer === "number") {
      window.clearTimeout(hideTimer);
    }
    if (typeof advanceTimer === "number") {
      window.clearTimeout(advanceTimer);
    }

    const memorizeTimer = session.memory?.memorizeTimeout;
    const countdownInterval = session.memory?.countdownInterval;
    if (typeof memorizeTimer === "number") {
      window.clearTimeout(memorizeTimer);
    }
    if (typeof countdownInterval === "number") {
      window.clearInterval(countdownInterval);
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
};
