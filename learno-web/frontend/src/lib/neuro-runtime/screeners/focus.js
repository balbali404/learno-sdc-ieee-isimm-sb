import {
  average,
  clamp,
  round,
  safeRatio,
  standardDeviation,
} from "../core/supportEngine.js";
import { INDICATORS } from "../core/constants.js";
import { resolveLearnerLevel } from "../core/levels.js";
import { createBlueprintFromPool, resolveLocalizedItem } from "../core/blueprint.js";
import { isRTL, getLabels } from "../core/i18n.js";
import {
  SELECTIVE_TERMS_POOL,
  GO_NO_GO_POOL,
  MEMORY_SEQUENCE_POOL,
  MULTISTEP_POOL,
  SELECTIVE_TERMS_POOL_EARLY,
  GO_NO_GO_POOL_EARLY,
  MEMORY_SEQUENCE_POOL_EARLY,
  MULTISTEP_POOL_EARLY,
  SELECTIVE_TERMS_POOL_SECONDARY,
  GO_NO_GO_POOL_SECONDARY,
  MEMORY_SEQUENCE_POOL_SECONDARY,
  MULTISTEP_POOL_SECONDARY,
  SELECTIVE_TERMS_POOL_ADVANCED,
  GO_NO_GO_POOL_ADVANCED,
  MEMORY_SEQUENCE_POOL_ADVANCED,
  MULTISTEP_POOL_ADVANCED,
} from "./banks/focus.bank.js";

function scheduleAfterPaint(action) {
  window.requestAnimationFrame(() => {
    action();
  });
}

const ATTENTION_INDICATORS = INDICATORS.attention;

const GO_STIMULUS_MS = 700;
const GO_GAP_MS = 250;

function getFocusPools(level) {
  if (level === "early") {
    return {
      selective: SELECTIVE_TERMS_POOL_EARLY,
      gng:       GO_NO_GO_POOL_EARLY,
      memory:    MEMORY_SEQUENCE_POOL_EARLY,
      multistep: MULTISTEP_POOL_EARLY,
    };
  }
  if (level === "secondary") {
    return {
      selective: SELECTIVE_TERMS_POOL_SECONDARY,
      gng:       GO_NO_GO_POOL_SECONDARY,
      memory:    MEMORY_SEQUENCE_POOL_SECONDARY,
      multistep: MULTISTEP_POOL_SECONDARY,
    };
  }
  if (level === "advanced") {
    return {
      selective: SELECTIVE_TERMS_POOL_ADVANCED,
      gng:       GO_NO_GO_POOL_ADVANCED,
      memory:    MEMORY_SEQUENCE_POOL_ADVANCED,
      multistep: MULTISTEP_POOL_ADVANCED,
    };
  }
  // default: middle
  return {
    selective: SELECTIVE_TERMS_POOL,
    gng:       GO_NO_GO_POOL,
    memory:    MEMORY_SEQUENCE_POOL,
    multistep: MULTISTEP_POOL,
  };
}

function createTaskBaseState() {
  return {
    startedAt: null,
    completedAt: null,
    pauseMs: 0,
    pausedAt: null,
    firstActionAt: null,
  };
}

function ensureStarted(task) {
  if (!task.startedAt) {
    task.startedAt = performance.now();
  }
}

function getElapsed(task) {
  if (!task.startedAt) {
    return 0;
  }
  const currentTime = task.completedAt || task.pausedAt || performance.now();
  return Math.max(0, currentTime - task.startedAt - task.pauseMs);
}

function pauseTask(task) {
  if (task.startedAt && !task.pausedAt) {
    task.pausedAt = performance.now();
  }
}

function resumeTask(task) {
  if (task.pausedAt) {
    task.pauseMs += performance.now() - task.pausedAt;
    task.pausedAt = null;
  }
}

function shuffle(items) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

/**
 * Focus Check preserves the intended paradigms explicitly:
 * - CPT-style sustained attention logic through a continuous target stream
 * - Go/No-Go inhibition logic through target / non-target response control
 * - Working-memory / sequencing logic through order reconstruction
 * - Multi-step instruction handling through staged academic instructions
 *
 * Layer separation:
 * - Task layer: click, select, order, respond
 * - Measurement layer: omissions, commissions, hesitation, timing, retries
 * - Interpretation layer: normalized sub-scores and supportive indicators in finalize()
 */
