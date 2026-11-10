import { exampleMarkup } from "./examples.js";

const WHO = "jw-ai30-who";
const CACHE = "jw-ai30-cache";
const API = "/api/ai-30-days";

const state = {
  plan: null,
  first: "",
  last: "",
  days: {},
  currentDay: 1,
  doneCount: 0,
  complete: false,
  createdAt: "",
  tab: "today",
  view: null,
  offline: false,
  status: "",
};

const $ = (sel) => document.querySelector(sel);

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readWho() {
  try { return JSON.parse(localStorage.getItem(WHO) || "null"); } catch (e) { return null; }
}

function cacheKey(first, last) {
  return `${first} ${last}`.replace(/\s+/g, " ").trim().toLowerCase();
}

function readCache(first, last) {
  try {
    const row = JSON.parse(localStorage.getItem(CACHE) || "null");
    if (!row || row.key !== cacheKey(first, last)) return null;
    return row.record;
  } catch (e) {
    return null;
  }
}

function writeCache() {
  localStorage.setItem(CACHE, JSON.stringify({
    key: cacheKey(state.first, state.last),
    record: {
      days: state.days,
      currentDay: state.currentDay,
      doneCount: state.doneCount,
      complete: state.complete,
      createdAt: state.createdAt,
    },
  }));
}

function applyRecord(record) {
  state.days = record.days || {};
  state.currentDay = record.currentDay || 1;
  state.doneCount = record.doneCount || 0;
  state.complete = !!record.complete;
  state.createdAt = record.createdAt || "";
  writeCache();
}

async function post(op, extra) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ op, first: state.first, last: state.last, ...extra }),
  });
  const data = await res.json().catch(() => ({ ok: false, error: "json" }));
  if (!res.ok || !data.ok) {
    const err = new Error(data.error || "save");
    err.code = data.error || "save";
    throw err;
  }
  return data;
}

function dayByNumber(n) {
  return state.plan.days.find((d) => d.day === n);
}

function slot(n) {
  return state.days[String(n)] || {};
}

function isDone(n) {
  return slot(n).done === true;
}

function phase(n) {
  if (isDone(n)) return "done";
  if (n === state.currentDay && !state.complete) return "today";
  if (state.complete && n === lessonTotal()) return "done";
  return "locked";
}

function lockLine() {
  const current = dayByNumber(state.currentDay);
  if (!current) return "Finish the lesson before this one to unlock";
  return `Finish "${current.title}" to unlock`;
}

const LOCK = `<svg class="lock" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="1.8"></path></svg>`;

function icsHref(day, timeValue) {
  const value = /^\d{2}:\d{2}$/.test(timeValue || "") ? timeValue : "09:00";
  const [hh, mm] = value.split(":");
  const start = new Date();
  start.setDate(start.getDate() + 1);
  const p = (n) => String(n).padStart(2, "0");
  const date = `${start.getFullYear()}${p(start.getMonth() + 1)}${p(start.getDate())}`;
  return `/api/ai-30-days/ics?day=${day}&date=${date}&time=${hh}${mm}`;
}

function reminderBlock(day) {
  return `
    <div class="remind">
      <label for="remind-time-${day}">Reminder time</label>
      <input type="time" id="remind-time-${day}" value="09:00">
      <a class="btn btn--ghost" id="remind-${day}" href="${icsHref(day, "09:00")}">Add reminder to my calendar</a>
    </div>
  `;
}

function bindReminder(day) {
  const input = document.querySelector(`#remind-time-${day}`);
  const link = document.querySelector(`#remind-${day}`);
  if (!input || !link) return;
  const sync = () => { link.href = icsHref(day, input.value); };
  input.addEventListener("input", sync);
  input.addEventListener("change", sync);
}

function refuseLocked() {
  state.lockNote = lockLine();
  state.view = null;
}

