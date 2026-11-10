import { exampleMarkup } from "./examples.js";

const WHO = "jw-ai30-who";
const CACHE = "jw-ai30-cache";
const ADMIN_TOKEN = "jw-ai30-admin-token";
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
  note: "",
  board: [],
  posts: [],
  selfie: false,
  closed: false,
  winner: "",
  tab: "today",
  view: null,
  offline: false,
  status: "",
  unlockAt: "",
  email: "",
  openThreads: {},
  replyTo: null,
  commentKind: "learned",
  reviewDay: null,
  isAdmin: false,
  needsAdminCode: false,
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
      note: state.note || "",
      board: state.board || [],
      posts: state.posts || [],
      selfie: !!state.selfie,
      closed: !!state.closed,
      winner: state.winner || "",
      unlockAt: state.unlockAt || "",
    },
  }));
}

function applyRecord(record) {
  state.days = record.days || {};
  state.currentDay = record.currentDay || 1;
  state.doneCount = record.doneCount || 0;
  state.complete = !!record.complete;
  state.createdAt = record.createdAt || "";
  state.note = record.note || "";
  state.board = Array.isArray(record.board) ? record.board : [];
  state.posts = Array.isArray(record.posts) ? record.posts : state.posts || [];
  state.selfie = !!record.selfie;
  state.isAdmin = record.isAdmin === true;
  state.needsAdminCode = record.needsAdminCode === true;
  state.closed = !!record.closed;
  state.winner = record.winner || "";
  if (record.unlockAt != null) state.unlockAt = record.unlockAt || "";
  writeCache();
}

async function post(op, extra) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ op, first: state.first, last: state.last, email: state.email || "", adminToken: readAdminToken(), ...extra }),
  });
  const data = await res.json().catch(() => ({ ok: false, error: "json" }));
  if (!res.ok || !data.ok) {
    const err = new Error(data.error || "save");
    err.code = data.error || "save";
    err.unlockAt = data.unlockAt || "";
    throw err;
  }
  return data;
}

function readAdminToken() {
  try {
    const saved = JSON.parse(localStorage.getItem(ADMIN_TOKEN) || "null");
    const email = (state.email || "").trim().toLowerCase();
    if (saved && saved.email === email && saved.token) return saved.token;
  } catch (e) {}
  return "";
}

function writeAdminToken(token) {
  localStorage.setItem(ADMIN_TOKEN, JSON.stringify({
    email: (state.email || "").trim().toLowerCase(),
    token,
  }));
}

function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN);
}

function dayByNumber(n) {
  return state.plan.days.find((d) => d.day === n);
}

