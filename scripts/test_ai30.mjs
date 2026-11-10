import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyProgress, currentDay, doneCount, normalizePerson } from "../netlify/functions/_shared/ai30.mjs";

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
assert.equal(plan.days.length, 30);
assert.equal(plan.catchUpDays.join(","), "7,16,24");
assert.ok(!plan.rule.includes("—"));
const sections = {
  Foundations: [1, 9],
  "Clients and reviews": [10, 10],
  "Brand and social": [11, 16],
  "Connect your tools": [17, 20],
  "Letters and offers": [21, 24],
  "Deal card": [25, 27],
  Advanced: [28, 30],
};
for (const day of plan.days) {
  assert.equal(day.day, plan.days.indexOf(day) + 1);
  assert.ok(day.title && day.why && day.steps.length >= 3 && day.prompt && day.visual);
  assert.ok(!JSON.stringify(day).includes("—"), "em dash in day " + day.day);
  if (day.day <= 9) assert.equal(day.minutes, "15 to 20 min");
  else if (day.day <= 20) assert.equal(day.minutes, "30 min");
  else assert.equal(day.minutes, "30 to 45 min");
  assert.equal(day.catchUp, plan.catchUpDays.includes(day.day));
  const band = Object.entries(sections).find(([, range]) => day.day >= range[0] && day.day <= range[1]);
  assert.ok(band, "section range for day " + day.day);
  assert.equal(day.section, band[0]);
}
assert.match(plan.days[5].title, /writing style/i);
assert.match(plan.days[9].title, /review/i);
assert.match(plan.days[10].title, /10 posts/i);
assert.match(plan.days[17].title, /notes/i);
assert.match(plan.days[19].title, /top 5/i);
assert.match(plan.days[22].title, /Coles Notes/i);
assert.match(plan.days[23].title, /deadline/i);
assert.match(plan.days[27].prompt, /RECO/);
assert.match(plan.days[27].prompt, /GeoWarehouse/);
assert.match(plan.days[28].title, /BrokerBay/);
assert.doesNotMatch(JSON.stringify(plan), /Follow Up Ace|Sisu|Brain log/i);

console.log("test_ai30: ok");
