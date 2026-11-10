import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { adminCodeLocked, adminEmails, adminPinOk, applyAdminSession, clearAdminCodeFailures, isAdminEmail, noteAdminCodeFailure, signAdminToken, verifyAdminToken } from "../netlify/functions/_shared/admin.mjs";
import { CONTEST_END_ISO, DAY_COUNT, LEGACY_DAY_IDS, applyProgress, currentDay, doneCount, emailClaim, loginPoints, migrateCurriculum, nextSelfieStamps, normalizePerson, paceUnlockAt, peerStanding, publicFeed, publicRecord, scorePerson, selfieFilename, validEmail } from "../netlify/functions/_shared/ai30.mjs";
import { buildIcs, eventDescription, icsFilename, parseWhen, unlockDescription } from "../netlify/functions/_shared/ics.mjs";

const lid = (n) => LEGACY_DAY_IDS[n - 1];
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
assert.equal(created.days[lid(1)].notes, "Installed on both.");
assert.equal(created.days[lid(1)].done, undefined);
assert.equal(currentDay(created.days), 1);

const day1 = applyProgress({ days: created.days }, { days: { 1: { done: true, notes: "Sent one email." } } }, t0);
assert.equal(day1.ok, true);
assert.equal(day1.days[lid(1)].done, true);
assert.equal(day1.days[lid(1)].doneAt, t0);
assert.equal(currentDay(day1.days), 2);
assert.equal(doneCount(day1.days), 1);

const skipped = applyProgress({ days: {} }, { days: { 2: { done: true } } }, t0);
assert.equal(skipped.ok, false);
assert.equal(skipped.error, "day_locked");

const kept = applyProgress({ days: day1.days }, { days: { 1: { done: false, notes: "Still done." } } }, "2026-11-11T00:00:00.000Z");
assert.equal(kept.days[lid(1)].done, true);
assert.equal(kept.days[lid(1)].doneAt, t0);
assert.equal(kept.days[lid(1)].notes, "Still done.");

const lockedNote = applyProgress({ days: {} }, { days: { 1: { notes: "today" }, 4: { notes: "nope" } } }, t0);
assert.equal(lockedNote.days[lid(1)].notes, "today");
assert.equal(lockedNote.days[lid(4)], undefined);

const long = applyProgress(null, { days: { 1: { notes: "x".repeat(5000) } } }, t0);
assert.equal(long.days[lid(1)].notes.length, 2000);

