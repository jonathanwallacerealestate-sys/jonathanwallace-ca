import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { CONTEST_END_ISO, DAY_COUNT, applyProgress, currentDay, doneCount, emailClaim, loginPoints, migrateCurriculum, nextSelfieStamps, normalizePerson, paceUnlockAt, peerStanding, publicFeed, scorePerson, selfieFilename, validEmail } from "../netlify/functions/_shared/ai30.mjs";
import { buildIcs, eventDescription, icsFilename, parseWhen } from "../netlify/functions/_shared/ics.mjs";

const jane = normalizePerson("  Jane   ", "  DOE ");
assert.equal(jane.ok, true);
assert.equal(jane.key, "jane doe");
assert.equal(jane.first, "Jane");
assert.equal(normalizePerson("jane", "Doe").key, jane.key);
assert.equal(normalizePerson("Mary-Jane", "O'Brien").ok, true);
assert.equal(normalizePerson("St. Marie", "Leblanc").ok, true);
assert.equal(normalizePerson("", "Doe").ok, false);
assert.equal(normalizePerson("Jane2", "Doe").ok, false);
assert.equal(normalizePerson("J".repeat(41), "Doe").ok, false);

const t0 = "2026-11-10T00:00:00.000Z";
const created = applyProgress(null, { days: { 1: { notes: "Installed on both." } } }, t0);
assert.equal(created.ok, true);
assert.equal(created.days["1"].notes, "Installed on both.");
assert.equal(created.days["1"].done, undefined);
assert.equal(currentDay(created.days), 1);

const day1 = applyProgress({ days: created.days }, { days: { 1: { done: true, notes: "Sent one email." } } }, t0);
assert.equal(day1.ok, true);
assert.equal(day1.days["1"].done, true);
assert.equal(day1.days["1"].doneAt, t0);
assert.equal(currentDay(day1.days), 2);
assert.equal(doneCount(day1.days), 1);

const skipped = applyProgress({ days: {} }, { days: { 2: { done: true } } }, t0);
assert.equal(skipped.ok, false);
assert.equal(skipped.error, "day_locked");

const kept = applyProgress({ days: day1.days }, { days: { 1: { done: false, notes: "Still done." } } }, "2026-11-11T00:00:00.000Z");
assert.equal(kept.days["1"].done, true);
assert.equal(kept.days["1"].doneAt, t0);
assert.equal(kept.days["1"].notes, "Still done.");

const lockedNote = applyProgress({ days: {} }, { days: { 1: { notes: "today" }, 4: { notes: "nope" } } }, t0);
assert.equal(lockedNote.days["1"].notes, "today");
assert.equal(lockedNote.days["4"], undefined);

const long = applyProgress(null, { days: { 1: { notes: "x".repeat(5000) } } }, t0);
assert.equal(long.days["1"].notes.length, 2000);

const paceA = "2026-11-10T12:00:00.000Z";
const paceB = "2026-11-10T12:20:00.000Z";
const firstPace = applyProgress(null, { days: { 1: { done: true } } }, paceA);
const two = applyProgress({ days: firstPace.days }, { days: { 2: { done: true } } }, paceB);
assert.equal(two.ok, true);
assert.equal(two.days["1"].doneAt, paceA);
assert.equal(two.days["2"].done, true);
const third = applyProgress({ days: two.days }, { days: { 3: { done: true } } }, "2026-11-10T13:00:00.000Z");
assert.equal(third.ok, false);
assert.equal(third.error, "pace");
assert.equal(third.unlockAt, "2026-11-10T20:00:00.000Z");
assert.equal(two.days["1"].done, true);
assert.equal(two.days["2"].done, true);
assert.equal(two.days["3"], undefined);
const opened = applyProgress({ days: two.days }, { days: { 3: { done: true } } }, "2026-11-10T20:00:00.000Z");
assert.equal(opened.ok, true);
assert.equal(opened.days["3"].done, true);
const burst = {
  1: { done: true, doneAt: "2026-11-10T10:00:00.000Z" },
  2: { done: true, doneAt: "2026-11-10T10:05:00.000Z" },
  3: { done: true, doneAt: "2026-11-10T10:10:00.000Z" },
};
const fourth = applyProgress({ days: burst }, { days: { 4: { done: true } } }, "2026-11-10T12:00:00.000Z");
assert.equal(fourth.error, "pace");
assert.equal(fourth.unlockAt, "2026-11-10T18:05:00.000Z");
assert.equal(burst["1"].done, true);
assert.equal(burst["3"].doneAt, "2026-11-10T10:10:00.000Z");
assert.equal(paceUnlockAt(burst, "2026-11-10T18:05:00.000Z"), "");
const undated = { 1: { done: true }, 2: { done: true, doneAt: paceB } };
const afterUndated = applyProgress({ days: undated }, { days: { 3: { done: true } } }, "2026-11-10T13:00:00.000Z");
assert.equal(afterUndated.ok, true);
assert.equal(afterUndated.days["1"].done, true);
assert.equal(afterUndated.days["1"].doneAt, undefined);