function takeDayRequest() {
  const url = new URL(location.href);
  const raw = url.searchParams.get("day");
  if (raw || location.hash) {
    url.searchParams.delete("day");
    url.hash = "";
    history.replaceState(null, "", url.pathname + url.search);
  }
  const n = Number(raw);
  if (!raw || !Number.isInteger(n)) return;
  if (phase(n) === "locked") refuseLocked();
  else if (phase(n) === "done") { state.tab = "all"; state.view = n; state.lockNote = ""; }
  else { state.tab = "today"; state.view = null; state.lockNote = ""; }
}

function lessonTotal() {
  return state.plan && state.plan.days ? state.plan.days.length : 31;
}

function show(name) {
  $("#gate").hidden = name !== "gate";
  $("#app").hidden = name !== "app";
  const print = $("#print");
  if (print) print.hidden = name === "gate";
  const who = readWho();
  $("#who").hidden = !who;
  if (who) $("#who-name").textContent = `${who.first} ${who.last}`;
}

async function signIn(first, last, remember) {
  state.first = first;
  state.last = last;
  state.offline = false;
  state.status = "";
  if (remember) localStorage.setItem(WHO, JSON.stringify({ first, last }));
  const cached = readCache(first, last);
  if (cached) applyRecord(cached);
  try {
    applyRecord(await post("load"));
    state.offline = false;
  } catch (e) {
    if (e.code === "name_invalid" || e.code === "name_required" || e.code === "name_too_long") throw e;
    state.offline = true;
    if (!cached) {
      state.days = {};
      state.currentDay = 1;
      state.doneCount = 0;
      state.complete = false;
    }
    state.status = e.code === "rate"
      ? "Too many tries. Wait a few minutes and tap Try the server again."
      : "The server copy is not available yet. Notes on this device are only a backup until it connects.";
  }
  state.tab = "today";
  state.view = null;
  takeDayRequest();
  show("app");
  render();
}

function signOut() {
  localStorage.removeItem(WHO);
  localStorage.removeItem(CACHE);
  state.first = "";
  state.last = "";
  state.days = {};
  show("gate");
  $("#first").value = "";
  $("#last").value = "";
  $("#first").focus();
}

function render() {
  const root = $("#app");
  if (state.view != null && phase(state.view) === "locked") state.view = null;
  const banner = state.offline
    ? `<p class="warn" role="status">${esc(state.status)} <button type="button" class="linkish" id="retry">Try the server again</button></p>`
    : "";
  const locked = state.lockNote ? `<p class="lockline" role="status">${LOCK} ${esc(state.lockNote)}</p>` : "";
  const enter = state.justAdvanced ? " card--next" : "";

  let panel = "";
  if (state.tab === "today") panel = renderToday(dayByNumber(state.complete ? lessonTotal() : state.currentDay), enter);
  else if (state.tab === "progress") panel = renderProgress();
  else panel = renderAll();

  root.innerHTML = `
    ${banner}
    ${locked}
    <div class="tabs" role="tablist">
      <button type="button" role="tab" id="tab-today" aria-selected="${state.tab === "today"}">Lesson</button>
      <button type="button" role="tab" id="tab-progress" aria-selected="${state.tab === "progress"}">Progress</button>
      <button type="button" role="tab" id="tab-all" aria-selected="${state.tab === "all"}">All lessons</button>
    </div>
    ${panel}
    <p class="status" id="save-status" role="status">${esc(state.status && !state.offline ? state.status : "")}</p>
  `;

  $("#tab-today").onclick = () => { state.tab = "today"; state.view = null; render(); };
  $("#tab-progress").onclick = () => { state.tab = "progress"; render(); };
  $("#tab-all").onclick = () => { state.tab = "all"; render(); };
  const retry = $("#retry");
  if (retry) retry.onclick = () => signIn(state.first, state.last, true);

  if (state.tab === "today") bindToday(state.complete ? lessonTotal() : state.currentDay);
  if (state.tab === "progress") bindDots();
  if (state.tab === "all") bindAll();
  const shot = root.querySelector(".shot");
  if (shot) shot.onclick = () => openShot(shot);
  state.justAdvanced = false;
}