export const focusScreener = {
  id: "focus-check",
  name: "Focus Check",
  studentSafeName: "Focus Check",
  domain: "attention",
  durationLabel: "3-5 min",
  description:
    "CPT-style sustained attention, Go/No-Go inhibition, working-memory sequencing, and multi-step academic follow-through.",
  scientificParadigms: [
    "CPT-style sustained attention",
    "Go/No-Go inhibition",
    "Working-memory sequencing",
    "Multi-step instruction handling",
  ],

  createSession({ level, age, language, seed, recentHistory } = {}) {
    const resolvedLevel = resolveLearnerLevel({ level, age });
    const resolvedLang = language || "en";

    const pools = getFocusPools(resolvedLevel);

    const bp = createBlueprintFromPool(pools, {
      seed,
      recentHistory,
      language: resolvedLang,
      slotOrder: ["selective", "gng", "memory", "multistep"],
    });

    const content = {
      selective: resolveLocalizedItem(bp.items.selective, resolvedLang),
      gng:       resolveLocalizedItem(bp.items.gng,       resolvedLang),
      memory:    resolveLocalizedItem(bp.items.memory,    resolvedLang),
      multistep: resolveLocalizedItem(bp.items.multistep, resolvedLang),
    };

    return {
      blueprint:     bp,
      blueprintMeta: bp.meta,
      level:         resolvedLevel,
      language:      bp.language,
      rtl:           isRTL(bp.language),
      content,
      stepIndex: 0,
      startedAtIso: new Date().toISOString(),
      selective: {
        ...createTaskBaseState(),
        terms:      content.selective.items,   // [{id, label, isTarget}]
        selections: new Set(),
      },
      goNoGo: {
        ...createTaskBaseState(),
        sequence:   content.gng.sequence,      // string[]
        target:     content.gng.target,        // "X"
        phase: "intro",
        currentIndex: 0,
        currentStimulus: "",
        currentTrial: null,
        trialStartedAt: null,
        reactionTimes: [],
        omissions: 0,
        commissions: 0,
        falseAlarms: 0,
        trials: [],
        timeouts: {
          hide: null,
          advance: null,
        },
      },
      memory: {
        ...createTaskBaseState(),
        sequence:          content.memory.steps,  // string[]
        phase: "intro",
        memorizeMs: 6500,
        memorizeRemainingMs: 6500,
        memorizeStartedAt: null,
        memorizeTimeout: null,
        countdownInterval: null,
        recallStartedAt: null,
        answer: [],
        retries: 0,
        shuffled: shuffle(content.memory.steps),
      },
      multistep: {
        ...createTaskBaseState(),
        scenario:  content.multistep,            // {note, mainIdeaOptions, order, titleOptions}
        mainIdea: null,
        order: [],
        title: null,
        restarts: 0,
        outOfSequenceAttempts: 0,
        notice: getLabels(resolvedLang).focusMultistepInstruction || "Follow the steps in order. Step 1 is active first.",
      },
    };
  },

  getLocalizedMeta(language) {
    const t = getLabels(language);
    return {
      name:        t.focusScreenerName,
      description: t.focusScreenerDescription,
      durationLabel: t.focusScreenerDuration,
      paradigms: [t.focusParadigm1, t.focusParadigm2, t.focusParadigm3, t.focusParadigm4],
    };
  },

  getTaskMeta(session) {
    const t = getLabels(session.language);
    const labels = [
      t.focusTask1Label,
      t.focusTask2Label,
      t.focusTask3Label,
      t.focusTask4Label,
    ];

    return {
      label: labels[session.stepIndex] || t.focusTitle,
      text: t.taskOf(session.stepIndex + 1, 4),
      percent: ((session.stepIndex + 1) / 4) * 100,
    };
  },

  render(session, slot, helpers) {
    const step = session.stepIndex;
    if (step === 0) {
      renderSelectiveAttention(session, slot, helpers);
      return;
    }

    if (step === 1) {
      renderGoNoGo(session, slot, helpers);
      return;
    }

    if (step === 2) {
      renderMemory(session, slot, helpers);
      return;
    }

    renderMultiStep(session, slot, helpers);
  },

  onPause(session) {
    const currentStep = session.stepIndex;
    if (currentStep === 1) {
      pauseGoNoGo(session.goNoGo);
    }

    if (currentStep === 2) {
      pauseMemory(session.memory);
    }
  },

  onResume(session, helpers) {
    const currentStep = session.stepIndex;
    if (currentStep === 1) {
      resumeGoNoGo(session.goNoGo, helpers);
    }

    if (currentStep === 2) {
      resumeMemory(session.memory, helpers);
    }
  },

  finalize(session, _contextBundle = null, _profile = null) {
    const selectiveMetrics = measureSelective(session.selective);
    const goNoGoMetrics = measureGoNoGo(session.goNoGo);
    const memoryMetrics = measureMemory(session.memory);
    const multistepMetrics = measureMultistep(session.multistep);

    const responseTimeVariability = goNoGoMetrics.reaction_time_variability_ms;
    const hesitationAverage = average([
      selectiveMetrics.hesitation_before_first_action_ms,
      memoryMetrics.hesitation_before_first_action_ms,
      multistepMetrics.hesitation_before_first_action_ms,
    ]);
    const earlyPerformance = average([selectiveMetrics.performance, goNoGoMetrics.performance]);
    const latePerformance = average([memoryMetrics.performance, multistepMetrics.performance]);
    const performanceDrop = clamp((earlyPerformance - latePerformance) * 100);

    const accuracyPerformance = average([
      selectiveMetrics.performance,
      memoryMetrics.performance,
      multistepMetrics.instruction_completion_accuracy,
    ]);
    const accuracyScore = round(clamp((1 - accuracyPerformance) * 100));

    const omissionRate = safeRatio(goNoGoMetrics.omissions, goNoGoMetrics.target_count);
    const commissionRate = safeRatio(goNoGoMetrics.commissions, goNoGoMetrics.non_target_count);
    const slowResponsePenalty = clamp(((goNoGoMetrics.mean_reaction_time_ms - 620) / 260) * 15, 0, 15);
    const falseAlarmPenalty = Math.min(goNoGoMetrics.false_alarms * 3, 15);
    const inhibitionScore = round(
      clamp(omissionRate * 45 + commissionRate * 40 + slowResponsePenalty + falseAlarmPenalty)
    );

    const variabilityDifficulty = clamp((responseTimeVariability / 220) * 100);
    const hesitationDifficulty = clamp(((hesitationAverage - 800) / 2800) * 100);
    const consistencyScore = round(
      clamp(variabilityDifficulty * 0.45 + performanceDrop * 0.35 + hesitationDifficulty * 0.2)
    );

    const multistepScore = round(
      clamp(
        (1 - multistepMetrics.instruction_completion_accuracy) * 70 +
          (1 - multistepMetrics.sequence_correctness) * 20 +
          Math.min(multistepMetrics.restarts * 5 + multistepMetrics.out_of_sequence_attempts * 2.5, 10)
      )
    );

    const finalScore = round(
      clamp(0.35 * accuracyScore + 0.25 * inhibitionScore + 0.2 * consistencyScore + 0.2 * multistepScore)
    );

    const indicators = [];
    if (finalScore >= 60) {
      indicators.push(ATTENTION_INDICATORS[0]);
    }
    if (performanceDrop >= 20 || consistencyScore >= 60) {
      indicators.push(ATTENTION_INDICATORS[1]);
    }
    if (multistepScore >= 55) {
      indicators.push(ATTENTION_INDICATORS[2]);
    }

    return {
      rawMetrics: {
        selective_attention: selectiveMetrics,
        go_no_go: goNoGoMetrics,
        working_memory_sequence: memoryMetrics,
        multi_step_instruction: multistepMetrics,
        omission_count: goNoGoMetrics.omissions,
        commission_count: goNoGoMetrics.commissions,
        response_time_variability_ms: responseTimeVariability,
        performance_drop_between_early_and_late_tasks: round(performanceDrop),
      },
      subScores: {
        accuracy_score: accuracyScore,
        inhibition_score: inhibitionScore,
        consistency_score: consistencyScore,
        multistep_score: multistepScore,
      },
      finalScore,
      indicators,
      contextSignals: {
        paradigm_alignment: this.scientificParadigms,
        omission_count: goNoGoMetrics.omissions,
        commission_count: goNoGoMetrics.commissions,
        response_time_variability_ms: responseTimeVariability,
      },
      studentSafeFeedback: [
        getLabels(session.language).studentFeedbackThanks || "Thanks. This helps personalize your support.",
        multistepScore >= 45
          ? (getLabels(session.language).studentFeedbackStepByStep || "A step-by-step version can be offered next time.")
          : (getLabels(session.language).studentFeedbackFocusMode || "Focus Mode is available for your next activity."),
      ],
      teacherMetrics: {
        omission_count: goNoGoMetrics.omissions,
        commission_count: goNoGoMetrics.commissions,
        response_time_variability_ms: round(responseTimeVariability),
        performance_drop_percent: round(performanceDrop),
        multistep_score: multistepScore,
      },
      blueprintMeta: session.blueprintMeta,
    };
  },
};