function slot(n) {
  const day = dayByNumber(n);
  if (!day) return {};
  return state.days[day.id] || state.days[String(n)] || {};
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

function paceActive() {
  const at = Date.parse(state.unlockAt || "");
  return !Number.isNaN(at) && Date.now() < at;
}

function paceClock(date) {
  const parts = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour").value;
  const minute = parts.find((part) => part.type === "minute").value;
  const period = (parts.find((part) => part.type === "dayPeriod") || {}).value || "";
  return `${hour}:${minute} ${period.toUpperCase()}`.trim();
}

function paceLine() {
  const when = new Date(state.unlockAt);
  if (Number.isNaN(when.getTime())) return "Nice work. Your next lesson unlocks in a little while.";
  const clock = paceClock(when);
  const now = new Date();
  const sameDay = when.getFullYear() === now.getFullYear() && when.getMonth() === now.getMonth() && when.getDate() === now.getDate();
  if (sameDay) return `Nice work. Your next lesson unlocks at ${clock}.`;
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(when);
  return `Nice work. Your next lesson unlocks at ${clock} on ${weekday}.`;
}

function lockLine() {
  const current = dayByNumber(state.currentDay);
  if (!current) return "Finish the lesson before this one to unlock";
  return `Finish "${current.title}" to unlock`;
}

const LOCK = `<svg class="lock" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="1.8"></path></svg>`;
const COMPLETE_LABEL = "I've completed the lesson and the challenge.";
const CLOSE_COPY = "Leaderboard closes Friday, December 11 at 8 PM.";
const PRIZE_COPY = "The winner gets 2 hours of one-on-one AI coaching with Jonathan.";
const POINTS_COPY = "3 points for each lesson you finish. 2 more when you come back the next day. 1 more for a second visit the same day. 5 more when you share a lesson with the group, once per lesson. 3 more when you answer someone else's question, once per question.";
const SELFIE_HELLO = "Got your learning selfie. Good job. Now you know how to stack the deck and win.";
const CONTEST_END = Date.parse("2026-12-12T01:00:00.000Z");
let feedTimer = 0;

function isoDate(date) {
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

function shiftLocalDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return isoDate(date);
}

function unlockIcsHref() {
  const when = new Date(state.unlockAt || "");
  const day = dayByNumber(state.currentDay);
  if (!day || Number.isNaN(when.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  const date = `${when.getFullYear()}${p(when.getMonth() + 1)}${p(when.getDate())}`;
  const time = `${p(when.getHours())}${p(when.getMinutes())}`;
  return `/api/ai-30-days/ics?day=${day.day}&date=${date}&time=${time}&kind=unlock`;
}

function icsHref(day, dateValue, timeValue) {
  const time = /^\d{2}:\d{2}$/.test(timeValue || "") ? timeValue : "09:00";
  const [hh, mm] = time.split(":");
  const today = shiftLocalDate(0);
  const tomorrow = shiftLocalDate(1);
  let date = /^\d{4}-\d{2}-\d{2}$/.test(dateValue || "") ? dateValue : tomorrow;
  if (date < today) date = today;
  return `/api/ai-30-days/ics?day=${day}&date=${date.replace(/-/g, "")}&time=${hh}${mm}`;
}

function reminderBlock(day) {
  const today = shiftLocalDate(0);
  const tomorrow = shiftLocalDate(1);
  return `
    <div class="remind">
      <div class="remind__when">
        <div class="remind__field">
          <label for="remind-date-${day}">Reminder date</label>
          <input type="date" id="remind-date-${day}" value="${tomorrow}" min="${today}" aria-label="Reminder date">
        </div>
        <div class="remind__field">
          <label for="remind-time-${day}">Reminder time</label>
          <input type="time" id="remind-time-${day}" value="09:00" aria-label="Reminder time">
        </div>
      </div>
      <a class="btn btn--ghost" id="remind-${day}" href="${icsHref(day, tomorrow, "09:00")}" aria-label="Add tomorrow's lesson to my calendar">Add tomorrow's lesson to my calendar</a>
    </div>
  `;
}

function bindReminder(day) {
  const date = document.querySelector(`#remind-date-${day}`);
  const time = document.querySelector(`#remind-time-${day}`);
  const link = document.querySelector(`#remind-${day}`);
  if (!date || !time || !link) return;
  const sync = () => {
    if (!date.value || (date.min && date.value < date.min)) date.value = date.min || shiftLocalDate(1);
    link.href = icsHref(day, date.value, time.value);
  };
  date.addEventListener("input", sync);
  date.addEventListener("change", sync);
  time.addEventListener("input", sync);
  time.addEventListener("change", sync);
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
  else if (phase(n) === "done") { state.tab = "today"; state.view = null; state.lockNote = ""; }
  else { state.tab = "today"; state.view = null; state.lockNote = ""; }
}

function lessonTotal() {
  return state.plan && state.plan.days ? state.plan.days.length : 31;
}

function show(name) {
  $("#gate").hidden = name !== "gate";
  $("#app").hidden = name !== "app";
  document.body.classList.toggle("is-in", name === "app");
  const who = readWho();
  $("#who").hidden = !who;
  if (who) $("#who-name").textContent = `${who.first} ${who.last}`;
}

async function signIn(first, last, email, remember) {
  state.first = first;
  state.last = last;
  state.offline = false;
  state.status = "";
  const cached = readCache(first, last);
  try {
    const data = await post("load", { email: email || "" });
    if (data.needsEmail) {
      show("gate");
      const err = $("#gate-err");
      if (err) err.textContent = "Add your email to continue.";
      return;
    }
    state.email = email || "";
    applyRecord(data);
    state.offline = false;
    if (remember) localStorage.setItem(WHO, JSON.stringify({ first, last, email: state.email }));
  } catch (e) {
    if (e.code === "name_invalid" || e.code === "name_required" || e.code === "name_too_long" || e.code === "email_invalid" || e.code === "email_mismatch") throw e;
    state.offline = true;
    if (cached) applyRecord(cached);
    else {
      state.days = {};
      state.currentDay = 1;
      state.doneCount = 0;
      state.complete = false;
    }
    state.status = e.code === "rate"
      ? "Too many tries. Wait a few minutes and tap Try the server again."
      : "The server copy is not available yet. Your progress on this device is only a backup until it connects.";
  }
  state.tab = "today";
  state.view = null;
  takeDayRequest();
  show("app");
  render();
  startFeed();
}

function signOut() {
  clearInterval(feedTimer);
  localStorage.removeItem(WHO);
  localStorage.removeItem(CACHE);
  state.first = "";
  state.last = "";
  state.email = "";
  state.isAdmin = false;
  state.needsAdminCode = false;
  clearAdminToken();
  state.drafts = null;
  state.reviewDay = null;
  state.days = {};
  state.replyTo = null;
  state.openThreads = {};
  show("gate");
  $("#first").value = "";
  $("#last").value = "";
  $("#email").value = "";
  $("#first").focus();
}

function render() {
  const root = $("#app");
  if (state.view != null && phase(state.view) === "locked") state.view = null;
  const banner = state.offline
    ? `<p class="warn" role="status">${esc(state.status)} <button type="button" class="linkish" id="retry">Try the server again</button></p>`
    : "";
  const locked = state.lockNote ? `<p class="lockline" role="status">${LOCK}<span>${esc(state.lockNote)}</span></p>` : "";
  const peers = state.note ? `<p class="peers" role="status">${esc(state.note)}</p>` : "";
  const enter = state.justAdvanced ? " card--next" : "";

  if (state.tab !== "progress" && state.tab !== "board") state.tab = "today";
  const panel = state.tab === "progress"
    ? renderProgress()
    : state.tab === "board"
      ? renderBoard()
      : renderToday(dayByNumber(lessonOnScreen()), enter);

  root.innerHTML = `
    ${banner}
    ${locked}
    ${peers}
    <div class="tabs" role="tablist" aria-label="Bootcamp sections">
      <button type="button" role="tab" id="tab-today" aria-selected="${state.tab === "today"}" aria-label="Lesson">Lesson</button>
      <button type="button" role="tab" id="tab-progress" aria-selected="${state.tab === "progress"}" aria-label="Leaderboard">Leaderboard</button>
      <button type="button" role="tab" id="tab-board" aria-selected="${state.tab === "board"}" aria-label="Messages">Messages</button>
    </div>
    ${panel}
    ${renderAdminCode()}
    ${renderAdmin()}
    <p class="status" id="save-status" role="status">${esc(state.status && !state.offline ? state.status : "")}</p>
  `;

  bindAdminCode();
  bindAdmin();
  $("#tab-today").onclick = () => { state.tab = "today"; state.view = null; render(); };
  $("#tab-progress").onclick = () => { state.tab = "progress"; render(); };
  $("#tab-board").onclick = () => { state.tab = "board"; render(); };
  const retry = $("#retry");
  if (retry) retry.onclick = async () => {
    try {
      await signIn(state.first, state.last, state.email || "", true);
    } catch (e) {
      show("gate");
      const err = $("#gate-err");
      if (err) err.textContent = explain(e);
    }
  };

  if (state.tab === "today") bindToday(lessonOnScreen());
  if (state.tab === "progress") { bindDots(); bindSelfie(); }
  if (state.tab === "board") bindBoard();
  const shot = root.querySelector(".shot");
  if (shot) shot.onclick = () => openShot(shot);
  state.justAdvanced = false;
}

function stepLinks(day, stepNumber) {
  const links = Array.isArray(day.links) ? day.links.filter((link) => link && link.step === stepNumber) : [];
  if (!links.length) return "";
  const items = links.filter((link) => /^https:\/\/apps\.apple\.com\//.test(link.href || "")).map((link) =>
    `<li><a href="${esc(link.href)}" target="_blank" rel="noopener noreferrer">${esc(link.label)}</a></li>`
  ).join("");
  return items ? `<ul class="step-links">${items}</ul>` : "";
}

function lessonDownload(day) {
  if (!day || !/^[a-z0-9-]+$/.test(day.id || "")) return "";
  const href = `/ai-30-days/kit/lessons/${day.id}.zip`;
  return `<p class="lesson-files"><a href="${esc(href)}" download="${esc(day.id)}.zip">Download this lesson's files</a></p>`;
}

function lessonOnScreen() {
  if (state.reviewDay && isDone(state.reviewDay)) return state.reviewDay;
  if (state.complete) return lessonTotal();
  return state.currentDay;
}

function renderToday(day, enter) {
  const done = isDone(day.day);
  const waiting = !done && paceActive();
  const next = dayByNumber(day.day + 1);
  const started = state.createdAt
    ? `<p class="fine">Your first lesson started when you signed in.</p>`
    : `<p class="fine">Your first lesson starts when you sign in.</p>`;
  return `
    <article class="card${enter || ""}" id="today-card">
      <p class="kicker">${esc(day.section)}</p>
      <div class="dayhead">
        <h2 class="lesson-title">${esc(day.title)}</h2>
        <p class="chip">${esc(day.minutes)}</p>
        <p class="teach">The more you teach it, the better it gets.</p>
        ${lessonDownload(day)}
      </div>
      ${waiting ? `<p class="lockline pace" role="status">${LOCK}<span>${esc(paceLine())}</span></p><a class="btn btn--ghost" id="unlock-remind" href="${esc(unlockIcsHref())}">Add a reminder to my calendar</a>` : ""}
      <p class="why">${esc(day.why)}</p>
      ${day.optional ? `<p class="optional"><strong>Optional.</strong> ${esc(day.optionalNote || `You can skip this lesson and tap ${COMPLETE_LABEL}`)}</p>` : ""}
      ${day.catchUp ? `<p class="catch">Good spot to catch up.</p>` : ""}
      ${day.day === 1 ? started : ""}
      <ol class="steps">${day.steps.map((s, index) => `<li>${esc(s)}${stepLinks(day, index + 1)}</li>`).join("")}</ol>
      ${day.tip ? `<p class="tip"><strong>Tip.</strong> ${esc(day.tip)}</p>` : ""}
      ${day.assignment ? `<p class="assignment"><strong>Challenge.</strong> ${esc(day.assignment)}</p>` : ""}
      ${day.sample ? `<div class="sample"><p class="kicker">Sample, made up</p><pre class="sample__text">${esc(day.sample)}</pre></div>` : ""}
      ${promptBoxes(day)}
      <div class="look">
        <h3>What good looks like</h3>
        <button type="button" class="shot" aria-label="Enlarge the example for ${esc(day.title)}">
          <span class="shot__frame">${exampleMarkup(day.visual)}</span>
        </button>
      </div>
      <div class="actions">
        ${done && state.complete ? `<p class="fine">You've finished every lesson that's here.</p>` : ""}
        ${!done && !waiting ? `<button type="button" class="btn" id="done">${COMPLETE_LABEL}</button>` : ""}
        ${done && next ? `<button type="button" class="btn btn--ghost" id="open-next">The next lesson is open.</button>` : ""}
      </div>
      ${done && next ? reminderBlock(next.day) : ""}
      ${shareBox(day)}
    </article>
  `;
}

function plural(count, one, many) {
  return `${count} ${count === 1 ? one : many}`;
}

function countdownText(now) {
  let left = CONTEST_END - now;
  if (left <= 0) return "";
  const days = Math.floor(left / 86400000);
  left -= days * 86400000;
  const hours = Math.floor(left / 3600000);
  left -= hours * 3600000;
  const minutes = Math.floor(left / 60000);
  return `${plural(days, "day", "days")}, ${plural(hours, "hour", "hours")}, ${plural(minutes, "minute", "minutes")} left.`;
}

function renderAdminCode() {
  if (!state.needsAdminCode || state.isAdmin) return "";
  return `
    <section class="card" id="admin-code" aria-label="Admin code">
      <label for="admin-code-input">Admin code</label>
      <input id="admin-code-input" type="password" autocomplete="current-password" maxlength="40" aria-label="Admin code">
      <button type="button" class="btn" id="admin-code-send">Continue</button>
      <p class="err" id="admin-code-status" role="status"></p>
    </section>`;
}

function bindAdminCode() {
  const send = $("#admin-code-send");
  if (!send) return;
  send.onclick = async () => {
    const status = $("#admin-code-status");
    const code = ($("#admin-code-input") && $("#admin-code-input").value || "").trim();
    if (!code) {
      if (status) status.textContent = "Enter the admin code.";
      return;
    }
    send.disabled = true;
    try {
      const data = await post("admin-code", { code });
      if (data.adminToken) writeAdminToken(data.adminToken);
      state.isAdmin = true;
      state.needsAdminCode = true;
      render();
    } catch (e) {
      if (status) status.textContent = e.code === "admin_lock"
        ? "Too many tries. Wait 15 minutes and try again."
        : "That code did not work.";
      send.disabled = false;
    }
  };
}

function renderAdmin() {
  if (state.isAdmin !== true) return "";
  return `
    <section class="card" id="admin" aria-label="Admin">
      <h2 class="lesson-title">Admin</h2>
      <button type="button" class="btn" id="admin-csv">Download learner CSV</button>
      <button type="button" class="btn btn--ghost" id="admin-reset">Reset test rows</button>
      <label for="admin-first">Learner first name</label>
      <input id="admin-first" autocomplete="off" maxlength="40">
      <label for="admin-last">Learner last name</label>
      <input id="admin-last" autocomplete="off" maxlength="40">
      <button type="button" class="btn btn--ghost" id="admin-delete">Delete this learner</button>
      <label for="admin-post">Board post id</label>
      <input id="admin-post" inputmode="numeric" autocomplete="off">
      <button type="button" class="btn btn--ghost" id="admin-remove">Remove this post</button>
      <p class="err" id="admin-status" role="status"></p>
    </section>`;
}

function bindAdmin() {
  if (state.isAdmin !== true) return;
  const status = $("#admin-status");
  const say = (text) => { if (status) status.textContent = text; };
  const csv = $("#admin-csv");
  if (csv) csv.onclick = async () => {
    say("");
    try {
      const data = await post("export");
      const blob = new Blob([data.csv || ""], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "ai-bootcamp-learners.csv";
      link.click();
      say("CSV downloaded.");
    } catch (e) {
      say("That did not work.");
    }
  };
  const reset = $("#admin-reset");
  if (reset) reset.onclick = async () => {
    if (!window.confirm("Remove Testy and Zztest learners, their points, logins, posts, and selfie flags?")) return;
    say("");
    try {
      await post("reset");
      say("Test rows removed.");
      render();
    } catch (e) {
      say("That did not work.");
    }
  };
  const remove = $("#admin-delete");
  if (remove) remove.onclick = async () => {
    const targetFirst = ($("#admin-first") && $("#admin-first").value || "").trim();
    const targetLast = ($("#admin-last") && $("#admin-last").value || "").trim();
    if (!targetFirst || !targetLast) {
      say("Enter the learner's first and last name.");
      return;
    }
    if (!window.confirm(`Delete ${targetFirst} ${targetLast}? Their lessons, posts, and logins will be removed.`)) return;
    say("");
    try {
      const data = await post("delete-learner", { targetFirst, targetLast });
      say(data.removed ? `${data.removed} was deleted.` : "No learner was found with that name.");
    } catch (e) {
      say("That did not work.");
    }
  };
  const drop = $("#admin-remove");
  if (drop) drop.onclick = async () => {
    const id = Number($("#admin-post") && $("#admin-post").value);
    if (!id) {
      say("Enter the post id.");
      return;
    }
    if (!window.confirm("Remove this board post and its replies?")) return;
    say("");
    try {
      await post("remove", { id });
      say("Post removed.");
      render();
    } catch (e) {
      say("That did not work.");
    }
  };
}

function renderProgress() {
  const rows = Array.isArray(state.board) ? state.board : [];
  const body = rows.length ? rows.map((row) => `
    <li class="board__row${row.you ? " board__row--you" : ""}">
      <span class="board__rank">${esc(row.rank)}</span>
      <span class="board__name">${esc(row.name)}${row.you ? ` <span class="board__tag">You</span>` : ""}</span>
      <span class="board__points">${esc(row.points)}</span>
    </li>`).join("") : `<li class="fine">Be the first on the board. Finish your first lesson to join.</li>`;
  const clock = state.closed
    ? `<p class="prize">${state.winner ? `Winner: ${esc(state.winner)}` : "The leaderboard is closed."}</p>`
    : `<p class="prize" id="countdown">${esc(CLOSE_COPY)} ${esc(countdownText(Date.now()))}</p>`;
  return `
    <section class="card board" aria-label="Leaderboard">
      <h2 class="lesson-title">Leaderboard</h2>
      ${clock}
      <p class="prize">${esc(PRIZE_COPY)}</p>
      ${state.selfie ? selfieUnlocked() : selfieLocked()}
      <div class="board__head"><span>Rank</span><span>Name</span><span>Points</span></div>
      <ul class="board__list">${body}</ul>
    </section>
  `;
}

function selfieLocked() {
  return `
    <section class="selfie" id="selfie">
      <h3>Post a selfie of you learning AI to unlock how to earn points</h3>
      <button type="button" class="btn" id="selfie-cam" aria-label="Take a selfie">Take a selfie</button>
      <button type="button" class="btn btn--ghost" id="selfie-lib" aria-label="Choose from Photos">Choose from Photos</button>
      <input id="selfie-cam-file" type="file" accept="image/*" capture="user" aria-label="Take a selfie" hidden>
      <input id="selfie-lib-file" type="file" accept="image/*" aria-label="Choose a selfie from Photos" hidden>
      <div id="selfie-preview" hidden>
        <img id="selfie-img" alt="Preview of your selfie">
        <div class="selfie__actions">
          <button type="button" class="btn btn--ghost" id="selfie-retake" aria-label="Retake selfie">Retake</button>
          <button type="button" class="btn" id="selfie-upload" aria-label="Upload selfie">Upload</button>
        </div>
        <button type="button" class="linkish" id="selfie-cancel">Cancel</button>
      </div>
      <p class="err" id="selfie-status" role="status"></p>
    </section>`;
}

function selfieUnlocked() {
  return `
    <section class="how">
      <p class="hello">${esc(SELFIE_HELLO)}</p>
      <h3>How points work</h3>
      <p>${esc(POINTS_COPY)}</p>
      <p class="prize">${esc(PRIZE_COPY)}</p>
    </section>`;
}

function shareBox(day) {
  return `
    <section class="share">
      <p class="share__prompt">Share what you learned with the group (+5 points)</p>
      <div class="tags" role="group" aria-label="What kind of note">
        <button type="button" class="tag" data-kind="learned" aria-pressed="true">Learned</button>
        <button type="button" class="tag" data-kind="question" aria-pressed="false">Question</button>
        <button type="button" class="tag" data-kind="stuck" aria-pressed="false">Stuck</button>
      </div>
      <textarea id="share-body" maxlength="500" placeholder="A note for the group" aria-label="A note for the group"></textarea>
      <button type="button" class="btn btn--ghost" id="share-send" data-lesson="${day.day}" data-lesson-id="${esc(day.id || "")}">Post to the group</button>
      <p class="fine" id="share-status" role="status"></p>
    </section>`;
}

function stamp(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

const AVATAR_PALETTE = [
  ["#1b1b1b", "#f7f3ec"],
  ["#c9a96a", "#1b1b1b"],
  ["#6e5a32", "#f7f3ec"],
  ["#e7d7b4", "#1b1b1b"],
  ["#3a3228", "#c9a96a"],
  ["#b3945a", "#1b1b1b"],
  ["#8c7350", "#f7f3ec"],
  ["#f3ead4", "#1b1b1b"],
];

function initials(name) {
  const parts = String(name || "").replace(/\./g, "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + last).toUpperCase();
}

function avatarStyle(name) {
  let hash = 0;
  const key = String(name || "").toLowerCase();
  for (let i = 0; i < key.length; i += 1) hash = (hash * 33 + key.charCodeAt(i)) >>> 0;
  const pair = AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
  return `background:${pair[0]};color:${pair[1]}`;
}

function relativeTime(iso) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const sec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (sec < 60) return "now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  const week = Math.floor(day / 7);
  return `${week}w`;
}

function commentRow(item, reply) {
  const name = item.name || "";
  const pill = reply ? "" : `<span class="cmt__pill">${esc(kindLabel(item.kind))}</span>`;
  const lesson = !reply && item.lessonTitle ? `<span class="cmt__lesson">${esc(item.lessonTitle)}</span>` : "";
  const replyBtn = reply ? "" : `<button type="button" class="linkish reply-open" data-id="${esc(item.id)}" data-name="${esc(name)}" aria-label="Reply to ${esc(name)}">Reply</button>`;
  return `
    <article class="cmt${reply ? " cmt--reply" : ""}">
      <span class="avatar" style="${avatarStyle(name)}" aria-hidden="true">${esc(initials(name))}</span>
      <div class="cmt__main">
        <p class="cmt__text"><strong>${esc(name)}</strong> ${esc(item.body)}</p>
        <p class="cmt__meta">
          <time datetime="${esc(item.createdAt || "")}" title="${esc(stamp(item.createdAt))}">${esc(relativeTime(item.createdAt))}</time>
          ${pill}
          ${lesson}
          ${replyBtn}
        </p>
      </div>
    </article>`;
}

function replyThread(post) {
  const replies = [...(post.replies || [])].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  if (!replies.length) return "";
  const open = !!state.openThreads[String(post.id)];
  const extra = replies.length - 2;
  const shown = !open && extra > 0 ? replies.slice(extra) : replies;
  const label = open
    ? "Hide replies"
    : `View ${extra} more ${extra === 1 ? "reply" : "replies"}`;
  const toggle = extra > 0
    ? `<button type="button" class="linkish thread-toggle" data-id="${esc(post.id)}">${label}</button>`
    : "";
  return `<div class="thread__replies">${toggle}${shown.map((reply) => commentRow(reply, true)).join("")}</div>`;
}

function draftStorageKey() {
  return `jw-ai30-drafts:${cacheKey(state.first || "", state.last || "")}`;
}

function loadDraftMap() {
  const key = draftStorageKey();
  if (!state.drafts || state.draftKey !== key) {
    state.draftKey = key;
    try { state.drafts = JSON.parse(sessionStorage.getItem(key) || "{}"); }
    catch (e) { state.drafts = {}; }
  }
  return state.drafts;
}

function draftId() {
  return state.replyTo ? `reply:${state.replyTo.id}` : "comment";
}

function keepDraft(text) {
  const drafts = loadDraftMap();
  const id = draftId();
  if (String(text || "").length) drafts[id] = String(text);
  else delete drafts[id];
  state.drafts = drafts;
  try { sessionStorage.setItem(draftStorageKey(), JSON.stringify(drafts)); } catch (e) {}
}

function takeDraft() {
  return loadDraftMap()[draftId()] || "";
}

function rememberComposer() {
  const input = $("#comment-body");
  if (input) keepDraft(input.value);
}

function composerBusy() {
  const input = $("#comment-body");
  return !!(input && input.value);
}

function renderComposer() {
  const replying = state.replyTo;
  const placeholder = replying ? `Reply to ${replying.name}` : "Add a comment...";
  const kind = state.commentKind || "learned";
  const tags = replying ? "" : `
    <div class="tags tags--compact" role="group" aria-label="What kind of note">
      <button type="button" class="tag" data-kind="learned" aria-pressed="${kind === "learned"}">Learned</button>
      <button type="button" class="tag" data-kind="question" aria-pressed="${kind === "question"}">Question</button>
      <button type="button" class="tag" data-kind="stuck" aria-pressed="${kind === "stuck"}">Stuck</button>
    </div>`;
  const note = replying
    ? `<p class="composer__to">Replying to ${esc(replying.name)} <button type="button" class="linkish" id="reply-cancel">Cancel</button></p>`
    : "";
  return `
    <form class="composer" id="composer">
      ${note}
      ${tags}
      <div class="composer__bar">
        <input id="comment-body" maxlength="500" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}" autocomplete="off">
        <button type="submit" class="btn" id="comment-send">Post</button>
      </div>
      <p class="fine" id="comment-status" role="status"></p>
    </form>`;
}

function renderBoard() {
  const posts = (Array.isArray(state.posts) ? state.posts.slice() : [])
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const cards = posts.length
    ? posts.map((post) => `${commentRow(post, false)}${replyThread(post)}`).join("")
    : `<p class="fine">Nothing here yet. Share one thing you learned, a question, or where you're stuck.</p>`;
  return `<section class="card feed"><h2 class="lesson-title">Messages</h2><div class="thread">${cards}</div>${renderComposer()}</section>`;
}

function kindLabel(kind) {
  if (kind === "question") return "Question";
  if (kind === "stuck") return "Stuck";
  return "Learned";
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
        <header><p>${label}</p><button type="button" class="copy" aria-label="Copy ${esc(label)}">Copy</button></header>
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
  const done = $("#done");
  if (done) {
    done.onclick = async () => {
      done.disabled = true;
      await savePayload(n, { done: true, notes: slot(n).notes || "" }, "Marked done.", true);
    };
  }
  const shot = document.querySelector("#today-card .shot");
  if (shot) shot.onclick = () => openShot(shot);
  const next = dayByNumber(n + 1);
  if (isDone(n) && next) bindReminder(next.day);
  const openNext = $("#open-next");
  if (openNext) {
    openNext.onclick = () => {
      state.reviewDay = null;
      render();
    };
  }
  bindShare();
}

function bindShare() {
  let kind = "learned";
  document.querySelectorAll(".tag").forEach((btn) => {
    btn.onclick = () => {
      kind = btn.dataset.kind;
      document.querySelectorAll(".tag").forEach((other) => other.setAttribute("aria-pressed", other === btn ? "true" : "false"));
    };
  });
  const send = $("#share-send");
  if (!send) return;
  send.onclick = async () => {
    const body = ($("#share-body") && $("#share-body").value) || "";
    const status = $("#share-status");
    send.disabled = true;
    try {
      applyRecord(await post("talk", { lesson: Number(send.dataset.lesson), lessonId: send.dataset.lessonId || "", kind, body }));
      if (status) status.textContent = "Posted to the group.";
      state.tab = "board";
      render();
    } catch (e) {
      if (status) status.textContent = e.code === "empty" ? "Write a note first." : explain(e);
      send.disabled = false;
    }
  };
}

function bindBoard() {
  const field = $("#comment-body");
  if (field) {
    field.value = takeDraft();
    const save = () => keepDraft(field.value);
    field.addEventListener("input", save);
    field.addEventListener("blur", save);
  }
  document.querySelectorAll(".reply-open").forEach((btn) => {
    btn.onclick = () => {
      rememberComposer();
      state.replyTo = { id: Number(btn.dataset.id), name: btn.dataset.name || "" };
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
      const input = $("#comment-body");
      if (input) input.focus();
    };
  });
  const cancel = $("#reply-cancel");
  if (cancel) {
    cancel.onclick = () => {
      rememberComposer();
      state.replyTo = null;
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
    };
  }
  document.querySelectorAll(".thread-toggle").forEach((btn) => {
    btn.onclick = () => {
      const id = String(btn.dataset.id);
      state.openThreads[id] = !state.openThreads[id];
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
    };
  });
  document.querySelectorAll(".composer .tag").forEach((btn) => {
    btn.onclick = () => {
      state.commentKind = btn.dataset.kind;
      document.querySelectorAll(".composer .tag").forEach((other) => {
        other.setAttribute("aria-pressed", other === btn ? "true" : "false");
      });
    };
  });
  const form = $("#composer");
  if (form) {
    form.onsubmit = async (event) => {
      event.preventDefault();
      const input = $("#comment-body");
      const status = $("#comment-status");
      const send = $("#comment-send");
      const body = input ? input.value : "";
      const replying = !!state.replyTo;
      if (!body.trim()) {
        if (status) status.textContent = replying ? "Type a reply first." : "Write a note first.";
        return;
      }
      if (send) send.disabled = true;
      try {
        if (state.replyTo) {
          applyRecord(await post("talk", { parentId: state.replyTo.id, body }));
          keepDraft("");
          state.replyTo = null;
        } else {
          const lesson = state.complete ? lessonTotal() : state.currentDay;
          const shown = dayByNumber(lesson);
          applyRecord(await post("talk", { lesson, lessonId: shown && shown.id, kind: state.commentKind || "learned", body }));
          keepDraft("");
        }
        state.status = "Posted to the group.";
        render();
      } catch (e) {
        if (status) {
          status.textContent = replying
            ? "That didn't post. Check your connection and try again."
            : (e.code === "empty" ? "Write a note first." : explain(e));
        }
        if (input) keepDraft(input.value);
        if (send) send.disabled = false;
      }
    };
  }
}

let selfieBlob = null;
let selfieHold = false;

async function fileToJpeg(file) {
  if (file.size > 15 * 1024 * 1024) throw new Error("That photo is too large. Use one under 15 MB.");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("This photo format didn't open. Take it again or choose a jpg."));
      image.src = url;
    });
    const max = 1280;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!blob) throw new Error("This photo format didn't open. Take it again or choose a jpg.");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function showPreview(blob) {
  selfieBlob = blob;
  selfieHold = true;
  const box = $("#selfie-preview");
  const img = $("#selfie-img");
  if (!box || !img) return;
  if (img.src && img.src.startsWith("blob:")) URL.revokeObjectURL(img.src);
  img.src = URL.createObjectURL(blob);
  box.hidden = false;
}

function clearSelfiePreview() {
  selfieHold = false;
  selfieBlob = null;
  const img = $("#selfie-img");
  if (img && img.src && img.src.startsWith("blob:")) URL.revokeObjectURL(img.src);
  if (img) img.removeAttribute("src");
  const box = $("#selfie-preview");
  if (box) box.hidden = true;
}

function bindSelfie() {
  const cam = $("#selfie-cam-file");
  const lib = $("#selfie-lib-file");
  const take = async (file) => {
    const status = $("#selfie-status");
    selfieHold = true;
    try {
      showPreview(await fileToJpeg(file));
      if (status) status.textContent = "";
    } catch (e) {
      if (!selfieBlob) selfieHold = false;
      if (status) status.textContent = e.message || "That photo didn't open.";
    }
  };
  if ($("#selfie-cam")) $("#selfie-cam").onclick = () => cam.click();
  if ($("#selfie-lib")) $("#selfie-lib").onclick = () => lib.click();
  if (cam) cam.onchange = () => { if (cam.files && cam.files[0]) take(cam.files[0]); };
  if (lib) lib.onchange = () => { if (lib.files && lib.files[0]) take(lib.files[0]); };
  if ($("#selfie-retake")) $("#selfie-retake").onclick = () => { cam.value = ""; cam.click(); };
  if ($("#selfie-cancel")) {
    $("#selfie-cancel").onclick = () => {
      clearSelfiePreview();
      refreshFeed();
    };
  }
  if (selfieHold && selfieBlob) showPreview(selfieBlob);
  if ($("#selfie-upload")) $("#selfie-upload").onclick = async () => {
    if (!selfieBlob) return;
    const status = $("#selfie-status");
    $("#selfie-upload").disabled = true;
    const data = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.readAsDataURL(selfieBlob);
    });
    try {
      const res = await fetch("/api/ai-30-days/selfie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first: state.first, last: state.last, email: state.email || "", image: data }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        const err = new Error(body.error || "save");
        err.code = body.error || "save";
        throw err;
      }
      selfieHold = false;
      selfieBlob = null;
      state.selfie = true;
      render();
    } catch (e) {
      if (status) {
        status.textContent = e.code === "rate"
          ? "You can upload 3 selfies an hour. Try again later."
          : e.code === "email_mismatch"
            ? explain(e)
            : "The photo did not save. Try again.";
      }
      $("#selfie-upload").disabled = false;
    }
  };
}

