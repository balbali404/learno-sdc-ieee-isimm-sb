import { average, clamp, round, safeRatio } from "../core/supportEngine.js";
import { INDICATORS, SUPPORT_ADVISORIES } from "../core/constants.js";
import { resolveLearnerLevel } from "../core/levels.js";
import { createBlueprintFromPool, resolveLocalizedItem } from "../core/blueprint.js";
import { isRTL, getLabels } from "../core/i18n.js";
import {
  VALUE_ITEMS_POOL,
  REPRESENTATION_ITEMS_POOL,
  SEQUENCE_ITEMS_POOL,
  FLUENCY_ITEMS_POOL,
  EARLY_VALUE_ITEMS_POOL,
  EARLY_REPRESENTATION_ITEMS_POOL,
  EARLY_SEQUENCE_ITEMS_POOL,
  EARLY_FLUENCY_ITEMS_POOL,
  SECONDARY_VALUE_ITEMS_POOL,
  SECONDARY_REPRESENTATION_ITEMS_POOL,
  SECONDARY_SEQUENCE_ITEMS_POOL,
  SECONDARY_FLUENCY_ITEMS_POOL,
  ADVANCED_VALUE_ITEMS_POOL,
  ADVANCED_REPRESENTATION_ITEMS_POOL,
  ADVANCED_SEQUENCE_ITEMS_POOL,
  ADVANCED_FLUENCY_ITEMS_POOL,
} from "./banks/math.bank.js";

const MATH_INDICATORS = INDICATORS.math;
const MATH_ADVISORY = SUPPORT_ADVISORIES.math[0];

function paintThenAdvance(button, advance) {
  if (button?.disabled) {
    return;
  }

  if (button) {
    button.classList.add("is-selected");
    button.setAttribute("aria-pressed", "true");
  }

  window.requestAnimationFrame(() => {
    advance();
  });
}