function renderSelectiveAttention(session, slot, helpers) {
  const t = getLabels(session.language);
  const task = session.selective;
  ensureStarted(task);

  slot.innerHTML = `
    <article class="task-card" ${session.rtl ? 'dir="rtl"' : ""}>
      <div class="task-card-header">
        <p class="eyebrow">${t.focusTitle}</p>
        <h3>${t.focusSelectiveInstruction}</h3>
        <p>${t.taskBasis}</p>
      </div>

      <div class="soft-note">
        <strong>${t.taskBasis}</strong>
        <p>${t.focusSelectiveInstruction}</p>
      </div>

      <div class="token-grid two-up">
        ${task.terms.map(
          (item) => `
            <button
              class="token-button ${task.selections.has(item.id) ? "is-selected" : ""}"
              type="button"
              data-term-id="${item.id}"
              aria-pressed="${task.selections.has(item.id)}"
            >
              ${item.label}
            </button>
          `
        ).join("")}
      </div>

      <div class="task-toolbar">
        <span class="info-pill" data-selection-count>${t.partOf(task.selections.size, task.terms.length)}</span>
        <div class="action-row compact">
          <button class="secondary-button" type="button" data-back disabled>${t.back}</button>
          <button class="primary-button" type="button" data-save-selective ${task.selections.size ? "" : "disabled"}>${t.saveAndContinue}</button>
        </div>
      </div>
    </article>
  `;

  slot.querySelectorAll("[data-term-id]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!task.firstActionAt) {
        task.firstActionAt = performance.now();
      }
      const termId = button.dataset.termId;
      const isSelected = task.selections.has(termId);
      if (isSelected) {
        task.selections.delete(termId);
      } else {
        task.selections.add(termId);
      }
      button.classList.toggle("is-selected", !isSelected);
      button.setAttribute("aria-pressed", String(!isSelected));

      const selectionCount = slot.querySelector("[data-selection-count]");
      if (selectionCount) {
        selectionCount.textContent = t.partOf(task.selections.size, task.terms.length);
      }

      const saveButton = slot.querySelector("[data-save-selective]");
      if (saveButton) {
        saveButton.disabled = task.selections.size === 0;
      }
    });
  });

  slot.querySelector("[data-save-selective]").addEventListener("click", () => {
    task.completedAt = performance.now();
    helpers.next();
  });
}

