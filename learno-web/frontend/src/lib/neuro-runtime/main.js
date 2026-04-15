import { mockLessonContext, mockStudent, getContextBundle } from "./core/context.js";
import { DEFAULT_STUDENT_ID } from "./core/constants.js";
import { createSupportProfile } from "./core/models.js";
import {
  buildSupportSignal,
  formatClock,
  updateSupportProfile,
} from "./core/supportEngine.js";
import {
  loadSupportProfile,
  loadUiPreferences,
  saveSupportProfile,
  saveUiPreferences,
  resetSupportProfile,
} from "./core/storage.js";
import {
  renderAssessmentShell,
  renderChallengeResultView,
  renderResultView,
  renderScreenerShell,
  renderSuiteHome,
} from "./ui/components.js";
import { applyTheme } from "./ui/theme.js";
import { SCREENERS, SCREENER_MAP } from "./screeners/index.js";
import { getLabels, isRTL } from "./core/i18n.js";
import { CHALLENGE_DEFINITIONS } from "./challenges/definitions.js";
import {
  advanceChallenge,
  createChallengeSession,
  finalizeChallenge,
  getChallengeDefinition,
  getChallengeMeta,
  getChallengeProgress,
  getCurrentChallengeRuntime,
  hasPreviousChallengePart,
  retreatChallenge,
} from "./challenges/runner.js";

let app;
let suiteEyebrow;
let suiteTitle;
let suiteSubtitle;
let stepLabel;
let progressText;
let progressBar;
let progressTrack;
let pauseToggle;
let pauseOverlay;
let resumeButton;
let elapsedTime;
let elapsedLabel;
let announcer;
let ageSelect;
let schoolCycleSelect;
let languageSelect;
let ageLabelText;
let schoolCycleLabelText;

let announceTimeoutId = null;

const storedPreferences = loadUiPreferences();

const state = {
  view: "home",
  language: storedPreferences.language || "en",
  student: {
    ...mockStudent,
    age: storedPreferences.age || 14,
    schoolCycle: storedPreferences.schoolCycle || "",
  },
  lessonContext: mockLessonContext,
  profile: loadSupportProfile(DEFAULT_STUDENT_ID),
  currentSignal: null,
  currentChallengeResult: null,
  activeScreenerId: null,
  activeChallengeId: null,
  session: null,
  challengeSession: null,
  isPaused: false,
  keyBindings: [],
};

if (!state.profile.student_id) {
  state.profile = createSupportProfile(DEFAULT_STUDENT_ID);
}

state.currentSignal = state.profile.signals.at(-1) || null;

function bindDom() {
  app = document.getElementById("app");
  suiteEyebrow = document.getElementById("suiteEyebrow");
  suiteTitle = document.getElementById("suiteTitle");
  suiteSubtitle = document.getElementById("suiteSubtitle");
  stepLabel = document.getElementById("stepLabel");
  progressText = document.getElementById("progressText");
  progressBar = document.getElementById("progressBar");
  progressTrack = document.querySelector(".progress-track[role='progressbar']");
  pauseToggle = document.getElementById("pauseToggle");
  pauseOverlay = document.getElementById("pauseOverlay");
  resumeButton = document.getElementById("resumeButton");
  elapsedTime = document.getElementById("elapsedTime");
  elapsedLabel = document.getElementById("elapsedLabel");
  announcer = document.getElementById("announcer");
  ageSelect = document.getElementById("ageSelect");
  schoolCycleSelect = document.getElementById("schoolCycleSelect");
  languageSelect = document.getElementById("languageSelect");
  ageLabelText = document.getElementById("ageLabelText");
  schoolCycleLabelText = document.getElementById("schoolCycleLabelText");
}