function startFeed() {
  clearInterval(feedTimer);
  feedTimer = setInterval(() => { refreshFeed(); }, 20000);
}

async function refreshFeed() {
  if (!state.first) return;
  try {
    const data = await post("feed");
    if (data.needsEmail) return;
    state.note = data.note || "";
    state.board = data.board || [];
    state.posts = data.posts || [];
    state.closed = !!data.closed;
    state.winner = data.winner || "";
    state.selfie = !!data.selfie;
    if (data.unlockAt != null) state.unlockAt = data.unlockAt || "";
    const typing = document.activeElement && /TEXTAREA|INPUT/i.test(document.activeElement.tagName);
    if (typing) return;
    if (state.tab === "board" && composerBusy()) return;
    if (selfieHold && state.tab === "progress") return;
    if (state.tab === "board" || state.tab === "progress") render();
    else {
      const note = document.querySelector(".peers");
      if (note && state.note) note.textContent = state.note;
      const clock = $("#countdown");
      if (clock && !state.closed) clock.textContent = `${CLOSE_COPY} ${countdownText(Date.now())}`;
      const showing = !!document.querySelector(".pace");
      if (!typing && showing !== paceActive()) render();
      else if (showing) {
        const span = document.querySelector(".pace span");
        if (span) span.textContent = paceLine();
      }
    }
  } catch (e) {}
}

