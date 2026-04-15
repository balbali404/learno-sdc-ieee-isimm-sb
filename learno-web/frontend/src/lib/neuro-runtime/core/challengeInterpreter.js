/**
 * js/core/challengeInterpreter.js
 *
 * Phase-2 challenge-level combination interpreter.
 *
 * Maps multiple screener results onto one of 7 defined learning-challenge
 * profiles.  Outputs are SUPPORT INTERPRETATIONS ONLY — not diagnoses.
 *
 * Official challenge → screener mapping
 * ─────────────────────────────────────
 * ADHD / attention regulation     → Primary: Focus (A),      Secondary: Reflection (E)
 * Executive-function difficulty   → Primary: Focus (A),      Secondary: Reflection (E)
 * Reading difficulty (dyslexia)   → Primary: Reading (B)
 * Math difficulty (dyscalculia)   → Primary: Math (C)
 * Sensory/environmental (autism)  → Primary: Comfort (D),    Secondary: Focus (A), Reflection (E)
 * Anxiety affecting learning      → Primary: Reflection (E), Secondary: Comfort (D)
 * Depression affecting learning   → Primary: Reflection (E)
 *
 * Ethics rule: no diagnostic language in any output field.
 */

// ---------------------------------------------------------------------------
// Support-level thresholds
// ---------------------------------------------------------------------------

/** Score at or above this value is treated as "elevated" for a screener. */
const ELEVATED_THRESHOLD = 60;

/** Score at or above this value is treated as "high" for a screener. */
const HIGH_THRESHOLD = 80;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if a finalScore value indicates elevated difficulty.
 * @param {number|null|undefined} score
 */
function isElevated(score) {
  return typeof score === "number" && score >= ELEVATED_THRESHOLD;
}

/**
 * Returns true if a finalScore value indicates high/strong difficulty.
 * @param {number|null|undefined} score
 */
function isHigh(score) {
  return typeof score === "number" && score >= HIGH_THRESHOLD;
}

/**
 * Determines whether repeated sessions have been observed.
 * Inspects the optional history array for the given domain.
 *
 * @param {Array|null|undefined} history  - Array of prior signal objects
 * @param {string} domain                 - Domain string (e.g. "attention")
 * @returns {boolean}
 */
function hasRepeatedSignal(history, domain) {
  if (!Array.isArray(history) || history.length === 0) return false;
  const domainSignals = history.filter(
    (entry) =>
      entry &&
      entry.domain === domain &&
      typeof entry.final_score === "number" &&
      entry.final_score >= ELEVATED_THRESHOLD
  );
  return domainSignals.length >= 2;
}

/**
 * Derive a supportLevel label from primary and optional secondary scores.
 *
 * Rules (applied in order):
 *  1. primary >= 80 AND secondary (if provided) >= 60  → "strong_support_signal"
 *  2. primary >= 80                                    → "elevated_primary_signal"
 *  3. primary >= 60 AND secondary (if provided) >= 60  → "moderate_combined_signal"
 *  4. primary >= 60                                    → "moderate_primary_signal"
 *  5. otherwise                                        → "no_strong_signal"
 *
 * @param {number|null|undefined} primaryScore
 * @param {number|null|undefined} secondaryScore  (pass null to skip)
 * @returns {string}
 */
function deriveSupportLevel(primaryScore, secondaryScore = null) {
  const hasPrimary = typeof primaryScore === "number";
  const hasSecondary = typeof secondaryScore === "number";

  if (hasPrimary && isHigh(primaryScore) && hasSecondary && isElevated(secondaryScore)) {
    return "strong_support_signal";
  }
  if (hasPrimary && isHigh(primaryScore)) {
    return "elevated_primary_signal";
  }
  if (hasPrimary && isElevated(primaryScore) && hasSecondary && isElevated(secondaryScore)) {
    return "moderate_combined_signal";
  }
  if (hasPrimary && isElevated(primaryScore)) {
    return "moderate_primary_signal";
  }
  return "no_strong_signal";
}

// ---------------------------------------------------------------------------
// Challenge definitions
// ---------------------------------------------------------------------------

