// Local stand-in for the Netlify function. Same progress rules, file storage instead of Postgres.
import { createServer } from "node:http";
import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync, readdirSync, unlinkSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { adminKeyOk } from "../netlify/functions/_shared/admin.mjs";
import { applyProgress, cleanPost, currentDay, learnersCsv, migrateCurriculum, normalizePerson, peerStanding, publicFeed, publicRecord, recordFromRow, selfieFilename, stampCurriculum, validEmail } from "../netlify/functions/_shared/ai30.mjs";
import { buildIcs, icsFilename, parseWhen } from "../netlify/functions/_shared/ics.mjs";
import plan from "../ai-30-days/days.json" with { type: "json" };

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const storePath = process.env.AI30_STORE || "/tmp/ai30-dev-store.json";
const selfieDir = process.env.AI30_SELFIES || "/tmp/ai30-selfies";
const port = Number(process.env.PORT || 8765);
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8" };

function loadStore() {
  if (!existsSync(storePath)) return {};
  return JSON.parse(readFileSync(storePath, "utf8"));
}
function saveStore(data) {
  writeFileSync(storePath, JSON.stringify(data));
}

function send(res, status, body, type) {
  res.writeHead(status, {
    "Content-Type": type || "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
  });
  res.end(body);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  if (url.pathname === "/api/ai-30-days/ics" && req.method === "GET") {
    const day = (plan.days || []).find((item) => item.day === Number(url.searchParams.get("day")));
    const when = parseWhen(url.searchParams.get("date"), url.searchParams.get("time"));
    if (!day || !when) return send(res, 400, "Missing day or time", "text/plain; charset=utf-8");
    res.writeHead(200, {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${icsFilename(day)}"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    });
    res.end(buildIcs(day, when));
    return;
  }

  if ((url.pathname === "/api/ai-30-days" || url.pathname === "/api/ai-30-days/selfie") && req.method === "POST") {
    const raw = await new Promise((resolve) => {
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    });
    const limit = url.pathname.endsWith("/selfie") ? 3000000 : 60000;
    if (raw.length > limit) return send(res, 413, JSON.stringify({ ok: false, error: "too_large" }));
    let body;
    try { body = JSON.parse(raw); } catch (e) { return send(res, 400, JSON.stringify({ ok: false, error: "json" })); }
    const store = loadStore();
    if (!Array.isArray(store._posts)) store._posts = [];
    const people = () => Object.entries(store).filter(([key]) => key !== "_posts").map(([key, item]) => ({
      key,
      first: item.first_name,
      last: item.last_name,
      email: item.email || "",
      days: item.days,
      logins: item.logins || [],
      selfieAt: item.selfie_at || "",
    }));
    const posts = () => {
      const rawPosts = store._posts.map((post) => ({ ...post }));
      const byId = new Map(rawPosts.map((post) => [post.id, post]));
      for (const post of rawPosts) {
        const parent = post.parentId ? byId.get(post.parentId) : null;
        post.parentKind = parent ? parent.kind : "";
        post.parentKey = parent ? parent.key : "";
      }
      return rawPosts;
    };
    const answer = (row) => {
      const record = publicRecord(person, row);
      const standing = peerStanding(people(), posts(), person.key);
      record.note = standing.note;
      record.board = standing.board;
      record.posts = publicFeed(posts(), person.key);
      record.closed = standing.closed;
      record.winner = standing.winner;
      return JSON.stringify(record);
    };
    const adminOp = ["export", "reset", "remove", "admin-login"].includes(body.op);
    if (adminOp && !adminKeyOk(body.adminKey)) return send(res, 403, JSON.stringify({ ok: false, error: "admin" }));
    if (body.op === "export") return send(res, 200, JSON.stringify({ ok: true, csv: learnersCsv(people(), posts()) }));
    if (body.op === "reset") {
      const removed = people().filter((person) => person.first.toLowerCase() === "testy" || person.key.startsWith("zztest")).map((person) => `${person.first} ${person.last}`);
      for (const key of Object.keys(store)) {
        if (key === "_posts") continue;
        const item = store[key];
        if (String(item.first_name || "").toLowerCase() === "testy" || key.startsWith("zztest")) delete store[key];
      }
      store._posts = store._posts.filter((post) => !(post.key || "").startsWith("testy ") && !(post.key || "").startsWith("zztest"));
      saveStore(store);
      if (existsSync(selfieDir)) {
        for (const name of readdirSync(selfieDir)) {
          if (/^(Testy|Zztest)-/i.test(name)) unlinkSync(join(selfieDir, name));
        }
      }
      return send(res, 200, JSON.stringify({ ok: true, removed, driveFiles: [], drive: "not_connected" }));
    }
    if (body.op === "remove") {
      const id = Number(body.id);
      store._posts = store._posts.filter((post) => post.id !== id && post.parentId !== id);
      saveStore(store);
      return send(res, 200, JSON.stringify({ ok: true }));
    }
    const person = normalizePerson(body.first, body.last);
    if (!person.ok) return send(res, 400, JSON.stringify({ ok: false, error: person.error }));
    if (body.op === "admin-login") {
      const at = new Date(body.at);
      if (Number.isNaN(at.getTime())) return send(res, 400, JSON.stringify({ ok: false, error: "time" }));
      if (!store[person.key]) return send(res, 400, JSON.stringify({ ok: false, error: "name_required" }));
      store[person.key].logins = store[person.key].logins || [];
      store[person.key].logins.push(at.toISOString());
      saveStore(store);
      return send(res, 200, JSON.stringify({ ok: true }));
    }
    if (url.pathname.endsWith("/selfie")) {
      const bytes = Buffer.from(String(body.image || ""), "base64");
      if (bytes.length < 100 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return send(res, 400, JSON.stringify({ ok: false, error: "image" }));
      if (!store[person.key] || !store[person.key].email) return send(res, 400, JSON.stringify({ ok: false, error: "email_required" }));
      mkdirSync(selfieDir, { recursive: true });
      const filename = selfieFilename(person.first, person.last);
      writeFileSync(join(selfieDir, filename), bytes);
      store[person.key].selfie_at = new Date().toISOString();
      saveStore(store);
      return send(res, 200, JSON.stringify({ ok: true, selfie: true, drive: "not_connected" }));
    }
    const ensure = () => {
      if (!store[person.key]) {
        store[person.key] = {
          first_name: person.first,
          last_name: person.last,
          email: "",
          days: {},
          logins: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      return store[person.key];
    };
    if (body.op === "load") {
      const item = ensure();
      item.days = migrateCurriculum(item.days);
      const email = validEmail(body.email);
      if (email) item.email = email;
      if (!item.email) {
        saveStore(store);
        return send(res, 200, JSON.stringify({ ok: true, needsEmail: true, first: person.first, last: person.last }));
      }
      item.logins = item.logins || [];
      item.logins.push(new Date().toISOString());
      item.updated_at = new Date().toISOString();
      saveStore(store);
      const row = recordFromRow(item);
      row.email = item.email;
      row.selfieAt = item.selfie_at || "";
      return send(res, 200, answer(row));
    }
    const item = store[person.key];
    if (!item || !item.email) return send(res, 200, JSON.stringify({ ok: true, needsEmail: true, first: person.first, last: person.last }));
    if (body.op === "save") {
      const applied = applyProgress({ days: migrateCurriculum(item.days) }, body, new Date().toISOString());
      if (!applied.ok) return send(res, 400, JSON.stringify({ ok: false, error: applied.error, day: applied.day }));
      item.days = stampCurriculum(applied.days);
      item.updated_at = new Date().toISOString();
      saveStore(store);
      const row = recordFromRow(item);
      row.email = item.email;
      row.selfieAt = item.selfie_at || "";
      return send(res, 200, answer(row));
    }
    if (body.op === "feed") {
      const row = recordFromRow(item);
      row.email = item.email;
      row.selfieAt = item.selfie_at || "";
      return send(res, 200, answer(row));
    }
    if (body.op === "talk") {
      const text = cleanPost(body.body);
      if (!text) return send(res, 400, JSON.stringify({ ok: false, error: "empty" }));
      const id = store._posts.reduce((max, post) => Math.max(max, post.id), 0) + 1;
      const parentId = Number(body.parentId);
      if (Number.isInteger(parentId) && parentId > 0) {
        const parent = store._posts.find((post) => post.id === parentId);
        if (!parent || parent.parentId) return send(res, 400, JSON.stringify({ ok: false, error: "reply" }));
        store._posts.push({ id, key: person.key, first: person.first, last: person.last, lesson: parent.lesson, kind: "reply", body: text, parentId, createdAt: new Date().toISOString() });
      } else {
        const lesson = Number(body.lesson);
        const kind = ["learned", "question", "stuck"].includes(body.kind) ? body.kind : "";
        if (!kind || lesson > currentDay(migrateCurriculum(item.days))) return send(res, 400, JSON.stringify({ ok: false, error: "day_locked" }));
        store._posts.push({ id, key: person.key, first: person.first, last: person.last, lesson, kind, body: text, parentId: null, createdAt: new Date().toISOString() });
      }
      saveStore(store);
      const row = recordFromRow(item);
      row.email = item.email;
      row.selfieAt = item.selfie_at || "";
      return send(res, 200, answer(row));
    }
    return send(res, 400, JSON.stringify({ ok: false, error: "op" }));
  }

  let path = decodeURIComponent(url.pathname);
  if (path === "/ai-30-days" || path === "/ai-30-days/") path = "/ai-30-days/index.html";
  const file = normalize(join(root, path));
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) {
    return send(res, 404, "Not found", "text/plain; charset=utf-8");
  }
  const body = readFileSync(file);
  const type = types[extname(file)] || "application/octet-stream";
  send(res, 200, body, type);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`ai30 dev http://127.0.0.1:${port}/ai-30-days`);
});
