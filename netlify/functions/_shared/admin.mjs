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