export function initApp() {
  if (typeof window === "undefined") {
    return;
  }

  if (window.__LEARNO_APP_INITIALIZED__) {
    return;
  }

  bindDom();
  if (!app) {
    return;
  }

  window.__LEARNO_APP_INITIALIZED__ = true;
  languageSelect.value = state.language;
  ageSelect.value = String(state.student.age);
  if (schoolCycleSelect) {
    schoolCycleSelect.value = state.student.schoolCycle || "";
  }

  languageSelect.addEventListener("change", () => {
    state.language = languageSelect.value;
    document.documentElement.lang = state.language;
    document.documentElement.dir = isRTL(state.language) ? "rtl" : "ltr";
    persistUiPreferences();
    render();
  });

  ageSelect.addEventListener("change", () => {
    state.student = { ...state.student, age: Number(ageSelect.value) };
    persistUiPreferences();
  });

  schoolCycleSelect?.addEventListener("change", () => {
    state.student = { ...state.student, schoolCycle: schoolCycleSelect.value };
    persistUiPreferences();
  });

  pauseToggle.addEventListener("click", togglePause);
  resumeButton.addEventListener("click", resumeSession);
  window.addEventListener("keydown", handleGlobalKeydown);
  window.setInterval(updateElapsedClock, 200);

  applyTheme("adaptive-sanctuary");
  document.documentElement.lang = state.language;
  document.documentElement.dir = isRTL(state.language) ? "rtl" : "ltr";
  render();
}

function setProgress(percent, text) {
  const normalizedPercent = Math.max(0, Math.min(100, Number(percent) || 0));
  progressBar.style.width = `${normalizedPercent}%`;

  if (progressTrack) {
    progressTrack.setAttribute("aria-valuenow", String(normalizedPercent));
    progressTrack.setAttribute("aria-valuetext", text);
  }
}

function persistUiPreferences() {
  saveUiPreferences({
    language: state.language,
    age: state.student.age,
    schoolCycle: state.student.schoolCycle,
  });
}

function handleGlobalKeydown(event) {
  if (state.isPaused) {
    return;
  }

  state.keyBindings.forEach((binding) => {
    if (binding.keys.includes(event.code)) {
      event.preventDefault();
      binding.handler();
    }
  });
}

function clearKeyBindings() {
  state.keyBindings = [];
}

function bindKeys(keys, handler) {
  state.keyBindings.push({ keys, handler });
}

function startScreener(screenerId) {
  const screener = SCREENER_MAP[screenerId];
  const session = screener.createSession({
    level: state.student.schoolCycle || undefined,
    age: state.student.age,
    language: state.language,
    seed: undefined,
    recentHistory: state.profile.signals
      .filter((signal) => signal.screener_id === screenerId)
      .map((signal) => signal.raw_metrics?.blueprintMeta || signal.blueprintMeta)
      .filter(Boolean)
      .slice(-5)
      .reverse(),
  });
  state.activeScreenerId = screenerId;
  state.activeChallengeId = null;
  state.challengeSession = null;
  state.currentChallengeResult = null;
  state.session = {
    ...session,
    startedAtIso: session.startedAtIso || new Date().toISOString(),
    startedAtMs: performance.now(),
    pauseMs: 0,
    pauseStartedAt: null,
  };
  state.view = "screener";
  state.isPaused = false;
  clearKeyBindings();
  announce(getLabels(state.language).announceStarted(screener.getLocalizedMeta ? screener.getLocalizedMeta(state.language).name : screener.studentSafeName));
  render();
}

function startChallenge(challengeId) {
  const challenge = getChallengeDefinition(challengeId);
  state.activeChallengeId = challengeId;
  state.activeScreenerId = null;
  state.currentSignal = null;
  state.currentChallengeResult = null;
  state.challengeSession = createChallengeSession({
    challengeId,
    age: state.student.age,
    level: state.student.schoolCycle || undefined,
    language: state.language,
    profile: state.profile,
  });
  state.session = null;
  state.view = "challenge";
  state.isPaused = false;
  clearKeyBindings();
  announce(getLabels(state.language).announceStarted(getChallengeMeta(challenge, state.language).name));
  render();
}

function togglePause() {
  if (!["screener", "challenge"].includes(state.view)) {
    return;
  }

  if (state.isPaused) {
    resumeSession();
    return;
  }

  state.isPaused = true;
  const activeSession = state.view === "challenge" ? state.challengeSession : state.session;
  activeSession.pauseStartedAt = performance.now();
  if (state.view === "screener") {
    const screener = SCREENER_MAP[state.activeScreenerId];
    screener.onPause?.(state.session);
  }
  if (state.view === "challenge") {
    const runtime = getCurrentChallengeRuntime(state.challengeSession);
    runtime?.screener.onPause?.(runtime.session);
  }
  updateChrome();
  announce(getLabels(state.language).announcePaused);
}

