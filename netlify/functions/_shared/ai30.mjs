// Progress rules for /ai-30-days. Stores only a name, day statuses, notes, and timestamps.
// The name key is trim + collapsed spaces + lowercase, so "Jane Doe" and "jane  doe" match.

import plan from "../../../ai-30-days/days.json" with { type: "json" };

export const DAY_COUNT = plan.days.length;
export const CURRICULUM = 31;
export const NOTE_MAX = 2000;
export const NAME_MAX = 40;

const NAME_RE = /^[\p{L}][\p{L}\s.'’-]{0,39}$/u;

export function collapse(value) {
  return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
}

export function normalizePerson(first, last) {
  const firstName = collapse(first);
  const lastName = collapse(last);
  if (!firstName || !lastName) return { ok: false, error: "name_required" };
  if (firstName.length > NAME_MAX || lastName.length > NAME_MAX) return { ok: false, error: "name_too_long" };
  if (!NAME_RE.test(firstName) || !NAME_RE.test(lastName)) return { ok: false, error: "name_invalid" };
  const key = `${firstName} ${lastName}`.toLowerCase();
  return { ok: true, key, first: firstName, last: lastName };
}

function cleanNote(value) {
  if (value == null || value === "") return "";
  const text = String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
  return text.slice(0, NOTE_MAX);
}

function daySlot(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  return {
    done: src.done === true,
    notes: cleanNote(src.notes),
  };
}

export function currentDay(days) {
  for (let n = 1; n <= DAY_COUNT; n += 1) {
    if (!days[String(n)] || days[String(n)].done !== true) return n;
  }
  return DAY_COUNT;
}

export function doneCount(days) {
  let n = 0;
  for (let i = 1; i <= DAY_COUNT; i += 1) if (days[String(i)] && days[String(i)].done) n += 1;
  return n;
}

export function isPracticeName(first, last) {
  return collapse(`${first || ""} ${last || ""}`).toLowerCase().startsWith("zztest");
}

// The host stays off the public leaderboard and out of peer comparisons.
export function isHost(person) {
  const first = collapse(person.first || person.first_name || "").toLowerCase();
  const last = collapse(person.last || person.last_name || "").toLowerCase();
  const key = collapse(person.key || person.name_key || `${first} ${last}`).toLowerCase();
  if (key === "jonathan wallace" || (first === "jonathan" && last === "wallace")) return true;
  return collapse(person.email || "").toLowerCase() === "jonathan@faristeam.ca";
}

// 8:00 p.m. Eastern on Friday, December 11, 2026. December is UTC-5 in Toronto.
export const CONTEST_END_ISO = "2026-12-12T01:00:00.000Z";
export const POST_MAX = 500;
export const CLOSE_COPY = "Leaderboard closes Friday, December 11 at 8 PM.";
export const PRIZE_COPY = "The winner gets 2 hours of one-on-one AI coaching with Jonathan.";
export const POINTS_COPY = "3 points for each lesson you finish. 2 more when you come back the next day. 1 more for a second visit the same day. 5 more when you share a lesson with the group, once per lesson. 3 more when you answer someone else's question, once per question.";
export const SELFIE_HELLO = "Got your learning selfie. Good job. Now you know how to stack the deck and win.";

export function contestOpen(now) {
  return new Date(now || Date.now()).getTime() < new Date(CONTEST_END_ISO).getTime();
}

export function countsForContest(iso) {
  const time = new Date(iso).getTime();
  return !Number.isNaN(time) && time <= new Date(CONTEST_END_ISO).getTime();
}

export function torontoParts(iso) {
  const date = new Date(iso || Date.now());
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type).value;
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
}

export function torontoDay(iso) {
  const parts = torontoParts(iso);
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : "";
}

export function selfieFilename(first, last, now) {
  const parts = torontoParts(now || Date.now());
  const given = collapse(first).replace(/[^\p{L}]+/gu, "") || "Learner";
  const initial = lastInitial(last) || "X";
  return `${given}-${initial}-${parts.year}-${parts.month}-${parts.day}-${parts.hour}${parts.minute}.jpg`;
}

export function validEmail(value) {
  const email = collapse(value).toLowerCase();
  if (email.length < 6 || email.length > 120) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "";
  return email;
}

// A stored email is never replaced. The first valid email is saved. A later sign-in must match it.
export function emailClaim(stored, given) {
  const saved = collapse(stored).toLowerCase();
  if (!saved) {
    const incoming = validEmail(given);
    if (!incoming) return { ok: false, error: "email_required" };
    return { ok: true, email: incoming, write: true };
  }
  if (collapse(given).toLowerCase() !== saved) return { ok: false, error: "email_mismatch" };
  return { ok: true, email: saved, write: false };
}

