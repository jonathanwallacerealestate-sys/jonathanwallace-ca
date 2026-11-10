// Progress for the private training portal at /ai-30-days.
// Storage is Netlify Database (site-scoped Postgres). No extra env vars.
// The table is created by netlify/database/migrations on deploy.
//
// Stores only the normalised name, day statuses, notes, and timestamps.

import { getDatabase } from "@netlify/database";
import { applyProgress, migrateCurriculum, normalizePerson, publicRecord, recordFromRow, stampCurriculum } from "./_shared/ai30.mjs";

const PRODUCTION = ["https://jonathanwallace.ca", "https://www.jonathanwallace.ca"];
const PREVIEW = /^https:\/\/deploy-preview-\d+--jonathanwallace-ca\.netlify\.app$/;
const LOCAL = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const hits = new Map();

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

function limited(bucket, limit) {
  const now = Date.now();
  const arr = (hits.get(bucket) || []).filter((t) => now - t < 600000);
  arr.push(now);
  hits.set(bucket, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > limit;
}

function firstRow(result) {
  if (Array.isArray(result)) return result[0] || null;
  if (result && Array.isArray(result.rows)) return result.rows[0] || null;
  return null;
}

async function readRow(db, key) {
  const rows = await db.sql`
    SELECT name_key, first_name, last_name, days, created_at, updated_at
    FROM ai30_progress
    WHERE name_key = ${key}
    LIMIT 1
  `;
  const row = firstRow(rows);
  return row ? recordFromRow(row) : null;
}

async function writeRow(db, person, days, createdAt) {
  const payload = JSON.stringify(days);
  const rows = await db.sql`
    INSERT INTO ai30_progress (name_key, first_name, last_name, days, created_at, updated_at)
    VALUES (${person.key}, ${person.first}, ${person.last}, CAST(${payload} AS jsonb), ${createdAt}::timestamptz, now())
    ON CONFLICT (name_key) DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      days = EXCLUDED.days,
      updated_at = now()
    RETURNING name_key, first_name, last_name, days, created_at, updated_at
  `;
  const row = firstRow(rows);
  if (!row) throw new Error("empty_write");
  return recordFromRow(row);
}

export default async (req, context) => {
  if (req.method === "OPTIONS") return json(204, { ok: true });
  if (req.method !== "POST") return json(405, { ok: false, error: "method" });

  const origin = req.headers.get("origin") || "";
  if (!allowed(origin)) return json(403, { ok: false, error: "origin" });

  const ip = (context && context.ip) || req.headers.get("x-nf-client-connection-ip") || "unknown";
  if (limited("ip:" + ip, 300)) return json(429, { ok: false, error: "rate" });

  const raw = await req.text();
  if (raw.length > 60000) return json(413, { ok: false, error: "too_large" });

  let body;
  try {
    body = JSON.parse(raw);
  } catch (e) {
    return json(400, { ok: false, error: "json" });
  }

  const person = normalizePerson(body && body.first, body && body.last);
  if (!person.ok) return json(400, { ok: false, error: person.error });
  if (body.op === "save" && limited("save:" + person.key, 40)) return json(429, { ok: false, error: "rate" });

  let db;
  try {
    db = getDatabase();
  } catch (e) {
    return json(503, { ok: false, error: "storage_unavailable" });
  }

  try {
    if (body.op === "load") {
      let row = await readRow(db, person.key);
      const migrated = migrateCurriculum(row ? row.days : {});
      const createdAt = row && row.createdAt ? row.createdAt : new Date().toISOString();
      if (!row || JSON.stringify(migrated) !== JSON.stringify(row.days)) {
        row = await writeRow(db, person, migrated, createdAt);
      }
      return json(200, publicRecord(person, row));
    }

    if (body.op === "save") {
      const existing = await readRow(db, person.key);
      const stored = existing ? { ...existing, days: migrateCurriculum(existing.days) } : null;
      const applied = applyProgress(stored, body, new Date().toISOString());
      if (!applied.ok) return json(400, { ok: false, error: applied.error, day: applied.day });
      const createdAt = existing && existing.createdAt ? existing.createdAt : new Date().toISOString();
      const row = await writeRow(db, person, stampCurriculum(applied.days), createdAt);
      return json(200, publicRecord(person, row));
    }

    return json(400, { ok: false, error: "op" });
  } catch (e) {
    return json(503, { ok: false, error: "storage_unavailable" });
  }
};

export const config = {
  path: "/api/ai-30-days",
};
