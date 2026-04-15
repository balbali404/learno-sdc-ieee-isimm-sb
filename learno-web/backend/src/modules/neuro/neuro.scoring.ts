import type { NeuroConditionCode } from "@prisma/client";

type QuestionEntry = {
  id: string;
  reverse: boolean;
  sectionId: string;
};

type EvaluationInput = {
  testKey: string;
  targetCondition: NeuroConditionCode;
  questionSetJson: unknown;
  scoringJson: unknown;
  answersJson: unknown;
};

type EvaluationResult = {
  score: number;
  inferredCondition: NeuroConditionCode;
  confidence: number;
  analysisJson: Record<string, unknown>;
};

const toObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

const round = (value: number, decimals = 0): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const average = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const isNeuroCondition = (value: unknown): value is NeuroConditionCode => {
  return (
    value === "ADHD" ||
    value === "ASD" ||
    value === "DYSLEXIA" ||
    value === "DYSCALCULIA" ||
    value === "ANXIETY" ||
    value === "DEPRESSION" ||
    value === "DEFAULT"
  );
};

const extractLikertAnswers = (answersJson: unknown): Record<string, number> => {
  const root = toObject(answersJson);
  if (!root) {
    return {};
  }

  const directMap: Record<string, number> = {};
  Object.entries(root).forEach(([key, value]) => {
    if (typeof value === "number") {
      directMap[key] = value;
    }
  });

  const nestedAnswers = toObject(root.answers);
  if (!nestedAnswers) {
    return directMap;
  }

  Object.entries(nestedAnswers).forEach(([key, value]) => {
    if (typeof value === "number") {
      directMap[key] = value;
    }
  });

  return directMap;
};

const getQuestionEntries = (questionSetJson: unknown): {
  questions: QuestionEntry[];
  minValue: number;
  maxValue: number;
} | null => {
  const root = toObject(questionSetJson);
  if (!root) {
    return null;
  }

  const rawSections = root.sections;
  if (!Array.isArray(rawSections)) {
    return null;
  }

  const minValue = typeof root.minValue === "number" ? root.minValue : 0;
  const maxValue = typeof root.maxValue === "number" ? root.maxValue : 4;

  const questions: QuestionEntry[] = [];

  rawSections.forEach((section, sectionIndex) => {
    const sectionObj = toObject(section);
    if (!sectionObj) {
      return;
    }

    const sectionId =
      typeof sectionObj.id === "string" && sectionObj.id.trim().length > 0
        ? sectionObj.id
        : `section-${sectionIndex + 1}`;

    const rawItems = sectionObj.items;
    if (!Array.isArray(rawItems)) {
      return;
    }

    rawItems.forEach((item, itemIndex) => {
      const itemObj = toObject(item);
      if (!itemObj) {
        return;
      }

      const itemId =
        typeof itemObj.id === "string" && itemObj.id.trim().length > 0
          ? itemObj.id
          : `${sectionId}-item-${itemIndex + 1}`;

      questions.push({
        id: itemId,
        reverse: Boolean(itemObj.reverse),
        sectionId,
      });
    });
  });

  if (questions.length === 0) {
    return null;
  }

  return {
    questions,
    minValue,
    maxValue,
  };
};

const getIndicatorKeys = (scoringJson: unknown): string[] => {
  const root = toObject(scoringJson);
  if (!root || !Array.isArray(root.indicatorKeys)) {
    return [];
  }

  return root.indicatorKeys.filter((value): value is string => typeof value === "string");
};

const getSupportLevel = (score: number): "no_strong_concern" | "monitor" | "repeated_difficulty_indicator" | "support_review_recommended" => {
  if (score >= 80) {
    return "support_review_recommended";
  }

  if (score >= 60) {
    return "repeated_difficulty_indicator";
  }

  if (score >= 40) {
    return "monitor";
  }

  return "no_strong_concern";
};

const inferCondition = (input: {
  testKey: string;
  defaultCondition: NeuroConditionCode;
  score: number;
  sectionScores: Record<string, number>;
  scoringJson: unknown;
}): NeuroConditionCode => {
  const { testKey, defaultCondition, score, sectionScores, scoringJson } = input;

  if (score < 45) {
    return "DEFAULT";
  }

  if (testKey === "learning-reflection") {
    const scoringRoot = toObject(scoringJson);
    const anxietyThreshold =
      typeof scoringRoot?.anxietySensitivityThreshold === "number"
        ? scoringRoot.anxietySensitivityThreshold
        : 64;
    const depressionThreshold =
      typeof scoringRoot?.depressionSensitivityThreshold === "number"
        ? scoringRoot.depressionSensitivityThreshold
        : 76;

    const focusConfidence = sectionScores["focus-and-confidence"] ?? score;
    const effortDifficulty = sectionScores["difficulty-and-effort"] ?? score;
    const supportReadiness = sectionScores["support-readiness"] ?? score;

    const depressionBlend = round((effortDifficulty * 0.55 + supportReadiness * 0.45), 1);
    const anxietyBlend = round((focusConfidence * 0.65 + effortDifficulty * 0.35), 1);

    if (depressionBlend >= depressionThreshold && effortDifficulty >= anxietyBlend) {
      return "DEPRESSION";
    }

    if (anxietyBlend >= anxietyThreshold) {
      return "ANXIETY";
    }

    return "DEFAULT";
  }

  return defaultCondition;
};