const sameCase = normalizePerson("JANE", "doe");
assert.equal(sameCase.key, "jane doe");

const plan = JSON.parse(readFileSync(new URL("../ai-30-days/days.json", import.meta.url), "utf8"));
assert.equal(plan.days.length, DAY_COUNT);
assert.equal(plan.catchUpDays.join(","), "7,17,25");
assert.equal(plan.title, "AI Bootcamp: Zero to Hero");
assert.ok(!plan.rule.includes("—"));
const sections = {
  Foundations: [1, 7],
  "Clients and Social": [8, 11],
  "Calendar, Notes and Listings": [12, 15],
  "Letters and Offers": [16, 19],
  "Deal Card": [20, 22],
  Advanced: [23, 24],
  "Your List": [25, 30],
  Review: [31, 31],
};
const SMALL_WORDS = new Set(["a", "an", "the", "and", "or", "but", "for", "to", "in", "on", "of", "at", "by", "with", "then", "into", "as"]);
const BRANDS = { ai: "AI", sop: "SOP", brokerbay: "BrokerBay", coles: "Coles" };
function styleCore(core, force) {
  return core.split("-").map((part) => {
    const low = part.toLowerCase();
    if (BRANDS[low]) return BRANDS[low];
    if (!part || /^\d+$/.test(part)) return part;
    if (!force && SMALL_WORDS.has(low)) return low;
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  }).join("-");
}
function titleCase(text) {
  const tokens = text.split(" ");
  let after = false;
  return tokens.map((token, index) => {
    const match = token.match(/^(\W*)(.*?)(\W*)$/u);
    const force = index === 0 || index === tokens.length - 1 || after;
    after = token.endsWith(":") || (match[2] || "").endsWith(":");
    return match[1] + styleCore(match[2], force) + match[3];
  }).join(" ");
}
assert.deepEqual(plan.sections.map((section) => section.id), ["foundations", "clients", "calendar", "letters", "deals", "advanced", "list", "review"]);
for (const section of plan.sections) assert.equal(titleCase(section.title), section.title);
for (const day of plan.days) {
  assert.equal(titleCase(day.title), day.title, day.title);
  assert.equal(day.day, plan.days.indexOf(day) + 1);
}
const lightClose = "Ask it to save what you set up today.";
const earlyClose = "Before you close, ask your AI to save the decisions you made today in this chat. You'll move them into your decision log once you set it up.";
const standingClose = "Before we close, give me every decision we made in this chat. Tell me which SOP each one belongs in, update that SOP if it already exists, or give me new rows for my decision log.";
const sopReminder = "Before you finish: log every decision you made today in your SOP, or update the SOP it belongs to.";
for (const day of plan.days) {
  assert.equal(day.day, plan.days.indexOf(day) + 1);
  const prompts = Array.isArray(day.prompts) ? day.prompts : (day.prompt ? [day.prompt] : []);
  assert.ok(day.title && day.why && day.steps.length >= 3 && prompts.length && day.assignment && day.visual);
  assert.ok(prompts.every((item) => typeof item === "string" && item.trim()));
  assert.ok(!JSON.stringify(day).includes("—"), "em dash in day " + day.day);
  const last = day.steps[day.steps.length - 1];
  const lastPrompt = prompts[prompts.length - 1];
  if (day.day < 3) {
    assert.equal(last, lightClose);
    assert.equal(lastPrompt, lightClose);
    assert.doesNotMatch(day.assignment, /Before you finish/);
  } else if (day.day < 6) {
    assert.equal(last, earlyClose);
    assert.equal(lastPrompt, earlyClose);
    assert.ok(day.assignment.endsWith(sopReminder), "reminder missing on day " + day.day);
  } else {
    assert.equal(last, standingClose);
    assert.equal(lastPrompt, standingClose);
    assert.ok(day.assignment.endsWith(sopReminder), "reminder missing on day " + day.day);
  }
  assert.match(day.minutes, /^(About )?\d+( to \d+)? minutes$/);
  assert.equal(day.catchUp, plan.catchUpDays.includes(day.day));
  const band = Object.entries(sections).find(([, range]) => day.day >= range[0] && day.day <= range[1]);
  assert.ok(band, "section range for day " + day.day);
  assert.equal(day.section, band[0]);
}
assert.equal(plan.days[2].minutes, "60 to 90 minutes");
assert.equal(plan.days[15].minutes, "60 to 90 minutes");
assert.equal(plan.days[17].minutes, "60 to 90 minutes");
assert.equal(plan.days[20].minutes, "60 to 90 minutes");
assert.equal(plan.days[22].minutes, "60 to 90 minutes");
assert.equal(plan.days[0].title, "Pick Your AI and Tell It About Your Business");
assert.equal(plan.days[1].title, "Teach It Your Writing Style");
assert.equal(plan.days[6].optional, true);
assert.match(plan.days[6].optionalNote, /Skip this lesson/);
assert.match(plan.days[7].title, /review/i);
assert.match(plan.days[8].assignment, /brand guidelines/);
assert.equal(plan.days[11].title, "Book Appointments into Your Calendar");
assert.equal(plan.days[14].title, "Write Listing Descriptions in Your Top 5");
assert.equal(plan.days[16].title, "Practise, then Time a Real Letter");
assert.equal(plan.days[17].title, "Read an Offer: The Coles Notes");
assert.equal(plan.days[20].title, "Ten Leads, then Make the Calls");
assert.equal(plan.days[21].title, "Paste the Notes, then the Next 10");
assert.equal(plan.days[13].title, "Stay in Touch with Past Clients");
assert.match(plan.days[22].prompts.join("\n"), /RECO/);
assert.match(plan.days[22].prompts.join("\n"), /GeoWarehouse/);
assert.equal(plan.title, "AI Bootcamp: Zero to Hero");
assert.doesNotMatch(plan.rule, /30 days|Getting Started/);
assert.match(plan.days[23].title, /BrokerBay/);
assert.doesNotMatch(JSON.stringify(plan), /Follow Up Ace|Sisu|Brain log/);
assert.doesNotMatch(JSON.stringify(plan), /keep-going/);
assert.equal(plan.days[9].title, "Plan Your Social Media Strategy");
assert.equal(plan.days[10].title, "Create Your First Three Posts");
assert.equal(plan.days[24].title, "Your List: Hand Off Your First Task");
assert.equal(plan.days[30].title, "Final Review");
assert.ok(plan.days.every((day) => day.assignment.startsWith("Done when")));
assert.match(plan.days[10].prompts[0], /my social media plan/);
assert.doesNotMatch(JSON.stringify(plan), /Lesson \d+|Lessons \d+|\d+ lessons/);
const shifted = migrateCurriculum({
  9: { done: true, doneAt: "2026-11-01T00:00:00.000Z" },
  10: { done: true, doneAt: "2026-11-02T00:00:00.000Z" },
  11: { done: true, doneAt: "2026-11-03T00:00:00.000Z" },
});
assert.equal(shifted._curriculum, 31);
assert.equal(shifted["9"].done, true);
assert.equal(shifted["10"], undefined);
assert.equal(shifted["11"].doneAt, "2026-11-02T00:00:00.000Z");
assert.equal(shifted["12"].doneAt, "2026-11-03T00:00:00.000Z");
assert.equal(migrateCurriculum(shifted), shifted);