const paceA = "2026-11-10T12:00:00.000Z";
const paceB = "2026-11-10T12:20:00.000Z";
const firstPace = applyProgress(null, { days: { 1: { done: true } } }, paceA);
const two = applyProgress({ days: firstPace.days }, { days: { 2: { done: true } } }, paceB);
assert.equal(two.ok, true);
assert.equal(two.days[lid(1)].doneAt, paceA);
assert.equal(two.days[lid(2)].done, true);
const third = applyProgress({ days: two.days }, { days: { 3: { done: true } } }, "2026-11-10T13:00:00.000Z");
assert.equal(third.ok, false);
assert.equal(third.error, "pace");
assert.equal(third.unlockAt, "2026-11-10T20:00:00.000Z");
assert.equal(two.days[lid(1)].done, true);
assert.equal(two.days[lid(2)].done, true);
assert.equal(two.days[lid(3)], undefined);
const opened = applyProgress({ days: two.days }, { days: { 3: { done: true } } }, "2026-11-10T20:00:00.000Z");
assert.equal(opened.ok, true);
assert.equal(opened.days[lid(3)].done, true);
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
assert.equal(afterUndated.days[lid(1)].done, true);
assert.equal(afterUndated.days[lid(1)].doneAt, undefined);

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
const earlyClose = "Before we close, list every decision we made in this chat and save them. I'll move them into my decision log once it's set up.";
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
  if (day.day === 1) {
    assert.equal(last, lightClose);
    assert.equal(lastPrompt, "Save everything we set up today, so you remember it next time.");
    assert.doesNotMatch(day.assignment, /Before you finish/);
  } else if (day.day < 3) {
    assert.equal(last, lightClose);
    assert.equal(lastPrompt, "Save everything we set up today, so you remember it next time.");
    assert.equal(day.steps[0], "Give it samples of writing you like: emails you have sent, articles, or authors. You can also just paste a link. If there is a blog writer you like, or a social media account whose captions you love, copy the URL and share it with your AI. With every link, tell it why you are sharing it and what you like about it, such as the tone, the short sentences, or how it opens. That way it learns not only what you like, but why.");
    assert.equal(day.steps[1], "Tell it your pet peeves too. Share everything you do not like in writing (for example em dashes, long paragraphs, salesy words) so it knows what to avoid.");
    assert.equal(prompts[0], "Here are samples of writing I like, including links to writers and social media accounts whose style I love, and what I like about each one. Here are my pet peeves, the things I never want, such as em dashes. Learn my style. Then make up a mock scenario with one of my clients and draft an email to them. Send it only to me, or save it as a draft, so I can see it. I'll coach you on what to change. Every time I make a suggestion, save it to my Email writing SOP. Rule one: you draft, I approve, and nothing goes out until I say so.");
    assert.doesNotMatch(day.assignment, /Before you finish/);
  } else if (day.day === 3) {
    assert.equal(day.id, "brand-guidelines");
    assert.equal(last, "Ask it to list and save every decision you made today.");
    assert.equal(lastPrompt, "Before we close, list every decision we made in this chat and save them.");
    assert.equal(day.assignment, "Done when your brand guidelines are saved and your AI can describe your fonts, colours and look back to you.");
    assert.equal(day.steps[0], "Research the fonts and colour palettes you like. Share screenshots from your phone, search online, or find websites whose fonts and layout you like.");
    assert.equal(prompts[0].startsWith("I'm building my brand guidelines."), true);
  } else if (day.day === 4) {
    assert.equal(day.id, "brain-dump");
    assert.equal(day.why, "You have had a couple of days to think since you first told it about your business. Now it learns where the gaps are, so it can start thinking ahead for you. Everyone's business is different.");
    assert.equal(last, "Ask it to save what it learned to your Google Drive, and to list and save every decision you made today.");
    assert.equal(lastPrompt, "Before we close, list every decision we made in this chat and save them.");
    assert.equal(day.assignment, "Done when your Google Drive is connected, it has asked you at least 10 questions, and it can play back how your business runs and where the gaps are, saved in your Drive.");
    assert.match(prompts[1], /Don't give me advice yet\./);
    assert.equal(day.steps[3], "No advice yet. This lesson is for it to understand your business, not to fix it.");
  } else if (day.day < 6) {
    assert.equal(last, earlyClose);
    assert.equal(lastPrompt, earlyClose);
    assert.ok(day.assignment.endsWith(sopReminder), "reminder missing on day " + day.day);
  } else {
    assert.equal(last, standingClose);
    assert.equal(lastPrompt, standingClose);
    assert.ok(day.assignment.endsWith(sopReminder), "reminder missing on day " + day.day);
  }
  const timeLabel = day.day === 2 || day.day === 3
    ? "30 minutes to start, longer if you go deeper"
    : "15 to 30 minutes, longer if you go deeper";
  assert.equal(day.minutes, timeLabel, "time label on day " + day.day);
  assert.equal(day.catchUp, plan.catchUpDays.includes(day.day));
  const band = Object.entries(sections).find(([, range]) => day.day >= range[0] && day.day <= range[1]);
  assert.ok(band, "section range for day " + day.day);
  assert.equal(day.section, band[0]);
}
assert.equal(plan.days[1].minutes, "30 minutes to start, longer if you go deeper");
assert.equal(plan.days[2].minutes, "30 minutes to start, longer if you go deeper");
assert.equal(plan.days[0].title, "Pick Your AI and Tell It About Your Business");
assert.equal(plan.days[0].id, "pick-your-ai");
assert.equal(plan.days[0].steps[0], "Pick one AI and start on the paid plan: Grok Bot or Claude Pro. My pick for real estate agents is Grok Bot.");
assert.equal(plan.days[0].steps[1], "Install it on your phone and your computer.");
assert.deepEqual(plan.days[0].links, [
  { step: 2, label: "Grok Bot for iPhone", href: "https://apps.apple.com/ca/app/grok-bot/id6794501026" },
  { step: 2, label: "Claude for iPhone", href: "https://apps.apple.com/ca/app/claude-by-anthropic/id6473753684" },
]);
assert.equal(plan.days[0].setup.text, "Stuck on setup? Watch a step-by-step tutorial:");
assert.deepEqual(plan.days[0].setup.links.map((link) => link.href), [
  "https://www.youtube.com/watch?v=q1IwR88mhaA",
  "https://www.youtube.com/watch?v=9oJySubZRSA",
]);
assert.match(plan.days[0].setup.links[1].note, /Projects at 20:20, phone and desktop at 25:29/);
assert.ok(plan.days.slice(1).every((day) => !day.links && !day.setup));
assert.doesNotMatch(JSON.stringify(plan), /Grok Premium|6670324846/);
assert.doesNotMatch(JSON.stringify(plan.days[0]), /start free/i);
assert.doesNotMatch(plan.days[0].steps[0], /\$\d/);
assert.equal(plan.days[0].prompts[1], "Save everything we set up today, so you remember it next time.");
{
  const noteSteps = plan.days.find((day) => day.day === 13).steps;
  assert.equal(noteSteps.filter((step) => /paste in/i.test(step)).length, 1);
  assert.equal(noteSteps[2], "If your AI is not connected to your CRM, have it give you the note to paste in.");
  assert.doesNotMatch(noteSteps.join("\n"), /paste in yourself/);
}
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
assert.equal(plan.rule, "One lesson at a time. Take the time you need.");
assert.equal(plan.days[9].title, "Plan Your Social Media Strategy");
assert.equal(plan.days[10].title, "Create Your First Three Posts");
const lessonIds = ["pick-your-ai", "writing-style", "brand-guidelines", "brain-dump", "dead-leads", "decision-log", "inbox", "reviews", "share-posts", "social-strategy", "first-posts", "book-appointments", "keep-notes", "past-clients", "listing-descriptions", "letter-of-opinion", "time-a-letter", "coles-notes", "deal-deadlines", "deal-card", "ten-leads", "paste-notes", "listing-paperwork", "brokerbay", "handoff-1", "handoff-2", "handoff-3", "handoff-4", "handoff-5", "handoff-6", "final-review"];
assert.deepEqual(plan.days.map((day) => day.id), lessonIds);
assert.equal(new Set(lessonIds).size, lessonIds.length);
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
assert.equal(shifted._ids, 1);
assert.equal(shifted[lid(9)].done, true);
assert.equal(shifted[lid(10)], undefined);
assert.equal(shifted[lid(11)].doneAt, "2026-11-02T00:00:00.000Z");
assert.equal(shifted[lid(12)].doneAt, "2026-11-03T00:00:00.000Z");
assert.equal(migrateCurriculum(shifted), shifted);
const stayed = migrateCurriculum({
  _curriculum: 31,
  1: { done: true, doneAt: "2026-11-01T00:00:00.000Z" },
  10: { done: true, doneAt: "2026-11-02T00:00:00.000Z" },
});
assert.equal(stayed[lid(1)].doneAt, "2026-11-01T00:00:00.000Z");
assert.equal(stayed[lid(10)].doneAt, "2026-11-02T00:00:00.000Z");
assert.equal(stayed[lid(11)], undefined);
{
  function legacyPoints(person, posts) {
    const doneSet = new Set();
    for (let n = 1; n <= 31; n += 1) {
      const slot = person.days[String(n)];
      if (!slot || slot.done !== true) continue;
      if (slot.doneAt && Date.parse(slot.doneAt) > Date.parse(CONTEST_END_ISO)) continue;
      doneSet.add(n);
    }
    const shared = new Set();
    for (const post of posts || []) {
      if (post.key !== person.key || post.parentId) continue;
      const n = Number(post.lesson);
      if (doneSet.has(n)) shared.add(n);
    }
    return doneSet.size * 3 + loginPoints(person.logins) + shared.size * 5;
  }
  const samples = [
    { days: { _curriculum: 31 }, logins: [], posts: [] },
    { days: { _curriculum: 31, 1: { done: true, doneAt: "2026-11-01T15:00:00.000Z" } }, logins: ["2026-11-01T15:00:00.000Z"], posts: [] },
    { days: { _curriculum: 31, 1: { done: true, doneAt: "2026-11-01T15:00:00.000Z" }, 2: { done: true, doneAt: "2026-11-02T15:00:00.000Z" }, 5: { done: true, doneAt: "2026-11-03T15:00:00.000Z" } }, logins: ["2026-11-01T15:00:00.000Z", "2026-11-01T16:00:00.000Z", "2026-11-02T15:00:00.000Z"], posts: [{ key: "sam lee", lesson: 5, parentId: null, createdAt: "2026-11-03T16:00:00.000Z" }] },
  ];
  for (let n = 1; n <= 31; n += 1) samples.push({ days: { _curriculum: 31, [String(n)]: { done: true, doneAt: "2026-11-01T15:00:00.000Z" } }, logins: ["2026-11-01T12:00:00.000Z", "2026-11-02T12:00:00.000Z"], posts: [{ key: "sam lee", lesson: n, parentId: null, createdAt: "2026-11-02T13:00:00.000Z" }] });
  let beforePoints = 0;
  let afterPoints = 0;
  let beforeDone = 0;
  let afterDone = 0;
  let beforeStreaks = 0;
  let afterStreaks = 0;
  for (const sample of samples) {
    const person = { key: "sam lee", email: "sam@example.com", days: sample.days, logins: sample.logins };
    const before = legacyPoints(person, sample.posts);
    const migrated = migrateCurriculum(sample.days);
    const afterPerson = { ...person, days: migrated };
    const after = scorePerson(afterPerson, sample.posts);
    assert.equal(after.points, before, "points dropped");
    assert.equal(after.done, Object.values(sample.days).filter((slot) => slot && slot.done).length);
    assert.equal(loginPoints(afterPerson.logins), loginPoints(person.logins));
    beforePoints += before;
    afterPoints += after.points;
    beforeDone += after.done;
    afterDone += scorePerson(person, sample.posts).done;
    beforeStreaks += loginPoints(person.logins);
    afterStreaks += loginPoints(afterPerson.logins);
  }
  assert.equal(afterPoints, beforePoints);
  assert.equal(afterDone, beforeDone);
  assert.equal(afterStreaks, beforeStreaks);
  console.log(`migration fixtures: points ${beforePoints} -> ${afterPoints}, completions ${beforeDone} -> ${afterDone}, streak points ${beforeStreaks} -> ${afterStreaks}`);
}

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
const unlockText = unfold(buildIcs(plan.days[0], when, { description: unlockDescription(plan.days[0]), alarm: `AI Bootcamp: ${plan.days[0].title}` }));
assert.match(unlockText, /It can only help with a business it understands\. Log in here: https:\/\/jonathanwallace\.ca\/ai-30-days/);
assert.doesNotMatch(unlockText, /Time for tomorrow/);
assert.match(unlockText, /DTSTART:20261111T090000/);
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
assert.match(portalSrc, /id="tab-board"[\s\S]*aria-label="Messages">Messages</);
assert.doesNotMatch(portalSrc, /Message Board|Stuck on|No one is on the board yet|No comments yet/);
assert.match(portalSrc, /Be the first on the board\. Finish your first lesson to join\./);
assert.match(portalSrc, /Nothing here yet\. Share one thing you learned, a question, or where you're stuck\./);
assert.match(portalSrc, />Stuck</);
assert.match(portalSrc, /<strong>Challenge\.<\/strong>/);
assert.match(portalSrc, /The more you teach it, the better it gets\./);
assert.match(portalSrc, /class="step-links"/);
assert.match(portalSrc, /class="setup-help"/);
assert.match(portalSrc, /function setupHelp/);
assert.match(portalSrc, /target="_blank" rel="noopener noreferrer"/);
assert.match(portalSrc, /Download this lesson's files/);
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
assert.match(portalSrc, /Add a reminder to my calendar/);
assert.match(portalSrc, /kind=unlock/);
assert.match(portalSrc, /That name is already taken with a different email\. Use the email you signed up with\./);
assert.match(portalSrc, /You can upload 3 selfies an hour\./);
assert.match(portalSrc, /selfieHold/);
assert.match(portalSrc, /aria-label="Bootcamp sections"/);
assert.match(portalSrc, /aria-label="Reply to /);
assert.match(portalSrc, /aria-label="Take a selfie"/);
assert.match(portalSrc, /aria-label="Reminder date"/);
assert.doesNotMatch(readFileSync(new URL("../ai-30-days/index.html", import.meta.url), "utf8"), /Download all the resources/);
assert.match(readFileSync(new URL("../ai-30-days/index.html", import.meta.url), "utf8"), /One lesson at a time\. Take the time you need\./);
assert.match(readFileSync(new URL("../ai-30-days/index.html", import.meta.url), "utf8"), /Short lessons that turn AI into your assistant, one real task at a time\./);
assert.match(readFileSync(new URL("../ai-30-days/index.html", import.meta.url), "utf8"), /Enter your name and email\. No password\. Use the same name and email to come back on your phone or computer\./);
assert.match(readFileSync(new URL("../ai-30-days/index.html", import.meta.url), "utf8"), /origin!==w\.location\.origin\)return/);
assert.match(readFileSync(new URL("../ai-30-days/portal.css", import.meta.url), "utf8"), /\.selfie__actions[\s\S]*grid-template-columns: 1fr 1fr/);
assert.match(portalSrc, /id="selfie-cancel"/);
assert.doesNotMatch(portalSrc, /linkish remove|window\.prompt\("Admin key"\)/);
assert.match(readFileSync(new URL("../ai-30-days/export.html", import.meta.url), "utf8"), /Remove a board post/);
assert.match(readFileSync(new URL("../ai-30-days/export.html", import.meta.url), "utf8"), /AI30_ADMIN_KEY/);
assert.match(portalSrc, /state\.isAdmin !== true/);
assert.match(portalSrc, /Admin code/);
assert.match(portalSrc, /needsAdminCode/);
assert.doesNotMatch(portalSrc, /AI30_ADMIN_PIN/);
assert.match(portalSrc, /delete-learner/);
assert.doesNotMatch(portalSrc, /AI30_ADMIN_EMAILS/);
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
const previousAdmins = process.env.AI30_ADMIN_EMAILS;
process.env.AI30_ADMIN_EMAILS = "Coach@example.com, other@example.com";
assert.deepEqual(adminEmails(), ["coach@example.com", "other@example.com"]);
assert.equal(isAdminEmail("  COACH@example.com "), true);
assert.equal(isAdminEmail("learner@example.com"), false);
const coach = learner("pat coach", "Pat", "Coach", 8);
coach.email = "coach@example.com";
const hiddenAdmin = peerStanding([
  learner("casey nguyen", "Casey", "Nguyen", 1),
  coach,
], [], "casey nguyen");
assert.ok(hiddenAdmin.board.every((row) => row.name !== "Pat C."));
process.env.AI30_ADMIN_PIN = "test-pin";
const adminRecord = publicRecord({ first: "Pat", last: "Coach" }, { email: "coach@example.com", days: {} });
assert.equal(adminRecord.needsAdminCode, true);
assert.equal(adminRecord.isAdmin, false);
assert.equal(adminRecord.email, undefined);
assert.equal(adminPinOk("test-pin"), true);
assert.equal(adminPinOk("nope"), false);
const token = signAdminToken("coach@example.com");
assert.equal(verifyAdminToken(token, "coach@example.com"), true);
assert.equal(verifyAdminToken(token, "other@example.com"), false);
assert.equal(verifyAdminToken(token + "x", "coach@example.com"), false);
const session = applyAdminSession({ unlockAt: "2026-11-10T20:00:00.000Z" }, "coach@example.com", token);
assert.equal(session.isAdmin, true);
assert.equal(session.unlockAt, "");
assert.equal(publicRecord({ first: "Casey", last: "Nguyen" }, { email: "casey@example.com", days: {} }).isAdmin, false);
coach.days["1"].doneAt = "2026-11-10T12:00:00.000Z";
coach.days["2"].doneAt = "2026-11-10T12:10:00.000Z";
coach.days["3"].doneAt = "2026-11-10T12:20:00.000Z";
coach.logins = ["2026-11-09T15:00:00.000Z", "2026-11-09T20:00:00.000Z", "2026-11-10T15:00:00.000Z"];
assert.equal(scorePerson(coach, [
  { id: 1, key: "pat coach", parentId: null, lesson: 1, kind: "learned", createdAt: "2026-11-10T16:00:00.000Z" },
  { id: 2, key: "pat coach", parentId: 9, parentKind: "question", parentKey: "ada north", createdAt: "2026-11-10T17:00:00.000Z" },
]).points, 0);
const learnerOnly = learner("ada north", "Ada", "North", 1);
learnerOnly.days["1"].doneAt = "2026-11-10T15:00:00.000Z";
assert.equal(scorePerson(learnerOnly, [
  { id: 4, key: "ada north", parentId: 3, parentKind: "question", parentKey: "pat coach", parentAdmin: true, createdAt: "2026-11-10T18:00:00.000Z" },
]).points, 3);
const besideAdmin = peerStanding([learnerOnly, coach], [], "ada north");
assert.equal(besideAdmin.note, "You're off to a good start. Keep going.");
assert.ok(besideAdmin.board.every((row) => row.name !== "Pat C."));
assert.equal(peerStanding([coach], [], "pat coach").note, "Welcome in. Finish your first lesson to join the leaderboard.");
const rushed = { email: "coach@example.com", days: { 1: { done: true, doneAt: "2026-11-10T12:00:00.000Z" }, 2: { done: true, doneAt: "2026-11-10T12:10:00.000Z" } } };
assert.equal(applyProgress(rushed, { days: { 3: { done: true } } }, "2026-11-10T12:20:00.000Z", { skipPace: true }).ok, true);
assert.equal(applyProgress(rushed, { days: { 3: { done: true } } }, "2026-11-10T12:20:00.000Z").error, "pace");
assert.notEqual(publicRecord({ first: "Pat", last: "Coach" }, rushed).unlockAt, "");
assert.equal(applyAdminSession(publicRecord({ first: "Pat", last: "Coach" }, rushed), "coach@example.com", token).unlockAt, "");
for (let n = 0; n < 5; n += 1) noteAdminCodeFailure("locked@example.com", "203.0.113.8");
assert.equal(adminCodeLocked("locked@example.com", "203.0.113.9"), true);
assert.equal(adminCodeLocked("other@example.com", "203.0.113.8"), true);
clearAdminCodeFailures("locked@example.com", "203.0.113.8");
if (previousAdmins == null) delete process.env.AI30_ADMIN_EMAILS;
else process.env.AI30_ADMIN_EMAILS = previousAdmins;
delete process.env.AI30_ADMIN_PIN;
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

assert.equal(loginPoints(["2026-11-09T15:00:00.000Z", "2026-11-09T15:00:02.000Z"]), 0);
assert.equal(loginPoints(["2026-11-09T15:00:00.000Z", "2026-11-09T15:29:00.000Z"]), 0);
assert.equal(loginPoints(["2026-11-09T15:00:00.000Z", "2026-11-09T15:30:00.000Z"]), 1);
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
function zipEscape(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const folders = [...new Set(zipList.trim().split("\n").filter((name) => name.includes("/")).map((name) => name.split("/")[0]))].sort((a, b) => a.localeCompare(b, "en"));
const lessonFolders = folders.filter((name) => name !== "forms");
assert.equal(lessonFolders.length, plan.days.length);
assert.deepEqual(lessonFolders, [...plan.days.map((day) => day.title)].sort((a, b) => a.localeCompare(b, "en")));
assert.ok(folders.includes("forms"));
for (const day of plan.days) {
  assert.match(zipList, new RegExp(`^${zipEscape(day.title)}/${zipEscape(day.title)}\\.txt$`, "m"));
  assert.doesNotMatch(day.title, /^\d/);
}
assert.match(zipList, /read-me\.txt/);
assert.match(zipList, /^Prompts-by-Area\.md$/m);
assert.match(zipList, /^Make the Letter of Opinion Yours\/Letter-of-Opinion-Kit\.docx$/m);
assert.match(zipList, /^Deal Card Setup\/Deal-Card-Kit\.docx$/m);
assert.match(zipList, /^Make the Letter of Opinion Yours\/Letter-of-Opinion-Client-Email-Template\.docx$/m);
assert.match(zipList, /^Make the Letter of Opinion Yours\/Letter-of-Opinion-123-Sample-Street-SAMPLE\.pdf$/m);
assert.match(zipList, /forms\/Form_200_Listing_Agreement_master\.pdf/);
assert.match(zipList, /forms\/RECO_Information_Guide_master\.pdf/);
assert.doesNotMatch(zipList, /30-Day-Checklist|Bootcamp-Checklist|Lesson \d|Day \d|handouts\/|kits\/|of 31|00 Prompts|^\d\d /m);
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
assert.doesNotMatch(readFileSync(new URL("../ai-30-days/index.html", import.meta.url), "utf8"), /class="btn".*Download all the resources/);
assert.doesNotMatch(portalSrc, /Notes on this device|Finish the current day|no shared calendar|\$\{days\} days/);
assert.match(portalSrc, /Your progress on this device is only a backup until it connects\./);
assert.match(portalSrc, /Finish this lesson before moving on\./);
assert.match(portalSrc, /plural\(days, "day", "days"\)/);
assert.match(portalSrc, /plural\(hours, "hour", "hours"\)/);
assert.match(portalSrc, /plural\(minutes, "minute", "minutes"\)/);
assert.doesNotMatch(JSON.stringify(plan), /no shared calendar|bootcamp checklist/);
assert.doesNotMatch(readFileSync(new URL("../ai-30-days/index.html", import.meta.url), "utf8"), /no shared calendar/);
const promptsMd = readFileSync(new URL("../ai-30-days/kit/source/Prompts-by-Area.md", import.meta.url), "utf8");
assert.match(promptsMd, /The skills below follow the lessons\./);
assert.doesNotMatch(promptsMd, /bootcamp checklist|house rules|rules file/i);
assert.match(promptsMd, /Paste your SOP at the start of a chat\./);
assert.match(promptsMd, /save them to my decision log\./);
{
  const lessonZip = execFileSync("python3", ["-c", "import zipfile; z=zipfile.ZipFile('ai-30-days/kit/lessons/pick-your-ai.zip'); print('\\n'.join(z.namelist())); print('---'); print(z.read([n for n in z.namelist() if n.endswith('.txt')][0]).decode())"], { cwd: repoRoot, encoding: "utf8" });
  assert.match(lessonZip, /Pick Your AI and Tell It About Your Business\/Pick Your AI and Tell It About Your Business\.txt/);
  assert.match(lessonZip, /Grok Bot or Claude Pro/);
  assert.match(lessonZip, /Grok Bot for iPhone: https:\/\/apps\.apple\.com\/ca\/app\/grok-bot\/id6794501026/);
  assert.match(lessonZip, /Claude for iPhone: https:\/\/apps\.apple\.com\/ca\/app\/claude-by-anthropic\/id6473753684/);
  assert.match(lessonZip, /Stuck on setup\? Watch a step-by-step tutorial:/);
  assert.match(lessonZip, /https:\/\/www\.youtube\.com\/watch\?v=q1IwR88mhaA/);
  assert.match(lessonZip, /Projects at 20:20, phone and desktop at 25:29/);
  assert.doesNotMatch(lessonZip, /Grok Premium|6670324846/);
  assert.doesNotMatch(lessonZip, /start free/i);
  assert.match(lessonZip, /^Challenge$/m);
  assert.doesNotMatch(lessonZip, /^Assignment$/m);
  const paper = execFileSync("python3", ["-c", "import zipfile; print('\\n'.join(zipfile.ZipFile('ai-30-days/kit/lessons/listing-paperwork.zip').namelist()))"], { cwd: repoRoot, encoding: "utf8" });
  const paperLines = paper.trim().split("\n");
  assert.ok(paperLines.some((line) => line.startsWith("forms/")));
  assert.ok(paperLines.findIndex((line) => line.startsWith("forms/")) > paperLines.findIndex((line) => line.includes("Prep Your Listing")));
  const style = execFileSync("python3", ["-c", "import zipfile; print('\\n'.join(zipfile.ZipFile('ai-30-days/kit/lessons/writing-style.zip').namelist()))"], { cwd: repoRoot, encoding: "utf8" });
  assert.match(style, /Prompts-by-Area\.md/);
  assert.equal(execFileSync("python3", ["-c", "import pathlib; print(len(list(pathlib.Path('ai-30-days/kit/lessons').glob('*.zip'))))"], { cwd: repoRoot, encoding: "utf8" }).trim(), "31");
}
assert.match(portalSrc, /classList\.toggle\("is-in", name === "app"\)/);
assert.match(readFileSync(new URL("../ai-30-days/portal.css", import.meta.url), "utf8"), /body\.is-in \.tabs button/);
assert.match(readFileSync(new URL("../ai-30-days/portal.css", import.meta.url), "utf8"), /\.teach[\s\S]*white-space:\s*nowrap/);
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