function renderToday(day, enter) {
  const done = isDone(day.day);
  const notes = slot(day.day).notes || "";
  const started = state.createdAt
    ? `<p class="fine">Your first lesson started when you signed in. There is no shared calendar.</p>`
    : `<p class="fine">Your first lesson starts when you sign in. There is no shared calendar.</p>`;
  return `
    <article class="card${enter || ""}" id="today-card">
      <p class="kicker">${esc(day.section)}</p>
      <div class="dayhead">
        <h2 class="lesson-title">${esc(day.title)}</h2>
        <p class="chip">About ${esc(day.minutes)}</p>
      </div>
      <p class="why">${esc(day.why)}</p>
      ${day.optional ? `<p class="optional"><strong>Optional.</strong> ${esc(day.optionalNote || "You can skip this lesson and tap Done.")}</p>` : ""}
      ${day.catchUp ? `<p class="catch">Good spot to catch up.</p>` : ""}
      ${reminderBlock(day.day)}
      ${day.day === 1 ? started : ""}
      <ol class="steps">${day.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      ${day.tip ? `<p class="tip"><strong>Tip.</strong> ${esc(day.tip)}</p>` : ""}
      ${day.assignment ? `<p class="assignment"><strong>Assignment.</strong> ${esc(day.assignment)}</p>` : ""}
      ${promptBoxes(day)}
      <div class="look">
        <h3>What good looks like</h3>
        <button type="button" class="shot" aria-label="Enlarge the example for ${esc(day.title)}">
          <span class="shot__frame">${exampleMarkup(day.visual)}</span>
        </button>
      </div>
      <label for="notes">Notes</label>
      <textarea id="notes" maxlength="2000" ${done && day.day !== state.currentDay && state.complete ? "" : ""}>${esc(notes)}</textarea>
      <div class="actions">
        ${done && state.complete ? `<p class="fine">You've finished every lesson that's here.</p>` : ""}
        ${!done ? `<button type="button" class="btn" id="done">${day.optional ? "Done" : "Mark done"}</button>` : `<p class="fine">Marked done. The next lesson is open.</p>`}
      </div>
    </article>
  `;
}

function renderProgress() {
  const total = lessonTotal();
  const pct = total ? Math.round((state.doneCount / total) * 100) : 0;
  return `
    <section class="card">
      <h2 class="lesson-title">${esc((dayByNumber(state.currentDay) || {}).title || "")}</h2>
      <div class="track" role="img" aria-label="Progress"><span style="width:${pct}%"></span></div>
    </section>
  `;
}

function renderAll() {
  const groups = [];
  let last = "";
  for (const day of state.plan.days) {
    if (day.section !== last) {
      groups.push(`<h3>${esc(day.section)}</h3>`);
      last = day.section;
    }
    const kind = phase(day.day);
    const note = kind === "locked" ? `${LOCK} ${esc(lockLine())}` : kind === "today" ? "Now" : "Done";
    groups.push(`<button type="button" class="row ${kind === "locked" ? "row--locked" : ""}" data-day="${day.day}"><span class="row__title">${esc(day.title)}</span><span class="row__note">${note}</span></button>`);
    if (state.view === day.day && kind !== "locked") groups.push(`<div class="open-day">${detail(day)}</div>`);
  }
  return `<section class="card"><ul class="daylist">${groups.join("")}</ul></section>`;
}

function detail(day) {
  const notes = slot(day.day).notes || "";
  return `
    <div class="card">
      <p class="why">${esc(day.why)}</p>
      <ol class="steps">${day.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      ${notes ? `<p class="tip"><strong>Your notes.</strong> ${esc(notes)}</p>` : `<p class="fine">No notes saved on this lesson.</p>`}
      ${promptBoxes(day)}
      ${reminderBlock(day.day)}
      <div class="look"><h3>What good looks like</h3><button type="button" class="shot" aria-label="Enlarge the example for ${esc(day.title)}"><span class="shot__frame">${exampleMarkup(day.visual)}</span></button></div>
    </div>
  `;
}