function renderGoNoGo(session, slot, helpers) {
  const t = getLabels(session.language);
  const task = session.goNoGo;
  ensureStarted(task);

  if (task.phase === "intro") {
    slot.innerHTML = `
      <article class="task-card" ${session.rtl ? 'dir="rtl"' : ""}>
        <div class="task-card-header">
          <p class="eyebrow">${t.focusTitle}</p>
          <h3>${t.focusGoNoGoInstruction}</h3>
          <p>${t.taskBasis}</p>
        </div>

        <div class="soft-note">
          <strong>${t.taskBasis}</strong>
          <p>${t.focusGoNoGoInstruction}</p>
        </div>

        <div class="mini-stat-row">
          <div class="mini-panel"><span class="section-label">${t.respondButton}</span><strong>${task.target}</strong></div>
          <div class="mini-panel"><span class="section-label">${t.focusCardsLabel}</span><strong>${task.sequence.length}</strong></div>
        </div>

        <div class="task-toolbar">
          <span class="info-pill">${t.respondOnly(task.target)}</span>
          <div class="action-row compact">
            <button class="secondary-button" type="button" data-back>${t.back}</button>
            <button class="primary-button" type="button" data-start-go>${t.startSequence}</button>
          </div>
        </div>
      </article>
    `;

    slot.querySelector("[data-start-go]").addEventListener("click", () => {
      task.phase = "running";
      helpers.update();
      scheduleGoNoGo(task, helpers);
    });
    slot.querySelector("[data-back]").addEventListener("click", () => {
      if (session.stepIndex > 0) { session.stepIndex -= 1; helpers.update(); }
    });
    return;
  }

  if (task.phase === "done") {
    slot.innerHTML = `
      <article class="task-card">
        <div class="task-card-header">
          <p class="eyebrow">${t.focusTitle}</p>
          <h3>${t.taskSaved}</h3>
          <p>${t.sharedSignalNote || ""}</p>
        </div>
        <div class="mini-stat-row">
          <div class="mini-panel"><span class="section-label">${t.focusOmissionsLabel}</span><strong>${task.omissions}</strong></div>
          <div class="mini-panel"><span class="section-label">${t.focusCommissionsLabel}</span><strong>${task.commissions}</strong></div>
          <div class="mini-panel"><span class="section-label">${t.focusVariabilityLabel}</span><strong>${round(standardDeviation(task.reactionTimes))} ms</strong></div>
        </div>
        <div class="task-toolbar">
          <button class="secondary-button" type="button" data-back>${t.back}</button>
          <button class="primary-button" type="button" data-next-step>${t.continue}</button>
        </div>
      </article>
    `;

    slot.querySelector("[data-next-step]").addEventListener("click", helpers.next);
    slot.querySelector("[data-back]").addEventListener("click", () => {
      if (session.stepIndex > 0) { session.stepIndex -= 1; helpers.update(); }
    });
    return;
  }

  slot.innerHTML = `
    <article class="task-card center-card">
      <div class="task-card-header compact">
        <p class="eyebrow">${t.focusTitle}</p>
        <h3>${t.respondOnly(task.target)}</h3>
      </div>

      <div class="stimulus-board ${task.currentStimulus ? "is-active" : ""}" aria-live="polite">
        <span>${task.currentStimulus || "-"}</span>
      </div>

      <div class="task-toolbar centered">
        <span class="info-pill">${t.partOf(Math.min(task.currentIndex + 1, task.sequence.length), task.sequence.length)}</span>
        <button class="primary-button" type="button" data-respond>${t.respondButton}</button>
      </div>
    </article>
  `;

  const respond = () => captureGoResponse(task);
  slot.querySelector("[data-respond]").addEventListener("click", respond);
  helpers.bindKey(["Space", "Enter"], respond);
}

