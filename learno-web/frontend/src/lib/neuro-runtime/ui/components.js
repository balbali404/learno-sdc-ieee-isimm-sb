import {
  ROLE_OPTIONS,
  THEME_OPTIONS,
} from "../core/constants.js";
import {
  formatClock,
  round,
} from "../core/supportEngine.js";
import {
  serializeStudentSignalResponse,
  serializeSupportSignalResponse,
  serializeTeacherSignalResponse,
} from "../core/contracts.js";
import { getLabels } from "../core/i18n.js";

/**
 * Returns a display copy of support_summary with indicator keys and recommendation key
 * resolved to localized display strings. Does not mutate the original object.
 */
function localizeDisplaySummary(summary, t) {
  if (!summary) return summary;
  const out = { ...summary };
  if (Array.isArray(out.indicators)) {
    out.indicators = out.indicators.map((ind) => t.indicatorLabels?.[ind] || ind);
  }
  if (out.recommendation) {
    out.recommendation = t.recommendationLabels?.[out.recommendation] || out.recommendation;
  }
  if (Array.isArray(out.paradigm_basis)) {
    out.paradigm_basis = out.paradigm_basis.map((p) => t.paradigmLabels?.[p] || p);
  }
  return out;
}

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderOptionChips(options, selectedValue, dataAttr = "data-choice") {
  return `
    <div class="choice-grid">
      ${options
        .map(
          (option) => `
            <button
              class="choice-chip ${selectedValue === option.value ? "is-selected" : ""}"
              type="button"
              ${dataAttr}="${escapeHtml(option.value)}"
              aria-pressed="${selectedValue === option.value}"
            >
              <strong>${escapeHtml(option.label)}</strong>
              ${option.hint ? `<span>${escapeHtml(option.hint)}</span>` : ""}
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

export function renderPills(items, className = "info-pill") {
  return items
    .map((item) => `<span class="${className}">${escapeHtml(item)}</span>`)
    .join("");
}

export function renderScaleRow(options, selectedValue, dataAttr = "data-scale") {
  return `
    <div class="scale-row" role="list">
      ${options
        .map(
          (option) => `
            <button
              class="scale-button ${selectedValue === option.value ? "is-selected" : ""}"
              type="button"
              ${dataAttr}="${escapeHtml(option.value)}"
              aria-pressed="${selectedValue === option.value}"
            >
              <span>${escapeHtml(option.label)}</span>
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

export function renderSuiteHome({ profile, screeners, challenges = [], lessonContext, language = "en", screenerMap = {} }) {
  const t = getLabels(language);
  const latestSignals = [...profile.signals].slice(-5).reverse();
  const activeFlags = profile.current_flags.length
    ? profile.current_flags.map((flag) => {
        const sep = flag.indexOf(":");
        const domain = sep !== -1 ? flag.slice(0, sep) : flag;
        const level  = sep !== -1 ? flag.slice(sep + 1) : "";
        const domainLabel = t.domainLabels?.[domain] || domain;
        const levelLabel  = t.supportLevelLabels?.[level] || level;
        return `<li>${escapeHtml(level ? `${domainLabel}: ${levelLabel}` : domainLabel)}</li>`;
      }).join("")
    : `<li>${escapeHtml(t.noActiveFlags)}</li>`;

  return `
    <section class="section-stack">
      <div class="section-heading">
        <div>
          <h3>${escapeHtml(t.challengeLibraryHeading || t.suiteTitle)}</h3>
        </div>
      </div>

      <div class="screener-grid">
        ${challenges
          .map(
            (challenge) => `
              <article class="screener-card">
                <div class="card-header-row">
                  <div>
                    <h4>${escapeHtml(challenge.name)}</h4>
                  </div>
                  <span class="duration-pill">${escapeHtml(challenge.durationLabel)}</span>
                </div>
                <div class="card-footer-row">
                  <button class="primary-button" type="button" data-open-challenge="${escapeHtml(challenge.id)}">
                    ${escapeHtml(t.launchChallenge || t.launch)}
                  </button>
                </div>
              </article>
            `
          )
          .join("")}
      </div>
    </section>

    <section class="section-stack profile-stack">
      <div class="section-heading">
        <div>
          <p class="eyebrow">${escapeHtml(t.suiteEyebrow)}</p>
          <h3>${escapeHtml(t.latestSignalHeading)}</h3>
        </div>
        <p>${escapeHtml(t.sharedSignalNote)}</p>
      </div>

      <div class="trend-grid">
        ${Object.values(profile.domain_trends)
          .map(
            (trend) => `
              <article class="trend-card">
                <span class="section-label">${escapeHtml(t.domainLabels[trend.domain] || trend.label)}</span>
                <strong>${trend.average || trend.last_score || 0}</strong>
                <p>${escapeHtml(t.supportLevelLabels[trend.level || trend.last_level] || "—")}</p>
                <div class="trend-meta">
                  <span>${trend.weighted_average || trend.recent_trend_score || 0}</span>
                  <span>${trend.count || 0}</span>
                  <span>${Math.round((trend.confidence || 0) * 100)}%</span>
                </div>
              </article>
            `
          )
          .join("")}
      </div>

      <div class="history-layout">
        <article class="soft-panel">
          <span class="section-label">${escapeHtml(t.activeFlagsLabel || t.noActiveFlags)}</span>
          <ul class="signal-list">
            ${activeFlags}
          </ul>
        </article>

        <article class="soft-panel">
          <span class="section-label">${escapeHtml(t.latestSignalHeading)}</span>
          <ul class="signal-list">
            ${
              latestSignals.length
                ? latestSignals
                    .map(
                      (signal) => `
                        <li>
                          <button class="signal-link" type="button" data-view-signal="${escapeHtml(signal.timestamp)}">
                            <span>${escapeHtml(
                              screenerMap[signal.screener_id]?.getLocalizedMeta
                                ? screenerMap[signal.screener_id].getLocalizedMeta(language).name
                                : signal.student_safe_name
                            )}</span>
                            <strong>${signal.final_score}</strong>
                          </button>
                        </li>
                      `
                    )
                    .join("")
                : `<li>${escapeHtml(t.noSignalsYet)}</li>`
            }
          </ul>
        </article>
      </div>
    </section>
  `;
}

export function renderScreenerShell({ screener, taskMeta, progress, elapsedMs, language = "en" }) {
  const meta = screener.getLocalizedMeta ? screener.getLocalizedMeta(language) : { name: screener.studentSafeName, durationLabel: screener.durationLabel, paradigms: screener.scientificParadigms };
  return renderAssessmentShell({
    eyebrow: "",
    title: meta.name,
    badges: [],
    taskMeta,
    progress,
    elapsedMs,
    durationLabel: meta.durationLabel,
    language,
  });
}

export function renderAssessmentShell({ eyebrow, title, badges = [], taskMeta, progress, elapsedMs, durationLabel = "", language = "en" }) {
  const t = getLabels(language);
  return `
    <section class="task-shell">
      <div class="task-frame-header">
        <div>
          <h2>${escapeHtml(title)}</h2>
        </div>
        ${durationLabel ? `<div class="pill-row"><span class="info-pill">${escapeHtml(durationLabel)}</span></div>` : ""}
      </div>

      <div class="progress-panel-inline">
        <div>
          <strong>${escapeHtml(progress.text)}</strong>
        </div>
        <div class="pill-row">
          <span class="info-pill" data-session-elapsed>${escapeHtml(t.elapsed)} ${formatClock(elapsedMs)}</span>
        </div>
      </div>

      <div class="fluid-track" aria-hidden="true">
        <span style="width:${progress.percent}%"></span>
      </div>

      <div id="taskSlot" class="task-slot"></div>
    </section>
  `;
}

export function renderChallengeResultView({ challengeResult, challengeName, language = "en", screenerMap = {} }) {
  const t = getLabels(language);
  return `
    <section class="result-layout">
      <article class="soft-panel large">
        <div class="card-header-row">
          <div>
            <span class="section-label">${escapeHtml(t.challengeResultEyebrow || t.roleBasedOutput)}</span>
            <h3>${escapeHtml(challengeName)}</h3>
          </div>
          <div class="score-block">
            <span>${escapeHtml(t.challengeDomainsLabel || t.suiteStepLabel)}</span>
            <strong>${escapeHtml(String(challengeResult.signals.length))}</strong>
          </div>
        </div>
        <div class="pill-row">
          ${renderPills(challengeResult.involvedDomains.map((domain) => t.domainLabels?.[domain] || domain), "indicator-pill")}
        </div>
        <div class="teacher-grid">
          ${challengeResult.signals
            .map(
              (signal) => `
                <article class="mini-panel">
                  <span class="section-label">${escapeHtml(
                    screenerMap[signal.screener_id]?.getLocalizedMeta
                      ? screenerMap[signal.screener_id].getLocalizedMeta(language).name
                      : signal.student_safe_name
                  )}</span>
                  <strong>${escapeHtml(t.supportLevelLabels?.[signal.level] || signal.level)}</strong>
                  <p>${escapeHtml(signal.indicators.map((indicator) => t.indicatorLabels?.[indicator] || indicator).join(" • ") || t.noActiveFlags)}</p>
                </article>
              `
            )
            .join("")}
        </div>
        <details class="details-panel" open>
          <summary>${escapeHtml(t.challengeBlueprintLabel || t.resultSubtitle)}</summary>
          <pre>${escapeHtml(JSON.stringify(challengeResult.blueprintMeta, null, 2))}</pre>
        </details>
      </article>
    </section>
  `;
}

export function renderResultView({ signal, role, language = "en", screenerName }) {
  const t = getLabels(language);

  if (role === "student") {
    const studentView = serializeStudentSignalResponse(signal);
    return `
      <section class="result-layout">
        <article class="hero-panel compact">
          <div class="hero-copy">
            <p class="eyebrow">${escapeHtml(t.resultEyebrow)}</p>
            <h2>${escapeHtml(studentView.feedback[0] || t.feedbackThankYou)}</h2>
            <p>${escapeHtml(t.signalAvailableNote)}</p>
          </div>
          <div class="context-panel compact">
            <span class="section-label">${escapeHtml(t.signalPreviewLabel)}</span>
            <ul class="signal-list">
              ${studentView.feedback.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </div>
        </article>
      </section>
    `;
  }

  if (role === "teacher") {
    const teacherView = serializeTeacherSignalResponse(signal);
    const scoreBand = t.supportLevelLabels[teacherView.level] || teacherView.level;
    const displayName = screenerName || teacherView.screener;
    const localizedIndicators = teacherView.indicators.map((ind) => t.indicatorLabels?.[ind] || ind);
    const actionText = t.supportActionLabels?.[teacherView.suggested_support_action] || teacherView.suggested_support_action;
    return `
      <section class="result-layout">
        <article class="soft-panel large">
          <div class="card-header-row">
            <div>
              <span class="section-label">${escapeHtml(t.roleBasedOutput)}</span>
              <h3>${escapeHtml(displayName)}</h3>
            </div>
            <div class="score-block">
              <span>${escapeHtml(scoreBand)}</span>
              <strong>${teacherView.score}</strong>
            </div>
          </div>
          <div class="pill-row">
            ${renderPills(localizedIndicators, "indicator-pill")}
          </div>
          <p>${escapeHtml(actionText)}</p>
          <div class="teacher-grid">
            ${Object.entries(teacherView.metrics_summary)
              .map(
                ([label, value]) => `
                  <div class="mini-panel">
                    <span class="section-label">${escapeHtml(t.metricsLabels?.[label] || label.replaceAll("_", " "))}</span>
                    <strong>${escapeHtml(String(value))}</strong>
                  </div>
                `
              )
              .join("")}
          </div>
        </article>
      </section>
    `;
  }

  // support (default)
  const supportView = serializeSupportSignalResponse(signal);
  const scoreBand = t.supportLevelLabels[supportView.level] || supportView.level;
  const displayName = screenerName || supportView.screener_name;
  const localizedIndicators = supportView.indicators.map((ind) => t.indicatorLabels?.[ind] || ind);
  return `
    <section class="result-layout">
      <article class="soft-panel large">
        <div class="card-header-row">
          <div>
            <span class="section-label">${escapeHtml(t.roleBasedOutput)}</span>
            <h3>${escapeHtml(displayName)}</h3>
          </div>
          <div class="score-block">
            <span>${escapeHtml(scoreBand)}</span>
            <strong>${supportView.final_score}</strong>
          </div>
        </div>
        <div class="pill-row">
          ${renderPills(localizedIndicators, "indicator-pill")}
        </div>
        <div class="teacher-grid">
          <div class="mini-panel">
            <span class="section-label">${escapeHtml(t.resultStepLabel)}</span>
            <strong>${Math.round(supportView.confidence_score * 100)}%</strong>
          </div>
          <div class="mini-panel">
            <span class="section-label">${escapeHtml(t.resultProgressText)}</span>
            <strong>${supportView.trend_metadata.recent_trend_score}</strong>
          </div>
          <div class="mini-panel">
            <span class="section-label">${escapeHtml(t.finalSupportIndicatorLabel)}</span>
            <strong>${supportView.trend_metadata.final_support_indicator}</strong>
          </div>
          <div class="mini-panel">
            <span class="section-label">${escapeHtml(t.elapsed)}</span>
            <strong>${round(supportView.duration_seconds, 1)} s</strong>
          </div>
        </div>
        <details class="details-panel" open>
          <summary>${escapeHtml(t.resultSubtitle)}</summary>
          <pre>${escapeHtml(JSON.stringify(localizeDisplaySummary(supportView.support_summary, t), null, 2))}</pre>
        </details>
      </article>
    </section>
  `;
}

export function renderToolbarOptions(selectedRole, selectedTheme) {
  return {
    roleOptions: ROLE_OPTIONS.map(
      (option) => `<option value="${escapeHtml(option.value)}" ${selectedRole === option.value ? "selected" : ""}>${escapeHtml(option.label)}</option>`
    ).join(""),
    themeOptions: THEME_OPTIONS.map(
      (option) => `<option value="${escapeHtml(option.value)}" ${selectedTheme === option.value ? "selected" : ""}>${escapeHtml(option.label)}</option>`
    ).join(""),
  };
}
