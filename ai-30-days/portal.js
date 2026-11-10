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
  state.closed = !!record.closed;
  state.winner = record.winner || "";
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
const COMPLETE_LABEL = "I've completed the lesson and the challenge.";
const CLOSE_COPY = "Leaderboard closes Friday, December 11 at 8 PM.";
const PRIZE_COPY = "The winner gets 2 hours of one-on-one AI coaching with Jonathan.";
const POINTS_COPY = "3 points for each lesson you finish. 2 more when you come back the next day. 1 more for a second visit the same day. 5 more when you share a lesson with the group, once per lesson. 3 more when you answer someone else's question, once per question.";
const SELFIE_HELLO = "Got your learning selfie. Good job. Now you know how to stack the deck and win.";
const CONTEST_END = Date.parse("2026-12-12T01:00:00.000Z");
let feedTimer = 0;

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
  else if (phase(n) === "done") { state.tab = "today"; state.view = null; state.lockNote = ""; }
  else { state.tab = "today"; state.view = null; state.lockNote = ""; }
}

function lessonTotal() {
  return state.plan && state.plan.days ? state.plan.days.length : 31;
}

function show(name) {
  $("#gate").hidden = name !== "gate";
  $("#app").hidden = name !== "app";
  const who = readWho();
  $("#who").hidden = !who;
  if (who) $("#who-name").textContent = `${who.first} ${who.last}`;
}

