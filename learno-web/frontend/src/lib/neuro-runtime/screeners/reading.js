import { average, clamp, round, safeRatio } from "../core/supportEngine.js";
import { INDICATORS, SUPPORT_ADVISORIES } from "../core/constants.js";
import { resolveLearnerLevel } from "../core/levels.js";
import { createBlueprintFromPool, resolveLocalizedItem } from "../core/blueprint.js";
import { isRTL, getLabels } from "../core/i18n.js";
import {
  WORD_ITEMS_POOL,
  EARLY_WORD_ITEMS_POOL,
  SECONDARY_WORD_ITEMS_POOL,
  PASSAGE_POOL,
  EARLY_PASSAGE_POOL,
  SECONDARY_PASSAGE_POOL,
  RECONSTRUCTION_POOL,
  EARLY_RECONSTRUCTION_POOL,
  SECONDARY_RECONSTRUCTION_POOL,
  MODALITY_POOL,
  EARLY_MODALITY_POOL,
  SECONDARY_MODALITY_POOL,
} from "./banks/reading.bank.js";

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

const READING_INDICATORS = INDICATORS.reading;
const READING_ADVISORY = SUPPORT_ADVISORIES.reading[0];

function getReadingPools(level) {
  if (level === "early") {
    return {
      word:           EARLY_WORD_ITEMS_POOL,
      passage:        EARLY_PASSAGE_POOL,
      reconstruction: EARLY_RECONSTRUCTION_POOL,
      modality:       EARLY_MODALITY_POOL,
    };
  }
  if (level === "secondary" || level === "advanced") {
    return {
      word:           SECONDARY_WORD_ITEMS_POOL,
      passage:        SECONDARY_PASSAGE_POOL,
      reconstruction: SECONDARY_RECONSTRUCTION_POOL,
      modality:       SECONDARY_MODALITY_POOL,
    };
  }
  // default: middle
  return {
    word:           WORD_ITEMS_POOL,
    passage:        PASSAGE_POOL,
    reconstruction: RECONSTRUCTION_POOL,
    modality:       MODALITY_POOL,
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
 * Reading Support Check preserves decoding, word recognition, comprehension,
 * and text-only versus audio-supported modality comparison instead of generic quiz logic.
 */
export const readingScreener = {
  id: "reading-support-check",
  name: "Reading Support Check",
  studentSafeName: "Reading Support Check",
  domain: "reading",
  durationLabel: "3-5 min",
  description:
    "Decoding, word recognition, comprehension, sentence reconstruction, and text-only versus audio-supported comparison.",
  scientificParadigms: [
    "Decoding and word recognition",
    "Reading comprehension",
    "Sentence reconstruction",
    "Text-only versus audio-supported comparison",
  ],

  createSession({ level, age, language, seed, recentHistory } = {}) {
    const resolvedLevel = resolveLearnerLevel({ level, age });
    const resolvedLang = language || "en";

    const pools = getReadingPools(resolvedLevel);

    const bp = createBlueprintFromPool(pools, {
      seed,
      recentHistory,
      language: resolvedLang,
      slotOrder: ["word", "passage", "reconstruction", "modality"],
    });

    // Resolve localized content for each task slot
    const content = {
      word:           resolveLocalizedItem(bp.items.word,           resolvedLang),
      passage:        resolveLocalizedItem(bp.items.passage,        resolvedLang),
      reconstruction: resolveLocalizedItem(bp.items.reconstruction, resolvedLang),
      modality:       resolveLocalizedItem(bp.items.modality,       resolvedLang),
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
      word: {
        ...createTaskBaseState(),
        items: content.word.items,          // reference for measure + render
        itemIndex: 0,
        itemStartedAt: null,
        currentAttempts: 0,
        responses: [],
        retries: 0,
        confusionPatterns: [],
      },
      passage: {
        ...createTaskBaseState(),
        questions: content.passage.questions, // reference for measure + render
        phase: "reading",
        readingEndedAt: null,
        questionIndex: 0,
        questionStartedAt: null,
        answers: [],
        skipped: 0,
      },
      reconstruction: {
        ...createTaskBaseState(),
        words:   content.reconstruction.words, // canonical ordered words for scoring
        answer: [],
        moves: 0,
        retries: 0,
        shuffled: shuffle(content.reconstruction.words),
      },
      modality: {
        ...createTaskBaseState(),
        phase: "text",
        textStartedAt: null,
        audioStartedAt: null,
        textScore: null,
        textSelected: null,
        audioScore: null,
        audioSelected: null,
        audioPlayed: false,
        textTimeMs: 0,
        audioTimeMs: 0,
      },
    };
  },

  getLocalizedMeta(language) {
    const t = getLabels(language);
    return {
      name:          t.readingScreenerName,
      description:   t.readingScreenerDescription,
      durationLabel: t.readingScreenerDuration,
      paradigms: [t.readingParadigm1, t.readingParadigm2, t.readingParadigm3, t.readingParadigm4],
    };
  },

  getTaskMeta(session) {
    const t = getLabels(session.language);
    const labels = [
      t.readingTask1Label,
      t.readingTask2Label,
      t.readingTask3Label,
      t.readingTask4Label,
    ];
    return {
      label: labels[session.stepIndex],
      text: t.taskOf(session.stepIndex + 1, 4),
      percent: ((session.stepIndex + 1) / 4) * 100,
    };
  },

  render(session, slot, helpers) {
    if (session.stepIndex === 0) {
      renderWordTask(session, slot, helpers);
      return;
    }
    if (session.stepIndex === 1) {
      renderPassageTask(session, slot, helpers);
      return;
    }
    if (session.stepIndex === 2) {
      renderReconstructionTask(session, slot, helpers);
      return;
    }
    renderModalityTask(session, slot, helpers);
  },

  onPause(session) {
    const tasks = [session.word, session.passage, session.reconstruction, session.modality];
    pauseTask(tasks[session.stepIndex]);
  },

  onResume(session) {
    const tasks = [session.word, session.passage, session.reconstruction, session.modality];
    resumeTask(tasks[session.stepIndex]);
  },

  finalize(session, _contextBundle = null, _profile = null) {
    const wordMetrics = measureWord(session.word);
    const passageMetrics = measurePassage(session.passage);
    const reconstructionMetrics = measureReconstruction(session.reconstruction);
    const modalityMetrics = measureModality(session.modality);

    const comprehensionScore = round(
      clamp((1 - average([passageMetrics.comprehension_accuracy, modalityMetrics.text_only_score / 100])) * 100)
    );
    const wordDiscriminationScore = round(
      clamp(
        (1 - wordMetrics.accuracy) * 70 + wordMetrics.retries * 10 + wordMetrics.confusion_pattern_count * 6
      )
    );
    const readingEfficiencyScore = round(
      clamp(
        ((passageMetrics.reading_time_ms - 18000) / 16000) * 30 +
          ((reconstructionMetrics.completion_time_ms - 14000) / 12000) * 25 +
          reconstructionMetrics.number_of_moves * 4 +
          passageMetrics.skipped_items * 10
      )
    );
    const modalityGap = modalityMetrics.audio_supported_score - modalityMetrics.text_only_score;
    const modalityGapOrEffortScore = round(
      clamp(Math.max(0, modalityGap) * 0.9 + wordMetrics.hesitation_average_ms / 240 + passageMetrics.skipped_items * 8)
    );
    const finalScore = round(
      clamp(
        0.3 * comprehensionScore +
          0.25 * wordDiscriminationScore +
          0.25 * readingEfficiencyScore +
          0.2 * modalityGapOrEffortScore
      )
    );

    const indicators = [];
    if (finalScore >= 60) {
      indicators.push(READING_INDICATORS[0]);
    }
    if (wordDiscriminationScore >= 55) {
      indicators.push(READING_INDICATORS[1]);
    }
    if (modalityGap > 10 || readingEfficiencyScore >= 50) {
      indicators.push(READING_ADVISORY);
    }

    return {
      rawMetrics: {
        word_discrimination: wordMetrics,
        passage_comprehension: passageMetrics,
        sentence_reconstruction: reconstructionMetrics,
        modality_comparison: modalityMetrics,
        modality_gap: round(modalityGap),
      },
      subScores: {
        comprehension_score: comprehensionScore,
        word_discrimination_score: wordDiscriminationScore,
        reading_efficiency_score: readingEfficiencyScore,
        modality_gap_or_effort_score: modalityGapOrEffortScore,
      },
      finalScore,
      indicators,
      contextSignals: {
        paradigm_alignment: this.scientificParadigms,
        modality_gap: round(modalityGap),
        audio_supported_score: modalityMetrics.audio_supported_score,
        text_only_score: modalityMetrics.text_only_score,
      },
      studentSafeFeedback: [
        "Thanks. This helps personalize your support.",
        modalityGap > 10
          ? "Audio-supported reading can be offered next time."
          : "Extra guided reading practice is available.",
      ],
      teacherMetrics: {
        word_accuracy_percent: Math.round(wordMetrics.accuracy * 100),
        comprehension_accuracy_percent: Math.round(passageMetrics.comprehension_accuracy * 100),
        modality_gap: round(modalityGap),
        skipped_items: passageMetrics.skipped_items,
      },
      blueprintMeta: session.blueprintMeta,
    };
  },
};

function renderWordTask(session, slot, helpers) {
  const task = session.word;
  const t = getLabels(session.language);
  ensureStarted(task);
  if (!task.itemStartedAt) {
    task.itemStartedAt = performance.now();
  }

  if (task.itemIndex >= task.items.length) {
    slot.innerHTML = `
      <article class="task-card">
        <div class="task-card-header">
          <p class="eyebrow">${t.readingTitle}</p>
          <h3>${t.taskSaved}</h3>
          <p>${t.continueToQuestions}</p>
        </div>
        <div class="task-toolbar">
          <button class="secondary-button" type="button" data-back disabled>${t.back}</button>
          <button class="primary-button" type="button" data-next-reading>${t.continue}</button>
        </div>
      </article>
    `;
    slot.querySelector("[data-next-reading]").addEventListener("click", helpers.next);
    return;
  }

  const item = task.items[task.itemIndex];
  slot.innerHTML = `
    <article class="task-card" ${session.rtl ? 'dir="rtl"' : ""}>
      <div class="task-card-header">
        <p class="eyebrow">${t.readingTitle}</p>
        <h3>${item.sentence}</h3>
        <p>${t.readingWordInstruction}</p>
      </div>
      <div class="soft-note">
        <strong>${t.taskBasis}</strong>
        <p>${t.readingWordInstruction}</p>
      </div>
      <div class="choice-grid">
        ${item.options
          .map(
            (option) => `
              <button class="choice-chip" type="button" data-word-option="${option}">
                <strong>${option}</strong>
              </button>
            `
          )
          .join("")}
      </div>
      ${task.currentAttempts > 0 ? `<div class="soft-note"><strong>${t.supportiveNote}</strong><p>${t.tryOnceMore}</p></div>` : ""}
      <div class="task-toolbar">
        <span class="info-pill">${t.taskOf(task.itemIndex + 1, task.items.length)}</span>
      </div>
    </article>
  `;

  slot.querySelectorAll("[data-word-option]").forEach((button) => {
    button.addEventListener("click", () => {
      paintThenAdvance(button, () => {
        if (!task.firstActionAt) {
          task.firstActionAt = performance.now();
        }
        const choice = button.dataset.wordOption;
        const correct = choice === item.correct;
        task.currentAttempts += 1;

        if (!correct) {
          task.confusionPatterns.push(item.confusionType);
          if (task.currentAttempts === 1) {
            task.retries += 1;
            helpers.update();
            return;
          }
        }

        task.responses.push({
          item_id: item.id,
          correct,
          selected: choice,
          hesitation_ms: round(performance.now() - task.itemStartedAt),
          attempts: task.currentAttempts,
        });
        task.itemIndex += 1;
        task.currentAttempts = 0;
        task.itemStartedAt = performance.now();
        if (task.itemIndex >= task.items.length) {
          task.completedAt = performance.now();
        }
        helpers.update();
      });
    });
  });
}

function renderPassageTask(session, slot, helpers) {
  const task = session.passage;
  const t = getLabels(session.language);
  ensureStarted(task);

  if (task.phase === "reading") {
    slot.innerHTML = `
      <article class="task-card" ${session.rtl ? 'dir="rtl"' : ""}>
        <div class="task-card-header">
          <p class="eyebrow">${t.readingTitle}</p>
          <h3>${t.readingPassageInstruction}</h3>
        </div>
        <div class="passage-block">${session.content.passage.text}</div>
        <div class="task-toolbar">
          <button class="secondary-button" type="button" data-back ${session.stepIndex === 0 ? "disabled" : ""}>${t.back}</button>
          <button class="primary-button" type="button" data-passage-ready>${t.continueToQuestions}</button>
        </div>
      </article>
    `;
    slot.querySelector("[data-passage-ready]").addEventListener("click", () => {
      task.readingEndedAt = performance.now();
      task.phase = "questions";
      task.questionStartedAt = performance.now();
      helpers.update();
    });
    slot.querySelector("[data-back]").addEventListener("click", () => {
      if (session.stepIndex > 0) {
        session.stepIndex -= 1;
        helpers.update();
      }
    });
    return;
  }

  if (task.phase === "done") {
    slot.innerHTML = `
      <article class="task-card">
        <div class="task-card-header">
          <p class="eyebrow">${t.readingTitle}</p>
          <h3>${t.taskSaved}</h3>
        </div>
        <div class="task-toolbar">
          <button class="secondary-button" type="button" data-back ${session.stepIndex === 0 ? "disabled" : ""}>${t.back}</button>
          <button class="primary-button" type="button" data-next-reconstruction>${t.continue}</button>
        </div>
      </article>
    `;
    slot.querySelector("[data-next-reconstruction]").addEventListener("click", helpers.next);
    slot.querySelector("[data-back]").addEventListener("click", () => {
      if (session.stepIndex > 0) {
        session.stepIndex -= 1;
        helpers.update();
      }
    });
    return;
  }

  const question = task.questions[task.questionIndex];
  slot.innerHTML = `
    <article class="task-card" ${session.rtl ? 'dir="rtl"' : ""}>
      <div class="task-card-header">
        <p class="eyebrow">${t.readingTitle}</p>
        <h3>${question.prompt}</h3>
        <p>${t.selectBestAnswer}</p>
      </div>
      <div class="choice-grid">
        ${question.options
          .map(
            (option) => `
              <button class="choice-chip" type="button" data-passage-option="${option}">
                <strong>${option}</strong>
              </button>
            `
          )
          .join("")}
      </div>
      <div class="task-toolbar">
        <span class="info-pill">${t.taskOf(task.questionIndex + 1, task.questions.length)}</span>
        <button class="secondary-button" type="button" data-skip-passage>${t.skip}</button>
      </div>
    </article>
  `;

  const saveAnswer = (selected, skipped) => {
    task.answers.push({
      correct: selected === question.correct,
      selected,
      skipped,
      time_ms: round(performance.now() - task.questionStartedAt),
    });
    if (skipped) {
      task.skipped += 1;
    }
    task.questionIndex += 1;
    if (task.questionIndex >= task.questions.length) {
      task.phase = "done";
      task.completedAt = performance.now();
    } else {
      task.questionStartedAt = performance.now();
    }
    helpers.update();
  };

  slot.querySelectorAll("[data-passage-option]").forEach((button) => {
    button.addEventListener("click", () => {
      paintThenAdvance(button, () => saveAnswer(button.dataset.passageOption, false));
    });
  });
  slot.querySelector("[data-skip-passage]").addEventListener("click", (event) => {
    paintThenAdvance(event.currentTarget, () => saveAnswer(null, true));
  });
}

function renderReconstructionTask(session, slot, helpers) {
  const task = session.reconstruction;
  const t = getLabels(session.language);
  ensureStarted(task);
  slot.innerHTML = `
    <article class="task-card" ${session.rtl ? 'dir="rtl"' : ""}>
      <div class="task-card-header">
        <p class="eyebrow">${t.readingTitle}</p>
        <h3>${t.readingReconstructionInstruction}</h3>
      </div>
      <div class="dual-column-layout">
        <div>
          <span class="section-label">${t.yourSentence}</span>
          <div class="slot-list">
            ${task.words.map((_, index) => {
              const word = task.answer[index];
              return `
                <button class="slot-chip ${word ? "is-filled" : "is-empty"}" type="button" data-reconstruction-slot="${index}">
                  <span>${index + 1}</span>
                  <strong>${word || t.placeBlockHere}</strong>
                </button>
              `;
            }).join("")}
          </div>
        </div>
        <div>
          <span class="section-label">${t.availableBlocks}</span>
          <div class="choice-grid">
            ${task.shuffled
              .filter((word) => !task.answer.includes(word))
              .map(
                (word) => `
                  <button class="choice-chip" type="button" data-reconstruction-word="${word}">
                    <strong>${word}</strong>
                  </button>
                `
              )
              .join("")}
          </div>
        </div>
      </div>
      <div class="task-toolbar">
        <button class="secondary-button" type="button" data-back ${session.stepIndex === 0 ? "disabled" : ""}>${t.back}</button>
        <button class="secondary-button" type="button" data-reset-reconstruction>${t.reset}</button>
        <button class="primary-button" type="button" data-save-reconstruction ${task.answer.length === task.words.length ? "" : "disabled"}>${t.saveAndContinue}</button>
      </div>
    </article>
  `;

  slot.querySelectorAll("[data-reconstruction-word]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!task.firstActionAt) {
        task.firstActionAt = performance.now();
      }
      task.moves += 1;
      task.answer.push(button.dataset.reconstructionWord);
      helpers.update();
    });
  });

  slot.querySelectorAll("[data-reconstruction-slot]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.reconstructionSlot);
      if (task.answer[index]) {
        task.moves += 1;
        task.answer.splice(index, 1);
        helpers.update();
      }
    });
  });

  slot.querySelector("[data-back]").addEventListener("click", () => {
    if (session.stepIndex > 0) {
      session.stepIndex -= 1;
      helpers.update();
    }
  });

  slot.querySelector("[data-reset-reconstruction]").addEventListener("click", () => {
    task.answer = [];
    task.retries += 1;
    helpers.update();
  });

  slot.querySelector("[data-save-reconstruction]").addEventListener("click", () => {
    task.completedAt = performance.now();
    helpers.next();
  });
}

