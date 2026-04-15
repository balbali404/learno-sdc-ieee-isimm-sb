/**
 * levels.js
 *
 * Learner level definitions and resolution helper.
 *
 * Levels are curriculum-stage concepts, not age categories.
 * Age is only used as a default suggestion when no explicit level is given.
 */

export const LEARNER_LEVELS = {
  EARLY: {
    id: "early",
    label: "Primaire",
    typicalAgeRange: [6, 11],
    schoolStage: "primaire",
  },
  MIDDLE: {
    id: "middle",
    label: "College",
    typicalAgeRange: [12, 14],
    schoolStage: "college",
  },
  SECONDARY: {
    id: "secondary",
    label: "Lycee",
    typicalAgeRange: [15, 18],
    schoolStage: "lycee",
  },
  ADVANCED: {
    id: "advanced",
    label: "Higher Education / Adults",
    typicalAgeRange: [18, null],
    schoolStage: "higher_education_adult",
  },
};

const LEVEL_IDS = Object.values(LEARNER_LEVELS).map((l) => l.id);

/**
 * Resolve a learner level from an explicit level string or an age fallback.
 *
 * Resolution order:
 *   1. If `level` is a valid level id → use it directly
 *   2. Else if `age` is provided → infer from typicalAgeRange
 *   3. Default → "middle"
 *
 * @param {object} options
 * @param {string} [options.level]  - One of "early" | "middle" | "secondary" | "advanced"
 * @param {number} [options.age]   - Learner age (used as fallback when level is absent)
 * @returns {string}               - Resolved level id
 */
export function resolveLearnerLevel({ level, age } = {}) {
  // 1. Explicit level wins
  if (level && LEVEL_IDS.includes(level)) {
    return level;
  }

  // 2. Age-based fallback
  if (typeof age === "number" && !isNaN(age)) {
    if (age <= 11) return "early";
    if (age <= 14) return "middle";
    if (age <= 18) return "secondary";
    return "advanced";
  }

  // 3. Default
  return "middle";
}