function resumeSession() {
  const activeSession = state.view === "challenge" ? state.challengeSession : state.session;
  if (!state.isPaused || !activeSession?.pauseStartedAt) {
    return;
  }

  const pauseDuration = performance.now() - activeSession.pauseStartedAt;
  activeSession.pauseMs += pauseDuration;
  activeSession.pauseStartedAt = null;
  state.isPaused = false;
  if (state.view === "screener") {
    const screener = SCREENER_MAP[state.activeScreenerId];
    screener.onResume?.(state.session, buildHelpers(screener));
  }
  if (state.view === "challenge") {
    const runtime = getCurrentChallengeRuntime(state.challengeSession);
    runtime?.screener.onResume?.(runtime.session, buildChallengeHelpers(runtime.screener));
  }
  updateChrome();
  render();
  announce(getLabels(state.language).announceResumed);
}

function cancelToHome() {
  state.activeScreenerId = null;
  state.activeChallengeId = null;
  state.session = null;
  state.challengeSession = null;
  state.isPaused = false;
  clearKeyBindings();
  state.view = "home";
  render();
}

function completeActiveScreener() {
  const screener = SCREENER_MAP[state.activeScreenerId];
  const contextBundle = getContextBundle(screener.domain, state.lessonContext);
  const completedAt = new Date().toISOString();
  const interpretation = screener.finalize(state.session, contextBundle, state.profile);
  interpretation.rawMetrics = {
    ...interpretation.rawMetrics,
    blueprintMeta: interpretation.blueprintMeta,
  };
  const signal = buildSupportSignal({
    screener,
    interpretation,
    profile: state.profile,
    contextBundle,
    startedAt: state.session.startedAtIso,
    completedAt,
    language: state.language,
  });

  state.profile = updateSupportProfile(state.profile, signal);
  saveSupportProfile(state.profile);
  state.currentSignal = signal;
  state.activeScreenerId = null;
  state.session = null;
  state.isPaused = false;
  clearKeyBindings();
  state.view = "result";
  announce(getLabels(state.language).announceComplete(screener.getLocalizedMeta ? screener.getLocalizedMeta(state.language).name : screener.studentSafeName));
  render();
}

function getSessionElapsedMs() {
  const activeSession = state.view === "challenge" ? state.challengeSession : state.session;
  if (!activeSession?.startedAtMs) {
    return 0;
  }
  const currentTime = state.isPaused && activeSession.pauseStartedAt ? activeSession.pauseStartedAt : performance.now();
  return Math.max(0, currentTime - activeSession.startedAtMs - activeSession.pauseMs);
}

function updateElapsedClock() {
  elapsedTime.textContent = formatClock(getSessionElapsedMs());
}