function scheduleGoNoGo(task, helpers) {
  if (helpers.isPaused()) {
    return;
  }

  if (task.currentIndex >= task.sequence.length) {
    task.phase = "done";
    task.completedAt = performance.now();
    helpers.update();
    return;
  }

  const stimulus = task.sequence[task.currentIndex];
  task.currentStimulus = stimulus;
  task.currentTrial = {
    stimulus,
    isTarget: stimulus === task.target,
    responded: false,
    responseTimeMs: null,
  };
  task.trialStartedAt = performance.now();
  helpers.update();

  clearTimeout(task.timeouts.hide);
  clearTimeout(task.timeouts.advance);

  task.timeouts.hide = window.setTimeout(() => {
    task.currentStimulus = "";
    helpers.update();
  }, GO_STIMULUS_MS);

  task.timeouts.advance = window.setTimeout(() => {
    finalizeGoTrial(task);
    task.currentIndex += 1;
    scheduleGoNoGo(task, helpers);
  }, GO_STIMULUS_MS + GO_GAP_MS);
}

function captureGoResponse(task) {
  if (!task.currentTrial || task.currentTrial.responded) {
    return;
  }
  task.currentTrial.responded = true;
  task.currentTrial.responseTimeMs = round(performance.now() - task.trialStartedAt);
}

function finalizeGoTrial(task) {
  const trial = task.currentTrial;
  if (!trial) {
    return;
  }

  let correct = false;
  if (trial.isTarget) {
    if (trial.responded) {
      correct = true;
      task.reactionTimes.push(trial.responseTimeMs);
    } else {
      task.omissions += 1;
    }
  } else if (trial.responded) {
    task.commissions += 1;
    task.falseAlarms += 1;
  } else {
    correct = true;
  }

  task.trials.push({
    stimulus: trial.stimulus,
    is_target: trial.isTarget,
    responded: trial.responded,
    correct,
    reaction_time_ms: trial.responseTimeMs,
  });
  task.currentTrial = null;
}

function pauseGoNoGo(task) {
  pauseTask(task);
  clearTimeout(task.timeouts.hide);
  clearTimeout(task.timeouts.advance);
  task.timeouts.hide = null;
  task.timeouts.advance = null;
  task.currentStimulus = "";
}

function resumeGoNoGo(task, helpers) {
  resumeTask(task);
  if (task.phase === "running") {
    window.setTimeout(() => scheduleGoNoGo(task, helpers), 240);
  }
}