const resolveDefaultCondition = (
  scoringJson: unknown,
  targetCondition: NeuroConditionCode,
): NeuroConditionCode => {
  const root = toObject(scoringJson);
  if (root && isNeuroCondition(root.inferredCondition)) {
    return root.inferredCondition;
  }

  return targetCondition;
};

export const evaluateNeuroAttempt = (input: EvaluationInput): EvaluationResult | null => {
  const parsedQuestionSet = getQuestionEntries(input.questionSetJson);
  if (!parsedQuestionSet) {
    return null;
  }

  const answers = extractLikertAnswers(input.answersJson);
  const answerRange = Math.max(1, parsedQuestionSet.maxValue - parsedQuestionSet.minValue);

  const answeredQuestions: Array<{
    id: string;
    sectionId: string;
    normalized: number;
  }> = [];

  parsedQuestionSet.questions.forEach((question) => {
    const raw = answers[question.id];
    if (!Number.isFinite(raw)) {
      return;
    }

    const bounded = clamp(raw, parsedQuestionSet.minValue, parsedQuestionSet.maxValue);
    const adjusted = question.reverse
      ? parsedQuestionSet.maxValue + parsedQuestionSet.minValue - bounded
      : bounded;
    const normalized = ((adjusted - parsedQuestionSet.minValue) / answerRange) * 100;

    answeredQuestions.push({
      id: question.id,
      sectionId: question.sectionId,
      normalized,
    });
  });

  if (answeredQuestions.length === 0) {
    return null;
  }

  const sectionBuckets = new Map<string, number[]>();
  answeredQuestions.forEach((entry) => {
    const current = sectionBuckets.get(entry.sectionId) ?? [];
    current.push(entry.normalized);
    sectionBuckets.set(entry.sectionId, current);
  });

  const sectionScores = Object.fromEntries(
    Array.from(sectionBuckets.entries()).map(([sectionId, values]) => [
      sectionId,
      round(average(values), 1),
    ]),
  ) as Record<string, number>;

  const finalScore = round(
    average(answeredQuestions.map((entry) => entry.normalized)),
    1,
  );

  const supportLevel = getSupportLevel(finalScore);
  const indicatorKeys = getIndicatorKeys(input.scoringJson);
  const topSection = Math.max(...Object.values(sectionScores));

  const indicators = Array.from(
    new Set(
      indicatorKeys.filter((key, index) => {
        if (index === 0) {
          return finalScore >= 60;
        }

        if (index === 1) {
          return topSection >= 65;
        }

        return finalScore >= 70 || topSection >= 72;
      }),
    ),
  );

  const defaultCondition = resolveDefaultCondition(input.scoringJson, input.targetCondition);
  const inferredCondition = inferCondition({
    testKey: input.testKey,
    defaultCondition,
    score: finalScore,
    sectionScores,
    scoringJson: input.scoringJson,
  });

  const completionRatio = clamp(
    answeredQuestions.length / parsedQuestionSet.questions.length,
    0,
    1,
  );
  const confidence = round(
    clamp(completionRatio * 0.7 + Math.abs(finalScore - 50) / 50 * 0.3, 0, 1),
    2,
  );

  const recommendation =
    supportLevel === "support_review_recommended"
      ? "Teacher review is recommended with targeted support planning."
      : supportLevel === "repeated_difficulty_indicator"
        ? "Monitor repeated patterns and consider assigning reinforcement support."
        : supportLevel === "monitor"
          ? "Light monitoring is advised for upcoming sessions."
          : "No strong support signal currently detected.";

  return {
    score: finalScore,
    inferredCondition,
    confidence,
    analysisJson: {
      engine: "support-likert-v1",
      supportLevel,
      indicators,
      sectionScores,
      answeredQuestions: answeredQuestions.length,
      totalQuestions: parsedQuestionSet.questions.length,
      completionRatio: round(completionRatio, 2),
      recommendation,
    },
  };
};
