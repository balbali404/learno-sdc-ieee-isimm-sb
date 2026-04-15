import {
  DEFAULT_STUDENT_ID,
  DOMAIN_LABELS,
  SUPPORT_SCHEMA_VERSION,
  SUPPORT_LEVEL_LABELS,
  TRACKED_DOMAINS,
} from "./constants.js";

/**
 * @typedef {object} SupportSignal
 * @property {string} screener_id
 * @property {string} screener_name
 * @property {string} student_safe_name
 * @property {"attention"|"reading"|"math"|"sensory"|"engagement"} domain
 * @property {Record<string, any>} raw_metrics
 * @property {Record<string, number>} sub_scores
 * @property {number} final_score
 * @property {"no_strong_concern"|"monitor"|"repeated_difficulty_indicator"|"support_review_recommended"} level
 * @property {string[]} indicators
 * @property {number} confidence_score
 * @property {string} started_at
 * @property {string} completed_at
 * @property {number} duration_seconds
 * @property {string} timestamp
 * @property {string=} session_context_id
 * @property {Record<string, any>=} context_signals
 * @property {string[]} student_safe_feedback
 * @property {Record<string, any>} teacher_summary
 * @property {Record<string, any>} support_summary
 * @property {Record<string, any>} trend_metadata
 */

export function createSupportSignal(overrides = {}) {
  return {
    schema_version: SUPPORT_SCHEMA_VERSION,
    screener_id: "",
    screener_name: "",
    student_safe_name: "",
    domain: "attention",
    raw_metrics: {},
    sub_scores: {},
    final_score: 0,
    level: "no_strong_concern",
    indicators: [],
    confidence_score: 0,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    duration_seconds: 0,
    timestamp: new Date().toISOString(),
    session_context_id: null,
    context_signals: {},
    student_safe_feedback: [],
    teacher_summary: {},
    support_summary: {},
    trend_metadata: {},
    ...overrides,
  };
}

export function createEmptyDomainTrend(domain) {
  return {
    domain,
    label: DOMAIN_LABELS[domain] || domain,
    average: 0,
    weighted_average: 0,
    level: "no_strong_concern",
    count: 0,
    confidence: 0,
    repeated_evidence_count: 0,
    should_trigger_review: false,
    recent_scores: [],
    recent_average: 0,
    recent_trend_score: 0,
    repeated_indicator_count: 0,
    last_level: "no_strong_concern",
    last_score: 0,
    final_support_indicator: 0,
    latest_signal_at: null,
  };
}

export function createSupportProfile(studentId = DEFAULT_STUDENT_ID) {
  const domain_trends = Object.fromEntries(
    TRACKED_DOMAINS.map((domain) => [domain, createEmptyDomainTrend(domain)])
  );

  return {
    schema_version: SUPPORT_SCHEMA_VERSION,
    student_id: studentId,
    signals: [],
    domain_trends,
    current_flags: [],
    last_updated: new Date().toISOString(),
  };
}

export function createTeacherSummary({
  domain,
  level,
  finalScore,
  metricsSummary,
  suggestedAction,
  recentTrend,
  paradigms,
  confidenceScore,
  sessionContextId,
}) {
  return {
    domain,
    domain_label: DOMAIN_LABELS[domain] || domain,
    score_band: SUPPORT_LEVEL_LABELS[level] || level,
    final_score: finalScore,
    metrics_summary: metricsSummary,
    recent_trend: recentTrend,
    confidence_score: confidenceScore,
    session_context_id: sessionContextId,
    suggested_support_action: suggestedAction,
    paradigm_basis: paradigms,
  };
}

export function createSupportSummary({
  domain,
  level,
  finalScore,
  indicators,
  rawMetrics,
  subScores,
  contextSignals,
  finalSupportIndicator,
  recommendation,
  paradigms,
  confidenceScore,
  sessionContextId,
  shouldTrigger,
}) {
  return {
    domain,
    level,
    final_score: finalScore,
    indicators,
    confidence_score: confidenceScore,
    full_metrics: rawMetrics,
    sub_scores: subScores,
    context_signals: contextSignals,
    final_support_indicator: finalSupportIndicator,
    session_context_id: sessionContextId,
    should_trigger_review: shouldTrigger,
    recommendation,
    paradigm_basis: paradigms,
  };
}