function promptList(day) {
  if (Array.isArray(day.prompts) && day.prompts.length) return day.prompts;
  if (day.prompt) return [day.prompt];
  return [];
}

function promptBoxes(day) {
  const list = promptList(day);
  return list.map((text, i) => {
    const label = list.length > 1 ? `Prompt ${i + 1}` : "Prompt";
    return `
      <div class="prompt">
        <header><p>${label}</p><button type="button" class="copy">Copy</button></header>
        <pre class="prompt-text">${esc(text)}</pre>
      </div>`;
  }).join("");
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {}
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "0";
  area.style.fontSize = "16px";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.contentEditable = "true";
  area.readOnly = false;
  area.focus();
  const range = document.createRange();
  range.selectNodeContents(area);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  area.setSelectionRange(0, area.value.length);
  let ok = false;
  try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
  document.body.removeChild(area);
  return ok;
}

function bindCopies(root) {
  root.querySelectorAll(".copy").forEach((btn) => {
    btn.onclick = async () => {
      const text = btn.closest(".prompt").querySelector(".prompt-text").textContent;
      const ok = await copyText(text);
      btn.textContent = ok ? "Copied" : "Select the prompt";
      setTimeout(() => { btn.textContent = "Copy"; }, 1600);
    };
  });
}

function bindToday(n) {
  bindCopies(document.querySelector("#today-card") || document);
  const notes = $("#notes");
  if (notes) {
    let timer;
    notes.oninput = () => {
      clearTimeout(timer);
      timer = setTimeout(() => saveNotes(n, notes.value), 700);
    };
  }
  const done = $("#done");
  if (done) {
    done.onclick = async () => {
      done.disabled = true;
      const notesValue = $("#notes") ? $("#notes").value : "";
      await savePayload(n, { done: true, notes: notesValue }, "Marked done.", true);
    };
  }
  const shot = document.querySelector("#today-card .shot");
  if (shot) shot.onclick = () => openShot(shot);
  bindReminder(n);
}

function bindDots() {
  document.querySelectorAll(".dot").forEach((btn) => {
    btn.onclick = () => {
      const n = Number(btn.dataset.day);
      if (phase(n) === "locked") { refuseLocked(); render(); return; }
      state.lockNote = "";
      if (phase(n) === "today") { state.tab = "today"; state.view = null; }
      else { state.tab = "all"; state.view = n; }
      render();
    };
  });
}

function bindAll() {
  document.querySelectorAll(".row").forEach((btn) => {
    btn.onclick = () => {
      const n = Number(btn.dataset.day);
      if (phase(n) === "locked") { refuseLocked(); render(); return; }
      state.lockNote = "";
      if (phase(n) === "today") { state.tab = "today"; state.view = null; render(); return; }
      state.view = state.view === n ? null : n;
      render();
    };
  });
  document.querySelectorAll(".open-day .shot").forEach((shot) => {
    shot.onclick = () => openShot(shot);
  });
  if (state.view) bindReminder(state.view);
  bindCopies(document.querySelector(".open-day") || document);
}

function payloadFromState(changeDay, change) {
  const days = {};
  for (let n = 1; n <= lessonTotal(); n += 1) {
    const cur = slot(n);
    const entry = {};
    if (cur.done) entry.done = true;
    if (cur.notes) entry.notes = cur.notes;
    if (n === changeDay) Object.assign(entry, change);
    if (Object.keys(entry).length) days[String(n)] = entry;
  }
  return days;
}

function explain(error) {
  if (error.code === "rate") return "Too many tries. Wait a few minutes and try again.";
  if (error.code === "day_locked") return "Finish the current day before moving on.";
  if (error.code === "name_invalid" || error.code === "name_required" || error.code === "name_too_long") {
    return "Use a first and last name, letters only, up to 40 characters each.";
  }
  return "Could not save on the server. Your place in the plan is unchanged.";
}

