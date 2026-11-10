import { getDatabase } from "@netlify/database";
import { emailClaim, nextSelfieStamps, normalizePerson, selfieFilename } from "./_shared/ai30.mjs";
import { saveSelfieBlob, uploadSelfieToDrive } from "./_shared/selfies.mjs";

const PRODUCTION = ["https://jonathanwallace.ca", "https://www.jonathanwallace.ca"];
const PREVIEW = /^https:\/\/deploy-preview-\d+--jonathanwallace-ca\.netlify\.app$/;
const LOCAL = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const selfieHits = new Map();

function selfieLimited(key) {
  const gate = nextSelfieStamps(selfieHits.get(key) || [], Date.now());
  selfieHits.set(key, gate.stamps);
  if (selfieHits.size > 5000) selfieHits.clear();
  return !gate.ok;
}

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });

function allowed(origin) {
  return PRODUCTION.indexOf(origin) !== -1 || PREVIEW.test(origin) || LOCAL.test(origin);
}

function firstRow(result) {
  if (Array.isArray(result)) return result[0] || null;
  if (result && Array.isArray(result.rows)) return result.rows[0] || null;
  return null;
}

export default async (req) => {
  if (req.method === "OPTIONS") return json(204, { ok: true });
  if (req.method !== "POST") return json(405, { ok: false, error: "method" });
  if (!allowed(req.headers.get("origin") || "")) return json(403, { ok: false, error: "origin" });

  const raw = await req.text();
  if (raw.length > 3000000) return json(413, { ok: false, error: "too_large" });
  let body;
  try { body = JSON.parse(raw); } catch (e) { return json(400, { ok: false, error: "json" }); }
  const person = normalizePerson(body && body.first, body && body.last);
  if (!person.ok) return json(400, { ok: false, error: person.error });

  let bytes;
  try { bytes = Buffer.from(String(body.image || ""), "base64"); } catch (e) { return json(400, { ok: false, error: "image" }); }
  if (bytes.length < 100 || bytes.length > 1800000 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return json(400, { ok: false, error: "image" });
  }

  let db;
  try { db = getDatabase(); } catch (e) { return json(503, { ok: false, error: "storage_unavailable" }); }
  const found = firstRow(await db.sql`SELECT email FROM ai30_progress WHERE name_key = ${person.key} LIMIT 1`);
  const claim = emailClaim(found && found.email, body.email);
  if (!claim.ok) return json(400, { ok: false, error: claim.error });
  if (selfieLimited(person.key)) return json(429, { ok: false, error: "rate" });
  const filename = selfieFilename(person.first, person.last);
  try {
    await saveSelfieBlob(filename, bytes);
    let drive = "not_connected";
    try {
      const uploaded = await uploadSelfieToDrive(bytes, filename);
      drive = uploaded.drive;
    } catch (e) {
      drive = "error";
    }
    await db.sql`UPDATE ai30_progress SET selfie_at = now(), updated_at = now() WHERE name_key = ${person.key}`;
    return json(200, { ok: true, selfie: true, drive });
  } catch (e) {
    return json(503, { ok: false, error: "storage_unavailable" });
  }
};

export const config = { path: "/api/ai-30-days/selfie" };
