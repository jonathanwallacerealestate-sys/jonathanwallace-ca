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
  "Clients and social": [8, 11],
  "Calendar, notes and listings": [12, 15],
  "Letters and offers": [16, 19],
  "Deal card": [20, 22],
  Advanced: [23, 24],
  "Your list": [25, 30],
  Review: [31, 31],
};
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
  if (day.day <= 9) assert.equal(day.minutes, "15 to 20 min");
  else if (day.day <= 20) assert.equal(day.minutes, "30 min");
  else assert.equal(day.minutes, "30 to 45 min");
  assert.equal(day.catchUp, plan.catchUpDays.includes(day.day));
  const band = Object.entries(sections).find(([, range]) => day.day >= range[0] && day.day <= range[1]);
  assert.ok(band, "section range for day " + day.day);
  assert.equal(day.section, band[0]);
}
assert.equal(plan.days[0].title, "Pick Your AI and Tell It About Your Business");
assert.equal(plan.days[1].title, "Teach It Your Writing Style");
assert.equal(plan.days[6].optional, true);
assert.match(plan.days[6].optionalNote, /Skip this lesson/);
assert.match(plan.days[7].title, /review/i);
assert.match(plan.days[8].assignment, /brand guidelines/);
assert.equal(plan.days[14].title, "Write Listing Descriptions in Your Top 5");
assert.match(plan.days[17].title, /Coles Notes/i);
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
  assert.match(text, /Hey\\, don't forget you've got to do your 30-minute AI session today\.\\n\\nTask:/);
  assert.match(text, new RegExp(`Task: ${day.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  assert.match(text, /https:\/\/jonathanwallace\.ca\/ai-30-days/);
}
assert.match(unfold(buildIcs(plan.days[0], when, { now: new Date("2026-11-10T12:00:00Z") })), /Assignment: Done when it can play back a short summary of your business/);
assert.match(unfold(buildIcs(plan.days[4], when, { now: new Date("2026-11-10T12:00:00Z") })), /Assignment: Done when the re-engagement skill is saved/);
const lesson11 = unfold(buildIcs(plan.days[10], when, { now: new Date("2026-11-10T12:00:00Z"), uid: "lesson-11@jonathanwallace.ca" }));
assert.match(lesson11, /SUMMARY:AI Bootcamp: Create Your First Three Posts/);
assert.match(lesson11, /Task: Create Your First Three Posts/);
assert.match(lesson11, /Assignment: Done when three posts are finished/);
assert.doesNotMatch(buildIcs(plan.days[0], when), /—/);

const portalSrc = readFileSync(new URL("../ai-30-days/portal.js", import.meta.url), "utf8");
assert.doesNotMatch(portalSrc, /All lessons|tab-all|renderAll|Mark done|of \$\{lessonTotal/);
assert.match(portalSrc, /I've completed the lesson and the challenge\./);
assert.match(portalSrc, /id="tab-today"/);
assert.match(portalSrc, /id="tab-progress"/);
assert.match(portalSrc, /id="tab-board"/);
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
assert.deepEqual(ben.board.map((row) => [row.rank, row.name, row.points, row.done, row.you]), [
  [1, "Ben C.", 12, 4, true],
  [1, "Cara S.", 12, 4, false],
  [3, "Ada N.", 6, 2, false],
  [4, "Dee P.", 3, 1, false],
]);
assert.equal(peerStanding(classRows, [], "dee park").note, "You're a little behind your peers learning AI. Today's a good day to catch up.");
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
], [], "casey nguyen").note, "You're the first one here learning AI. Keep it going.");
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
  assert.ok(standing.board.every((row) => !String(row.done).includes("/")));
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
assert.doesNotMatch(plan.days.find((day) => day.day === 16).prompts.join("\n"), /whole drive/);

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
assert.doesNotMatch(zipList, /30-Day-Checklist|Bootcamp-Checklist|Lesson \d/);
const zipReadme = execFileSync("python3", ["-c", "import zipfile; print(zipfile.ZipFile('ai-30-days/kit/ai-bootcamp-resources.zip').read('read-me.txt').decode())"], { cwd: repoRoot, encoding: "utf8" });
assert.match(zipReadme, /Letter-of-Opinion-123-Sample-Street-SAMPLE\.pdf/);
assert.doesNotMatch(zipReadme, /not in this folder yet/);
const zipBytes = readFileSync(new URL("../ai-30-days/kit/ai-bootcamp-resources.zip", import.meta.url));
for (const needle of ["Jonathan Wallace", "jonathan@faristeam.ca", "705-433-2525", "531 King Street", "Faris Team", "FarisTeam", "1gVOahhpWV00QdTg44BbqIaCOhjplNq1t"]) {
  assert.equal(zipBytes.includes(Buffer.from(needle)), false, needle);
}
assert.match(readFileSync(new URL("../ai-30-days/index.html", import.meta.url), "utf8"), /Download all the resources/);

console.log("test_ai30: ok");
