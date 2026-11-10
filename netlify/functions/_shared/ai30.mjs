// Progress rules for /ai-30-days. Stores only a name, day statuses, notes, and timestamps.
// The name key is trim + collapsed spaces + lowercase, so "Jane Doe" and "jane  doe" match.

export const DAY_COUNT = 30;
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

export function emptyDays() {
  return {};
}

// Forward only. A day can be marked done only after every earlier day is done.
// Done days stay done. Notes are kept on done days and on the current day. Locked days drop notes.
// doneAt is set on the server. The client clock is ignored.
export function applyProgress(existing, incoming, nowIso) {
  const prev = existing && existing.days && typeof existing.days === "object" ? existing.days : {};
  const nextIn = incoming && incoming.days && typeof incoming.days === "object" ? incoming.days : {};
  const now = nowIso || new Date().toISOString();
  const days = {};
  let passedOpen = false;

  for (let n = 1; n <= DAY_COUNT; n += 1) {
    const id = String(n);
    const before = prev[id] && typeof prev[id] === "object" ? prev[id] : null;
    const want = daySlot(nextIn[id]);
    const wasDone = !!(before && before.done === true);
    if (want.done && !wasDone && passedOpen) return { ok: false, error: "day_locked", day: n };
    const done = wasDone || want.done;
    const notes = done || !passedOpen ? want.notes : "";
    if (!done) passedOpen = true;

    const slot = {};
    if (done) {
      slot.done = true;
      slot.doneAt = wasDone && before.doneAt ? String(before.doneAt) : now;
    }
    if (notes) slot.notes = notes;
    if (Object.keys(slot).length) days[id] = slot;
  }

  return { ok: true, days };
}

export function publicRecord(person, row) {
  const days = row && row.days && typeof row.days === "object" ? row.days : {};
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
  };
}

function toIso(value) {
  if (!value) return new Date().toISOString();
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}
