/**
 * Build a private normalized fixture from local research files.
 * Writes only under the repo's .local directory, which is gitignored.
 * Never writes the public release file. The public page stays empty
 * until a release audit flips the flags in content/waterfront/public-release.json.
 *
 * Usage:
 *   node scripts/waterfront-adapt.mjs \
 *     --year 2026 --input /path/to/2026.json \
 *     --year 2025 --input /path/to/2025.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { adaptRealmFile } from "../assets/js/waterfront-model.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localRoot = path.join(root, ".local", "waterfront-preview");

function args(argv) {
  const pairs = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--year") {
      const year = Number(argv[i + 1]);
      const inputFlag = argv[i + 2];
      const input = argv[i + 3];
      if (inputFlag !== "--input" || !input) throw new Error("Each --year needs an --input");
      pairs.push({ year, input: path.resolve(input) });
      i += 3;
    }
  }
  if (!pairs.length) throw new Error("Pass --year YYYY --input file.json at least once");
  return pairs;
}

function assertInsideLocal(target) {
  const resolved = path.resolve(target);
  const allowed = path.resolve(localRoot);
  if (resolved !== allowed && !resolved.startsWith(allowed + path.sep)) {
    throw new Error("Refusing to write outside .local/waterfront-preview");
  }
  const publicFile = path.resolve(root, "content/waterfront/public-release.json");
  if (resolved === publicFile) throw new Error("Refusing to overwrite the public release file");
}

function tally(records, field) {
  const counts = {};
  for (const record of records) {
    const key = record[field] == null ? "unknown" : String(record[field]);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

const jobs = args(process.argv.slice(2));
fs.mkdirSync(localRoot, { recursive: true });
assertInsideLocal(localRoot);

const written = [];
for (const job of jobs) {
  if (job.year !== 2025 && job.year !== 2026) throw new Error("Only 2025 and 2026 are in scope");
  const raw = JSON.parse(fs.readFileSync(job.input, "utf8"));
  const normalized = adaptRealmFile(raw, job.year);
  const target = path.join(localRoot, `${job.year}.normalized.json`);
  assertInsideLocal(target);
  fs.writeFileSync(target, JSON.stringify(normalized));
  written.push({
    year: job.year,
    rows: normalized.records.length,
    status: tally(normalized.records, "status"),
    town: tally(normalized.records, "town"),
    shoreline: tally(normalized.records, "shorelineClass"),
    frontage: tally(normalized.records.map((record) => record.frontage), "band"),
    unknownEventDates: normalized.records.filter((record) => !record.eventDate).length,
    photos: normalized.records.reduce((sum, record) => sum + record.photos.length, 0)
  });
}
console.log(JSON.stringify({ wrote: localRoot, years: written }, null, 2));
