// RFC 5545 calendar file for one practice day. Times are floating local
// values (no timezone id, no Z) so 9:00 stays 9:00 on the agent's phone.

const PORTAL = "https://jonathanwallace.ca/ai-30-days";

export function assignmentText(day) {
  if (day && day.assignment && String(day.assignment).trim()) return String(day.assignment).trim();
  return ((day && day.steps) || []).join(" ");
}

export function eventDescription(day) {
  const title = String((day && day.title) || "your next lesson").trim();
  const topic = String((day && day.why) || "").replace(/\s+/g, " ").trim().replace(/\.+$/, "");
  const line = topic ? `${topic}.` : "";
  return `Time for tomorrow's AI lesson: ${title}. ${line} Log in here: ${PORTAL}`.replace(/\s+/g, " ").trim();
}

export function escapeText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\n|\r/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

// Fold at 75 octets. Continuation lines start with a space, and that space
// counts toward the 75.
export function foldLine(line) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const parts = [];
  let start = 0;
  let budget = 75;
  while (start < bytes.length) {
    let end = start;
    let used = 0;
    while (end < bytes.length) {
      const size = utf8Size(bytes, end);
      if (used + size > budget) break;
      used += size;
      end += size;
    }
    if (end === start) end = start + utf8Size(bytes, start);
    parts.push(new TextDecoder().decode(bytes.slice(start, end)));
    start = end;
    budget = 74;
  }
  return parts.map((part, i) => (i === 0 ? part : ` ${part}`)).join("\r\n");
}

function utf8Size(bytes, index) {
  const b = bytes[index];
  if (b < 0x80) return 1;
  if ((b & 0xe0) === 0xc0) return 2;
  if ((b & 0xf0) === 0xe0) return 3;
  return 4;
}

export function stampUtc(date) {
  const d = date instanceof Date ? date : new Date(date);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

export function parseWhen(date, time) {
  if (!/^\d{8}$/.test(date || "") || !/^\d{4}$/.test(time || "")) return null;
  const y = Number(date.slice(0, 4));
  const mo = Number(date.slice(4, 6));
  const d = Number(date.slice(6, 8));
  const h = Number(time.slice(0, 2));
  const mi = Number(time.slice(2, 4));
  if (mo < 1 || mo > 12 || h > 23 || mi > 59) return null;
  const check = new Date(Date.UTC(y, mo - 1, d));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null;
  const now = new Date();
  const year = now.getUTCFullYear();
  if (y < year - 1 || y > year + 2) return null;
  return { date, hhmm: time };
}

function shift(date, hhmm, minutes) {
  const y = Number(date.slice(0, 4));
  const mo = Number(date.slice(4, 6));
  const d = Number(date.slice(6, 8));
  const h = Number(hhmm.slice(0, 2));
  const mi = Number(hhmm.slice(2, 4));
  const dt = new Date(Date.UTC(y, mo - 1, d, h, mi));
  dt.setUTCMinutes(dt.getUTCMinutes() + minutes);
  const p = (n) => String(n).padStart(2, "0");
  return `${dt.getUTCFullYear()}${p(dt.getUTCMonth() + 1)}${p(dt.getUTCDate())}T${p(dt.getUTCHours())}${p(dt.getUTCMinutes())}00`;
}

export function icsFilename(day) {
  const slug = String((day && day.title) || "session")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `ai-bootcamp-${slug || "session"}.ics`;
}

export function buildIcs(day, when, options) {
  const opts = options || {};
  const now = opts.now || new Date();
  const uid = opts.uid || `ai30-day-${day.day}-${when.date}T${when.hhmm}-${stampUtc(now)}@jonathanwallace.ca`;
  const summary = `AI Bootcamp: ${day.title}`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Jonathan Wallace//AI Bootcamp: Zero to Hero//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stampUtc(now)}`,
    `DTSTART:${shift(when.date, when.hhmm, 0)}`,
    `DTEND:${shift(when.date, when.hhmm, 30)}`,
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(eventDescription(day))}`,
    `URL:${PORTAL}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(`Time for tomorrow's AI lesson: ${day.title}.`)}`,
    "TRIGGER:PT0S",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}
