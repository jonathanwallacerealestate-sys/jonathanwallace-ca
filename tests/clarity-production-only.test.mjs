import assert from "node:assert/strict";
import { productionHost, guardScript } from "../netlify/edge-functions/clarity-production-only.js";

const cases = [
  ["jonathanwallace.ca", true],
  ["www.jonathanwallace.ca", true],
  ["JonathanWallace.ca", true],
  ["deploy-preview-42--jonathanwallace.netlify.app", false],
  ["main--jonathanwallace.netlify.app", false],
  ["localhost", false],
];

for (const [host, expected] of cases) {
  assert.equal(productionHost(host), expected, host);
}

const guard = guardScript();
assert.match(guard, /<script>/);
assert.match(guard, /<\/script>/);
assert.match(guard, /\/clarity\\.ms\/i/);
assert.doesNotMatch(guard, /GTM-/);

const re = eval(guard.match(/(\/clarity\\.ms\/i)/)[1]);
assert.equal(re.test("https://www.clarity.ms/tag/abc"), true);
assert.equal(re.test("https://scripts.clarity.ms/0.8.0/clarity.js"), true);
assert.equal(re.test("https://www.googletagmanager.com/gtm.js?id=GTM-P36FJB8L"), false);
assert.equal(re.test("https://www.google-analytics.com/g/collect"), false);

console.log("clarity host gate ok");