function renderModalityTask(session, slot, helpers) {
  const task = session.modality;
  const t = getLabels(session.language);
  ensureStarted(task);

  if (task.phase === "done") {
    slot.innerHTML = `
      <article class="task-card">
        <div class="task-card-header">
          <p class="eyebrow">${t.readingTitle}</p>
          <h3>${t.taskSaved}</h3>
        </div>
        <div class="task-toolbar">
          <button class="secondary-button" type="button" data-back ${session.stepIndex === 0 ? "disabled" : ""}>${t.back}</button>
          <button class="primary-button" type="button" data-finish-reading>${t.finishReadingCheck}</button>
        </div>
      </article>
    `;
    slot.querySelector("[data-finish-reading]").addEventListener("click", helpers.complete);
    slot.querySelector("[data-back]").addEventListener("click", () => {
      if (session.stepIndex > 0) {
        session.stepIndex -= 1;
        helpers.update();
      }
    });
    return;
  }

  const modalityContent = session.content.modality;
  const item = task.phase === "text" ? modalityContent.textOnly : modalityContent.audioSupported;
  const label = task.phase === "text" ? t.textOnlyLabel : t.audioSupportedLabel;
  slot.innerHTML = `
    <article class="task-card" ${session.rtl ? 'dir="rtl"' : ""}>
      <div class="task-card-header">
        <p class="eyebrow">${t.readingTitle}</p>
        <h3>${label}</h3>
        <p>${t.readingModalityInstruction}</p>
      </div>
      <div class="passage-block">${item.passage}</div>
      ${
        task.phase === "audio"
          ? `<div class="task-toolbar compact"><button class="secondary-button" type="button" data-play-audio>${t.playAudio}</button></div>`
          : ""
      }
      <div class="soft-note"><strong>${item.question.prompt}</strong></div>
      <div class="choice-grid">
        ${item.question.options
          .map(
            (option) => `
              <button class="choice-chip" type="button" data-modality-option="${option}">
                <strong>${option}</strong>
              </button>
            `
          )
          .join("")}
      </div>
    </article>
  `;

  if (task.phase === "text" && !task.textStartedAt) {
    task.textStartedAt = performance.now();
  }
  if (task.phase === "audio" && !task.audioStartedAt) {
    task.audioStartedAt = performance.now();
  }

  const save = (choice) => {
    const correct = choice === item.question.correct;
    if (task.phase === "text") {
      task.textScore = correct ? 100 : 0;
      task.textSelected = choice;
      task.textTimeMs = round(performance.now() - task.textStartedAt);
      task.phase = "audio";
    } else {
      task.audioScore = correct ? 100 : 0;
      task.audioSelected = choice;
      task.audioTimeMs = round(performance.now() - task.audioStartedAt);
      task.phase = "done";
      task.completedAt = performance.now();
    }
    helpers.update();
  };

  slot.querySelectorAll("[data-modality-option]").forEach((button) => {
    button.addEventListener("click", () => {
      paintThenAdvance(button, () => save(button.dataset.modalityOption));
    });
  });

  const playAudio = slot.querySelector("[data-play-audio]");
  if (playAudio) {
    playAudio.addEventListener("click", () => {
      task.audioPlayed = true;
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(item.passage);
        utterance.rate = 0.95;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    });
  }
}