function unfold(ics) {
  return ics.replace(/\r\n[ \t]/g, "");
}

const when = parseWhen("20261111", "0900");
assert.ok(when);
assert.equal(parseWhen("20261111", "9"), null);
assert.equal(parseWhen("20260231", "0900"), null);

for (const number of [1, 5]) {
  const day = plan.days[number - 1];
  const ics = buildIcs(day, when, { now: new Date("2026-11-10T12:00:00Z"), uid: `test-day-${number}@jonathanwallace.ca` });
  assert.ok(!/(?<!\r)\n/.test(ics), "bare LF in day " + number);
  for (const line of ics.split("\r\n")) {
    assert.ok(new TextEncoder().encode(line).length <= 75, "long line in day " + number);
  }
  const text = unfold(ics);
  assert.match(text, new RegExp(`SUMMARY:AI Bootcamp: ${day.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  assert.doesNotMatch(icsFilename(day), /lesson-\d|Lesson/);
  assert.match(text, /DTSTART:20261111T090000/);
  assert.match(text, /DTEND:20261111T093000/);
  assert.match(text, /DTSTAMP:20261110T120000Z/);
  assert.match(text, /TRIGGER:PT0S/);
  assert.match(text, new RegExp(`UID:test-day-${number}@jonathanwallace.ca`));
  assert.match(text, /Time for tomorrow's AI lesson:/);
  assert.match(text, /Log in here: https:\/\/jonathanwallace\.ca\/ai-30-days/);
  assert.match(text, /URL:https:\/\/jonathanwallace\.ca\/ai-30-days/);
  assert.doesNotMatch(text, /RRULE|30-minute AI session|webhook|hook\.us2/);
  assert.match(text, new RegExp(`SUMMARY:AI Bootcamp: ${day.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
}
const tomorrow = unfold(buildIcs(plan.days[1], when, { now: new Date("2026-11-10T12:00:00Z") }));
assert.match(tomorrow, /SUMMARY:AI Bootcamp: Teach It Your Writing Style/);
assert.match(tomorrow, /Time for tomorrow's AI lesson: Teach It Your Writing Style\. What you feed it is what it writes like\. Log in here: https:\/\/jonathanwallace\.ca\/ai-30-days/);
assert.doesNotMatch(buildIcs(plan.days[0], when), /—/);
assert.match(portalPlaceholder(), /reminderBlock\(next\.day\)/);
assert.match(portalPlaceholder(), /type="date"/);
assert.match(portalPlaceholder(), /Reminder date/);
assert.match(portalPlaceholder(), /min="\$\{today\}"/);

function portalPlaceholder() {
  return readFileSync(new URL("../ai-30-days/portal.js", import.meta.url), "utf8");
}
const portalSrc = portalPlaceholder();
assert.doesNotMatch(portalSrc, /All lessons|tab-all|renderAll|Mark done|of \$\{lessonTotal/);
assert.match(portalSrc, /I've completed the lesson and the challenge\./);
assert.match(portalSrc, /id="tab-today"/);
assert.match(portalSrc, /id="tab-progress"/);
assert.match(portalSrc, /id="tab-board"/);
assert.match(portalSrc, />Leaderboard</);
assert.doesNotMatch(portalSrc, /<span>Lessons<\/span>|board__done/);
assert.match(portalSrc, />Message Board</);
assert.match(portalSrc, /Type a reply first\./);
assert.match(portalSrc, /That didn't post\. Check your connection and try again\./);
assert.match(portalSrc, /sessionStorage/);
assert.doesNotMatch(portalSrc, />Progress<|>Board</);
assert.match(portalSrc, /capture="user"/);
assert.match(portalSrc, /Got your learning selfie\. Good job\. Now you know how to stack the deck and win\./);
assert.match(portalSrc, /Leaderboard closes Friday, December 11 at 8 PM\./);
assert.match(portalSrc, /The winner gets 2 hours of one-on-one AI coaching with Jonathan\./);
assert.match(portalSrc, /3 more when you answer someone else's question/);
assert.doesNotMatch(portalSrc, /Your selfie is shared|Print checklist|printChecklist|for="notes"/);
assert.doesNotMatch(readFileSync(new URL("../ai-30-days/index.html", import.meta.url), "utf8"), /Print checklist|print-root/);
assert.doesNotMatch(readFileSync(new URL("../ai-30-days/index.html", import.meta.url), "utf8"), /So we can send you updates/);
assert.doesNotMatch(portalSrc, /role="img" aria-label="Progress"/);
assert.match(portalSrc, /Add a comment\.\.\./);
assert.match(portalSrc, /View \$\{extra\} more/);
assert.match(portalSrc, /function relativeTime/);
assert.match(portalSrc, /function initials/);
assert.doesNotMatch(portalSrc, /❤|aria-label="Like"|like-count/);
assert.match(portalSrc, /Nice work\. Your next lesson unlocks at /);
assert.match(portalSrc, /That name is already taken with a different email\. Use the email you signed up with\./);
assert.match(portalSrc, /You can upload 3 selfies an hour\./);
assert.match(portalSrc, /selfieHold/);
assert.match(portalSrc, /id="selfie-cancel"/);
assert.doesNotMatch(portalSrc, /linkish remove|window\.prompt\("Admin key"\)/);
assert.match(readFileSync(new URL("../ai-30-days/export.html", import.meta.url), "utf8"), /Remove a board post/);
assert.doesNotMatch(readFileSync(new URL("../ai-30-days/portal.css", import.meta.url), "utf8"), /—/);
assert.match(readFileSync(new URL("../ai-30-days/portal.css", import.meta.url), "utf8"), /\.composer/);

function learner(key, first, last, done) {
  const days = { _curriculum: 31 };
  for (let n = 1; n <= done; n += 1) days[String(n)] = { done: true };
  return { key, first, last, days };
}
const classRows = [
  learner("ada north", "Ada", "North", 2),
  learner("ben cole", "Ben", "Cole", 4),
  learner("cara singh", "Cara", "Singh", 4),
  learner("dee park", "Dee", "Park", 1),
  learner("zztest notab", "Zztest", "Notab", 20),
];
const ben = peerStanding(classRows, [], "ben cole");
assert.equal(ben.note, "You're ahead of most of your peers learning AI. Keep it going.");
assert.equal(ben.board.length, 4);
assert.deepEqual(ben.board.map((row) => [row.rank, row.name, row.points, row.you]), [
  [1, "Ben C.", 12, true],
  [1, "Cara S.", 12, false],
  [3, "Ada N.", 6, false],
  [4, "Dee P.", 3, false],
]);
assert.ok(ben.board.every((row) => row.done == null));
const tiedLessons = peerStanding([
  learner("amy bee", "Amy", "Bee", 2),
  Object.assign(learner("cam dee", "Cam", "Dee", 1), { logins: ["2026-11-08T15:00:00.000Z", "2026-11-09T15:00:00.000Z", "2026-11-09T18:00:00.000Z"] }),
], [], "amy bee");
assert.deepEqual(tiedLessons.board.map((row) => [row.rank, row.name, row.points]), [
  [1, "Amy B.", 6],
  [1, "Cam D.", 6],
]);
assert.equal(peerStanding(classRows, [], "dee park").note, "You're off to a good start. Keep going.");
assert.equal(peerStanding(classRows, [], "ada north").note, "You're off to a good start. Keep going.");
assert.equal(peerStanding([
  learner("ada north", "Ada", "North", 2),
  learner("dee park", "Dee", "Park", 1),
], [], "ada north").note, "You're ahead of most of your peers learning AI. Keep it going.");
assert.equal(peerStanding([
  learner("ada north", "Ada", "North", 3),
  learner("ben cole", "Ben", "Cole", 4),
], [], "ada north").note, "You're a little behind your peers learning AI. Today's a good day to catch up.");
assert.equal(peerStanding([
  learner("ada north", "Ada", "North", 3),
  learner("ben cole", "Ben", "Cole", 3),
], [], "ada north").note, "You're right in step with your peers learning AI.");
const solo = peerStanding([
  learner("ada north", "Ada", "North", 0),
  learner("zztest x", "Zztest", "X", 9),
], [], "ada north");
assert.equal(solo.note, "Welcome in. Finish your first lesson to join the leaderboard.");
assert.equal(solo.board.length, 1);
assert.equal(solo.board[0].you, true);
const host = learner("jonathan wallace", "Jonathan", "Wallace", 6);
host.email = "jonathan@faristeam.ca";
const newbie = peerStanding([
  learner("casey nguyen", "Casey", "Nguyen", 0),
  host,
  learner("ada north", "Ada", "North", 4),
], [], "casey nguyen");
assert.equal(newbie.note, "Welcome in. Finish your first lesson to join the leaderboard.");
assert.ok(newbie.board.every((row) => row.name !== "Jonathan W."));
assert.equal(peerStanding([
  learner("casey nguyen", "Casey", "Nguyen", 1),
  host,
], [], "casey nguyen").note, "You're off to a good start. Keep going.");
const cool = publicFeed([
  { id: 1, key: "jonathan wallace", first: "Jonathan", last: "Wallace", body: "That was a cool lesson.", kind: "learned", lesson: 1, createdAt: "2026-11-10T12:00:00.000Z", parentId: null },
  { id: 2, key: "ada north", first: "Ada", last: "North", body: "Same here.", kind: "reply", lesson: 1, createdAt: "2026-11-10T12:05:00.000Z", parentId: 1 },
  { id: 3, key: "ada north", first: "Ada", last: "North", body: "The writing sample finally sounded like me.", kind: "learned", lesson: 2, createdAt: "2026-11-10T12:06:00.000Z", parentId: null },
], "ada north");
assert.deepEqual(cool.map((post) => post.body), ["The writing sample finally sounded like me."]);
const hidden = peerStanding(classRows, [], "zztest notab");
assert.equal(hidden.board.length, 4);
assert.ok(hidden.board.every((row) => row.you !== true));
for (const standing of [ben, hidden, solo]) {
  assert.doesNotMatch(standing.note, /\d|out of/);
  assert.ok(standing.board.every((row) => !/zztest/i.test(row.name)));
  assert.ok(standing.board.every((row) => row.done == null));
}

assert.equal(loginPoints(["2026-11-09T15:00:00.000Z", "2026-11-09T20:00:00.000Z"]), 1);
assert.equal(loginPoints(["2026-11-09T15:00:00.000Z", "2026-11-10T15:00:00.000Z"]), 2);
assert.equal(loginPoints(["2026-11-09T15:00:00.000Z", "2026-11-11T15:00:00.000Z"]), 0);
const ada = { key: "ada north", first: "Ada", last: "North", days: { _curriculum: 31, "1": { done: true, doneAt: "2026-11-10T15:00:00.000Z" } }, logins: [] };
const question = { id: 1, key: "ben cole", parentId: null, kind: "question", lesson: 1, createdAt: "2026-11-10T15:00:00.000Z" };
assert.equal(scorePerson(ada, [
  { id: 2, key: "ada north", parentId: null, lesson: 1, createdAt: "2026-11-10T16:00:00.000Z" },
  { id: 3, key: "ada north", parentId: 1, parentKind: "question", parentKey: "ben cole", createdAt: "2026-11-10T17:00:00.000Z" },
  { id: 4, key: "ada north", parentId: 1, parentKind: "question", parentKey: "ben cole", createdAt: "2026-11-10T18:00:00.000Z" },
]).points, 3 + 5 + 3);
assert.equal(scorePerson(ada, [
  { id: 9, key: "ada north", parentId: 8, parentKind: "question", parentKey: "ada north", createdAt: "2026-11-10T17:00:00.000Z" },
]).points, 3);
const late = { key: "ada north", first: "Ada", last: "North", days: { _curriculum: 31, "1": { done: true, doneAt: "2026-12-12T02:00:00.000Z" } }, logins: [] };
assert.equal(scorePerson(late, []).points, 0);
assert.equal(validEmail("test+alpha@example.com"), "test+alpha@example.com");
assert.equal(validEmail("not an email"), "");
assert.deepEqual(emailClaim("", "  ZZTEST.Mail@Example.com "), { ok: true, email: "zztest.mail@example.com", write: true });
assert.deepEqual(emailClaim("zztest.mail@example.com", "ZZTEST.MAIL@example.com"), { ok: true, email: "zztest.mail@example.com", write: false });
assert.equal(emailClaim("zztest.mail@example.com", "other@example.com").error, "email_mismatch");
assert.equal(emailClaim("zztest.mail@example.com", "  ").error, "email_mismatch");
assert.equal(emailClaim("", "nope").error, "email_required");
const hour = 60 * 60 * 1000;
const selfieNow = Date.parse("2026-11-10T15:00:00.000Z");
let selfie = nextSelfieStamps([], selfieNow);
assert.equal(selfie.ok, true);
selfie = nextSelfieStamps(selfie.stamps, selfieNow + 1000);
selfie = nextSelfieStamps(selfie.stamps, selfieNow + 2000);
assert.equal(selfie.ok, true);
assert.equal(nextSelfieStamps(selfie.stamps, selfieNow + 3000).ok, false);
assert.equal(nextSelfieStamps(selfie.stamps, selfieNow + hour).ok, true);
assert.match(selfieFilename("Testy", "Alpha", "2026-11-10T15:00:00.000Z"), /^Testy-A-2026-11-10-\d{4}\.jpg$/);
assert.equal(CONTEST_END_ISO, "2026-12-12T01:00:00.000Z");
assert.match(plan.days.find((day) => day.day === 15).prompts[0], /Create a skill called Listing writer/);
assert.equal(plan.days.find((day) => day.day === 16).title, "Make the Letter of Opinion Yours");
assert.match(plan.days.find((day) => day.day === 16).steps.join("\n"), /full name and your work address/);
assert.match(plan.days.find((day) => day.day === 16).prompts[0], /work address is \[brokerage office address\]/);
assert.match(plan.days.find((day) => day.day === 16).prompts[0], /standard agent details/);
assert.doesNotMatch(plan.days.find((day) => day.day === 16).prompts.join("\n"), /whole drive/);
const paperwork = plan.days.find((day) => day.day === 23);
assert.match(paperwork.prompts.join("\n"), /5% total, with 2\.5% to the co-operating brokerage, and a 60-day holdover/);
assert.match(paperwork.prompts.join("\n"), /Fill my name into every agent name field on the Form 200 and RECO forms/);

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
execFileSync("python3", ["scripts/build_ai30_kit.py"], { cwd: repoRoot });
const zipList = execFileSync("python3", ["-c", "import zipfile; z=zipfile.ZipFile('ai-30-days/kit/ai-bootcamp-resources.zip'); print('\\n'.join(z.namelist()))"], { cwd: repoRoot, encoding: "utf8" });
for (const day of plan.days) {
  const piece = day.title.replace(/[^\w\s-]/gu, "").replace(/\s+/g, " ").trim();
  assert.match(zipList, new RegExp(piece.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}
assert.match(zipList, /read-me\.txt/);
assert.match(zipList, /kits\/Letter-of-Opinion-Kit\.docx/);
assert.match(zipList, /kits\/Deal-Card-Kit\.docx/);
assert.match(zipList, /kits\/Prompts-by-Area\.md/);
assert.match(zipList, /kits\/Letter-of-Opinion-Client-Email-Template\.docx/);
assert.match(zipList, /kits\/Letter-of-Opinion-123-Sample-Street-SAMPLE\.pdf/);
assert.match(zipList, /forms\/Form_200_Listing_Agreement_master\.pdf/);
assert.match(zipList, /forms\/RECO_Information_Guide_master\.pdf/);
assert.doesNotMatch(zipList, /30-Day-Checklist|Bootcamp-Checklist|Lesson \d/);
const zipReadme = execFileSync("python3", ["-c", "import zipfile; print(zipfile.ZipFile('ai-30-days/kit/ai-bootcamp-resources.zip').read('read-me.txt').decode())"], { cwd: repoRoot, encoding: "utf8" });
assert.match(zipReadme, /Letter-of-Opinion-123-Sample-Street-SAMPLE\.pdf/);
assert.match(zipReadme, /forms\/Form_200_Listing_Agreement_master\.pdf/);
assert.match(zipReadme, /forms\/RECO_Information_Guide_master\.pdf/);
assert.match(paperwork.steps[0], /in your kit/);
assert.match(paperwork.prompts[0], /in my kit/);
assert.doesNotMatch(zipReadme, /not in this folder yet/);
const zipBytes = readFileSync(new URL("../ai-30-days/kit/ai-bootcamp-resources.zip", import.meta.url));
for (const needle of ["Jonathan Wallace", "jonathan@faristeam.ca", "705-433-2525", "531 King Street", "Faris Team", "FarisTeam", "1gVOahhpWV00QdTg44BbqIaCOhjplNq1t"]) {
  assert.equal(zipBytes.includes(Buffer.from(needle)), false, needle);
}
assert.match(readFileSync(new URL("../ai-30-days/index.html", import.meta.url), "utf8"), /class="btn".*Download all the resources/);
assert.match(portalSrc, /classList\.toggle\("is-in", name === "app"\)/);
assert.match(readFileSync(new URL("../ai-30-days/portal.css", import.meta.url), "utf8"), /body\.is-in \.kit \.btn/);
const portalCss = readFileSync(new URL("../ai-30-days/portal.css", import.meta.url), "utf8");
assert.match(portalCss, /--gold:\s*#c9a96a/i);
assert.match(portalCss, /--gold-dark:\s*#886a3b/i);
{
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const lum = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const r = lin(((n >> 16) & 255) / 255);
    const g = lin(((n >> 8) & 255) / 255);
    const b = lin((n & 255) / 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (fg, bg) => {
    const a = lum(fg);
    const b = lum(bg);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };
  assert.ok(ratio("#886a3b", "#F7F3EC") >= 4.5);
  assert.ok(ratio("#886a3b", "#FDFBF7") >= 4.5);
}

console.log("test_ai30: ok");
