import { average, clamp, round } from "../core/supportEngine.js";
import { INDICATORS, SUPPORT_ADVISORIES } from "../core/constants.js";
import { resolveLearnerLevel } from "../core/levels.js";
import { createBlueprintFromPool, resolveLocalizedItem } from "../core/blueprint.js";
import { getLabels, isRTL } from "../core/i18n.js";
import {
  FOCUS_PROMPT_POOL,
  CONFIDENCE_PROMPT_POOL,
  DIFFICULTY_PROMPT_POOL,
  SUPPORT_PROMPT_POOL,
  EFFORT_PROMPT_POOL,
} from "./banks/reflection.bank.js";

const ENGAGEMENT_INDICATORS = INDICATORS.engagement;
const ENGAGEMENT_ADVISORY = SUPPORT_ADVISORIES.engagement[0];

// Scale functions — called inside render() with the current label map
function getScale(t) {
  return [
    { value: 0, label: t.scaleVeryLow },
    { value: 1, label: t.scaleLow },
    { value: 2, label: t.scaleMixed },
    { value: 3, label: t.scaleGood },
    { value: 4, label: t.scaleVeryGood },
  ];
}

function getDifficultyScale(t) {
  return [
    { value: 0, label: t.scaleNotDifficult },
    { value: 1, label: t.scaleAlittleDifficult },
    { value: 2, label: t.scaleModeratelyDifficult },
    { value: 3, label: t.scaleQuiteDifficult },
    { value: 4, label: t.scaleVeryDifficult },
  ];
}

// Support option values must stay stable for scoring
function getSupportOptions(t) {
  return [
    { value: "extra-explanation", label: t.supportExtraExplanation },
    { value: "extra-practice",    label: t.supportExtraPractice },
    { value: "simpler-version",   label: t.supportSimplerVersion },
    { value: "step-by-step",      label: t.supportStepByStep },
  ];
}