/**
 * Each entry describes one recognised challenge profile.
 *
 * domain fields map to screener finalScore inputs:
 *   focusResult.finalScore       → attention domain
 *   readingResult.finalScore     → reading domain
 *   mathResult.finalScore        → math domain
 *   comfortResult.finalScore     → sensory domain
 *   reflectionResult.finalScore  → engagement domain
 */
const CHALLENGE_DEFINITIONS = {
  "adhd-attention": {
    label: "Attention and self-regulation patterns",
    primaryDomain: "attention",
    primaryKey: "focusResult",
    secondaryDomain: "engagement",
    secondaryKey: "reflectionResult",
    studentSafeSummaryTemplate(level) {
      if (level === "no_strong_signal") {
        return "Your responses suggest no strong pattern in this area right now. Keep checking in — it helps build a picture over time.";
      }
      return "Some patterns in your focus and self-reflection responses may benefit from support. A member of the team can look at ways to help.";
    },
    teacherSummaryTemplate(level, repeated) {
      const base =
        level === "no_strong_signal"
          ? "No strong combined signal from Focus and Reflection screeners at this time."
          : "Focus screener and Reflection screener together indicate patterns worth reviewing. " +
            "Consider structured task-chunking, visible step-by-step instructions, and follow-up check-ins.";
      return repeated
        ? base + " Repeated sessions show a consistent pattern — support-staff review is advisable."
        : base + " A single session is not sufficient for strong conclusions; monitor across further sessions.";
    },
  },

  "executive-function": {
    label: "Executive function and planning patterns",
    primaryDomain: "attention",
    primaryKey: "focusResult",
    secondaryDomain: "engagement",
    secondaryKey: "reflectionResult",
    studentSafeSummaryTemplate(level) {
      if (level === "no_strong_signal") {
        return "Your responses do not show a strong pattern in this area right now.";
      }
      return "Some patterns in planning and follow-through steps may benefit from support. Your teacher can discuss options.";
    },
    teacherSummaryTemplate(level, repeated) {
      const base =
        level === "no_strong_signal"
          ? "No strong combined signal for executive-function difficulty at this time."
          : "Focus screener results suggest difficulty with multi-step instruction handling and sustained organisation. " +
            "Reflection screener adds context about learner awareness of difficulty. " +
            "Consider scaffolded planning supports and explicit sequence prompts.";
      return repeated
        ? base + " Repeated sessions strengthen this signal — support-staff review is advisable."
        : base + " Single session only; additional sessions are needed before drawing firm conclusions.";
    },
  },

  "reading-difficulty": {
    label: "Reading access patterns",
    primaryDomain: "reading",
    primaryKey: "readingResult",
    secondaryDomain: null,
    secondaryKey: null,
    studentSafeSummaryTemplate(level) {
      if (level === "no_strong_signal") {
        return "Your reading responses do not show a strong pattern at this time.";
      }
      return "Some patterns in reading and word recognition may benefit from support. Audio-supported reading can be offered.";
    },
    teacherSummaryTemplate(level, repeated) {
      const base =
        level === "no_strong_signal"
          ? "No strong signal from the Reading screener at this time."
          : "Reading screener indicates patterns in decoding, word discrimination, or comprehension that may benefit from support. " +
            "Consider audio-supported reading, guided decoding prompts, and shorter reading blocks.";
      return repeated
        ? base + " Repeated sessions show a consistent reading access pattern — support-staff review is advisable."
        : base + " Single session; further sessions are needed before drawing strong conclusions.";
    },
  },

  "math-difficulty": {
    label: "Math reasoning patterns",
    primaryDomain: "math",
    primaryKey: "mathResult",
    secondaryDomain: null,
    secondaryKey: null,
    studentSafeSummaryTemplate(level) {
      if (level === "no_strong_signal") {
        return "Your math responses do not show a strong pattern at this time.";
      }
      return "Some patterns in number reasoning and math fluency may benefit from support. Worked examples can be offered.";
    },
    teacherSummaryTemplate(level, repeated) {
      const base =
        level === "no_strong_signal"
          ? "No strong signal from the Math screener at this time."
          : "Math screener indicates patterns in symbolic reasoning, representation, or fluency that may benefit from support. " +
            "Consider worked examples, symbolic-to-visual scaffolds, and short fluency refresh tasks.";
      return repeated
        ? base + " Repeated sessions show a consistent math reasoning pattern — support-staff review is advisable."
        : base + " Single session; further sessions are needed before drawing strong conclusions.";
    },
  },

  "sensory-environmental": {
    label: "Sensory and environmental comfort patterns",
    primaryDomain: "sensory",
    primaryKey: "comfortResult",
    secondaryDomain: "attention",
    secondaryKey: "focusResult",
    tertiaryDomain: "engagement",
    tertiaryKey: "reflectionResult",
    studentSafeSummaryTemplate(level) {
      if (level === "no_strong_signal") {
        return "Your comfort and focus responses do not show a strong pattern at this time.";
      }
      return "Some patterns in classroom comfort and focus may benefit from environmental adjustments. Your teacher can discuss options.";
    },
    teacherSummaryTemplate(level, repeated, tertiaryScore) {
      const base =
        level === "no_strong_signal"
          ? "No strong combined signal from Comfort, Focus, and Reflection screeners at this time."
          : "Comfort screener indicates sensory or environmental patterns. " +
            (isElevated(tertiaryScore)
              ? "Focus and Reflection screeners add further context around concentration and self-awareness. "
              : "Focus screener adds context around concentration impact. ") +
            "Consider reviewing seating, lighting, noise, and offering a quieter follow-up pathway.";
      return repeated
        ? base + " Repeated sessions show a consistent sensory pattern — support-staff review is advisable."
        : base + " Single session only; monitor across further sessions before drawing strong conclusions.";
    },
  },

  "anxiety-learning": {
    label: "Anxiety and learning engagement patterns",
    primaryDomain: "engagement",
    primaryKey: "reflectionResult",
    secondaryDomain: "sensory",
    secondaryKey: "comfortResult",
    studentSafeSummaryTemplate(level) {
      if (level === "no_strong_signal") {
        return "Your self-reflection responses do not show a strong pattern at this time.";
      }
      return "Some patterns around confidence and difficulty levels may benefit from support. Extra explanation and check-ins can be offered.";
    },
    teacherSummaryTemplate(level, repeated) {
      const base =
        level === "no_strong_signal"
          ? "No strong combined signal from Reflection and Comfort screeners at this time."
          : "Reflection screener indicates patterns in confidence, overwhelm, and support-seeking. " +
            "Comfort screener adds context around environmental contributors. " +
            "Consider shorter guided follow-up, reduced environmental stressors, and regular check-in points.";
      return repeated
        ? base + " Repeated sessions show a consistent engagement pattern — support-staff review is advisable."
        : base + " Single session only; further sessions are needed before drawing strong conclusions.";
    },
  },

  "depression-learning": {
    label: "Low engagement and motivation patterns",
    primaryDomain: "engagement",
    primaryKey: "reflectionResult",
    secondaryDomain: null,
    secondaryKey: null,
    studentSafeSummaryTemplate(level) {
      if (level === "no_strong_signal") {
        return "Your self-reflection responses do not show a strong pattern at this time.";
      }
      return "Some patterns around motivation and energy levels may benefit from support. A gentle check-in with your teacher can help.";
    },
    teacherSummaryTemplate(level, repeated) {
      const base =
        level === "no_strong_signal"
          ? "No strong signal from the Reflection screener at this time."
          : "Reflection screener indicates patterns in confidence, effort, and engagement that may benefit from support. " +
            "Consider reduced workload complexity, more frequent acknowledgement of effort, and regular pastoral check-ins.";
      return repeated
        ? base + " Repeated sessions show a consistent low-engagement pattern — support-staff review is advisable."
        : base + " Single session only; further sessions are needed before drawing strong conclusions.";
    },
  },
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Builds a challenge-level interpretation from multiple screener results.
 *
 * @param {object} params
 * @param {string}      params.challengeId        - One of the 7 known challenge IDs
 * @param {object|null} params.focusResult         - finalize() output from focus screener
 * @param {object|null} params.readingResult       - finalize() output from reading screener
 * @param {object|null} params.mathResult          - finalize() output from math screener
 * @param {object|null} params.comfortResult       - finalize() output from comfort screener
 * @param {object|null} params.reflectionResult    - finalize() output from reflection screener
 * @param {Array|null}  params.history             - Optional prior signal array for repeated-pattern detection
 *
 * @returns {{
 *   challengeId: string,
 *   primaryEvidence: { domain: string, score: number|null, elevated: boolean },
 *   secondaryEvidence: { domain: string, score: number|null, elevated: boolean }|null,
 *   indicators: string[],
 *   supportLevel: string,
 *   studentSafeSummary: string,
 *   teacherSummary: string,
 * }}
 */
export function buildChallengeInterpretation({
  challengeId,
  focusResult = null,
  readingResult = null,
  mathResult = null,
  comfortResult = null,
  reflectionResult = null,
  history = null,
}) {
  const definition = CHALLENGE_DEFINITIONS[challengeId];
  if (!definition) {
    throw new Error(
      `Unknown challengeId: "${challengeId}". ` +
        `Valid IDs: ${Object.keys(CHALLENGE_DEFINITIONS).join(", ")}`
    );
  }

  // Map screener keys to result objects
  const resultMap = {
    focusResult,
    readingResult,
    mathResult,
    comfortResult,
    reflectionResult,
  };

  // Extract primary score
  const primaryResult = definition.primaryKey ? resultMap[definition.primaryKey] : null;
  const primaryScore = primaryResult?.finalScore ?? null;

  // Extract secondary score (if applicable)
  const secondaryResult = definition.secondaryKey ? resultMap[definition.secondaryKey] : null;
  const secondaryScore = secondaryResult?.finalScore ?? null;

  // Extract tertiary score (sensory-environmental only)
  const tertiaryResult = definition.tertiaryKey ? resultMap[definition.tertiaryKey] : null;
  const tertiaryScore = tertiaryResult?.finalScore ?? null;

  // Determine support level
  const supportLevel = deriveSupportLevel(primaryScore, secondaryScore);

  // Build indicators from screener indicator arrays — avoid diagnostic language
  const indicators = [];

  if (primaryResult?.indicators) {
    indicators.push(...primaryResult.indicators);
  }
  if (secondaryResult?.indicators) {
    indicators.push(...secondaryResult.indicators);
  }
  if (tertiaryResult?.indicators) {
    indicators.push(...tertiaryResult.indicators);
  }

  // Deduplicate
  const uniqueIndicators = [...new Set(indicators)];

  // Check for repeated signals in history
  const repeatedPrimary = hasRepeatedSignal(history, definition.primaryDomain);

  // Build output
  const primaryEvidence = {
    domain: definition.primaryDomain,
    score: primaryScore,
    elevated: isElevated(primaryScore),
  };

  const secondaryEvidence =
    definition.secondaryDomain !== null
      ? {
          domain: definition.secondaryDomain,
          score: secondaryScore,
          elevated: isElevated(secondaryScore),
        }
      : null;

  // Build summaries via definition templates
  const studentSafeSummary = definition.studentSafeSummaryTemplate(supportLevel);

  const teacherSummary =
    challengeId === "sensory-environmental"
      ? definition.teacherSummaryTemplate(supportLevel, repeatedPrimary, tertiaryScore)
      : definition.teacherSummaryTemplate(supportLevel, repeatedPrimary);

  return {
    challengeId,
    primaryEvidence,
    secondaryEvidence,
    indicators: uniqueIndicators,
    supportLevel,
    studentSafeSummary,
    teacherSummary,
  };
}

// ---------------------------------------------------------------------------
// Convenience: list of valid challenge IDs
// ---------------------------------------------------------------------------

export const CHALLENGE_IDS = Object.keys(CHALLENGE_DEFINITIONS);