function bindDots() {
  document.querySelectorAll(".dot").forEach((btn) => {
    btn.onclick = () => {
      const n = Number(btn.dataset.day);
      if (phase(n) === "locked") { refuseLocked(); render(); return; }
      state.lockNote = "";
      state.tab = "today";
      state.view = null;
      render();
    };
  });
}

function payloadFromState(changeDay, change) {
  const days = {};
  for (const day of state.plan.days) {
    const cur = state.days[day.id] || state.days[String(day.day)] || {};
    const entry = {};
    if (cur.done) entry.done = true;
    if (cur.notes) entry.notes = cur.notes;
    if (day.day === changeDay) Object.assign(entry, change);
    if (Object.keys(entry).length) days[day.id] = entry;
  }
  return days;
}

function explain(error) {
  if (error.code === "rate") return "Too many tries. Wait a few minutes and try again.";
  if (error.code === "day_locked") return "Finish this lesson before moving on.";
  if (error.code === "pace") return paceLine();
  if (error.code === "email_invalid" || error.code === "email_required") return "Enter a valid email address.";
  if (error.code === "email_mismatch") return "That name is already taken with a different email. Use the email you signed up with.";
  if (error.code === "name_invalid" || error.code === "name_required" || error.code === "name_too_long") {
    return "Use a first and last name, letters only, up to 40 characters each.";
  }
  return "Could not save on the server. Your place in the plan is unchanged.";
}