function renderMemory(session, slot, helpers) {
  const t = getLabels(session.language);
  const task = session.memory;
  ensureStarted(task);

  if (task.phase === "intro") {
    slot.innerHTML = `
      <article class="task-card" ${session.rtl ? 'dir="rtl"' : ""}>
        <div class="task-card-header">
          <p class="eyebrow">${t.focusTitle}</p>
          <h3>${t.focusMemoryInstruction}</h3>
          <p>${t.taskBasis}</p>
        </div>
        <div class="mini-stat-row">
          <div class="mini-panel"><span class="section-label">${t.availableSteps}</span><strong>${task.sequence.length}</strong></div>
        </div>
        <div class="task-toolbar">
          <button class="secondary-button" type="button" data-back>${t.back}</button>
          <button class="primary-button" type="button" data-show-sequence>${t.showSequence}</button>
        </div>
      </article>
    `;

    slot.querySelector("[data-show-sequence]").addEventListener("click", () => {
      task.phase = "memorize";
      task.memorizeStartedAt = performance.now();
      scheduleMemoryHide(task, helpers);
      helpers.update();
    });
    slot.querySelector("[data-back]").addEventListener("click", () => {
      if (session.stepIndex > 0) { session.stepIndex -= 1; helpers.update(); }
    });
    return;
  }

  if (task.phase === "memorize") {
    const remaining = Math.max(
      0,
      task.memorizeRemainingMs - (task.memorizeStartedAt ? performance.now() - task.memorizeStartedAt : 0)
    );
    slot.innerHTML = `
      <article class="task-card" ${session.rtl ? 'dir="rtl"' : ""}>
        <div class="task-card-header compact">
          <p class="eyebrow">${t.focusTitle}</p>
          <h3>${t.focusMemoryInstruction}</h3>
          <p>${round(remaining / 1000, 1)} s</p>
        </div>
        <ol class="sequence-list">
          ${task.sequence.map((item) => `<li>${item}</li>`).join("")}
        </ol>
      </article>
    `;
    return;
  }

  if (task.phase === "done") {
    slot.innerHTML = `
      <article class="task-card">
        <div class="task-card-header">
          <p class="eyebrow">${t.focusTitle}</p>
          <h3>${t.taskSaved}</h3>
        </div>
        <div class="mini-stat-row">
          <div class="mini-panel"><span class="section-label">${t.focusAccuracyLabel}</span><strong>${Math.round(measureMemory(task).sequence_accuracy * 100)}%</strong></div>
          <div class="mini-panel"><span class="section-label">${t.focusRetriesLabel}</span><strong>${task.retries}</strong></div>
        </div>
        <div class="task-toolbar">
          <button class="secondary-button" type="button" data-back>${t.back}</button>
          <button class="primary-button" type="button" data-next-memory>${t.continue}</button>
        </div>
      </article>
    `;

    slot.querySelector("[data-next-memory]").addEventListener("click", helpers.next);
    slot.querySelector("[data-back]").addEventListener("click", () => {
      if (session.stepIndex > 0) { session.stepIndex -= 1; helpers.update(); }
    });
    return;
  }

  slot.innerHTML = `
    <article class="task-card" ${session.rtl ? 'dir="rtl"' : ""}>
      <div class="task-card-header">
        <p class="eyebrow">${t.focusTitle}</p>
        <h3>${t.focusMemoryInstruction}</h3>
        <p>${t.selectBestAnswer}</p>
      </div>
      <div class="dual-column-layout">
        <div>
          <span class="section-label">${t.yourOrder}</span>
          <div class="slot-list">
            ${task.sequence.map((_, index) => {
              const item = task.answer[index];
              return `
                <button class="slot-chip ${item ? "is-filled" : "is-empty"}" type="button" data-memory-slot="${index}">
                  <span>${index + 1}</span>
                  <strong>${item || t.placeStepHere}</strong>
                </button>
              `;
            }).join("")}
          </div>
        </div>
        <div>
          <span class="section-label">${t.availableSteps}</span>
          <div class="choice-grid">
            ${task.shuffled
              .filter((item) => !task.answer.includes(item))
              .map(
                (item) => `
                  <button class="choice-chip" type="button" data-memory-item="${item}">
                    <strong>${item}</strong>
                  </button>
                `
              )
              .join("")}
          </div>
        </div>
      </div>
      <div class="task-toolbar">
        <button class="secondary-button" type="button" data-reset-memory>${t.resetOrder}</button>
        <button class="primary-button" type="button" data-save-memory ${task.answer.length === task.sequence.length ? "" : "disabled"}>${t.saveAndContinue}</button>
      </div>
    </article>
  `;

  slot.querySelectorAll("[data-memory-item]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!task.firstActionAt) {
        task.firstActionAt = performance.now();
      }
      button.classList.add("is-selected");
      task.answer.push(button.dataset.memoryItem);
      scheduleAfterPaint(() => helpers.update());
    });
  });

  slot.querySelectorAll("[data-memory-slot]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.memorySlot);
      if (task.answer[index]) {
        task.answer.splice(index, 1);
        scheduleAfterPaint(() => helpers.update());
      }
    });
  });

  slot.querySelector("[data-reset-memory]").addEventListener("click", () => {
    task.answer = [];
    task.retries += 1;
    scheduleAfterPaint(() => helpers.update());
  });

  slot.querySelector("[data-save-memory]").addEventListener("click", () => {
    task.phase = "done";
    task.completedAt = performance.now();
    scheduleAfterPaint(() => helpers.update());
  });
}

function scheduleMemoryHide(task, helpers) {
  clearTimeout(task.memorizeTimeout);
  clearInterval(task.countdownInterval);

  task.memorizeTimeout = window.setTimeout(() => {
    task.phase = "recall";
    task.recallStartedAt = performance.now();
    helpers.update();
  }, task.memorizeRemainingMs);

  task.countdownInterval = window.setInterval(() => {
    if (helpers.isPaused()) {
      return;
    }
    helpers.softUpdate();
  }, 180);
}

function pauseMemory(task) {
  pauseTask(task);
  if (task.phase === "memorize" && task.memorizeStartedAt) {
    task.memorizeRemainingMs = Math.max(0, task.memorizeRemainingMs - (performance.now() - task.memorizeStartedAt));
  }
  clearTimeout(task.memorizeTimeout);
  clearInterval(task.countdownInterval);
  task.memorizeTimeout = null;
  task.countdownInterval = null;
}

function resumeMemory(task, helpers) {
  resumeTask(task);
  if (task.phase === "memorize") {
    task.memorizeStartedAt = performance.now();
    scheduleMemoryHide(task, helpers);
  }
}