function getMathPools(level) {
  if (level === "early") {
    return {
      comparison:     EARLY_VALUE_ITEMS_POOL,
      representation: EARLY_REPRESENTATION_ITEMS_POOL,
      sequence:       EARLY_SEQUENCE_ITEMS_POOL,
      fluency:        EARLY_FLUENCY_ITEMS_POOL,
    };
  }
  if (level === "secondary") {
    return {
      comparison:     SECONDARY_VALUE_ITEMS_POOL,
      representation: SECONDARY_REPRESENTATION_ITEMS_POOL,
      sequence:       SECONDARY_SEQUENCE_ITEMS_POOL,
      fluency:        SECONDARY_FLUENCY_ITEMS_POOL,
    };
  }
  if (level === "advanced") {
    return {
      comparison:     ADVANCED_VALUE_ITEMS_POOL,
      representation: ADVANCED_REPRESENTATION_ITEMS_POOL,
      sequence:       ADVANCED_SEQUENCE_ITEMS_POOL,
      fluency:        ADVANCED_FLUENCY_ITEMS_POOL,
    };
  }
  // default: middle
  return {
    comparison:     VALUE_ITEMS_POOL,
    representation: REPRESENTATION_ITEMS_POOL,
    sequence:       SEQUENCE_ITEMS_POOL,
    fluency:        FLUENCY_ITEMS_POOL,
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

/**
 * Math Reasoning Check preserves symbolic magnitude comparison, number sense,
 * symbol-quantity mapping, arithmetic fluency, and sequence reasoning.
 */
export const mathScreener = {
  id: "math-reasoning-check",
  name: "Math Reasoning Check",
  studentSafeName: "Math Reasoning Check",
  domain: "math",
  durationLabel: "3-5 min",
  description:
    "Symbolic comparison, number sense, representation matching, sequence logic, and arithmetic fluency.",
  scientificParadigms: [
    "Symbolic magnitude comparison",
    "Number sense",
    "Symbol-quantity mapping",
    "Arithmetic fluency",
    "Sequence reasoning",
  ],

  createSession({ level, age, language, seed, recentHistory } = {}) {
    const resolvedLevel = resolveLearnerLevel({ level, age });
    const resolvedLang = language || "en";

    const pools = getMathPools(resolvedLevel);

    const bp = createBlueprintFromPool(pools, {
      seed,
      recentHistory,
      language: resolvedLang,
      slotOrder: ["comparison", "representation", "sequence", "fluency"],
    });

    const content = {
      comparison:     resolveLocalizedItem(bp.items.comparison,     resolvedLang),
      representation: resolveLocalizedItem(bp.items.representation, resolvedLang),
      sequence:       resolveLocalizedItem(bp.items.sequence,       resolvedLang),
      fluency:        resolveLocalizedItem(bp.items.fluency,        resolvedLang),
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
      comparison:     { ...createTaskBaseState(), items: content.comparison.items,     itemIndex: 0, itemStartedAt: null, responses: [], confusionTypes: [] },
      representation: { ...createTaskBaseState(), items: content.representation.items, itemIndex: 0, itemStartedAt: null, responses: [], errors: [] },
      sequence:       { ...createTaskBaseState(), items: content.sequence.items,       itemIndex: 0, itemStartedAt: null, responses: [] },
      fluency:        { ...createTaskBaseState(), items: content.fluency.items,        itemIndex: 0, itemStartedAt: null, responses: [], skipped: 0 },
    };
  },

  getLocalizedMeta(language) {
    const t = getLabels(language);
    return {
      name:          t.mathScreenerName,
      description:   t.mathScreenerDescription,
      durationLabel: t.mathScreenerDuration,
      paradigms: [t.mathParadigm1, t.mathParadigm2, t.mathParadigm3, t.mathParadigm4, t.mathParadigm5],
    };
  },

  getTaskMeta(session) {
    const t = getLabels(session.language);
    const labels = [
      t.mathTask1Label,
      t.mathTask2Label,
      t.mathTask3Label,
      t.mathTask4Label,
    ];
    return {
      label: labels[session.stepIndex],
      text: t.taskOf(session.stepIndex + 1, 4),
      percent: ((session.stepIndex + 1) / 4) * 100,
    };
  },

  render(session, slot, helpers) {
    const t = getLabels(session.language);
    if (session.stepIndex === 0) {
      renderChoiceSequence({
        slot,
        helpers,
        session,
        task: session.comparison,
        items: session.comparison.items,
        eyebrow: t.mathComparisonEyebrow,
        title: t.mathComparisonTitle,
        helper: t.mathComparisonHelper,
        onComplete: helpers.next,
        onRecord: (task, item, choice, timeMs) => {
          task.responses.push({ correct: choice === item.correct, time_ms: timeMs, hesitation_ms: timeMs, selected: choice });
          if (choice !== item.correct) {
            task.confusionTypes.push(item.confusionType);
          }
        },
      });
      return;
    }
    if (session.stepIndex === 1) {
      renderChoiceSequence({
        slot,
        helpers,
        session,
        task: session.representation,
        items: session.representation.items,
        eyebrow: t.mathRepresentationEyebrow,
        title: t.mathRepresentationTitle,
        helper: t.mathRepresentationHelper,
        renderVisual: (item) => item.visual,
        onComplete: helpers.next,
        onRecord: (task, item, choice, timeMs) => {
          task.responses.push({ correct: choice === item.correct, time_ms: timeMs, selected: choice });
          if (choice !== item.correct) {
            task.errors.push(item.errorType);
          }
        },
      });
      return;
    }
    if (session.stepIndex === 2) {
      renderChoiceSequence({
        slot,
        helpers,
        session,
        task: session.sequence,
        items: session.sequence.items,
        eyebrow: t.mathSequenceEyebrow,
        title: t.mathSequenceTitle,
        helper: t.mathSequenceHelper,
        onComplete: helpers.next,
        onRecord: (task, item, choice, timeMs) => {
          task.responses.push({ correct: choice === item.correct, time_ms: timeMs, error_type: choice === item.correct ? null : item.errorType });
        },
      });
      return;
    }

    renderFluency(session, slot, helpers);
  },

  onPause(session) {
    const tasks = [session.comparison, session.representation, session.sequence, session.fluency];
    pauseTask(tasks[session.stepIndex]);
  },

  onResume(session) {
    const tasks = [session.comparison, session.representation, session.sequence, session.fluency];
    resumeTask(tasks[session.stepIndex]);
  },

  finalize(session, _contextBundle = null, _profile = null) {
    const comparisonMetrics = measureChoiceTask(session.comparison, session.comparison.items?.length);
    const representationMetrics = measureChoiceTask(session.representation, session.representation.items?.length);
    const sequenceMetrics = measureChoiceTask(session.sequence, session.sequence.items?.length);
    const fluencyMetrics = measureFluency(session.fluency);

    const symbolicAccuracyScore = round(
      clamp((1 - average([comparisonMetrics.accuracy, fluencyMetrics.accuracy])) * 100)
    );
    const numberSenseScore = round(
      clamp((1 - average([comparisonMetrics.accuracy, representationMetrics.accuracy])) * 100 + comparisonMetrics.confusion_type_count * 5)
    );
    const sequenceLogicScore = round(
      clamp((1 - sequenceMetrics.accuracy) * 75 + average(sequenceMetrics.response_times_ms) / 260)
    );
    const fluencyScore = round(
      clamp((1 - fluencyMetrics.accuracy) * 70 + fluencyMetrics.skipped_items * 8 + fluencyMetrics.fact_recall_difficulty * 1.5)
    );
    const visualSymbolicGap = Math.round(representationMetrics.accuracy * 100 - average([comparisonMetrics.accuracy, fluencyMetrics.accuracy]) * 100);
    const finalScore = round(
      clamp(
        0.3 * symbolicAccuracyScore +
          0.25 * numberSenseScore +
          0.2 * sequenceLogicScore +
          0.25 * fluencyScore
      )
    );

    const indicators = [];
    if (finalScore >= 60) {
      indicators.push(MATH_INDICATORS[0]);
    }
    if (symbolicAccuracyScore >= 55 || visualSymbolicGap > 15) {
      indicators.push(MATH_INDICATORS[1]);
    }
    if (fluencyScore >= 45 || numberSenseScore >= 45) {
      indicators.push(MATH_ADVISORY);
    }

    return {
      rawMetrics: {
        value_comparison: comparisonMetrics,
        representation_matching: representationMetrics,
        sequence_logic: sequenceMetrics,
        mental_calculation_fluency: fluencyMetrics,
        visual_symbolic_gap: visualSymbolicGap,
      },
      subScores: {
        symbolic_accuracy_score: symbolicAccuracyScore,
        number_sense_score: numberSenseScore,
        sequence_logic_score: sequenceLogicScore,
        fluency_score: fluencyScore,
      },
      finalScore,
      indicators,
      contextSignals: {
        paradigm_alignment: this.scientificParadigms,
        visual_symbolic_gap: visualSymbolicGap,
      },
      studentSafeFeedback: [
        "Thanks. This helps personalize your support.",
        visualSymbolicGap > 10
          ? "Worked examples and visual supports can be offered next time."
          : "Extra guided practice is available.",
      ],
      teacherMetrics: {
        symbolic_accuracy_percent: Math.round((1 - symbolicAccuracyScore / 100) * 100),
        visual_symbolic_gap: visualSymbolicGap,
        skipped_items: fluencyMetrics.skipped_items,
        sequence_accuracy_percent: Math.round(sequenceMetrics.accuracy * 100),
      },
      blueprintMeta: session.blueprintMeta,
    };
  },
};

function renderChoiceSequence({ slot, helpers, session, task, items, eyebrow, title, helper, onComplete, onRecord, renderVisual }) {
  const t = getLabels(session.language);
  ensureStarted(task);
  if (!task.itemStartedAt) {
    task.itemStartedAt = performance.now();
  }
  if (task.itemIndex >= items.length) {
    const backDisabled = session.stepIndex === 0 ? "disabled" : "";
    slot.innerHTML = `
      <article class="task-card">
        <div class="task-card-header">
          <p class="eyebrow">${eyebrow} — ${t.taskSaved}</p>
          <h3>${t.taskSaved}</h3>
        </div>
        <div class="task-toolbar">
          <button class="secondary-button" type="button" data-back ${backDisabled}>${t.back}</button>
          <button class="primary-button" type="button" data-choice-continue>${t.continue}</button>
        </div>
      </article>
    `;
    slot.querySelector("[data-choice-continue]").addEventListener("click", onComplete);
    slot.querySelector("[data-back]").addEventListener("click", () => {
      if (session.stepIndex > 0) { session.stepIndex -= 1; helpers.update(); }
    });
    return;
  }

  const item = items[task.itemIndex];
  slot.innerHTML = `
    <article class="task-card" ${session && session.rtl ? 'dir="rtl"' : ""}>
      <div class="task-card-header">
        <p class="eyebrow">${eyebrow}</p>
        <h3>${item.prompt}</h3>
        <p>${helper}</p>
      </div>
      ${renderVisual ? `<div class="representation-panel">${renderVisual(item)}</div>` : ""}
      <div class="choice-grid">
        ${items[task.itemIndex].options
          .map(
            (option) => `
              <button class="choice-chip" type="button" data-choice-option="${option}">
                <strong>${option}</strong>
              </button>
            `
          )
          .join("")}
      </div>
      <div class="task-toolbar">
        <span class="info-pill">${t.partOf(task.itemIndex + 1, items.length)}</span>
      </div>
    </article>
  `;

  slot.querySelectorAll("[data-choice-option]").forEach((button) => {
    button.addEventListener("click", () => {
      paintThenAdvance(button, () => {
        if (!task.firstActionAt) {
          task.firstActionAt = performance.now();
        }
        const timeMs = round(performance.now() - task.itemStartedAt);
        onRecord(task, item, button.dataset.choiceOption, timeMs);
        task.itemIndex += 1;
        task.itemStartedAt = performance.now();
        if (task.itemIndex >= items.length) {
          task.completedAt = performance.now();
        }
        helpers.update();
      });
    });
  });
}

function renderFluency(session, slot, helpers) {
  const t = getLabels(session.language);
  const task = session.fluency;
  ensureStarted(task);
  if (!task.itemStartedAt) {
    task.itemStartedAt = performance.now();
  }

  if (task.itemIndex >= task.items.length) {
    slot.innerHTML = `
      <article class="task-card">
        <div class="task-card-header">
          <p class="eyebrow">${t.mathTitle}</p>
          <h3>${t.taskSaved}</h3>
        </div>
        <div class="task-toolbar">
          <button class="secondary-button" type="button" data-back>${t.back}</button>
          <button class="primary-button" type="button" data-finish-math>${t.finishMathCheck}</button>
        </div>
      </article>
    `;
    slot.querySelector("[data-finish-math]").addEventListener("click", helpers.complete);
    slot.querySelector("[data-back]").addEventListener("click", () => {
      if (session.stepIndex > 0) { session.stepIndex -= 1; helpers.update(); }
    });
    return;
  }

  const item = task.items[task.itemIndex];
  slot.innerHTML = `
    <article class="task-card" ${session.rtl ? 'dir="rtl"' : ""}>
      <div class="task-card-header">
        <p class="eyebrow">${t.mathTitle}</p>
        <h3>${item.prompt}</h3>
        <p>${t.skipsAllowed}</p>
      </div>
      <div class="choice-grid">
        ${item.options
          .map(
            (option) => `
              <button class="choice-chip" type="button" data-fluency-option="${option}">
                <strong>${option}</strong>
              </button>
            `
          )
          .join("")}
      </div>
      <div class="task-toolbar">
        <span class="info-pill">${t.partOf(task.itemIndex + 1, task.items.length)}</span>
        <button class="secondary-button" type="button" data-skip-fluency>${t.skip}</button>
      </div>
    </article>
  `;

  const record = (choice, skipped) => {
    if (!task.firstActionAt) {
      task.firstActionAt = performance.now();
    }
    const timeMs = round(performance.now() - task.itemStartedAt);
    task.responses.push({
      correct: choice === item.correct,
      selected: choice,
      skipped,
      time_ms: timeMs,
      fact_recall_difficulty: timeMs > 6500 ? 1 : 0,
    });
    if (skipped) {
      task.skipped += 1;
    }
    task.itemIndex += 1;
    task.itemStartedAt = performance.now();
    if (task.itemIndex >= task.items.length) {
      task.completedAt = performance.now();
    }
    helpers.update();
  };

  slot.querySelectorAll("[data-fluency-option]").forEach((button) => {
    button.addEventListener("click", () => {
      paintThenAdvance(button, () => record(button.dataset.fluencyOption, false));
    });
  });
  slot.querySelector("[data-skip-fluency]").addEventListener("click", (event) => {
    paintThenAdvance(event.currentTarget, () => record(null, true));
  });
}

function measureChoiceTask(task, totalItems) {
  const resolvedTotalItems = Number.isFinite(totalItems) && totalItems > 0
    ? totalItems
    : task.responses.length;
  const correct = task.responses.filter((response) => response.correct).length;
  return {
    accuracy: round(safeRatio(correct, resolvedTotalItems), 2),
    response_times_ms: task.responses.map((response) => response.time_ms),
    hesitation_ms: round(task.firstActionAt ? task.firstActionAt - task.startedAt - task.pauseMs : 0),
    confusion_type_count: task.confusionTypes?.length || task.errors?.length || 0,
    total_completion_time_ms: round(getElapsed(task)),
  };
}

function measureFluency(task) {
  const totalItems = task.items?.length || task.responses.length;
  const correct = task.responses.filter((response) => response.correct).length;
  const factRecallDifficulty = task.responses.reduce(
    (sum, response) => sum + response.fact_recall_difficulty,
    0
  );
  return {
    accuracy: round(safeRatio(correct, totalItems), 2),
    response_times_ms: task.responses.map((response) => response.time_ms),
    skipped_items: task.skipped,
    fact_recall_difficulty: factRecallDifficulty,
    total_completion_time_ms: round(getElapsed(task)),
  };
}
