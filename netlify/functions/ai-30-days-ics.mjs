// Serves one practice-day calendar file. iOS Safari opens a text/calendar
// response with an inline Content-Disposition in the Add Event sheet.
// The day title and assignment come from ai-30-days/days.json.

import plan from "../../ai-30-days/days.json" with { type: "json" };
import { buildIcs, icsFilename, parseWhen, unlockDescription } from "./_shared/ics.mjs";

const hits = new Map();

function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 600000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > 80;
}

function text(status, body, extra) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      ...(extra || {}),
    },
  });
}

export default async (req, context) => {
  if (req.method !== "GET") return text(405, "Method not allowed");
  const ip = (context && context.ip) || req.headers.get("x-nf-client-connection-ip") || "unknown";
  if (limited(ip)) return text(429, "Too many requests");

  const url = new URL(req.url);
  const dayNo = Number(url.searchParams.get("day"));
  const when = parseWhen(url.searchParams.get("date"), url.searchParams.get("time"));
  const day = (plan.days || []).find((item) => item.day === dayNo);
  if (!day || !when) return text(400, "Missing day or time");

  const unlock = url.searchParams.get("kind") === "unlock";
  const body = buildIcs(day, when, unlock ? { description: unlockDescription(day), alarm: `AI Bootcamp: ${day.title}` } : {});
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${icsFilename(day)}"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
};

export const config = {
  path: "/api/ai-30-days/ics",
};