function measureWord(task) {
  const correct = task.responses.filter((response) => response.correct).length;
  return {
    accuracy: round(safeRatio(correct, task.items.length), 2),
    retries: task.retries,
    hesitation_average_ms: round(average(task.responses.map((response) => response.hesitation_ms))),
    confusion_pattern_count: task.confusionPatterns.length,
    confusion_patterns: task.confusionPatterns,
    total_completion_time_ms: round(getElapsed(task)),
  };
}

function measurePassage(task) {
  const correct = task.answers.filter((answer) => answer.correct).length;
  return {
    reading_time_ms: round((task.readingEndedAt || task.startedAt) - task.startedAt - task.pauseMs),
    comprehension_accuracy: round(safeRatio(correct, task.questions.length), 2),
    time_per_question_ms: task.answers.map((answer) => answer.time_ms),
    skipped_items: task.skipped,
    total_completion_time_ms: round(getElapsed(task)),
  };
}

function measureReconstruction(task) {
  const correct = task.answer.filter((word, index) => word === task.words[index]).length;
  return {
    reconstruction_accuracy: round(safeRatio(correct, task.words.length), 2),
    number_of_moves: task.moves,
    retries: task.retries,
    completion_time_ms: round(getElapsed(task)),
  };
}

function measureModality(task) {
  return {
    text_only_score: task.textScore || 0,
    audio_supported_score: task.audioScore || 0,
    modality_gap: (task.audioScore || 0) - (task.textScore || 0),
    text_time_ms: task.textTimeMs,
    audio_time_ms: task.audioTimeMs,
    audio_played: task.audioPlayed,
  };
}