function updateChrome() {
  const t = getLabels(state.language);

  if (state.view === "home") {
    suiteEyebrow.textContent = t.challengeLibraryEyebrow || t.suiteEyebrow;
    suiteTitle.textContent = t.challengeLibraryHeading || t.suiteTitle;
    suiteSubtitle.textContent = "";
    stepLabel.textContent = "";
    progressText.textContent = t.launchChallenge || t.suiteProgressText;
    setProgress(0, t.launchChallenge || t.suiteProgressText);
  }

  if (state.view === "result") {
    const signalScreener = state.currentSignal ? SCREENER_MAP[state.currentSignal.screener_id] : null;
    const localizedSignalName = signalScreener?.getLocalizedMeta
      ? signalScreener.getLocalizedMeta(state.language).name
      : state.currentSignal?.student_safe_name;
    suiteEyebrow.textContent = t.resultEyebrow;
    suiteTitle.textContent = localizedSignalName || t.suiteTitle;
    suiteSubtitle.textContent = t.resultSubtitle;
    stepLabel.textContent = t.resultStepLabel;
    progressText.textContent = t.resultProgressText;
    setProgress(100, t.resultProgressText);
  }

  if (state.view === "challenge-result") {
    const challenge = getChallengeDefinition(state.currentChallengeResult.challengeId);
    const challengeMeta = getChallengeMeta(challenge, state.language);
    suiteEyebrow.textContent = t.challengeResultEyebrow;
    suiteTitle.textContent = challengeMeta.name;
    suiteSubtitle.textContent = challengeMeta.description;
    stepLabel.textContent = t.resultStepLabel;
    progressText.textContent = t.resultProgressText;
    setProgress(100, t.resultProgressText);
  }

  if (state.view === "screener") {
    const screener = SCREENER_MAP[state.activeScreenerId];
    const progress = screener.getTaskMeta(state.session);
    const localizedMeta = screener.getLocalizedMeta ? screener.getLocalizedMeta(state.language) : { name: screener.studentSafeName, description: screener.description };
    suiteEyebrow.textContent = t.screenerEyebrow;
    suiteTitle.textContent = localizedMeta.name;
    suiteSubtitle.textContent = "";
    stepLabel.textContent = "";
    progressText.textContent = progress.text;
    setProgress(progress.percent, progress.text);
  }

  if (state.view === "challenge") {
    const challenge = getChallengeDefinition(state.activeChallengeId);
    const challengeMeta = getChallengeMeta(challenge, state.language);
    const progress = getChallengeProgress(state.challengeSession, state.language);
    suiteEyebrow.textContent = t.challengeFlowEyebrow;
    suiteTitle.textContent = challengeMeta.name;
    suiteSubtitle.textContent = "";
    stepLabel.textContent = "";
    progressText.textContent = progress.text;
    setProgress(progress.percent, progress.text);
  }

  // Update elapsed label
  if (elapsedLabel) {
    elapsedLabel.textContent = t.elapsed;
  }

  // Update age label
  if (ageLabelText) {
    ageLabelText.textContent = t.ageLabel;
  }

  if (schoolCycleLabelText) {
    schoolCycleLabelText.textContent = t.schoolCycleLabel;
  }

  if (schoolCycleSelect) {
    const options = schoolCycleSelect.options;
    if (options[0]) options[0].textContent = t.autoOption || "Auto";
    if (options[1]) options[1].textContent = t.cyclePrimary;
    if (options[2]) options[2].textContent = t.cycleCollege;
    if (options[3]) options[3].textContent = t.cycleLycee;
  }

  pauseToggle.hidden = !["screener", "challenge"].includes(state.view);
  pauseToggle.textContent = state.isPaused ? t.continue : t.pause;
  pauseOverlay.classList.toggle("hidden", !state.isPaused);
  pauseOverlay.setAttribute("aria-hidden", String(!state.isPaused));
}

function buildHelpers(screener) {
  return {
    update: () => renderActiveScreener(false),
    softUpdate: () => renderActiveScreener(false),
    next: () => {
      clearKeyBindings();
      state.session.stepIndex += 1;
      renderActiveScreener(true);
    },
    complete: completeActiveScreener,
    cancelToHome,
    announce,
    isPaused: () => state.isPaused,
    bindKey: (keys, handler) => bindKeys(keys, handler),
  };
}

function buildChallengeHelpers(screener) {
  return {
    update: () => renderActiveChallenge(false),
    softUpdate: () => renderActiveChallenge(false),
    next: () => {
      clearKeyBindings();
      if (advanceChallenge(state.challengeSession)) {
        completeActiveChallenge();
        return;
      }
      renderActiveChallenge(true);
    },
    complete: () => {
      clearKeyBindings();
      if (advanceChallenge(state.challengeSession)) {
        completeActiveChallenge();
        return;
      }
      renderActiveChallenge(true);
    },
    cancelToHome,
    announce,
    isPaused: () => state.isPaused,
    bindKey: (keys, handler) => bindKeys(keys, handler),
  };
}

function goToPreviousChallengeStep() {
  if (!hasPreviousChallengePart(state.challengeSession)) {
    return;
  }
  clearKeyBindings();
  retreatChallenge(state.challengeSession);
  renderActiveChallenge(true);
}

function completeActiveChallenge() {
  const challenge = getChallengeDefinition(state.activeChallengeId);
  const challengeMeta = getChallengeMeta(challenge, state.language);
  const outcome = finalizeChallenge({
    challengeSession: state.challengeSession,
    profile: state.profile,
    lessonContext: state.lessonContext,
    language: state.language,
  });

  state.profile = outcome.profile;
  saveSupportProfile(state.profile);
  state.currentSignal = outcome.challengeResult.signals.at(-1) || null;
  state.currentChallengeResult = outcome.challengeResult;
  state.activeScreenerId = null;
  state.activeChallengeId = null;
  state.session = null;
  state.challengeSession = null;
  state.isPaused = false;
  clearKeyBindings();
  state.view = "challenge-result";
  announce(getLabels(state.language).announceComplete(challengeMeta.name));
  render();
}