export const SELFIE_LIMIT = 3;
export const SELFIE_WINDOW_MS = 60 * 60 * 1000;

export function nextSelfieStamps(stamps, nowMs) {
  const now = Number.isFinite(nowMs) ? nowMs : Date.now();
  const recent = (stamps || []).map((stamp) => Number(stamp)).filter((stamp) => now - stamp < SELFIE_WINDOW_MS && now - stamp >= 0);
  if (recent.length >= SELFIE_LIMIT) return { ok: false, stamps: recent };
  recent.push(now);
  return { ok: true, stamps: recent };
}

export function cleanPost(value) {
  const text = String(value || "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
  if (!text) return "";
  return text.slice(0, POST_MAX);
}

function daySpan(earlier, later) {
  const a = Date.parse(`${earlier}T00:00:00Z`);
  const b = Date.parse(`${later}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

export function loginPoints(logins) {
  const counts = new Map();
  for (const iso of logins || []) {
    if (!countsForContest(iso)) continue;
    const day = torontoDay(iso);
    if (!day) continue;
    counts.set(day, (counts.get(day) || 0) + 1);
  }
  const days = [...counts.keys()].sort();
  let points = 0;
  for (let i = 1; i < days.length; i += 1) {
    if (daySpan(days[i - 1], days[i]) === 1) points += 2;
  }
  for (const count of counts.values()) if (count >= 2) points += 1;
  return points;
}

export function scorePerson(person, posts) {
  const days = lessonMap(migrateCurriculum(person.days));
  const doneLessons = new Set();
  for (let n = 1; n <= DAY_COUNT; n += 1) {
    const slot = days[String(n)];
    if (!slot || slot.done !== true) continue;
    if (slot.doneAt && !countsForContest(slot.doneAt)) continue;
    doneLessons.add(n);
  }
  const key = person.key;
  const mine = (posts || []).filter((post) => post.key === key && (!post.createdAt || countsForContest(post.createdAt)));
  const shared = new Set();
  for (const post of mine) {
    if (post.parentId) continue;
    if (doneLessons.has(Number(post.lesson))) shared.add(Number(post.lesson));
  }
  const answered = new Set();
  let answers = 0;
  for (const post of mine) {
    if (!post.parentId || post.parentKind !== "question" || post.parentKey === key) continue;
    const id = String(post.parentId);
    if (answered.has(id)) continue;
    answered.add(id);
    answers += 1;
  }
  const done = doneLessons.size;
  const points = done * 3 + loginPoints(person.logins) + shared.size * 5 + answers * 3;
  return { points, done };
}

const PEER_NOTE = {
  welcome: "Welcome in. Finish your first lesson to join the leaderboard.",
  ahead: "You're ahead of most of your peers learning AI. Keep it going.",
  behind: "You're a little behind your peers learning AI. Today's a good day to catch up.",
  even: "You're right in step with your peers learning AI.",
  first: "You're the first one here learning AI. Keep it going.",
};

function lastInitial(last) {
  const clean = collapse(last);
  if (!clean) return "";
  return Array.from(clean)[0].toUpperCase();
}

export function displayLearner(first, last) {
  const given = collapse(first);
  const initial = lastInitial(last);
  return initial ? `${given} ${initial}.` : given;
}

function peerPlace(you, counts) {
  if (!counts.length) return "first";
  const sorted = counts.slice().sort((a, b) => a - b);
  const n = sorted.length;
  if (n % 2 === 1) {
    const median = sorted[(n - 1) / 2];
    if (you > median) return "ahead";
    if (you < median) return "behind";
    return "even";
  }
  const low = sorted[n / 2 - 1];
  const high = sorted[n / 2];
  if (you > high) return "ahead";
  if (you < low) return "behind";
  return "even";
}

function asPerson(row) {
  return {
    key: String(row.key || row.name_key || ""),
    first: row.first || row.first_name || "",
    last: row.last || row.last_name || "",
    days: row.days,
    logins: row.logins || [],
    email: row.email || "",
    practice: isPracticeName(row.first || row.first_name || "", row.last || row.last_name || ""),
    host: isHost(row),
  };
}

function onPublicBoard(person) {
  return !person.practice && !person.host;
}

// Points decide the order. The same points share a rank. Names are only there to keep the list steady.
// Practice names that start with Zztest, and the host, stay off the board and out of the note.
// A learner with no finished lesson gets a welcome, not an ahead or behind line.
export function peerStanding(rows, posts, youKey) {
  const people = (rows || []).map(asPerson).filter((person) => person.key);
  const scored = people.map((person) => ({ ...person, ...scorePerson(person, posts) }));
  const you = scored.find((person) => person.key === youKey);
  const peers = scored.filter((person) => onPublicBoard(person) && person.key !== youKey);
  const youDone = you ? you.done : 0;
  const tone = youDone < 1 ? "welcome" : peerPlace(you ? you.points : 0, peers.map((person) => person.points));
  const board = scored.filter(onPublicBoard).map((person) => ({
    name: displayLearner(person.first, person.last),
    points: person.points,
    you: person.key === youKey,
  }));
  board.sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, "en"));
  let previous = "";
  let rank = 0;
  board.forEach((person, index) => {
    const mark = String(person.points);
    if (mark !== previous) {
      rank = index + 1;
      previous = mark;
    }
    person.rank = rank;
  });
  const closed = !contestOpen();
  const leaders = board.filter((person) => person.rank === 1 && person.points > 0);
  return {
    note: PEER_NOTE[tone],
    board,
    closed,
    winner: closed ? leaders.map((person) => person.name).join(" and ") : "",
  };
}

export function lessonTitle(day) {
  const found = (plan.days || []).find((item) => item.day === Number(day));
  return found ? found.title : "";
}

function hiddenPost(post) {
  if (isPracticeName(post.first, post.last)) return true;
  const body = collapse(post.body || "").replace(/[.]+$/, "").toLowerCase();
  return body === "that was a cool lesson";
}

export function publicFeed(posts, youKey) {
  const visible = (posts || []).filter((post) => !hiddenPost(post));
  const byId = new Map();
  const top = [];
  for (const post of visible) {
    if (post.parentId) continue;
    const item = {
      id: post.id,
      name: displayLearner(post.first, post.last),
      body: post.body,
      kind: post.kind,
      lessonTitle: lessonTitle(post.lesson),
      createdAt: post.createdAt,
      you: post.key === youKey,
      replies: [],
    };
    byId.set(String(post.id), item);
    top.push(item);
  }
  for (const post of visible) {
    if (!post.parentId) continue;
    const parent = byId.get(String(post.parentId));
    if (!parent) continue;
    parent.replies.push({
      id: post.id,
      name: displayLearner(post.first, post.last),
      body: post.body,
      createdAt: post.createdAt,
      you: post.key === youKey,
    });
  }
  top.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return top.slice(0, 80);
}

function csvCell(value) {
  const text = String(value == null ? "" : value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function learnersCsv(rows, posts) {
  const lines = ["name,email,points,lessons_completed,last_login"];
  const people = (rows || []).map(asPerson).filter((person) => person.key);
  people.sort((a, b) => a.first.localeCompare(b.first, "en") || a.last.localeCompare(b.last, "en"));
  for (const person of people) {
    const score = scorePerson(person, posts);
    const last = (person.logins || []).map((iso) => new Date(iso).getTime()).filter((time) => !Number.isNaN(time)).sort((a, b) => b - a)[0];
    lines.push([
      csvCell(`${person.first} ${person.last}`),
      csvCell(person.email),
      score.points,
      score.done,
      csvCell(last ? new Date(last).toISOString() : ""),
    ].join(","));
  }
  return `${lines.join("\r\n")}\r\n`;
}

export function emptyDays() {
  return { _curriculum: CURRICULUM };
}

// Old plans had 30 lessons. Lesson 10 was replaced by two new lessons, so stored
// numbers from 11 up move forward by one. If old lesson 10 was finished, new
// lesson 11 is marked finished. Numbers 1 to 9 stay put. Runs once.
export function migrateCurriculum(days) {
  const src = days && typeof days === "object" ? days : {};
  if (src._curriculum === CURRICULUM) return src;
  const next = { _curriculum: CURRICULUM };
  const copy = (from, to) => {
    const slot = src[String(from)];
    if (slot && typeof slot === "object") next[String(to)] = slot;
  };
  for (let n = 1; n <= 9; n += 1) copy(n, n);
  if (src["10"] && src["10"].done === true) copy(10, 11);
  for (let n = 11; n <= 30; n += 1) copy(n, n + 1);
  return next;
}

export function stampCurriculum(days) {
  const next = lessonMap(days);
  next._curriculum = CURRICULUM;
  return next;
}

export function lessonMap(days) {
  const out = {};
  const src = days && typeof days === "object" ? days : {};
  for (let n = 1; n <= DAY_COUNT; n += 1) {
    if (src[String(n)] && typeof src[String(n)] === "object") out[String(n)] = src[String(n)];
  }
  return out;
}

// Two finished lessons in any 8 hour stretch. The next one waits until 8 hours
// after the earlier of the two most recent completions.
export const PACE_LIMIT = 2;
export const PACE_WINDOW_MS = 8 * 60 * 60 * 1000;

export function completionTimes(days) {
  const times = [];
  const src = days && typeof days === "object" ? days : {};
  for (let n = 1; n <= DAY_COUNT; n += 1) {
    const slot = src[String(n)];
    if (!slot || slot.done !== true || !slot.doneAt) continue;
    const time = new Date(slot.doneAt).getTime();
    if (!Number.isNaN(time)) times.push(time);
  }
  times.sort((a, b) => a - b);
  return times;
}

export function paceUnlockAt(days, nowIso) {
  const times = completionTimes(days);
  if (times.length < PACE_LIMIT) return "";
  const earliest = times[times.length - PACE_LIMIT];
  const unlock = earliest + PACE_WINDOW_MS;
  const now = new Date(nowIso || Date.now()).getTime();
  if (Number.isNaN(now) || now >= unlock) return "";
  return new Date(unlock).toISOString();
}

// Forward only. A day can be marked done only after every earlier day is done.
// Done days stay done. Notes are kept on done days and on the current day. Locked days drop notes.
// doneAt is set on the server. The client clock is ignored.
// A third new completion inside the 8 hour pace window is refused. Older completions are left as they are.
export function applyProgress(existing, incoming, nowIso) {
  const prev = existing && existing.days && typeof existing.days === "object" ? existing.days : {};
  const nextIn = incoming && incoming.days && typeof incoming.days === "object" ? incoming.days : {};
  const now = nowIso || new Date().toISOString();
  const nowMs = new Date(now).getTime();
  const days = {};
  const stamped = completionTimes(prev);
  let passedOpen = false;

  for (let n = 1; n <= DAY_COUNT; n += 1) {
    const id = String(n);
    const before = prev[id] && typeof prev[id] === "object" ? prev[id] : null;
    const want = daySlot(nextIn[id]);
    const wasDone = !!(before && before.done === true);
    if (want.done && !wasDone && passedOpen) return { ok: false, error: "day_locked", day: n };
    if (want.done && !wasDone && stamped.length >= PACE_LIMIT) {
      const earliest = stamped[stamped.length - PACE_LIMIT];
      if (nowMs < earliest + PACE_WINDOW_MS) {
        return { ok: false, error: "pace", day: n, unlockAt: new Date(earliest + PACE_WINDOW_MS).toISOString() };
      }
    }
    const done = wasDone || want.done;
    const notes = done || !passedOpen ? want.notes : "";
    if (!done) passedOpen = true;

    const slot = {};
    if (done) {
      slot.done = true;
      if (wasDone) {
        if (before.doneAt) slot.doneAt = String(before.doneAt);
      } else {
        slot.doneAt = now;
        stamped.push(nowMs);
        stamped.sort((a, b) => a - b);
      }
    }
    if (notes) slot.notes = notes;
    if (Object.keys(slot).length) days[id] = slot;
  }

  return { ok: true, days };
}

export function publicRecord(person, row) {
  const days = lessonMap(row && row.days);
  const createdAt = row && row.createdAt ? row.createdAt : new Date().toISOString();
  const updatedAt = row && row.updatedAt ? row.updatedAt : createdAt;
  return {
    ok: true,
    first: person.first,
    last: person.last,
    days,
    createdAt,
    updatedAt,
    currentDay: currentDay(days),
    doneCount: doneCount(days),
    complete: doneCount(days) === DAY_COUNT,
    selfie: !!(row && (row.selfieAt || row.selfie_at)),
    needsEmail: !(row && row.email),
    unlockAt: paceUnlockAt(days),
  };
}

export function recordFromRow(row) {
  if (!row) return null;
  let days = row.days;
  if (typeof days === "string") {
    try { days = JSON.parse(days); } catch (e) { days = {}; }
  }
  return {
    first: row.first_name || row.first,
    last: row.last_name || row.last,
    days: days && typeof days === "object" ? days : {},
    createdAt: toIso(row.created_at || row.createdAt),
    updatedAt: toIso(row.updated_at || row.updatedAt),
    email: row.email || "",
    selfieAt: row.selfie_at || row.selfieAt || "",
    logins: Array.isArray(row.logins) ? row.logins : [],
  };
}

function toIso(value) {
  if (!value) return new Date().toISOString();
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}
