// progression-ui.js
// UI logic for progression.html: maintains the day-by-day log (persisted
// in localStorage on this device only — not shared or sent anywhere),
// and renders the HMM's decoded state path as a colored timeline.

const STORAGE_KEY = "nirog-progression-log";

// Same severity colors used in the explainer diagram, so the visual
// language stays consistent with how this was introduced.
const STATE_COLORS = {
  "Healthy": { bg: "#FAEEDA", text: "#412402" },
  "Moderate": { bg: "#FAC775", text: "#633806" },
  "Sick": { bg: "#EF9F27", text: "#412402" },
  "Needs specialist": { bg: "#854F0B", text: "#FAEEDA" },
  "Diseases": { bg: "#412402", text: "#FAC775" },
};

function loadLog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLog(log) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {
    // localStorage unavailable (private browsing etc.) — log just won't persist.
  }
}

let dayLog = loadLog();

function renderDayLog() {
  const listEl = document.getElementById("dayLog");
  listEl.innerHTML = "";

  if (dayLog.length === 0) {
    listEl.innerHTML = '<li class="day-log-empty">No days logged yet.</li>';
    return;
  }

  dayLog.forEach((count, i) => {
    const li = document.createElement("li");
    li.className = "day-log-row";
    li.innerHTML = `
      <span class="day-log-label">Day ${i + 1}</span>
      <span class="day-log-count">${count} symptom${count === 1 ? "" : "s"}</span>
      <button type="button" class="day-log-remove" data-index="${i}" aria-label="Remove this day">\u00D7</button>
    `;
    listEl.appendChild(li);
  });

  listEl.querySelectorAll(".day-log-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.index, 10);
      dayLog.splice(idx, 1);
      saveLog(dayLog);
      renderDayLog();
      resetResults();
    });
  });
}

function resetResults() {
  document.getElementById("trendEmpty").hidden = false;
  document.getElementById("trendFilled").hidden = true;
}

function renderTrend(result) {
  const emptyEl = document.getElementById("trendEmpty");
  const filledEl = document.getElementById("trendFilled");
  const timelineEl = document.getElementById("stateTimeline");
  const verdictEl = document.getElementById("trendVerdict");

  emptyEl.hidden = true;
  filledEl.hidden = false;

  timelineEl.innerHTML = "";
  result.dailyStates.forEach((state, i) => {
    const colors = STATE_COLORS[state];
    const chip = document.createElement("div");
    chip.className = "state-chip";
    chip.style.background = colors.bg;
    chip.style.color = colors.text;
    chip.innerHTML = `<span class="state-chip-day">Day ${i + 1}</span><span class="state-chip-label">${state}</span>`;
    timelineEl.appendChild(chip);
  });

  const trendWord = result.trend;
  const isWord = ["Improving", "Stable", "Worsening"].includes(trendWord);
  verdictEl.innerHTML = isWord
    ? `Overall trend — <strong>${trendWord}</strong>`
    : trendWord; // "Not enough data yet..." message
}

document.addEventListener("DOMContentLoaded", () => {
  renderDayLog();

  document.getElementById("addDayBtn").addEventListener("click", () => {
    const input = document.getElementById("dayCount");
    const value = parseInt(input.value, 10);
    if (Number.isNaN(value) || value < 0) return;
    dayLog.push(value);
    saveLog(dayLog);
    input.value = "";
    renderDayLog();
    resetResults();
  });

  document.getElementById("analyzeTrendBtn").addEventListener("click", () => {
    if (dayLog.length === 0) return;
    const result = window.NirogProgression.inferProgression(dayLog);
    renderTrend(result);
  });

  document.getElementById("clearLogBtn").addEventListener("click", () => {
    dayLog = [];
    saveLog(dayLog);
    renderDayLog();
    resetResults();
  });
});
