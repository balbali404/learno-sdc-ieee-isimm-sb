import { getContextBundle } from "../core/context.js";
import { getLabels, isRTL } from "../core/i18n.js";
import { resolveLearnerLevel } from "../core/levels.js";
import { buildSupportSignal, updateSupportProfile } from "../core/supportEngine.js";
import { SCREENER_MAP } from "../screeners/index.js";
import { CHALLENGE_MAP } from "./definitions.js";

const SCREENER_ALIASES = {
  focus: "focus-check",
  reading: "reading-support-check",
  math: "math-reasoning-check",
  comfort: "comfort-check",
  reflection: "learning-reflection",
};

function getScreenerId(alias) {
  return SCREENER_ALIASES[alias] || alias;
}

function getRecentHistory(profile, screenerId) {
  return (profile?.signals || [])
    .filter((signal) => signal.screener_id === screenerId)
    .map((signal) => signal.raw_metrics?.blueprintMeta || signal.blueprintMeta)
    .filter(Boolean)
    .slice(-5)
    .reverse();
}

export function getChallengeDefinition(challengeId) {
  return CHALLENGE_MAP[challengeId] || null;
}

export function getChallengeMeta(challenge, language = "en") {
  const t = getLabels(language);
  const [minMinutes, maxMinutes] = challenge.estimatedMinutes || [0, 0];
  return {
    name: t[challenge.nameKey] || challenge.id,
    description: t[challenge.descriptionKey] || "",
    durationLabel: minMinutes && maxMinutes ? `${minMinutes}-${maxMinutes} min` : "",
    domainTags: challenge.domainTags || [],
  };
}

export function createChallengeSession({ challengeId, level, age, language = "en", profile }) {
  const challenge = getChallengeDefinition(challengeId);
  if (!challenge) {
    throw new Error(`Unknown challenge: ${challengeId}`);
  }

  const resolvedLevel = resolveLearnerLevel({ level, age });
  const screenerIds = [...new Set(challenge.steps.map((step) => getScreenerId(step.screener)))];
  const screenerSessions = Object.fromEntries(
    screenerIds.map((screenerId) => {
      const screener = SCREENER_MAP[screenerId];
      const session = screener.createSession({
        level: resolvedLevel,
        age,
        language,
        recentHistory: getRecentHistory(profile, screenerId),
      });
      return [screenerId, session];
    })
  );

  const parts = challenge.steps.map((step, index) => {
    const screenerId = getScreenerId(step.screener);
    const screener = SCREENER_MAP[screenerId];
    return {
      id: `${challenge.id}:${index}`,
      screener: step.screener,
      screenerId,
      step: step.step,
      sourceDomain: screener.domain,
      blueprintMeta: screenerSessions[screenerId].blueprintMeta,
    };
  });

  return {
    challenge: {
      id: challenge.id,
      language,
      level: resolvedLevel,
      rtl: isRTL(language),
    },
    parts,
    blueprint: {
      screeners: Object.fromEntries(
        screenerIds.map((screenerId) => [screenerId, screenerSessions[screenerId].blueprint])
      ),
    },
    blueprintMeta: {
      screeners: Object.fromEntries(
        screenerIds.map((screenerId) => [screenerId, screenerSessions[screenerId].blueprintMeta])
      ),
      orderSignature: parts.map((part) => `${part.screener}:${part.step}`).join("|"),
    },
    currentPartIndex: 0,
    results: {},
    screenerSessions,
    startedAtIso: new Date().toISOString(),
    startedAtMs: performance.now(),
    pauseMs: 0,
    pauseStartedAt: null,
  };
}

export function getCurrentChallengePart(challengeSession) {
  return challengeSession.parts[challengeSession.currentPartIndex] || null;
}

export function getCurrentChallengeRuntime(challengeSession) {
  const part = getCurrentChallengePart(challengeSession);
  if (!part) {
    return null;
  }

  const screener = SCREENER_MAP[part.screenerId];
  const session = challengeSession.screenerSessions[part.screenerId];
  session.stepIndex = part.step;

  return {
    part,
    screener,
    session,
  };
}

export function getChallengeProgress(challengeSession, language = "en") {
  const current = challengeSession.currentPartIndex + 1;
  const total = challengeSession.parts.length;
  const part = getCurrentChallengePart(challengeSession);
  const t = getLabels(language);
  const text = t.taskOf(current, total);
  return {
    label: part ? `${t.domainLabels?.[part.sourceDomain] || part.sourceDomain}` : text,
    text,
    percent: total ? (current / total) * 100 : 0,
  };
}

export function hasPreviousChallengePart(challengeSession) {
  return challengeSession.currentPartIndex > 0;
}

export function advanceChallenge(challengeSession) {
  challengeSession.currentPartIndex += 1;
  return challengeSession.currentPartIndex >= challengeSession.parts.length;
}

export function retreatChallenge(challengeSession) {
  challengeSession.currentPartIndex = Math.max(0, challengeSession.currentPartIndex - 1);
}

export function finalizeChallenge({ challengeSession, profile, lessonContext, language = "en" }) {
  const challenge = getChallengeDefinition(challengeSession.challenge.id);
  const screenerIdsInOrder = [...new Set(challenge.steps.map((step) => getScreenerId(step.screener)))];
  const signals = [];
  let nextProfile = profile;

  screenerIdsInOrder.forEach((screenerId) => {
    const screener = SCREENER_MAP[screenerId];
    const session = challengeSession.screenerSessions[screenerId];
    const contextBundle = getContextBundle(screener.domain, lessonContext);
    const completedAt = new Date().toISOString();
    const interpretation = screener.finalize(session, contextBundle, nextProfile);
    interpretation.rawMetrics = {
      ...interpretation.rawMetrics,
      blueprintMeta: interpretation.blueprintMeta,
    };
    const signal = buildSupportSignal({
      screener,
      interpretation,
      profile: nextProfile,
      contextBundle,
      startedAt: session.startedAtIso || challengeSession.startedAtIso,
      completedAt,
      language,
    });

    nextProfile = updateSupportProfile(nextProfile, signal);
    challengeSession.results[screenerId] = {
      screenerId,
      interpretation,
      signal,
      blueprintMeta: session.blueprintMeta,
    };
    signals.push(signal);
  });

  return {
    profile: nextProfile,
    challengeResult: {
      challengeId: challenge.id,
      signals,
      involvedDomains: [...new Set(signals.map((signal) => signal.domain))],
      blueprintMeta: challengeSession.blueprintMeta,
    },
  };
}
