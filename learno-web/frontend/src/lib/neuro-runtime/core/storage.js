import {
  DEFAULT_STUDENT_ID,
  DEFAULT_UI_PREFERENCES,
  SUPPORT_SCHEMA_VERSION,
  TRACKED_DOMAINS,
} from "./constants.js";
import {
  serializeProfileForPersistence,
  serializeSignalForPersistence,
} from "./contracts.js";
import { createSupportProfile, createSupportSignal } from "./models.js";
import {
  buildCurrentFlags,
  buildDomainTrendsFromSignals,
  clamp,
  hydrateSupportProfile,
  interpretLevel,
  round,
  standardizeIndicators,
} from "./supportEngine.js";

const PROFILE_KEY = "learno.support-suite.profile.v1";
const UI_KEY = "learno.support-suite.ui.v1";

function normalizeConfidence(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return value > 1 ? clamp(value / 100, 0, 1) : clamp(value, 0, 1);
}

export function migrateSupportSignal(signal = {}) {
  const finalScore = round(clamp(Number(signal.final_score ?? signal.finalScore ?? 0)));
  const domain = signal.domain || "attention";
  const level = signal.level || interpretLevel(finalScore);

  const migrated = createSupportSignal({
    schema_version: SUPPORT_SCHEMA_VERSION,
    screener_id: signal.screener_id || signal.screenerId || "",
    screener_name: signal.screener_name || signal.screenerName || "",
    student_safe_name: signal.student_safe_name || signal.studentSafeName || signal.screener_name || "",
    domain,
    raw_metrics: signal.raw_metrics || signal.rawMetrics || {},
    sub_scores: signal.sub_scores || signal.subScores || {},
    final_score: finalScore,
    level,
    indicators: standardizeIndicators(domain, signal.indicators || []),
    confidence_score: normalizeConfidence(signal.confidence_score ?? signal.confidenceScore ?? 0),
    started_at: signal.started_at || signal.startedAt || signal.timestamp || new Date().toISOString(),
    completed_at: signal.completed_at || signal.completedAt || signal.timestamp || new Date().toISOString(),
    duration_seconds: Number(signal.duration_seconds ?? signal.durationSeconds ?? 0),
    timestamp: signal.timestamp || signal.completed_at || new Date().toISOString(),
    session_context_id:
      signal.session_context_id ||
      signal.context_signals?.session_context_id ||
      signal.context_signals?.lesson_id ||
      signal.teacher_summary?.session_context_id ||
      signal.support_summary?.session_context_id ||
      null,
    context_signals: signal.context_signals || signal.contextSignals || {},
    student_safe_feedback: signal.student_safe_feedback || signal.studentSafeFeedback || [],
    teacher_summary: signal.teacher_summary || {},
    support_summary: signal.support_summary || {},
    trend_metadata: {
      recent_trend_score: signal.trend_metadata?.recent_trend_score || 0,
      final_support_indicator: signal.trend_metadata?.final_support_indicator || 0,
      classroom_analytics_score: signal.trend_metadata?.classroom_analytics_score || 0,
      teacher_observation_score: signal.trend_metadata?.teacher_observation_score || 0,
      repetition_score: signal.trend_metadata?.repetition_score || 0,
      weighted_average: signal.trend_metadata?.weighted_average || signal.trend_metadata?.recent_trend_score || 0,
      domain_average: signal.trend_metadata?.domain_average || finalScore,
      repeated_evidence_count: signal.trend_metadata?.repeated_evidence_count || 0,
      should_trigger_review: Boolean(signal.trend_metadata?.should_trigger_review),
    },
  });

  return serializeSignalForPersistence(migrated);
}

export function migrateSupportProfile(storedProfile = {}, studentId = DEFAULT_STUDENT_ID) {
  const baseProfile = createSupportProfile(storedProfile.student_id || studentId);
  const migratedSignals = Array.isArray(storedProfile.signals)
    ? storedProfile.signals.map(migrateSupportSignal).sort((left, right) => {
        return new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime();
      })
    : [];

  const hydrated = hydrateSupportProfile(
    {
      ...baseProfile,
      schema_version: SUPPORT_SCHEMA_VERSION,
      student_id: storedProfile.student_id || studentId,
      last_updated:
        storedProfile.last_updated || migratedSignals.at(-1)?.completed_at || new Date().toISOString(),
    },
    migratedSignals
  );

  const domainTrends = buildDomainTrendsFromSignals(migratedSignals);

  TRACKED_DOMAINS.forEach((domain) => {
    if (!domainTrends[domain]) {
      return;
    }

    hydrated.domain_trends[domain] = {
      ...hydrated.domain_trends[domain],
      ...domainTrends[domain],
    };
  });

  hydrated.current_flags = buildCurrentFlags(hydrated.domain_trends);

  return serializeProfileForPersistence({
    ...hydrated,
    schema_version: SUPPORT_SCHEMA_VERSION,
  });
}

