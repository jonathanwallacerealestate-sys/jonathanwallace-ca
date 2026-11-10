import { timingSafeEqual } from "node:crypto";

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