function renderMultiStep(session, slot, helpers) {
  const t = getLabels(session.language);
  const task = session.multistep;
  const ms = task.scenario;
  ensureStarted(task);

  const requiredStep = !task.mainIdea ? 1 : task.order.length < ms.order.length ? 2 : !task.title ? 3 : 4;
  slot.innerHTML = `
    <article class="task-card" ${session.rtl ? 'dir="rtl"' : ""}>
      <div class="task-card-header">
        <p class="eyebrow">${t.focusTitle}</p>
        <h3>${t.focusMultistepInstruction}</h3>
        <p>${t.taskBasis}</p>
      </div>

      <div class="soft-note">
        <strong>${t.supportiveNote}</strong>
        <p>${ms.note}</p>
      </div>

      <div class="soft-note">
        <strong>${t.supportiveNote}</strong>
        <p>${task.notice}</p>
      </div>

      <div class="step-stack">
        <section class="step-panel ${requiredStep === 1 ? "is-current" : ""}">
          <div class="card-header-row">
            <h4>${t.taskOf(1, 3)}</h4>
            <span class="info-pill">${task.mainIdea ? t.taskSaved : t.continue}</span>
          </div>
          <div class="choice-grid">
            ${ms.mainIdeaOptions
              .map(
                (option) => `
                  <button class="choice-chip ${task.mainIdea === option.id ? "is-selected" : ""}" type="button" data-main-idea="${option.id}">
                    <strong>${option.label}</strong>
                  </button>
                `
              )
              .join("")}
          </div>
        </section>

        <section class="step-panel ${requiredStep === 2 ? "is-current" : ""} ${requiredStep < 2 ? "is-muted" : ""}">
          <div class="card-header-row">
            <h4>${t.taskOf(2, 3)}</h4>
            <span class="info-pill">${task.order.length === ms.order.length ? t.taskSaved : requiredStep === 2 ? t.continue : t.lockedLabel}</span>
          </div>
          <div class="dual-column-layout">
            <div>
              <span class="section-label">${t.yourOrder}</span>
              <div class="slot-list">
                ${ms.order
                  .map((_, index) => {
                    const selected = ms.order.find((item) => item.id === task.order[index]);
                    return `
                      <button class="slot-chip ${selected ? "is-filled" : "is-empty"}" type="button" data-mslot="${index}">
                        <span>${index + 1}</span>
                        <strong>${selected?.label || t.placeStepHere}</strong>
                      </button>
                    `;
                  })
                  .join("")}
              </div>
            </div>
            <div>
              <span class="section-label">${t.availableSteps}</span>
              <div class="choice-grid">
                ${ms.order
                  .filter((item) => !task.order.includes(item.id))
                  .map(
                    (item) => `
                      <button class="choice-chip" type="button" data-order-step="${item.id}">
                        <strong>${item.label}</strong>
                      </button>
                    `
                  )
                  .join("")}
              </div>
            </div>
          </div>
        </section>

        <section class="step-panel ${requiredStep === 3 ? "is-current" : ""} ${requiredStep < 3 ? "is-muted" : ""}">
          <div class="card-header-row">
            <h4>${t.taskOf(3, 3)}</h4>
            <span class="info-pill">${task.title ? t.taskSaved : requiredStep === 3 ? t.continue : t.lockedLabel}</span>
          </div>
          <div class="choice-grid">
            ${ms.titleOptions
              .map(
                (option) => `
                  <button class="choice-chip ${task.title === option.id ? "is-selected" : ""}" type="button" data-title="${option.id}">
                    <strong>${option.label}</strong>
                  </button>
                `
              )
              .join("")}
          </div>
        </section>
      </div>

      <div class="task-toolbar">
        <button class="secondary-button" type="button" data-back>${t.back}</button>
        <div class="action-row compact">
          <button class="secondary-button" type="button" data-reset-order>${t.resetStepOrder}</button>
          <button class="primary-button" type="button" data-finish-focus ${requiredStep === 4 ? "" : "disabled"}>${t.finishFocusCheck}</button>
        </div>
      </div>
    </article>
  `;

  slot.querySelectorAll("[data-main-idea]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!task.firstActionAt) {
        task.firstActionAt = performance.now();
      }
      button.classList.add("is-selected");
      task.mainIdea = button.dataset.mainIdea;
      task.notice = t.taskSaved;
      scheduleAfterPaint(() => helpers.update());
    });
  });

  slot.querySelectorAll("[data-order-step]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!task.mainIdea) {
        task.outOfSequenceAttempts += 1;
        task.notice = t.tryOnceMore;
        scheduleAfterPaint(() => helpers.update());
        return;
      }

      if (!task.firstActionAt) {
        task.firstActionAt = performance.now();
      }
      button.classList.add("is-selected");
      task.order.push(button.dataset.orderStep);
      task.notice =
        task.order.length === ms.order.length
          ? t.taskSaved
          : t.selectBestAnswer;
      scheduleAfterPaint(() => helpers.update());
    });
  });

  slot.querySelectorAll("[data-mslot]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.mslot);
      if (task.order[index]) {
        task.order.splice(index, 1);
        task.notice = t.tryOnceMore;
        scheduleAfterPaint(() => helpers.update());
      }
    });
  });

  slot.querySelectorAll("[data-title]").forEach((button) => {
    button.addEventListener("click", () => {
      if (task.order.length < ms.order.length) {
        task.outOfSequenceAttempts += 1;
        task.notice = t.tryOnceMore;
        scheduleAfterPaint(() => helpers.update());
        return;
      }

      if (!task.firstActionAt) {
        task.firstActionAt = performance.now();
      }
      button.classList.add("is-selected");
      task.title = button.dataset.title;
      task.notice = t.taskSaved;
      scheduleAfterPaint(() => helpers.update());
    });
  });

  slot.querySelector("[data-reset-order]").addEventListener("click", () => {
    if (task.order.length) {
      task.order = [];
      task.restarts += 1;
      task.notice = t.resetStepOrder;
      scheduleAfterPaint(() => helpers.update());
    }
  });

  slot.querySelector("[data-back]").addEventListener("click", () => {
    if (session.stepIndex > 0) { session.stepIndex -= 1; helpers.update(); }
  });

  slot.querySelector("[data-finish-focus]").addEventListener("click", () => {
    task.completedAt = performance.now();
    helpers.complete();
  });
}