export function loadSupportProfile(studentId = DEFAULT_STUDENT_ID) {
  try {
    const raw = localStorage.getItem(`${PROFILE_KEY}:${studentId}`);
    if (!raw) {
      return createSupportProfile(studentId);
    }

    const parsed = JSON.parse(raw);
    const migrated = migrateSupportProfile(parsed, studentId);

    if ((parsed.schema_version || 0) !== SUPPORT_SCHEMA_VERSION) {
      saveSupportProfile(migrated);
    }

    return migrated?.student_id ? migrated : createSupportProfile(studentId);
  } catch (_error) {
    return createSupportProfile(studentId);
  }
}

export function saveSupportProfile(profile) {
  try {
    const serialized = serializeProfileForPersistence(profile);
    localStorage.setItem(`${PROFILE_KEY}:${profile.student_id}`, JSON.stringify(serialized));
  } catch (_error) {
    // Ignore storage issues for this first implementation.
  }
}

export function loadUiPreferences() {
  try {
    const raw = localStorage.getItem(UI_KEY);
    if (!raw) {
      return { ...DEFAULT_UI_PREFERENCES };
    }

    return { ...DEFAULT_UI_PREFERENCES, ...JSON.parse(raw) };
  } catch (_error) {
    return { ...DEFAULT_UI_PREFERENCES };
  }
}

export function saveUiPreferences(preferences) {
  try {
    localStorage.setItem(UI_KEY, JSON.stringify(preferences));
  } catch (_error) {
    // Ignore storage issues for this first implementation.
  }
}

export function resetSupportProfile(studentId = DEFAULT_STUDENT_ID) {
  const profile = createSupportProfile(studentId);
  saveSupportProfile(profile);
  return profile;
}

// ─── Screener result history ──────────────────────────────────────────────────

const SCREENER_HISTORY_KEY = "learno.support-suite.screener-history.v1";

/**
 * saveScreenerResult(result, studentId?)
 *
 * Appends a screener result object to the learner's screener history in
 * localStorage. Only metadata is stored (no item-level response data).
 *
 * result shape: { screener_id, domain, final_score, level, timestamp, ... }
 */
export function saveScreenerResult(result, studentId = DEFAULT_STUDENT_ID) {
  try {
    const key = `${SCREENER_HISTORY_KEY}:${studentId}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    const updated = [...existing, { ...result, saved_at: new Date().toISOString() }];
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (_error) {
    // Ignore storage issues.
  }
}

/**
 * getScreenerHistory(studentId?, screener_id?)
 *
 * Returns an array of stored screener results for a learner.
 * Optionally filter by screener_id.
 */
export function getScreenerHistory(studentId = DEFAULT_STUDENT_ID, screener_id = null) {
  try {
    const key = `${SCREENER_HISTORY_KEY}:${studentId}`;
    const raw = localStorage.getItem(key);
    const history = raw ? JSON.parse(raw) : [];
    if (screener_id) {
      return history.filter((entry) => entry.screener_id === screener_id);
    }
    return history;
  } catch (_error) {
    return [];
  }
}

/**
 * clearScreenerHistory(studentId?, screener_id?)
 *
 * Clears screener history for a learner.
 * If screener_id is given, removes only entries for that screener.
 * Otherwise clears the full history.
 */
export function clearScreenerHistory(studentId = DEFAULT_STUDENT_ID, screener_id = null) {
  try {
    const key = `${SCREENER_HISTORY_KEY}:${studentId}`;
    if (!screener_id) {
      localStorage.removeItem(key);
      return;
    }
    const raw = localStorage.getItem(key);
    const history = raw ? JSON.parse(raw) : [];
    const filtered = history.filter((entry) => entry.screener_id !== screener_id);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (_error) {
    // Ignore storage issues.
  }
}