async function saveNotes(n, notes) {
  const days = payloadFromState(n, { notes });
  try {
    applyRecord(await post("save", { days }));
    state.offline = false;
    const status = $("#save-status");
    if (status) status.textContent = "Notes saved.";
  } catch (e) {
    const status = $("#save-status");
    if (status) status.textContent = explain(e);
  }
}

async function savePayload(n, change, okMessage, advance) {
  const days = payloadFromState(n, change);
  try {
    applyRecord(await post("save", { days }));
    state.offline = false;
    state.status = okMessage;
    state.lockNote = "";
    if (advance) {
      state.tab = "today";
      state.view = null;
      state.justAdvanced = true;
    }
    render();
  } catch (e) {
    state.status = explain(e);
    const done = $("#done");
    if (done) done.disabled = false;
    const status = $("#save-status");
    if (status) status.textContent = state.status;
  }
}

function openShot(shot) {
  const box = $("#lightbox");
  $("#lb-body").innerHTML = shot.querySelector(".ex, .ex--split")
    ? shot.querySelector(".shot__frame").innerHTML
    : shot.innerHTML;
  if (typeof box.showModal === "function") box.showModal();
  else box.setAttribute("open", "");
}

function printChecklist() {
  const root = $("#print-root");
  const days = state.plan.days.map((d) => `
    <article class="print-day">
      <h2><span class="box"></span>${esc(d.title)}</h2>
      <p>${esc(d.section)} · About ${esc(d.minutes)}${d.catchUp ? " · Good spot to catch up" : ""}${isDone(d.day) ? " · Done" : ""}</p>
      <p>${esc(d.why)}</p>
      <ol>${d.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
    </article>
  `).join("");
  root.innerHTML = `<h1>${esc(state.plan.title)}</h1><p>${esc(state.plan.rule)}</p>${days}<p>${esc(state.plan.signature)}</p>`;
  window.print();
}

function renderLearn() {
  const root = $("#learn");
  if (!root || !state.plan) return;
  const sections = state.plan.sections || [];
  const days = state.plan.days || [];
  const lines = sections.map((section) => `<li>${esc(section.summary || section.title)}</li>`).join("");
  const groups = sections.map((section) => {
    const start = section.days[0];
    const end = section.days[1];
    const items = days.filter((day) => day.day >= start && day.day <= end);
    return `<details class="learn__group">
      <summary>${esc(section.title)}</summary>
      <ul>${items.map((day) => `<li>${esc(day.title)}</li>`).join("")}</ul>
    </details>`;
  }).join("");
  root.innerHTML = `<h2>What you'll learn along the way</h2><ul class="learn__sum">${lines}</ul>${groups}`;
}

async function boot() {
  const res = await fetch("/ai-30-days/days.json", { cache: "no-cache" });
  state.plan = await res.json();
  renderLearn();
  $("#rule-text").textContent = state.plan.rule;
  $("#sig").textContent = state.plan.signature;
  const who = readWho();
  if (who && who.first && who.last) {
    await signIn(who.first, who.last, true);
  } else {
    show("gate");
  }
}

$("#gate-form").onsubmit = async (event) => {
  event.preventDefault();
  const first = $("#first").value;
  const last = $("#last").value;
  const err = $("#gate-err");
  if (!first.trim() || !last.trim()) {
    err.textContent = "Enter a first name and a last name.";
    return;
  }
  err.textContent = "";
  $("#enter").disabled = true;
  try {
    await signIn(first.trim(), last.trim(), true);
  } catch (e) {
    err.textContent = explain(e);
  }
  $("#enter").disabled = false;
};

$("#not-you").onclick = () => signOut();
$("#print").onclick = () => { if (state.plan) printChecklist(); };
$("#lb-close").onclick = () => {
  const box = $("#lightbox");
  if (box.close) box.close();
  box.removeAttribute("open");
};

boot().catch(() => {
  $("#rule-text").textContent = "The plan could not be loaded. Refresh the page.";
});