function measureSelective(task) {
  const targets = task.terms.filter((item) => item.isTarget);
  const selected = task.terms.filter((item) => task.selections.has(item.id));
  const correct = selected.filter((item) => item.isTarget).length;
  const wrong = selected.filter((item) => !item.isTarget).length;
  const missed = targets.length - correct;
  const performanceScore = average([
    1 - safeRatio(missed, targets.length),
    1 - safeRatio(wrong, task.terms.length - targets.length),
  ]);
  return {
    correct_selections: correct,
    missed_targets: missed,
    wrong_selections: wrong,
    hesitation_before_first_action_ms: round(task.firstActionAt ? task.firstActionAt - task.startedAt - task.pauseMs : 0),
    total_completion_time_ms: round(getElapsed(task)),
    target_count: targets.length,
    total_items: task.terms.length,
    performance: round(performanceScore, 2),
  };
}

function measureGoNoGo(task) {
  const targetCount = task.sequence.filter((item) => item === task.target).length;
  const nonTargetCount = task.sequence.length - targetCount;
  const hitRate = 1 - safeRatio(task.omissions, targetCount);
  const correctRejectionRate = 1 - safeRatio(task.commissions, nonTargetCount);
  return {
    omissions: task.omissions,
    commissions: task.commissions,
    false_alarms: task.falseAlarms,
    reaction_time_variability_ms: round(standardDeviation(task.reactionTimes)),
    mean_reaction_time_ms: round(average(task.reactionTimes)),
    total_completion_time_ms: round(getElapsed(task)),
    hit_rate: round(hitRate, 2),
    correct_rejection_rate: round(correctRejectionRate, 2),
    performance: round(average([hitRate, correctRejectionRate]), 2),
    target_count: targetCount,
    non_target_count: nonTargetCount,
  };
}

function measureMemory(task) {
  const correctPositions = task.answer.filter((item, index) => item === task.sequence[index]).length;
  const sequenceAccuracy = safeRatio(correctPositions, task.sequence.length);
  return {
    sequence_accuracy: round(sequenceAccuracy, 2),
    retries: task.retries,
    hesitation_before_first_action_ms: round(task.firstActionAt ? task.firstActionAt - task.recallStartedAt : 0),
    ordering_mistakes: task.sequence.length - correctPositions,
    total_completion_time_ms: round(getElapsed(task)),
    performance: round(Math.max(0, sequenceAccuracy - task.retries * 0.05), 2),
  };
}

function measureMultistep(task) {
  const ms = task.scenario;
  const correctOrder = task.order.filter((stepId, index) => stepId === ms.order[index].id).length;
  const detailOrderAccuracy = safeRatio(correctOrder, ms.order.length);
  const mainIdeaCorrect = ms.mainIdeaOptions.find((option) => option.id === task.mainIdea)?.isCorrect ? 1 : 0;
  const titleCorrect = ms.titleOptions.find((option) => option.id === task.title)?.isCorrect ? 1 : 0;
  const instructionCompletionAccuracy = average([mainIdeaCorrect, detailOrderAccuracy, titleCorrect]);
  return {
    instruction_completion_accuracy: round(instructionCompletionAccuracy, 2),
    sequence_correctness: round(Math.max(0, 1 - task.outOfSequenceAttempts * 0.18 - task.restarts * 0.08), 2),
    completion_time_ms: round(getElapsed(task)),
    restarts: task.restarts,
    out_of_sequence_attempts: task.outOfSequenceAttempts,
    hesitation_before_first_action_ms: round(task.firstActionAt ? task.firstActionAt - task.startedAt - task.pauseMs : 0),
    performance: round(instructionCompletionAccuracy, 2),
  };
}
