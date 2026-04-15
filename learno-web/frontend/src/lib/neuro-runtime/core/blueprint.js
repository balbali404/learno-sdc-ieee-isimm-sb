/**
 * blueprint.js
 *
 * Utilities for deterministic session blueprint generation:
 * - Seeded PRNG (LCG)
 * - Deterministic shuffle
 * - Anti-repetition variant picker
 * - Blueprint assembly
 * - Localization resolver
 * - DB result payload builder
 */

const SUPPORTED_LANGUAGES = ["en", "fr", "ar"];
const RTL_LANGUAGES = ["ar"];

/**
 * Deterministic LCG pseudo-random number generator.
 * Returns a function that produces values in [0, 1) from a numeric seed.
 *
 * Parameters chosen for LCG: m=2^31-1 (Mersenne prime), a=48271 (full-period)
 */
function seededRandom(seed) {
  const M = 2147483647; // 2^31 - 1
  const A = 48271;
  let state = (Math.abs(Math.floor(seed)) % (M - 1)) + 1; // ensure state in [1, M-1]
  return function () {
    state = (state * A) % M;
    return (state - 1) / (M - 1); // [0, 1)
  };
}

/**
 * Fisher-Yates shuffle using a seeded PRNG.
 * Returns a new array; does not mutate the input.
 */
function shuffleWithSeed(array, seed) {
  const rng = seededRandom(seed);
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Pick one variant set from a pool, avoiding recently used variant IDs when
 * alternatives exist.
 *
 * @param {Array}  pool              - Array of variant objects; each must have an `id` property
 * @param {Array}  recentVariantIds  - IDs of variants used in recent sessions (most recent first)
 * @param {number} seed              - Numeric seed for determinism
 * @returns {object}                 - The chosen variant object
 */
function pickVariantSet(pool, recentVariantIds = [], seed = 1) {
  if (!pool || pool.length === 0) {
    throw new Error("pickVariantSet: pool must be a non-empty array");
  }
  if (pool.length === 1) {
    return pool[0];
  }

  const recentSet = new Set(recentVariantIds);
  const fresh = pool.filter((v) => !recentSet.has(v.id));
  const candidates = fresh.length > 0 ? fresh : pool;

  // Use seeded selection among candidates
  const rng = seededRandom(seed);
  const idx = Math.floor(rng() * candidates.length);
  return candidates[idx];
}

/**
 * Assemble a full blueprint for a screener session.
 *
 * @param {object} pools    - Map of slotName → pool array (each pool item has { id, content })
 * @param {object} config   - { seed, recentHistory, language, slotOrder }
 *   - seed:          numeric seed (default: Date.now())
 *   - recentHistory: array of past blueprintMeta objects (most recent first)
 *   - language:      "en" | "fr" | "ar" (default: "en")
 *   - slotOrder:     optional array of slot names defining display order
 * @returns {object} blueprint with:
 *   - items:         { slotName: chosenVariant, ... }
 *   - meta:          { variantIds: [...], orderSignature: "..." }
 *   - language
 *   - rtl
 *   - seed
 */
function createBlueprintFromPool(pools, config = {}) {
  const seed = config.seed != null ? config.seed : Date.now();
  const recentHistory = Array.isArray(config.recentHistory)
    ? config.recentHistory
    : [];
  const rawLang = config.language || "en";
  const language = SUPPORTED_LANGUAGES.includes(rawLang) ? rawLang : "en";
  const rtl = RTL_LANGUAGES.includes(language);

  const slotNames = config.slotOrder
    ? config.slotOrder
    : Object.keys(pools);

  // Build a map of slot → recent variant IDs from history
  const recentBySlot = {};
  for (const meta of recentHistory) {
    if (meta && meta.variantIds && typeof meta.variantIds === "object") {
      for (const [slot, vid] of Object.entries(meta.variantIds)) {
        if (!recentBySlot[slot]) recentBySlot[slot] = [];
        if (!recentBySlot[slot].includes(vid)) {
          recentBySlot[slot].push(vid);
        }
      }
    }
  }

  // Pick variants per slot using offset seeds for independence
  const items = {};
  const variantIds = {};
  let seedOffset = 0;

  for (const slot of slotNames) {
    const pool = pools[slot];
    if (!pool) continue;
    const recentIds = recentBySlot[slot] || [];
    const chosen = pickVariantSet(pool, recentIds, seed + seedOffset);
    items[slot] = chosen;
    variantIds[slot] = chosen.id;
    seedOffset += 1000;
  }

  // Order signature: sorted slotName:variantId pairs joined
  const orderSignature = slotNames
    .map((s) => `${s}:${variantIds[s] || ""}`)
    .join("|");

  return {
    items,
    meta: { variantIds, orderSignature },
    language,
    rtl,
    seed,
  };
}

/**
 * Resolve a single localized item's content fields for a given language.
 * Falls back to "en" if the requested language is missing.
 *
 * @param {object} item     - An item with { id, content: { en, fr, ar } }
 * @param {string} language - "en" | "fr" | "ar"
 * @returns {object}        - { id, ...languageContent }
 */
function resolveLocalizedItem(item, language = "en") {
  if (!item) return null;
  const lang = SUPPORTED_LANGUAGES.includes(language) ? language : "en";
  const content =
    (item.content && item.content[lang]) ||
    (item.content && item.content["en"]) ||
    {};
  return { id: item.id, ...content };
}

/**
 * Build the DB-facing result payload.
 *
 * @param {string} screenerId       - e.g. "focus" | "reading" | "math" | "comfort" | "reflection"
 * @param {string} language         - "en" | "fr" | "ar"
 * @param {object} result           - Output of screener.finalize()
 * @param {object} blueprintMeta    - { variantIds, orderSignature } from blueprint.meta
 * @param {string} [studentId]      - Optional student identifier
 * @returns {object}                - Storable result payload
 */
function buildResultPayload(
  screenerId,
  language,
  result,
  blueprintMeta,
  studentId = null
) {
  return {
    studentId,
    screenerId,
    language: SUPPORTED_LANGUAGES.includes(language) ? language : "en",
    timestamp: Date.now(),
    finalScore: result.finalScore,
    subScores: result.subScores || {},
    indicators: result.indicators || [],
    studentSafeFeedback: result.studentSafeFeedback || null,
    teacherMetrics: result.teacherMetrics || {},
    blueprintMeta: {
      variantIds: (blueprintMeta && blueprintMeta.variantIds) || {},
      orderSignature: (blueprintMeta && blueprintMeta.orderSignature) || "",
    },
  };
}

export {
  seededRandom,
  shuffleWithSeed,
  pickVariantSet,
  createBlueprintFromPool,
  resolveLocalizedItem,
  buildResultPayload,
  SUPPORTED_LANGUAGES,
  RTL_LANGUAGES,
};
