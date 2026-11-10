// Local stand-in for the Netlify function. Same progress rules, file storage instead of Postgres.
import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { applyProgress, normalizePerson, publicRecord, recordFromRow } from "../netlify/functions/_shared/ai30.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const storePath = process.env.AI30_STORE || "/tmp/ai30-dev-store.json";
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
  if (url.pathname === "/api/ai-30-days" && req.method === "POST") {
    const raw = await new Promise((resolve) => {
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    });
    if (raw.length > 60000) return send(res, 413, JSON.stringify({ ok: false, error: "too_large" }));
    let body;
    try { body = JSON.parse(raw); } catch (e) { return send(res, 400, JSON.stringify({ ok: false, error: "json" })); }
    const person = normalizePerson(body.first, body.last);
    if (!person.ok) return send(res, 400, JSON.stringify({ ok: false, error: person.error }));
    const store = loadStore();
    const existing = store[person.key] ? recordFromRow(store[person.key]) : null;
    if (body.op === "load") {
      const row = existing || { first_name: person.first, last_name: person.last, days: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      store[person.key] = { ...row, first_name: person.first, last_name: person.last, updated_at: new Date().toISOString(), created_at: row.createdAt || row.created_at };
      if (!store[person.key].days) store[person.key].days = {};
      saveStore(store);
      return send(res, 200, JSON.stringify(publicRecord(person, recordFromRow(store[person.key]))));
    }
    if (body.op === "save") {
      const applied = applyProgress(existing, body, new Date().toISOString());
      if (!applied.ok) return send(res, 400, JSON.stringify({ ok: false, error: applied.error, day: applied.day }));
      const created = existing && existing.createdAt ? existing.createdAt : new Date().toISOString();
      store[person.key] = {
        first_name: person.first,
        last_name: person.last,
        days: applied.days,
        created_at: created,
        updated_at: new Date().toISOString(),
      };
      saveStore(store);
      return send(res, 200, JSON.stringify(publicRecord(person, recordFromRow(store[person.key]))));
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