function createPromptState() {
  return {
    startedAt: null,
    completedAt: null,
    pauseMs: 0,
    pausedAt: null,
    firstActionAt: null,
    value: null,
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
 * Learning Reflection preserves school engagement self-report, academic distress / help-seeking,
 * and staged school-based support screening logic.
 */
export const reflectionScreener = {
  id: "learning-reflection",
  name: "Learning Reflection",
  studentSafeName: "Learning Reflection",
  domain: "engagement",
  durationLabel: "2-3 min",
  description:
    "School engagement self-report with focus, confidence, difficulty, help-seeking, and mental effort prompts.",
  scientificParadigms: [
    "School engagement self-report",
    "Academic distress and help-seeking",
    "Staged school-based support screening",
  ],

  createSession({ level, age, language, seed, recentHistory } = {}) {
    const resolvedLevel = resolveLearnerLevel({ level, age });
    const resolvedLang = language || "en";

    const pools = {
      focus:      FOCUS_PROMPT_POOL.filter((i) => i.level === resolvedLevel),
      confidence: CONFIDENCE_PROMPT_POOL.filter((i) => i.level === resolvedLevel),
      difficulty: DIFFICULTY_PROMPT_POOL.filter((i) => i.level === resolvedLevel),
      support:    SUPPORT_PROMPT_POOL.filter((i) => i.level === resolvedLevel),
      effort:     EFFORT_PROMPT_POOL.filter((i) => i.level === resolvedLevel),
    };

    const bp = createBlueprintFromPool(pools, {
      seed,
      recentHistory,
      language: resolvedLang,
      slotOrder: ["focus", "confidence", "difficulty", "support", "effort"],
    });

    const content = {
      focus:      resolveLocalizedItem(bp.items.focus,      resolvedLang),
      confidence: resolveLocalizedItem(bp.items.confidence, resolvedLang),
      difficulty: resolveLocalizedItem(bp.items.difficulty, resolvedLang),
      support:    resolveLocalizedItem(bp.items.support,    resolvedLang),
      effort:     resolveLocalizedItem(bp.items.effort,     resolvedLang),
    };

    return {
      blueprint:     bp,
      blueprintMeta: bp.meta,
      level:         resolvedLevel,
      language:      bp.language,
      rtl:           bp.rtl,
      content,
      stepIndex: 0,
      startedAtIso: new Date().toISOString(),
      prompts: {
        focus:      createPromptState(),
        confidence: createPromptState(),
        difficulty: createPromptState(),
        support:    { ...createPromptState(), value: null },
        effort:     createPromptState(),
      },
    };
  },

  getLocalizedMeta(language) {
    const t = getLabels(language);
    return {
      name:          t.reflectionScreenerName,
      description:   t.reflectionScreenerDescription,
      durationLabel: t.reflectionScreenerDuration,
      paradigms: [t.reflectionParadigm1, t.reflectionParadigm2, t.reflectionParadigm3],
    };
  },

  getTaskMeta(session) {
    const t = getLabels(session.language);
    const labels = [
      t.reflectionTask1Label,
      t.reflectionTask2Label,
      t.reflectionTask3Label,
      t.reflectionTask4Label,
      t.reflectionTask5Label,
    ];
    return {
      label: labels[session.stepIndex],
      text: t.taskOf(session.stepIndex + 1, 5),
      percent: ((session.stepIndex + 1) / 5) * 100,
    };
  },

  render(session, slot, helpers) {
    const keys = ["focus", "confidence", "difficulty", "support", "effort"];
    const key = keys[session.stepIndex];
    const prompt = session.prompts[key];
    ensureStarted(prompt);

    const t = getLabels(session.language);
    const dir = session.rtl ? ' dir="rtl"' : '';

    // Bank-driven content for title/helper
    const content = session.content[key];

    // Scale assignments per prompt type
    const scaleForKey = {
      focus:      getScale(t),
      confidence: getScale(t),
      difficulty: getDifficultyScale(t),
      effort:     getDifficultyScale(t),
    };
    const supportOptions = getSupportOptions(t);

    const isLast = session.stepIndex === 4;

    slot.innerHTML = `
      <article class="task-card"${dir}>
        <div class="task-card-header">
          <p class="eyebrow">${t.reflectionTitle}</p>
          <h3>${content.title}</h3>
          <p>${content.helper}</p>
        </div>

        <div class="soft-note">
          <strong>${t.taskBasis}</strong>
          <p>${t.reflectionInstruction}</p>
        </div>

        <div class="${key === "support" ? "choice-grid" : "scale-row"}">
          ${(key === "support" ? supportOptions : scaleForKey[key])
            .map(
              (option) => `
                <button class="${key === "support" ? "choice-chip" : "scale-button"} ${prompt.value === option.value ? "is-selected" : ""}" type="button" data-reflection-choice="${option.value}" aria-pressed="${prompt.value === option.value}">
                  ${key === "support" ? `<strong>${option.label}</strong>` : option.label}
                </button>
              `
            )
            .join("")}
        </div>

        <div class="task-toolbar">
          <button class="secondary-button" type="button" data-back ${session.stepIndex === 0 ? "disabled" : ""}>${t.back}</button>
          <button class="primary-button" type="button" data-next ${prompt.value !== null ? "" : "disabled"}>
            ${isLast ? t.finish : t.continue}
          </button>
        </div>
      </article>
    `;

    slot.querySelectorAll("[data-reflection-choice]").forEach((button) => {
      button.addEventListener("click", () => {
        if (!prompt.firstActionAt) {
          prompt.firstActionAt = performance.now();
        }
        prompt.value = key === "support" ? button.dataset.reflectionChoice : Number(button.dataset.reflectionChoice);

        slot.querySelectorAll("[data-reflection-choice]").forEach((candidate) => {
          const selected = candidate === button;
          candidate.classList.toggle("is-selected", selected);
          candidate.setAttribute("aria-pressed", String(selected));
        });

        const nextButton = slot.querySelector("[data-next]");
        if (nextButton) {
          nextButton.disabled = prompt.value === null;
        }
      });
    });

    slot.querySelector("[data-back]").addEventListener("click", () => {
      if (session.stepIndex > 0) {
        session.stepIndex -= 1;
        helpers.update();
      }
    });

    slot.querySelector("[data-next]").addEventListener("click", () => {
      prompt.completedAt = performance.now();
      if (session.stepIndex === 4) {
        helpers.complete();
        return;
      }
      session.stepIndex += 1;
      helpers.update();
    });
  },

  onPause(session) {
    const current = Object.values(session.prompts)[session.stepIndex];
    pauseTask(current);
  },

  onResume(session) {
    const current = Object.values(session.prompts)[session.stepIndex];
    resumeTask(current);
  },

  finalize(session, contextBundle, profile) {
    const focusValue = session.prompts.focus.value;
    const confidenceValue = session.prompts.confidence.value;
    const difficultyValue = session.prompts.difficulty.value;
    const effortValue = session.prompts.effort.value;
    const supportValue = session.prompts.support.value;

    const priorEngagementAverage = average(
      (profile?.signals ?? []).filter((signal) => signal.domain === this.domain).slice(-3).map((signal) => signal.final_score)
    );
    const confidencePatternScore = round(clamp(((4 - confidenceValue) / 4) * 80 + priorEngagementAverage * 0.15));
    const difficultyOverwhelmScore = round(
      clamp((difficultyValue / 4) * 55 + (effortValue / 4) * 30 + ((4 - focusValue) / 4) * 15)
    );
    const completionScore = round(clamp((1 - (contextBundle?.follow_up_completion_rate ?? 1)) * 100));
    const supportRequestScore = round(
      clamp(["step-by-step", "simpler-version", "extra-explanation"].includes(supportValue) ? 68 : 24)
    );
    const classroomTrendScore = round(clamp(contextBundle?.engagement_trend || 0));
    const finalScore = round(
      clamp(
        0.3 * confidencePatternScore +
          0.25 * difficultyOverwhelmScore +
          0.2 * completionScore +
          0.15 * supportRequestScore +
          0.1 * classroomTrendScore
      )
    );

    const indicators = [];
    if (finalScore >= 60) {
      indicators.push(ENGAGEMENT_INDICATORS[0]);
    }
    if (difficultyOverwhelmScore >= 55) {
      indicators.push(ENGAGEMENT_INDICATORS[1]);
    }
    if (["step-by-step", "simpler-version", "extra-explanation"].includes(supportValue)) {
      indicators.push(ENGAGEMENT_ADVISORY);
    }

    return {
      rawMetrics: {
        focus: buildPromptMetric(session.prompts.focus),
        confidence: buildPromptMetric(session.prompts.confidence),
        difficulty: buildPromptMetric(session.prompts.difficulty),
        support_preference: buildPromptMetric(session.prompts.support),
        mental_effort: buildPromptMetric(session.prompts.effort),
        follow_up_completion_rate: contextBundle?.follow_up_completion_rate ?? null,
        classroom_engagement_trend: contextBundle?.engagement_trend ?? null,
      },
      subScores: {
        confidence_pattern_score: confidencePatternScore,
        difficulty_overwhelm_score: difficultyOverwhelmScore,
        completion_score: completionScore,
        support_request_score: supportRequestScore,
        classroom_trend_score: classroomTrendScore,
      },
      finalScore,
      indicators,
      blueprintMeta: session.blueprintMeta,
      contextSignals: {
        follow_up_completion_rate: contextBundle?.follow_up_completion_rate ?? null,
        classroom_engagement_trend: contextBundle?.engagement_trend ?? null,
        preferred_support: supportValue,
      },
      studentSafeFeedback: [
        getLabels(session.language).studentFeedbackThanks || "Thanks. This helps personalize your support.",
        supportValue === "step-by-step"
          ? (getLabels(session.language).studentFeedbackStepByStep || "A step-by-step version can be offered next time.")
          : (getLabels(session.language).studentFeedbackExtraExplanation || "Extra explanation or guided practice can be prepared for the next lesson."),
      ],
      teacherMetrics: {
        focus_rating: focusValue,
        confidence_rating: confidenceValue,
        difficulty_rating: difficultyValue,
        preferred_support: supportValue,
      },
    };
  },
};

function buildPromptMetric(prompt) {
  return {
    response: prompt.value,
    hesitation_before_first_action_ms: round(prompt.firstActionAt ? prompt.firstActionAt - prompt.startedAt - prompt.pauseMs : 0),
    completion_time_ms: round(getElapsed(prompt)),
  };
}