function getLocalizedSignalName(signal, language) {
  if (!signal) return "";
  const screener = SCREENER_MAP[signal.screener_id];
  if (screener?.getLocalizedMeta) {
    return screener.getLocalizedMeta(language).name;
  }
  return signal.student_safe_name || "";
}

function renderHome() {
  const t = getLabels(state.language);
  const challengeCards = CHALLENGE_DEFINITIONS.map((challenge) => {
    const meta = getChallengeMeta(challenge, state.language);
    return {
      id: challenge.id,
      ...meta,
      stepCount: challenge.steps.length,
    };
  });

  app.innerHTML = `
    ${renderSuiteHome({
      profile: state.profile,
      screeners: SCREENERS,
      challenges: challengeCards,
      lessonContext: state.lessonContext,
      language: state.language,
      screenerMap: SCREENER_MAP,
    })}
    <section class="section-stack">
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t.signalPreviewLabel}</p>
          <h3>${state.currentSignal ? t.latestSignalHeading : t.noSignalYet}</h3>
        </div>
        <p>${t.sharedSignalNote}</p>
      </div>
      ${
        state.currentSignal
          ? renderResultView({ signal: state.currentSignal, role: "support", language: state.language, screenerName: getLocalizedSignalName(state.currentSignal, state.language) })
          : `<article class="soft-panel large"><p>${t.noSignalEmptyState}</p></article>`
      }
      <div class="task-toolbar home-actions">
        <button class="secondary-button" type="button" data-reset-profile>${t.resetDemoProfile}</button>
      </div>
    </section>
  `;

  app.querySelectorAll("[data-open-challenge]").forEach((button) => {
    button.addEventListener("click", () => startChallenge(button.dataset.openChallenge));
  });

  app.querySelectorAll("[data-view-signal]").forEach((button) => {
    button.addEventListener("click", () => {
      const signal = state.profile.signals.find((entry) => entry.timestamp === button.dataset.viewSignal);
      if (signal) {
        state.currentSignal = signal;
        render();
      }
    });
  });

  app.querySelector("[data-reset-profile]").addEventListener("click", () => {
    state.profile = resetSupportProfile(DEFAULT_STUDENT_ID);
    state.currentSignal = null;
    render();
    announce(getLabels(state.language).announceProfileReset);
  });
}

function renderResult() {
  const t = getLabels(state.language);

  app.innerHTML = `
    <section class="section-stack">
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t.roleBasedOutput}</p>
          <h3>${getLocalizedSignalName(state.currentSignal, state.language)}</h3>
        </div>
        <p>${t.signalAvailableNote}</p>
      </div>
      ${renderResultView({ signal: state.currentSignal, role: "support", language: state.language, screenerName: getLocalizedSignalName(state.currentSignal, state.language) })}
      <div class="task-toolbar home-actions">
        <button class="secondary-button" type="button" data-back-suite>${t.backToSuite}</button>
        <button class="primary-button" type="button" data-rerun-screener>${t.runAgain}</button>
      </div>
    </section>
  `;

  app.querySelector("[data-back-suite]").addEventListener("click", () => {
    state.view = "home";
    render();
  });
  app.querySelector("[data-rerun-screener]").addEventListener("click", () => {
    startScreener(state.currentSignal.screener_id);
  });
}

function renderChallengeResult() {
  const t = getLabels(state.language);
  const challenge = getChallengeDefinition(state.currentChallengeResult.challengeId);
  const challengeMeta = getChallengeMeta(challenge, state.language);

  app.innerHTML = `
    <section class="section-stack">
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t.challengeResultEyebrow}</p>
          <h3>${challengeMeta.name}</h3>
        </div>
      </div>
      ${renderChallengeResultView({
        challengeResult: state.currentChallengeResult,
        challengeName: challengeMeta.name,
        language: state.language,
        screenerMap: SCREENER_MAP,
      })}
      <div class="task-toolbar home-actions">
        <button class="secondary-button" type="button" data-back-suite>${t.backToSuite}</button>
        <button class="primary-button" type="button" data-rerun-challenge>${t.launchChallenge}</button>
      </div>
    </section>
  `;

  app.querySelector("[data-back-suite]").addEventListener("click", () => {
    state.view = "home";
    render();
  });
  app.querySelector("[data-rerun-challenge]").addEventListener("click", () => {
    startChallenge(state.currentChallengeResult.challengeId);
  });
}

