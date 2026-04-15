import {
  GENERIC_STUDENT_FEEDBACK,
  INDICATORS,
  LONGITUDINAL_FUSION_WEIGHTS,
  SUPPORT_ADVISORIES,
  SUPPORT_LEVEL_BANDS,
  TRACKED_DOMAINS,
} from "./constants.js";
import {
  createSupportSignal,
  createTeacherSummary,
  createSupportSummary,
  createEmptyDomainTrend,
} from "./models.js";
import { getLabels } from "./i18n.js";

export function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function round(value, decimals = 0) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function average(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) {
    return 0;
  }

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

export function standardDeviation(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (valid.length < 2) {
    return 0;
  }

  const mean = average(valid);
  const variance = average(valid.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
}

export function safeRatio(numerator, denominator) {
  return denominator ? numerator / denominator : 0;
}

export function formatClock(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function interpretLevel(score) {
  const normalized = clamp(score);
  return (
    SUPPORT_LEVEL_BANDS.find((band) => normalized >= band.min && normalized <= band.max)?.level ||
    "no_strong_concern"
  );
}

export function getRecentDomainSignals(profile, domain, limit = 4) {
  return profile.signals
    .filter((signal) => signal.domain === domain)
    .slice(-limit);
}

export function calculateRecentTrendScore(profile, domain) {
  return round(clamp(computeWeightedTrend(getRecentDomainSignals(profile, domain, 3))));
}

export function calculateRepetitionScore(profile, domain) {
  const recentSignals = getRecentDomainSignals(profile, domain, 5);
  return round(computeConfidence(recentSignals) * 100);
}

export function computeConfidence(signalsForDomain) {
  const count = signalsForDomain.length;

  if (count === 0) return 0;

  const recent = signalsForDomain.slice(-5);

  const repeatedHigh = recent.filter((signal) => signal.level !== "no_strong_concern").length;

  return Math.min(1, repeatedHigh / recent.length);
}

export function computeWeightedTrend(signals) {
  const weights = [0.5, 0.3, 0.2];
  const recent = signals.slice(-3).reverse();

  let total = 0;
  let weightSum = 0;

  recent.forEach((signal, index) => {
    const weight = weights[index] || 0;
    total += signal.final_score * weight;
    weightSum += weight;
  });

  return weightSum ? total / weightSum : 0;
}

export function computeDomainTrend(signals, domain) {
  const domainSignals = signals.filter((signal) => signal.domain === domain);

  if (domainSignals.length === 0) return null;

  const recent = domainSignals.slice(-3);
  const avgScore = recent.reduce((sum, signal) => sum + signal.final_score, 0) / recent.length;
  const weightedAverage = computeWeightedTrend(domainSignals);
  const confidence = computeConfidence(domainSignals);
  const repeatedEvidenceCount = domainSignals.filter(
    (signal) => signal.level !== "no_strong_concern"
  ).length;

  return {
    average: round(avgScore, 1),
    weighted_average: round(weightedAverage, 1),
    level: interpretLevel(avgScore),
    count: domainSignals.length,
    confidence,
    repeated_evidence_count: repeatedEvidenceCount,
  };
}

export function shouldTriggerReview(domainTrend, confidence) {
  if (!domainTrend) {
    return false;
  }

  const hasMinimumRepeatedEvidence = domainTrend.repeated_evidence_count >= 2;
  const elevatedLevel =
    domainTrend.level === "repeated_difficulty_indicator" ||
    domainTrend.level === "support_review_recommended";

  return hasMinimumRepeatedEvidence && elevatedLevel && confidence > 0.6;
}

export function buildDomainTrendsFromSignals(signals) {
  const trends = {};

  TRACKED_DOMAINS.forEach((domain) => {
    const domainSignals = signals.filter((entry) => entry.domain === domain);
    const baseTrend = computeDomainTrend(signals, domain);

    if (!baseTrend) {
      trends[domain] = createEmptyDomainTrend(domain);
      return;
    }

    const recentScores = domainSignals.slice(-5).map((entry) => entry.final_score);
    const lastSignal = domainSignals.at(-1);
    const triggerReview = shouldTriggerReview(baseTrend, baseTrend.confidence);

    trends[domain] = {
      ...(trends[domain] || createEmptyDomainTrend(domain)),
      average: baseTrend.average,
      weighted_average: baseTrend.weighted_average,
      level: baseTrend.level,
      count: baseTrend.count,
      confidence: baseTrend.confidence,
      repeated_evidence_count: baseTrend.repeated_evidence_count,
      should_trigger_review: triggerReview,
      recent_scores: recentScores,
      recent_average: round(average(recentScores)),
      recent_trend_score: round(clamp(baseTrend.weighted_average)),
      repeated_indicator_count: baseTrend.repeated_evidence_count,
      last_level: lastSignal?.level || "no_strong_concern",
      last_score: lastSignal?.final_score || 0,
      final_support_indicator: lastSignal?.trend_metadata?.final_support_indicator || 0,
      latest_signal_at: lastSignal?.completed_at || null,
    };
  });

  return trends;
}

export function buildCurrentFlags(domainTrends) {
  return dedupe(
    Object.values(domainTrends)
      .filter((trend) => trend.should_trigger_review)
      .map((trend) => `${trend.domain}:${trend.level}`)
  );
}

export function hydrateSupportProfile(profile, signals) {
  const domainTrends = buildDomainTrendsFromSignals(signals);

  return {
    ...profile,
    signals,
    domain_trends: domainTrends,
    current_flags: buildCurrentFlags(domainTrends),
    last_updated: signals.at(-1)?.completed_at || profile.last_updated,
  };
}

export function calculateFinalSupportIndicator({
  currentScreenerScore,
  recentTrendScore,
  classroomAnalyticsScore,
  teacherObservationScore,
}) {
  return round(
    clamp(
      LONGITUDINAL_FUSION_WEIGHTS.current * currentScreenerScore +
        LONGITUDINAL_FUSION_WEIGHTS.recentTrend * recentTrendScore +
        LONGITUDINAL_FUSION_WEIGHTS.classroomAnalytics * classroomAnalyticsScore +
        LONGITUDINAL_FUSION_WEIGHTS.teacherObservation * teacherObservationScore
    )
  );
}

export function flattenMeasurementValues(input) {
  const values = [];

  function visit(value) {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    if (value && typeof value === "object") {
      Object.values(value).forEach(visit);
      return;
    }

    if (typeof value === "number") {
      values.push(value);
      return;
    }

    if (typeof value === "boolean") {
      values.push(value ? 1 : 0);
    }
  }

  visit(input);
  return values;
}

export function calculateMeasurementCompleteness(rawMetrics) {
  const values = flattenMeasurementValues(rawMetrics);
  if (!values.length) {
    return 30;
  }

  const populated = values.filter((value) => Number.isFinite(value)).length;
  return round(clamp((populated / values.length) * 100));
}

export function dedupe(list) {
  return [...new Set(list.filter(Boolean))];
}

export function standardizeIndicators(domain, candidates = []) {
  const allowed = [...(INDICATORS[domain] || []), ...(SUPPORT_ADVISORIES[domain] || [])];
  return dedupe(candidates).filter((candidate) => allowed.includes(candidate));
}

export function getSuggestedSupportAction(domain, level, indicators) {
  if (domain === "attention") {
    if (indicators.includes("difficulty handling multi-step academic instructions")) {
      return "attention.chunk_instructions";
    }

    return level === "support_review_recommended"
      ? "attention.support_review"
      : "attention.short_chunks";
  }

  if (domain === "reading") {
    return indicators.includes("reading support may be beneficial")
      ? "reading.guided_decoding"
      : "reading.monitor_comprehension";
  }

  if (domain === "math") {
    return indicators.includes("guided math support may help")
      ? "math.worked_examples"
      : "math.monitor_symbolic";
  }

  if (domain === "sensory") {
    return indicators.includes("environmental adjustment may help")
      ? "sensory.review_environment"
      : "sensory.monitor_comfort";
  }

  return indicators.includes("learner may benefit from additional support")
    ? "engagement.guided_followup"
    : "engagement.monitor_confidence";
}

export function buildSupportSignal({
  screener,
  interpretation,
  profile,
  contextBundle,
  startedAt,
  completedAt,
  language = "en",
}) {
  const localizedParadigms = screener.getLocalizedMeta
    ? screener.getLocalizedMeta(language).paradigms
    : screener.scientificParadigms;
  const level = interpretLevel(interpretation.finalScore);
  const standardizedIndicators = standardizeIndicators(screener.domain, interpretation.indicators);
  const candidateSignalsForDomain = [
    ...profile.signals.filter((signal) => signal.domain === screener.domain),
    {
      domain: screener.domain,
      final_score: interpretation.finalScore,
      level,
    },
  ];
  const recentTrendScore = round(clamp(computeWeightedTrend(candidateSignalsForDomain)));
  const domainTrend = computeDomainTrend(candidateSignalsForDomain, screener.domain);
  const confidenceScore = computeConfidence(candidateSignalsForDomain);
  const triggerReview = shouldTriggerReview(domainTrend, confidenceScore);
  const finalSupportIndicator = calculateFinalSupportIndicator({
    currentScreenerScore: interpretation.finalScore,
    recentTrendScore,
    classroomAnalyticsScore: contextBundle.classroomAnalyticsScore || 0,
    teacherObservationScore: contextBundle.teacherObservationScore || 0,
  });
  const localizedFeedbackPool = getLabels(language).genericStudentFeedback?.[screener.domain] || GENERIC_STUDENT_FEEDBACK[screener.domain];
  const studentSafeFeedback = dedupe([
    ...interpretation.studentSafeFeedback,
    ...localizedFeedbackPool,
  ]).slice(0, 4);
  const suggestedAction = getSuggestedSupportAction(screener.domain, level, standardizedIndicators);
  const durationSeconds = round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000, 1);

  return createSupportSignal({
    screener_id: screener.id,
    screener_name: screener.name,
    student_safe_name: screener.studentSafeName,
    domain: screener.domain,
    raw_metrics: interpretation.rawMetrics,
    sub_scores: interpretation.subScores,
    final_score: round(clamp(interpretation.finalScore)),
    level,
    indicators: standardizedIndicators,
    confidence_score: confidenceScore,
    started_at: startedAt,
    completed_at: completedAt,
    duration_seconds: durationSeconds,
    timestamp: completedAt,
    session_context_id: contextBundle.session_context_id || contextBundle.lesson_id || null,
    context_signals: interpretation.contextSignals || contextBundle,
    student_safe_feedback: studentSafeFeedback,
    teacher_summary: createTeacherSummary({
      domain: screener.domain,
      level,
      finalScore: interpretation.finalScore,
      metricsSummary: interpretation.teacherMetrics,
      suggestedAction,
      recentTrend: {
        recent_trend_score: recentTrendScore,
        classroom_analytics_score: contextBundle.classroomAnalyticsScore || 0,
        weighted_average: domainTrend?.weighted_average || 0,
        domain_average: domainTrend?.average || 0,
        trigger_review: triggerReview,
      },
      paradigms: localizedParadigms,
      confidenceScore,
      sessionContextId: contextBundle.session_context_id || contextBundle.lesson_id || null,
    }),
    support_summary: createSupportSummary({
      domain: screener.domain,
      level,
      finalScore: interpretation.finalScore,
      indicators: standardizedIndicators,
      rawMetrics: interpretation.rawMetrics,
      subScores: interpretation.subScores,
      contextSignals: interpretation.contextSignals || contextBundle,
      finalSupportIndicator,
      recommendation:
        triggerReview
          ? "recommendation.support_review"
          : level === "support_review_recommended"
            ? "recommendation.high_score_monitor"
          : level === "repeated_difficulty_indicator"
            ? "recommendation.monitor_repeated_patterns"
            : "recommendation.routine_monitoring",
      paradigms: screener.scientificParadigms,
      confidenceScore,
      sessionContextId: contextBundle.session_context_id || contextBundle.lesson_id || null,
      shouldTrigger: triggerReview,
    }),
    trend_metadata: {
      recent_trend_score: recentTrendScore,
      final_support_indicator: finalSupportIndicator,
      classroom_analytics_score: contextBundle.classroomAnalyticsScore || 0,
      teacher_observation_score: contextBundle.teacherObservationScore || 0,
      repetition_score: round(confidenceScore * 100),
      weighted_average: domainTrend?.weighted_average || 0,
      domain_average: domainTrend?.average || 0,
      repeated_evidence_count: domainTrend?.repeated_evidence_count || 0,
      should_trigger_review: triggerReview,
    },
  });
}

export function updateSupportProfile(profile, signal) {
  const nextSignals = [...profile.signals, signal];
  return hydrateSupportProfile(profile, nextSignals);
}

export function buildStudentView(signal) {
  return {
    screener: signal.screener_name,
    feedback: signal.student_safe_feedback,
  };
}

export function buildTeacherView(signal) {
  return {
    screener: signal.screener_name,
    domain: signal.domain,
    score: signal.final_score,
    level: signal.level,
    indicators: signal.indicators,
    metrics_summary: signal.teacher_summary.metrics_summary,
    suggested_support_action: signal.teacher_summary.suggested_support_action,
    recent_trend: signal.teacher_summary.recent_trend,
    confidence_score: signal.confidence_score,
  };
}

export function buildSupportView(signal) {
  return signal;
}

/**
 * computeRepeatedIndicator(signals, indicator)
 *
 * Counts how many signals in `signals` include a specific indicator string.
 * Used to detect patterns like "difficulty with multi-step instructions" appearing
 * repeatedly across sessions — a key signal for support escalation.
 *
 * @param {Array}  signals   - Array of support signal objects (each has .indicators)
 * @param {string} indicator - Indicator string to search for
 * @returns {number}         - Count of occurrences across all provided signals
 */
export function computeRepeatedIndicator(signals, indicator) {
  if (!Array.isArray(signals) || !indicator) return 0;
  return signals.filter(
    (signal) => Array.isArray(signal.indicators) && signal.indicators.includes(indicator)
  ).length;
}

/**
 * computeProgress(signals, domain)
 *
 * Computes a simple progress metric for a learner in a domain over time.
 * Compares the average final_score of the most recent half of sessions vs the
 * earlier half. Returns a value in [-100, 100]:
 *   positive = improving (scores decreasing = less support needed)
 *   negative = worsening
 *   0        = stable or insufficient data
 *
 * Note: lower scores = less support needed = positive progress.
 *
 * @param {Array}  signals - Array of support signal objects
 * @param {string} domain  - Domain to filter on (e.g. "attention")
 * @returns {number}       - Progress delta rounded to 1 decimal
 */
export function computeProgress(signals, domain) {
  if (!Array.isArray(signals)) return 0;
  const domainSignals = signals.filter((s) => s.domain === domain);
  if (domainSignals.length < 2) return 0;

  const mid = Math.floor(domainSignals.length / 2);
  const earlier = domainSignals.slice(0, mid);
  const recent = domainSignals.slice(mid);

  const avgEarlier = average(earlier.map((s) => s.final_score));
  const avgRecent = average(recent.map((s) => s.final_score));

  // Positive progress = score decreased (less support needed)
  return round(clamp(avgEarlier - avgRecent, -100, 100), 1);
}
