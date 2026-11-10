import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DAY_COUNT, applyProgress, currentDay, doneCount, migrateCurriculum, normalizePerson } from "../netlify/functions/_shared/ai30.mjs";
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
assert.match(plan.days[0].title, /Pick your AI/);
assert.match(plan.days[1].title, /writing style/i);
assert.equal(plan.days[6].optional, true);
assert.match(plan.days[6].optionalNote, /Skip this lesson/);
assert.match(plan.days[7].title, /review/i);
assert.match(plan.days[8].assignment, /brand guidelines/);
assert.match(plan.days[14].title, /top 5/i);
assert.match(plan.days[17].title, /Coles Notes/i);
assert.match(plan.days[22].prompts.join("\n"), /RECO/);
assert.match(plan.days[22].prompts.join("\n"), /GeoWarehouse/);
assert.equal(plan.title, "AI Bootcamp: Zero to Hero");
assert.doesNotMatch(plan.rule, /30 days|Getting Started/);
assert.match(plan.days[23].title, /BrokerBay/);
assert.doesNotMatch(JSON.stringify(plan), /Follow Up Ace|Sisu|Brain log/);
assert.doesNotMatch(JSON.stringify(plan), /keep-going/);
assert.equal(plan.days[9].title, "Plan your social media strategy");
assert.equal(plan.days[10].title, "Create your first three posts");
assert.equal(plan.days[24].title, "Your list: hand off your first task");
assert.equal(plan.days[30].title, "Final review");
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
assert.match(lesson11, /SUMMARY:AI Bootcamp: Create your first three posts/);
assert.match(lesson11, /Task: Create your first three posts/);
assert.match(lesson11, /Assignment: Done when three posts are finished/);
assert.doesNotMatch(buildIcs(plan.days[0], when), /—/);

const portalSrc = readFileSync(new URL("../ai-30-days/portal.js", import.meta.url), "utf8");
assert.doesNotMatch(portalSrc, /All lessons|tab-all|renderAll/);
assert.match(portalSrc, /id="tab-today"/);
assert.match(portalSrc, /id="tab-progress"/);

console.log("test_ai30: ok");
