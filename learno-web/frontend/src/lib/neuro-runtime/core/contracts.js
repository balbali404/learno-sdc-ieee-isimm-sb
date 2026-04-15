import { SUPPORT_SCHEMA_VERSION } from "./constants.js";
import {
  buildStudentView,
  buildSupportView,
  buildTeacherView,
} from "./supportEngine.js";

export function serializeSignalForPersistence(signal) {
  return {
    schema_version: signal.schema_version || SUPPORT_SCHEMA_VERSION,
    screener_id: signal.screener_id,
    screener_name: signal.screener_name,
    student_safe_name: signal.student_safe_name,
    domain: signal.domain,
    raw_metrics: signal.raw_metrics,
    sub_scores: signal.sub_scores,
    final_score: signal.final_score,
    level: signal.level,
    indicators: signal.indicators,
    confidence_score: signal.confidence_score,
    started_at: signal.started_at,
    completed_at: signal.completed_at,
    duration_seconds: signal.duration_seconds,
    timestamp: signal.timestamp,
    session_context_id: signal.session_context_id || null,
    context_signals: signal.context_signals || {},
    student_safe_feedback: signal.student_safe_feedback || [],
    teacher_summary: signal.teacher_summary || {},
    support_summary: signal.support_summary || {},
    trend_metadata: signal.trend_metadata || {},
  };
}

export function serializeProfileForPersistence(profile) {
  return {
    schema_version: profile.schema_version || SUPPORT_SCHEMA_VERSION,
    student_id: profile.student_id,
    signals: (profile.signals || []).map(serializeSignalForPersistence),
    domain_trends: profile.domain_trends || {},
    current_flags: profile.current_flags || [],
    last_updated: profile.last_updated,
  };
}

export function serializeSignalForBackend(signal) {
  return {
    schema_version: signal.schema_version || SUPPORT_SCHEMA_VERSION,
    session_context_id: signal.session_context_id || null,
    screener_id: signal.screener_id,
    screener_name: signal.screener_name,
    student_safe_name: signal.student_safe_name,
    domain: signal.domain,
    raw_metrics: signal.raw_metrics,
    sub_scores: signal.sub_scores,
    final_score: signal.final_score,
    level: signal.level,
    indicators: signal.indicators,
    confidence_score: signal.confidence_score,
    started_at: signal.started_at,
    completed_at: signal.completed_at,
    duration_seconds: signal.duration_seconds,
    timestamp: signal.timestamp,
    context_signals: signal.context_signals || {},
    student_safe_feedback: signal.student_safe_feedback || [],
    teacher_summary: signal.teacher_summary || {},
    support_summary: signal.support_summary || {},
    trend_metadata: {
      weighted_average: signal.trend_metadata?.weighted_average || 0,
      domain_average: signal.trend_metadata?.domain_average || 0,
      recent_trend_score: signal.trend_metadata?.recent_trend_score || 0,
      final_support_indicator: signal.trend_metadata?.final_support_indicator || 0,
      repeated_evidence_count: signal.trend_metadata?.repeated_evidence_count || 0,
      should_trigger_review: Boolean(signal.trend_metadata?.should_trigger_review),
      classroom_analytics_score: signal.trend_metadata?.classroom_analytics_score || 0,
      teacher_observation_score: signal.trend_metadata?.teacher_observation_score || 0,
    },
  };
}

export function serializeProfileForBackend(profile) {
  return {
    schema_version: profile.schema_version || SUPPORT_SCHEMA_VERSION,
    student_id: profile.student_id,
    signals: (profile.signals || []).map(serializeSignalForBackend),
    domain_trends: profile.domain_trends || {},
    current_flags: profile.current_flags || [],
    last_updated: profile.last_updated,
  };
}

export function serializeStudentSignalResponse(signal) {
  return {
    schema_version: signal.schema_version || SUPPORT_SCHEMA_VERSION,
    session_context_id: signal.session_context_id || null,
    ...buildStudentView(signal),
  };
}

export function serializeTeacherSignalResponse(signal) {
  return {
    schema_version: signal.schema_version || SUPPORT_SCHEMA_VERSION,
    session_context_id: signal.session_context_id || null,
    ...buildTeacherView(signal),
  };
}

export function serializeSupportSignalResponse(signal) {
  return serializeSignalForBackend(buildSupportView(signal));
}


