// Progress for the private training portal at /ai-30-days.
// Storage is Netlify Database (site-scoped Postgres). No extra env vars.
// The table is created by netlify/database/migrations on deploy.
//
// Stores only the normalised name, day statuses, notes, and timestamps.

import { getDatabase } from "@netlify/database";
import { adminKeyOk } from "./_shared/admin.mjs";
import { applyProgress, cleanPost, currentDay, emailClaim, learnersCsv, migrateCurriculum, normalizePerson, peerStanding, publicFeed, publicRecord, recordFromRow, stampCurriculum } from "./_shared/ai30.mjs";
import { deleteTestBlobs, listDriveSelfies } from "./_shared/selfies.mjs";

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

function rowsOf(result) {
  if (Array.isArray(result)) return result;
  if (result && Array.isArray(result.rows)) return result.rows;
  return [];
}

function iso(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function enrichPosts(rows) {
  const posts = rows.map((row) => ({
    id: Number(row.id),
    key: row.name_key,
    first: row.first_name,
    last: row.last_name,
    lesson: Number(row.lesson),
    kind: row.kind,
    body: row.body,
    parentId: row.parent_id ? Number(row.parent_id) : null,
    createdAt: iso(row.created_at),
  }));
  const byId = new Map(posts.map((post) => [post.id, post]));
  for (const post of posts) {
    const parent = post.parentId ? byId.get(post.parentId) : null;
    post.parentKind = parent ? parent.kind : "";
    post.parentKey = parent ? parent.key : "";
  }
  return posts;
}

async function readContext(db) {
  const peopleRows = rowsOf(await db.sql`
    SELECT name_key, first_name, last_name, email, days, selfie_at, created_at, updated_at
    FROM ai30_progress
  `);
  const loginRows = rowsOf(await db.sql`SELECT name_key, logged_at FROM ai30_logins`);
  const postRows = enrichPosts(rowsOf(await db.sql`
    SELECT id, name_key, first_name, last_name, lesson, kind, body, parent_id, created_at
    FROM ai30_posts
    ORDER BY created_at ASC
  `));
  const people = peopleRows.map((row) => {
    const person = recordFromRow(row);
    person.key = row.name_key;
    person.logins = [];
    return person;
  });
  const byKey = new Map(people.map((person) => [person.key, person]));
  for (const login of loginRows) {
    const person = byKey.get(login.name_key);
    const at = iso(login.logged_at);
    if (person && at) person.logins.push(at);
  }
  return { people, posts: postRows };
}

function pack(person, row, context) {
  const record = publicRecord(person, row);
  const standing = peerStanding(context.people, context.posts, person.key);
  record.note = standing.note;
  record.board = standing.board;
  record.posts = publicFeed(context.posts, person.key);
  record.closed = standing.closed;
  record.winner = standing.winner;
  return record;
}

async function readRow(db, key) {
  const rows = await db.sql`
    SELECT name_key, first_name, last_name, email, days, selfie_at, created_at, updated_at
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
    RETURNING name_key, first_name, last_name, email, days, selfie_at, created_at, updated_at
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
  if (limited("ip:" + ip, 1200)) return json(429, { ok: false, error: "rate" });

  const raw = await req.text();
  if (raw.length > 60000) return json(413, { ok: false, error: "too_large" });

  let body;
  try {
    body = JSON.parse(raw);
  } catch (e) {
    return json(400, { ok: false, error: "json" });
  }

  const adminOp = body.op === "export" || body.op === "reset" || body.op === "remove" || body.op === "admin-login";
  if (adminOp && !adminKeyOk(body.adminKey)) return json(403, { ok: false, error: "admin" });

  const person = adminOp && body.op !== "admin-login" ? { ok: true, key: "", first: "", last: "" } : normalizePerson(body && body.first, body && body.last);
  if (!person.ok) return json(400, { ok: false, error: person.error });
  if ((body.op === "save" || body.op === "talk") && limited(body.op + ":" + person.key, 40)) {
    return json(429, { ok: false, error: "rate" });
  }

  let db;
  try {
    db = getDatabase();
  } catch (e) {
    return json(503, { ok: false, error: "storage_unavailable" });
  }

  try {
    if (body.op === "export") {
      const context = await readContext(db);
      return json(200, { ok: true, csv: learnersCsv(context.people, context.posts) });
    }

    if (body.op === "reset") {
      const listed = await listDriveSelfies();
      const removed = rowsOf(await db.sql`
        SELECT first_name, last_name FROM ai30_progress
        WHERE lower(first_name) = 'testy' OR name_key LIKE 'zztest%'
      `);
      await db.sql`DELETE FROM ai30_posts WHERE name_key LIKE 'testy %' OR name_key LIKE 'zztest%'`;
      await db.sql`DELETE FROM ai30_logins WHERE name_key LIKE 'testy %' OR name_key LIKE 'zztest%'`;
      await db.sql`DELETE FROM ai30_progress WHERE lower(first_name) = 'testy' OR name_key LIKE 'zztest%'`;
      await deleteTestBlobs();
      return json(200, {
        ok: true,
        removed: removed.map((row) => `${row.first_name} ${row.last_name}`),
        driveFiles: listed.files,
        drive: listed.drive,
      });
    }

    if (body.op === "admin-login") {
      const who = normalizePerson(body.first, body.last);
      if (!who.ok) return json(400, { ok: false, error: who.error });
      const at = new Date(body.at);
      if (Number.isNaN(at.getTime())) return json(400, { ok: false, error: "time" });
      await db.sql`INSERT INTO ai30_logins (name_key, logged_at) VALUES (${who.key}, ${at.toISOString()}::timestamptz)`;
      return json(200, { ok: true });
    }

    if (body.op === "remove") {
      const id = Number(body.id);
      if (!Number.isInteger(id) || id < 1) return json(400, { ok: false, error: "post" });
      await db.sql`DELETE FROM ai30_posts WHERE id = ${id} OR parent_id = ${id}`;
      return json(200, { ok: true });
    }

    if (body.op === "load" || body.op === "save" || body.op === "feed" || body.op === "talk") {
      return json(200, await learnerOp(db, person, body));
    }

    return json(400, { ok: false, error: "op" });
  } catch (e) {
    return json(503, { ok: false, error: "storage_unavailable" });
  }
};

async function saveLocked(db, person, body) {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    const found = await client.query(
      "SELECT name_key, first_name, last_name, email, days, selfie_at, created_at, updated_at FROM ai30_progress WHERE name_key = $1 FOR UPDATE",
      [person.key],
    );
    const raw = found.rows[0];
    if (!raw || !raw.email) {
      await client.query("COMMIT");
      return { ok: true, needsEmail: true, first: person.first, last: person.last };
    }
    const existing = recordFromRow(raw);
    const applied = applyProgress({ ...existing, days: migrateCurriculum(existing.days) }, body, new Date().toISOString());
    if (!applied.ok) {
      await client.query("ROLLBACK");
      return { ok: false, error: applied.error, day: applied.day, unlockAt: applied.unlockAt || "" };
    }
    const updated = await client.query(
      "UPDATE ai30_progress SET days = $2::jsonb, updated_at = now() WHERE name_key = $1 RETURNING name_key, first_name, last_name, email, days, selfie_at, created_at, updated_at",
      [person.key, JSON.stringify(stampCurriculum(applied.days))],
    );
    await client.query("COMMIT");
    const row = recordFromRow(updated.rows[0]);
    return pack(person, row, await readContext(db));
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch (err) {}
    throw e;
  } finally {
    client.release();
  }
}

async function learnerOp(db, person, body) {
  if (body.op === "load") {
    let row = await readRow(db, person.key);
    const migrated = migrateCurriculum(row ? row.days : {});
    const createdAt = row && row.createdAt ? row.createdAt : new Date().toISOString();
    if (!row) {
      const claim = emailClaim("", body.email);
      if (!claim.ok) return { ok: true, needsEmail: true, first: person.first, last: person.last };
      row = await writeRow(db, person, migrated, createdAt);
    } else if (JSON.stringify(migrated) !== JSON.stringify(row.days)) {
      row = await writeRow(db, person, migrated, createdAt);
    }
    const claim = emailClaim(row.email, body.email);
    if (!claim.ok) {
      if (claim.error === "email_required") return { ok: true, needsEmail: true, first: person.first, last: person.last };
      return { ok: false, error: "email_mismatch" };
    }
    if (claim.write) {
      const saved = firstRow(await db.sql`
        UPDATE ai30_progress SET email = ${claim.email}, updated_at = now()
        WHERE name_key = ${person.key} AND (email IS NULL OR btrim(email) = '')
        RETURNING email
      `);
      if (saved && saved.email) row.email = saved.email;
      else {
        const fresh = await readRow(db, person.key);
        const again = emailClaim(fresh && fresh.email, body.email);
        if (!again.ok) return { ok: false, error: again.error === "email_required" ? "email_mismatch" : again.error };
        row.email = fresh.email;
      }
    }
    await db.sql`INSERT INTO ai30_logins (name_key) VALUES (${person.key})`;
    const context = await readContext(db);
    return pack(person, row, context);
  }

  if (body.op === "save") return saveLocked(db, person, body);

  if (body.op === "feed") {
    const row = await readRow(db, person.key);
    if (!row || !row.email) return { ok: true, needsEmail: true, first: person.first, last: person.last };
    const context = await readContext(db);
    return pack(person, row, context);
  }

  const row = await readRow(db, person.key);
  if (!row || !row.email) return { ok: true, needsEmail: true, first: person.first, last: person.last };
  const claim = emailClaim(row.email, body.email);
  if (!claim.ok) return { ok: false, error: claim.error };
  const text = cleanPost(body.body);
  if (!text) return { ok: false, error: "empty" };
  const parentId = Number(body.parentId);
  if (Number.isInteger(parentId) && parentId > 0) {
    const parent = firstRow(await db.sql`SELECT id, parent_id FROM ai30_posts WHERE id = ${parentId} LIMIT 1`);
    if (!parent || parent.parent_id) return { ok: false, error: "reply" };
    await db.sql`
      INSERT INTO ai30_posts (name_key, first_name, last_name, lesson, kind, body, parent_id)
      VALUES (${person.key}, ${person.first}, ${person.last}, 0, 'reply', ${text}, ${parentId})
    `;
  } else {
    const lesson = Number(body.lesson);
    const kind = body.kind === "question" || body.kind === "stuck" ? body.kind : body.kind === "learned" ? "learned" : "";
    if (!kind || !Number.isInteger(lesson) || lesson < 1) return { ok: false, error: "post" };
    const days = migrateCurriculum(row.days);
    if (lesson > currentDay(days)) return { ok: false, error: "day_locked" };
    await db.sql`
      INSERT INTO ai30_posts (name_key, first_name, last_name, lesson, kind, body)
      VALUES (${person.key}, ${person.first}, ${person.last}, ${lesson}, ${kind}, ${text})
    `;
  }
  const context = await readContext(db);
  return pack(person, row, context);
}

export const config = {
  path: "/api/ai-30-days",
};
