import { average, clamp, round } from "../core/supportEngine.js";
import { INDICATORS, SUPPORT_ADVISORIES } from "../core/constants.js";
import { resolveLearnerLevel } from "../core/levels.js";
import { createBlueprintFromPool, resolveLocalizedItem } from "../core/blueprint.js";
import { getLabels, isRTL } from "../core/i18n.js";
import {
  NOISE_PROMPT_POOL,
  LIGHT_PROMPT_POOL,
  AIR_PROMPT_POOL,
  CONCENTRATION_PROMPT_POOL,
} from "./banks/comfort.bank.js";

const SENSORY_INDICATORS = INDICATORS.sensory;
const SENSORY_ADVISORY = SUPPORT_ADVISORIES.sensory[0];

// Support option values must stay stable for scoring
const SUPPORT_OPTIONS_VALUES = [
  { value: "quieter-space", labelKey: "quieterSpace" },
  { value: "simpler-view",  labelKey: "betterLighting" },
  { value: "step-by-step",  labelKey: "fewerDistractions" },
  { value: "no-change",     labelKey: "nothingNeeded" },
];

function createPromptState() {
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
 * Comfort Check preserves sensory self-report and context-aware environmental screening logic.
 * The interpretation layer combines self-report with classroom context without producing diagnosis claims.
 */
export const comfortScreener = {
  id: "comfort-check",
  name: "Comfort Check",
  studentSafeName: "Comfort Check",
  domain: "sensory",
  durationLabel: "1-2 min",
  description:
    "Private sensory self-report with classroom context matching for noise, light, air, and concentration comfort.",
  scientificParadigms: [
    "Sensory self-report",
    "Context-aware environmental screening",
    "Classroom comfort indicators",
  ],

  createSession({ level, age, language, seed, recentHistory } = {}) {
    const resolvedLevel = resolveLearnerLevel({ level, age });
    const resolvedLang = language || "en";

    // Filter each pool to the resolved level
    const pools = {
      noise:         NOISE_PROMPT_POOL.filter((i) => i.level === resolvedLevel),
      light:         LIGHT_PROMPT_POOL.filter((i) => i.level === resolvedLevel),
      air:           AIR_PROMPT_POOL.filter((i) => i.level === resolvedLevel),
      concentration: CONCENTRATION_PROMPT_POOL.filter((i) => i.level === resolvedLevel),
    };

    const bp = createBlueprintFromPool(pools, {
      seed,
      recentHistory,
      language: resolvedLang,
      slotOrder: ["noise", "light", "air", "concentration"],
    });

    // Resolve localized text for each slot
    const content = {
      noise:         resolveLocalizedItem(bp.items.noise,         resolvedLang),
      light:         resolveLocalizedItem(bp.items.light,         resolvedLang),
      air:           resolveLocalizedItem(bp.items.air,           resolvedLang),
      concentration: resolveLocalizedItem(bp.items.concentration, resolvedLang),
    };

    return {
      blueprint:     bp,           // backward compat
      blueprintMeta: bp.meta,
      level:         resolvedLevel,
      language:      bp.language,
      rtl:           bp.rtl,
      content,
      stepIndex: 0,
      startedAtIso: new Date().toISOString(),
      prompts: {
        noise:         { ...createPromptState(), value: null },
        light:         { ...createPromptState(), value: null },
        air:           { ...createPromptState(), value: null },
        concentration: { ...createPromptState(), value: null, supportPreference: null },
      },
    };
  },

  getLocalizedMeta(language) {
    const t = getLabels(language);
    return {
      name:          t.comfortScreenerName,
      description:   t.comfortScreenerDescription,
      durationLabel: t.comfortScreenerDuration,
      paradigms: [t.comfortParadigm1, t.comfortParadigm2, t.comfortParadigm3],
    };
  },

  getTaskMeta(session) {
    const t = getLabels(session.language);
    const labels = [
      t.comfortTask1Label,
      t.comfortTask2Label,
      t.comfortTask3Label,
      t.comfortTask4Label,
    ];

    return {
      label: labels[session.stepIndex],
      text: t.taskOf(session.stepIndex + 1, 4),
      percent: ((session.stepIndex + 1) / 4) * 100,
    };
  },

  render(session, slot, helpers) {
    const promptKeys = ["noise", "light", "air", "concentration"];
    const key = promptKeys[session.stepIndex];
    const prompt = session.prompts[key];
    ensureStarted(prompt);

    const t = getLabels(session.language);
    const dir = session.rtl ? ' dir="rtl"' : '';

    // Localized content from bank
    const content = session.content[key];

    // Scale using i18n labels
    const scale = [
      { value: 0, label: t.scaleNotAtAll },
      { value: 1, label: t.scaleAlittleBit },
      { value: 2, label: t.scaleModerately },
      { value: 3, label: t.scaleQuite },
      { value: 4, label: t.scaleVeryMuch },
    ];

    // Support option labels localized; values stay scoring-stable
    const supportOptions = SUPPORT_OPTIONS_VALUES.map((opt) => ({
      value: opt.value,
      label: t[opt.labelKey] || opt.value,
    }));

    const isLast = session.stepIndex === 3;
    const canAdvance = prompt.value !== null && (key !== "concentration" || prompt.supportPreference);

    slot.innerHTML = `
      <article class="task-card"${dir}>
        <div class="task-card-header">
          <p class="eyebrow">${t.comfortScreenerName}</p>
          <h3>${content.title}</h3>
          <p>${content.helper}</p>
        </div>

        <div class="soft-note">
          <strong>${t.taskBasis}</strong>
          <p>${t.comfortInstruction}</p>
        </div>

        <div class="scale-row">
          ${scale.map(
            (option) => `
                <button class="scale-button ${prompt.value === option.value ? "is-selected" : ""}" type="button" data-scale="${option.value}" aria-pressed="${prompt.value === option.value}">
                  ${option.label}
                </button>
            `
          ).join("")}
        </div>

        ${
          key === "concentration"
            ? `
              <div class="choice-grid">
                ${supportOptions.map(
                  (option) => `
                    <button class="choice-chip ${prompt.supportPreference === option.value ? "is-selected" : ""}" type="button" data-support="${option.value}" aria-pressed="${prompt.supportPreference === option.value}">
                      <strong>${option.label}</strong>
                    </button>
                  `
                ).join("")}
              </div>
            `
            : ""
        }

        <div class="task-toolbar">
          <button class="secondary-button" type="button" data-back ${session.stepIndex === 0 ? "disabled" : ""}>${t.back}</button>
          <button class="primary-button" type="button" data-next ${canAdvance ? "" : "disabled"}>
            ${isLast ? t.finish : t.continue}
          </button>
        </div>
      </article>
    `;

    slot.querySelectorAll("[data-scale]").forEach((button) => {
      button.addEventListener("click", () => {
        if (!prompt.firstActionAt) {
          prompt.firstActionAt = performance.now();
        }
        prompt.value = Number(button.dataset.scale);

        slot.querySelectorAll("[data-scale]").forEach((candidate) => {
          const selected = candidate === button;
          candidate.classList.toggle("is-selected", selected);
          candidate.setAttribute("aria-pressed", String(selected));
        });

        const nextButton = slot.querySelector("[data-next]");
        if (nextButton) {
          nextButton.disabled = key === "concentration"
            ? !(prompt.value !== null && prompt.supportPreference)
            : prompt.value === null;
        }
      });
    });

    slot.querySelectorAll("[data-support]").forEach((button) => {
      button.addEventListener("click", () => {
        prompt.supportPreference = button.dataset.support;

        slot.querySelectorAll("[data-support]").forEach((candidate) => {
          const selected = candidate === button;
          candidate.classList.toggle("is-selected", selected);
          candidate.setAttribute("aria-pressed", String(selected));
        });

        const nextButton = slot.querySelector("[data-next]");
        if (nextButton) {
          nextButton.disabled = !(prompt.value !== null && prompt.supportPreference);
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
      if (session.stepIndex === 3) {
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
    const promptMetrics = Object.fromEntries(
      Object.entries(session.prompts).map(([key, prompt]) => [
        key,
        {
          response: prompt.value,
          hesitation_before_first_action_ms: round(
            prompt.firstActionAt ? prompt.firstActionAt - prompt.startedAt - prompt.pauseMs : 0
          ),
          completion_time_ms: round(getElapsed(prompt)),
          support_preference: prompt.supportPreference || null,
        },
      ])
    );

    const responses = Object.values(session.prompts)
      .map((prompt) => prompt.value)
      .filter((value) => Number.isFinite(value));
    const currentAverage = average(responses);
    const signals = profile?.signals ?? [];
    const historical = signals
      .filter((signal) => signal.domain === this.domain)
      .slice(-3)
      .map((signal) => signal.final_score / 25);
    const selfReportTrendScore = round(clamp((average([currentAverage, ...historical]) / 4) * 100));
    const env = contextBundle?.classroom_environment ?? {};
    const environmentMatchScore = round(
      clamp(
        ((env.noise_db > 45 ? session.prompts.noise.value : 0) * 12 +
          (env.light_lux < 320 ? session.prompts.light.value : 0) * 10 +
          (env.co2_ppm > 850 ? session.prompts.air.value : 0) * 12 +
          session.prompts.concentration.value * 8) /
          2
      )
    );
    const repetitionScore = clamp((profile?.domain_trends?.sensory?.repeated_indicator_count ?? 0) * 25);
    const finalScore = round(
      clamp(0.45 * selfReportTrendScore + 0.35 * environmentMatchScore + 0.2 * repetitionScore)
    );

    const indicators = [];
    if (finalScore >= 60) {
      indicators.push(SENSORY_INDICATORS[0]);
    }
    if (environmentMatchScore >= 55) {
      indicators.push(SENSORY_INDICATORS[1]);
    }
    if (
      session.prompts.concentration.supportPreference === "quieter-space" ||
      session.prompts.concentration.supportPreference === "simpler-view"
    ) {
      indicators.push(SENSORY_ADVISORY);
    }

    return {
      rawMetrics: {
        prompts: promptMetrics,
        self_report_average: round(currentAverage, 2),
        support_preference: session.prompts.concentration.supportPreference,
      },
      subScores: {
        self_report_trend_score: selfReportTrendScore,
        environment_match_score: environmentMatchScore,
        repetition_score: repetitionScore,
      },
      finalScore,
      indicators,
      blueprintMeta: session.blueprintMeta,
      contextSignals: {
        classroom_environment: contextBundle?.classroom_environment ?? null,
        support_preference: session.prompts.concentration.supportPreference,
      },
      studentSafeFeedback: [
        "Thanks. This helps personalize your support.",
        session.prompts.concentration.supportPreference === "quieter-space"
          ? "A quieter follow-up can be offered next time."
          : "Comfort settings can be adjusted when needed.",
      ],
      teacherMetrics: {
        self_report_average: round(currentAverage, 2),
        environment_match_score: environmentMatchScore,
        support_preference: session.prompts.concentration.supportPreference || "not selected",
      },
    };
  },
};
