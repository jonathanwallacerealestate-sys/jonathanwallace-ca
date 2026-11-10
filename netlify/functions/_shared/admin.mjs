import { createHmac, timingSafeEqual } from "node:crypto";

export function adminSecret() {
  let fromNetlify = "";
  try {
    if (typeof Netlify !== "undefined" && Netlify.env) fromNetlify = Netlify.env.get("AI30_ADMIN_KEY") || "";
  } catch (e) {
    fromNetlify = "";
  }
  return fromNetlify || process.env.AI30_ADMIN_KEY || "";
}

export function adminKeyOk(given) {
  const expected = adminSecret();
  if (!expected || given == null || given === "") return false;
  const left = Buffer.from(String(given));
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function envValue(name) {
  let fromNetlify = "";
  try {
    if (typeof Netlify !== "undefined" && Netlify.env) fromNetlify = Netlify.env.get(name) || "";
  } catch (e) {
    fromNetlify = "";
  }
  return fromNetlify || process.env[name] || "";
}

// Comma-separated addresses. Comparison is trim + lowercase. The list never goes to the browser.
export function adminEmails() {
  return envValue("AI30_ADMIN_EMAILS")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email) {
  const value = String(email || "").trim().toLowerCase();
  if (!value) return false;
  return adminEmails().includes(value);
}

export function adminPin() {
  return envValue("AI30_ADMIN_PIN").trim();
}

function pinDigest(value) {
  return createHmac("sha256", "ai30-admin-pin").update(String(value)).digest();
}

export function adminPinOk(given) {
  const expected = adminPin();
  if (!expected || given == null || String(given).trim() === "") return false;
  return timingSafeEqual(pinDigest(expected), pinDigest(String(given).trim()));
}

const ADMIN_TOKEN_MS = 30 * 24 * 60 * 60 * 1000;

export function signAdminToken(email, nowMs = Date.now()) {
  const pin = adminPin();
  if (!pin) return "";
  const payload = Buffer.from(JSON.stringify({
    email: String(email || "").trim().toLowerCase(),
    exp: nowMs + ADMIN_TOKEN_MS,
  })).toString("base64url");
  const sig = createHmac("sha256", pin).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token, email, nowMs = Date.now()) {
  const pin = adminPin();
  if (!pin || !token) return false;
  const parts = String(token).split(".");
  if (parts.length !== 2) return false;
  const expected = createHmac("sha256", pin).update(parts[0]).digest("base64url");
  const left = Buffer.from(parts[1]);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return false;
  try {
    const data = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    return data.email === String(email || "").trim().toLowerCase() && typeof data.exp === "number" && data.exp >= nowMs;
  } catch (e) {
    return false;
  }
}

export function applyAdminSession(record, email, token, nowMs = Date.now()) {
  const needs = isAdminEmail(email);
  record.needsAdminCode = needs;
  record.isAdmin = !!(needs && verifyAdminToken(token, email, nowMs));
  if (record.isAdmin) record.unlockAt = "";
  return record;
}

const ADMIN_FAIL_LIMIT = 5;
const ADMIN_LOCK_MS = 15 * 60 * 1000;
const adminFails = new Map();

function adminFailKey(kind, value) {
  return `${kind}:${String(value || "").trim().toLowerCase()}`;
}

function adminFailRow(key, now) {
  const row = adminFails.get(key);
  if (!row) return null;
  if (row.lockUntil && row.lockUntil <= now) {
    adminFails.delete(key);
    return null;
  }
  return row;
}

export function adminCodeLocked(email, ip, now = Date.now()) {
  for (const key of [adminFailKey("email", email), adminFailKey("ip", ip)]) {
    const row = adminFailRow(key, now);
    if (row && row.lockUntil > now) return true;
  }
  return false;
}

export function noteAdminCodeFailure(email, ip, now = Date.now()) {
  for (const key of [adminFailKey("email", email), adminFailKey("ip", ip)]) {
    const existing = adminFailRow(key, now);
    const row = existing || { count: 0, lockUntil: 0 };
    if (row.lockUntil > now) continue;
    row.count += 1;
    if (row.count >= ADMIN_FAIL_LIMIT) {
      row.lockUntil = now + ADMIN_LOCK_MS;
      row.count = 0;
    }
    adminFails.set(key, row);
  }
}

export function clearAdminCodeFailures(email, ip) {
  adminFails.delete(adminFailKey("email", email));
  adminFails.delete(adminFailKey("ip", ip));
}