async function savePayload(n, change, okMessage, advance) {
  const days = payloadFromState(n, change);
  try {
    applyRecord(await post("save", { days }));
    state.offline = false;
    state.status = okMessage;
    state.lockNote = "";
    if (advance) {
      state.reviewDay = n;
      state.tab = "today";
      state.view = null;
      state.justAdvanced = true;
    }
    render();
  } catch (e) {
    if (e.unlockAt) state.unlockAt = e.unlockAt;
    state.status = explain(e);
    const done = $("#done");
    if (done) done.disabled = false;
    const status = $("#save-status");
    if (status) status.textContent = state.status;
    if (e.code === "pace") render();
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
    if (who.email) $("#email").value = who.email;
    try {
      await signIn(who.first, who.last, who.email || "", true);
    } catch (e) {
      show("gate");
      const err = $("#gate-err");
      if (err) err.textContent = explain(e);
    }
  } else {
    show("gate");
  }
}

$("#gate-form").onsubmit = async (event) => {
  event.preventDefault();
  const first = $("#first").value;
  const last = $("#last").value;
  const email = $("#email").value;
  const err = $("#gate-err");
  if (!first.trim() || !last.trim() || !email.trim()) {
    err.textContent = "Enter your name and email.";
    return;
  }
  err.textContent = "";
  $("#enter").disabled = true;
  try {
    await signIn(first.trim(), last.trim(), email.trim(), true);
  } catch (e) {
    err.textContent = explain(e);
  }
  $("#enter").disabled = false;
};

$("#not-you").onclick = () => signOut();
$("#lb-close").onclick = () => {
  const box = $("#lightbox");
  if (box.close) box.close();
  box.removeAttribute("open");
};

boot().catch(() => {
  $("#rule-text").textContent = "The plan could not be loaded. Refresh the page.";
});