function renderActiveScreener(forceShell = true) {
  const screener = SCREENER_MAP[state.activeScreenerId];
  if (!screener) {
    return;
  }

  state.session.language = state.language;
  state.session.rtl = isRTL(state.language);

  const t = getLabels(state.language);
  const taskMeta = screener.getTaskMeta(state.session);
  updateChrome();

  if (forceShell || !document.getElementById("taskSlot")) {
    app.innerHTML = renderScreenerShell({
      screener,
      taskMeta,
      progress: taskMeta,
      elapsedMs: getSessionElapsedMs(),
      language: state.language,
    });
  } else {
    const taskLabelEl = app.querySelector(".progress-panel-inline .section-label");
    const taskText = app.querySelector(".progress-panel-inline strong");
    const fluidTrack = app.querySelector(".fluid-track span");
    const elapsedChip = app.querySelector("[data-session-elapsed]");

    if (taskLabelEl) {
      taskLabelEl.textContent = taskMeta.label;
    }
    if (taskText) {
      taskText.textContent = taskMeta.text;
    }
    if (fluidTrack) {
      fluidTrack.style.width = `${taskMeta.percent}%`;
    }
    if (elapsedChip) {
      elapsedChip.textContent = `${t.elapsed} ${formatClock(getSessionElapsedMs())}`;
    }
  }

  clearKeyBindings();
  const slot = document.getElementById("taskSlot");
  screener.render(state.session, slot, buildHelpers(screener));
}

function renderActiveChallenge(forceShell = true) {
  const runtime = getCurrentChallengeRuntime(state.challengeSession);
  if (!runtime) {
    return;
  }

  state.challengeSession.challenge.language = state.language;
  state.challengeSession.challenge.rtl = isRTL(state.language);
  Object.values(state.challengeSession.screenerSessions || {}).forEach((session) => {
    session.language = state.language;
    session.rtl = isRTL(state.language);
  });

  const challenge = getChallengeDefinition(state.activeChallengeId);
  const challengeMeta = getChallengeMeta(challenge, state.language);
  const progress = getChallengeProgress(state.challengeSession, state.language);
  updateChrome();

  if (forceShell || !document.getElementById("taskSlot")) {
    app.innerHTML = renderAssessmentShell({
      eyebrow: "",
      title: challengeMeta.name,
      badges: [],
      taskMeta: progress,
      progress,
      elapsedMs: getSessionElapsedMs(),
      durationLabel: challengeMeta.durationLabel,
      language: state.language,
    });
  } else {
    const taskLabelEl = app.querySelector(".progress-panel-inline .section-label");
    const taskText = app.querySelector(".progress-panel-inline strong");
    const fluidTrack = app.querySelector(".fluid-track span");
    const elapsedChip = app.querySelector("[data-session-elapsed]");

    if (taskLabelEl) {
      taskLabelEl.textContent = progress.label;
    }
    if (taskText) {
      taskText.textContent = progress.text;
    }
    if (fluidTrack) {
      fluidTrack.style.width = `${progress.percent}%`;
    }
    if (elapsedChip) {
      elapsedChip.textContent = `${getLabels(state.language).elapsed} ${formatClock(getSessionElapsedMs())}`;
    }
  }

  clearKeyBindings();
  const slot = document.getElementById("taskSlot");
  runtime.screener.render(runtime.session, slot, buildChallengeHelpers(runtime.screener));
  slot.querySelectorAll("[data-back]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      goToPreviousChallengeStep();
    });
    button.disabled = !hasPreviousChallengePart(state.challengeSession);
  });
}

function render() {
  updateChrome();

  if (state.view === "home") {
    renderHome();
    return;
  }

  if (state.view === "result") {
    renderResult();
    return;
  }

  if (state.view === "challenge-result") {
    renderChallengeResult();
    return;
  }

  if (state.view === "challenge") {
    renderActiveChallenge(true);
    return;
  }

  renderActiveScreener(true);
}

function announce(message) {
  if (announceTimeoutId) {
    window.clearTimeout(announceTimeoutId);
  }

  announcer.textContent = "";
  announceTimeoutId = window.setTimeout(() => {
    announcer.textContent = message;
  }, 10);
}