async function signIn(first, last, email, remember) {
  state.first = first;
  state.last = last;
  state.offline = false;
  state.status = "";
  if (remember) localStorage.setItem(WHO, JSON.stringify({ first, last, email: email || "" }));
  const cached = readCache(first, last);
  if (cached) applyRecord(cached);
  try {
    const data = await post("load", email ? { email } : {});
    if (data.needsEmail) {
      show("gate");
      const err = $("#gate-err");
      if (err) err.textContent = "Add your email to continue.";
      return;
    }
    applyRecord(data);
    state.offline = false;
  } catch (e) {
    if (e.code === "name_invalid" || e.code === "name_required" || e.code === "name_too_long" || e.code === "email_invalid") throw e;
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
  startFeed();
}

function signOut() {
  clearInterval(feedTimer);
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
  const peers = state.note ? `<p class="peers" role="status">${esc(state.note)}</p>` : "";
  const enter = state.justAdvanced ? " card--next" : "";

  if (state.tab !== "progress" && state.tab !== "board") state.tab = "today";
  const panel = state.tab === "progress"
    ? renderProgress()
    : state.tab === "board"
      ? renderBoard()
      : renderToday(dayByNumber(state.complete ? lessonTotal() : state.currentDay), enter);

  root.innerHTML = `
    ${banner}
    ${locked}
    ${peers}
    <div class="tabs" role="tablist">
      <button type="button" role="tab" id="tab-today" aria-selected="${state.tab === "today"}">Lesson</button>
      <button type="button" role="tab" id="tab-progress" aria-selected="${state.tab === "progress"}">Progress</button>
      <button type="button" role="tab" id="tab-board" aria-selected="${state.tab === "board"}">Board</button>
    </div>
    ${panel}
    <p class="status" id="save-status" role="status">${esc(state.status && !state.offline ? state.status : "")}</p>
  `;

  $("#tab-today").onclick = () => { state.tab = "today"; state.view = null; render(); };
  $("#tab-progress").onclick = () => { state.tab = "progress"; render(); };
  $("#tab-board").onclick = () => { state.tab = "board"; render(); };
  const retry = $("#retry");
  if (retry) retry.onclick = () => signIn(state.first, state.last, true);

  if (state.tab === "today") bindToday(state.complete ? lessonTotal() : state.currentDay);
  if (state.tab === "progress") { bindDots(); bindSelfie(); }
  if (state.tab === "board") bindBoard();
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
      ${day.optional ? `<p class="optional"><strong>Optional.</strong> ${esc(day.optionalNote || `You can skip this lesson and tap ${COMPLETE_LABEL}`)}</p>` : ""}
      ${day.catchUp ? `<p class="catch">Good spot to catch up.</p>` : ""}
      ${reminderBlock(day.day)}
      ${day.day === 1 ? started : ""}
      <ol class="steps">${day.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      ${day.tip ? `<p class="tip"><strong>Tip.</strong> ${esc(day.tip)}</p>` : ""}
      ${day.assignment ? `<p class="assignment"><strong>Assignment.</strong> ${esc(day.assignment)}</p>` : ""}
      ${day.sample ? `<div class="sample"><p class="kicker">Sample, made up</p><pre class="sample__text">${esc(day.sample)}</pre></div>` : ""}
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
        ${!done ? `<button type="button" class="btn" id="done">${COMPLETE_LABEL}</button>` : `<p class="fine">Marked done. The next lesson is open.</p>`}
      </div>
      ${shareBox(day)}
    </article>
  `;
}

function countdownText(now) {
  let left = CONTEST_END - now;
  if (left <= 0) return "";
  const days = Math.floor(left / 86400000);
  left -= days * 86400000;
  const hours = Math.floor(left / 3600000);
  left -= hours * 3600000;
  const minutes = Math.floor(left / 60000);
  return `${days} days, ${hours} hours, ${minutes} minutes left.`;
}

function renderProgress() {
  const rows = Array.isArray(state.board) ? state.board : [];
  const body = rows.length ? rows.map((row) => `
    <li class="board__row${row.you ? " board__row--you" : ""}">
      <span class="board__rank">${esc(row.rank)}</span>
      <span class="board__name">${esc(row.name)}${row.you ? ` <span class="board__tag">You</span>` : ""}</span>
      <span class="board__points">${esc(row.points)}</span>
      <span class="board__done">${esc(row.done)}</span>
    </li>`).join("") : `<li class="fine">No one is on the board yet.</li>`;
  const clock = state.closed
    ? `<p class="prize">${state.winner ? `Winner: ${esc(state.winner)}` : "The leaderboard is closed."}</p>`
    : `<p class="prize" id="countdown">${esc(CLOSE_COPY)} ${esc(countdownText(Date.now()))}</p>`;
  return `
    <section class="card board" aria-label="Leaderboard">
      <h2 class="lesson-title">Leaderboard</h2>
      ${clock}
      <p class="prize">${esc(PRIZE_COPY)}</p>
      ${state.selfie ? selfieUnlocked() : selfieLocked()}
      <div class="board__head"><span>Rank</span><span>Name</span><span>Points</span><span>Lessons</span></div>
      <ul class="board__list">${body}</ul>
    </section>
  `;
}

function selfieLocked() {
  return `
    <section class="selfie" id="selfie">
      <h3>Post a selfie of you learning AI to unlock how to earn points</h3>
      <button type="button" class="btn" id="selfie-cam">Take a selfie</button>
      <button type="button" class="btn btn--ghost" id="selfie-lib">Choose from Photos</button>
      <input id="selfie-cam-file" type="file" accept="image/*" capture="user" hidden>
      <input id="selfie-lib-file" type="file" accept="image/*" hidden>
      <div id="selfie-preview" hidden>
        <img id="selfie-img" alt="Preview of your selfie">
        <div class="selfie__actions">
          <button type="button" class="btn btn--ghost" id="selfie-retake">Retake</button>
          <button type="button" class="btn" id="selfie-upload">Upload</button>
        </div>
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
        <button type="button" class="tag" data-kind="stuck" aria-pressed="false">Stuck on</button>
      </div>
      <textarea id="share-body" maxlength="500" placeholder="A note for the group"></textarea>
      <button type="button" class="btn btn--ghost" id="share-send" data-lesson="${day.day}">Post to the group</button>
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

function renderBoard() {
  const posts = Array.isArray(state.posts) ? state.posts : [];
  const cards = posts.length ? posts.map((post) => `
    <article class="post" data-id="${esc(post.id)}">
      <header>
        <span class="pill">${esc(kindLabel(post.kind))}</span>
        <strong>${esc(post.name)}</strong>
        <time>${esc(stamp(post.createdAt))}</time>
      </header>
      <p class="post__lesson">${esc(post.lessonTitle || "")}</p>
      <p>${esc(post.body)}</p>
      <div class="replies">${(post.replies || []).map((reply) => `
        <article class="reply">
          <header><strong>${esc(reply.name)}</strong> <time>${esc(stamp(reply.createdAt))}</time></header>
          <p>${esc(reply.body)}</p>
          <button type="button" class="linkish remove" data-id="${esc(reply.id)}">Remove</button>
        </article>`).join("")}</div>
      <div class="replybox">
        <textarea maxlength="500" placeholder="Write a reply"></textarea>
        <button type="button" class="btn btn--ghost reply-send" data-parent="${esc(post.id)}">Reply</button>
      </div>
      <button type="button" class="linkish remove" data-id="${esc(post.id)}">Remove</button>
    </article>`).join("") : `<p class="fine">No notes yet. Share one from today's lesson.</p>`;
  return `<section class="card feed"><h2 class="lesson-title">Message board</h2>${cards}</section>`;
}

function kindLabel(kind) {
  if (kind === "question") return "Question";
  if (kind === "stuck") return "Stuck on";
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
      applyRecord(await post("talk", { lesson: Number(send.dataset.lesson), kind, body }));
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
  document.querySelectorAll(".reply-send").forEach((btn) => {
    btn.onclick = async () => {
      const box = btn.parentElement.querySelector("textarea");
      btn.disabled = true;
      try {
        applyRecord(await post("talk", { parentId: Number(btn.dataset.parent), body: box ? box.value : "" }));
        render();
      } catch (e) {
        btn.disabled = false;
      }
    };
  });
  document.querySelectorAll(".remove").forEach((btn) => {
    btn.onclick = async () => {
      const key = window.prompt("Admin key");
      if (!key) return;
      try {
        await post("remove", { id: Number(btn.dataset.id), adminKey: key });
        await refreshFeed();
        render();
      } catch (e) {
        window.alert("That key did not work.");
      }
    };
  });
}

let selfieBlob = null;

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
  const box = $("#selfie-preview");
  const img = $("#selfie-img");
  if (img.src && img.src.startsWith("blob:")) URL.revokeObjectURL(img.src);
  img.src = URL.createObjectURL(blob);
  box.hidden = false;
}

function bindSelfie() {
  const cam = $("#selfie-cam-file");
  const lib = $("#selfie-lib-file");
  const take = async (file) => {
    const status = $("#selfie-status");
    try {
      showPreview(await fileToJpeg(file));
      if (status) status.textContent = "";
    } catch (e) {
      if (status) status.textContent = e.message || "That photo didn't open.";
    }
  };
  if ($("#selfie-cam")) $("#selfie-cam").onclick = () => cam.click();
  if ($("#selfie-lib")) $("#selfie-lib").onclick = () => lib.click();
  if (cam) cam.onchange = () => { if (cam.files && cam.files[0]) take(cam.files[0]); };
  if (lib) lib.onchange = () => { if (lib.files && lib.files[0]) take(lib.files[0]); };
  if ($("#selfie-retake")) $("#selfie-retake").onclick = () => { cam.value = ""; cam.click(); };
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
        body: JSON.stringify({ first: state.first, last: state.last, image: data }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error("save");
      state.selfie = true;
      render();
    } catch (e) {
      if (status) status.textContent = "The photo did not save. Try again.";
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
    const typing = document.activeElement && /TEXTAREA|INPUT/i.test(document.activeElement.tagName);
    if (typing) return;
    if (state.tab === "board" || state.tab === "progress") render();
    else {
      const note = document.querySelector(".peers");
      if (note && state.note) note.textContent = state.note;
      const clock = $("#countdown");
      if (clock && !state.closed) clock.textContent = `${CLOSE_COPY} ${countdownText(Date.now())}`;
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
  if (error.code === "email_invalid" || error.code === "email_required") return "Enter a valid email address.";
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
    await signIn(who.first, who.last, who.email || "", true);
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
