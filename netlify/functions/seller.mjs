// Private endpoint for /seller-valuation/. The page posts here. Make hook URLs stay in
// Netlify env vars and are never written into the repo or the response.
//
// Required (Site settings > Environment variables):
//   MAKE_LEAD_HOOK      page-1 webhook URL
//   MAKE_DETAILS_HOOK   page-2 webhook URL
//   MAKE_PHOTO_HOOK     photo-to-Drive webhook URL
//   MAKE_SHARED_SECRET  value Make checks in the x-jw-secret header
//
// If any of those is unset, the function refuses the post. It does not fall back
// to a hook URL. Photos go to Make → Google Drive (per-lead folder).

const PRODUCTION_ORIGINS = ["https://jonathanwallace.ca", "https://www.jonathanwallace.ca"];
const PREVIEW_ORIGIN = /^https:\/\/deploy-preview-\d+--jonathanwallace-ca\.netlify\.app$/;
const HOOKS = { lead: "MAKE_LEAD_HOOK", details: "MAKE_DETAILS_HOOK", photo: "MAKE_PHOTO_HOOK" };
const hits = new Map();

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

function env(name) {
  try {
    if (typeof Netlify !== "undefined" && Netlify.env && typeof Netlify.env.get === "function") {
      return Netlify.env.get(name) || "";
    }
  } catch (e) {}
  return "";
}

function originAllowed(origin) {
  return PRODUCTION_ORIGINS.indexOf(origin) !== -1 || PREVIEW_ORIGIN.test(origin);
}

// Some in-app browsers (Facebook, Instagram) and privacy settings send no Origin or
// "null" on a same-origin fetch. Accept those when the browser itself marks the call
// same-origin, or the Referer is our own page, instead of refusing a real lead.
function requestAllowed(req) {
  const origin = req.headers.get("origin") || "";
  if (origin && origin !== "null") return originAllowed(origin);
  if ((req.headers.get("sec-fetch-site") || "") === "same-origin") return true;
  try {
    const ref = new URL(req.headers.get("referer") || "");
    return originAllowed(ref.origin);
  } catch (e) {
    return false;
  }
}

// One line per refused or held-back post, so Netlify function logs show why.
// No names, emails or phone numbers are logged.
function logReject(reason, req, step, extra) {
  try {
    console.log(
      JSON.stringify({
        seller_reject: reason,
        step: step || "",
        origin: req.headers.get("origin") || "",
        referer: (req.headers.get("referer") || "").split("?")[0],
        sec_fetch_site: req.headers.get("sec-fetch-site") || "",
        ua: (req.headers.get("user-agent") || "").slice(0, 200),
        ...(extra || {}),
      })
    );
  } catch (e) {}
}

function rateLimited(ip, step) {
  const limit = step === "photo" ? 40 : 6;
  const key = step + ":" + (ip || "unknown");
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < 600000);
  arr.push(now);
  hits.set(key, arr);
  return arr.length > limit;
}

export default async (req, context) => {
  if (req.method !== "POST") return json(405, { ok: false });

  const step = new URL(req.url).searchParams.get("step");
  if (!requestAllowed(req)) {
    logReject("origin", req, step);
    return json(403, { ok: false });
  }

  const hookName = HOOKS[step];
  if (!hookName) {
    logReject("bad_step", req, step);
    return json(400, { ok: false });
  }

  const hook = env(hookName);
  const secret = env("MAKE_SHARED_SECRET");
  if (!hook || !secret) {
    logReject("not_configured", req, step);
    return json(503, { ok: false, error: "not_configured" });
  }

  const ip = (context && context.ip) || req.headers.get("x-nf-client-connection-ip") || "";
  if (rateLimited(ip, step)) {
    logReject("rate_limited", req, step);
    return json(429, { ok: false });
  }

  let data;
  try {
    data = await req.json();
  } catch (e) {
    logReject("bad_json", req, step);
    return json(400, { ok: false });
  }
  if (!data || !/^[\w-]{8,64}$/.test(data.lead_id || "")) {
    logReject("bad_lead_id", req, step);
    return json(400, { ok: false });
  }
  if (step === "photo") {
    if (!data.photo_base64 || typeof data.photo_base64 !== "string") return json(400, { ok: false });
    if (data.photo_base64.length > 9000000) return json(413, { ok: false });
  }

  if (step === "lead") {
    const ms = Number(data.ms_on_page);
    // Bots get a normal-looking 200 so they don't retry, but forwarded:false tells
    // the page not to fire the Meta Lead / Google Ads conversion for this post.
    const hp = String(data.jw_hp_note || data.company || "");
    if (hp || !Number.isFinite(ms) || ms < 3000) {
      logReject(hp ? "honeypot" : "too_fast", req, step, { ms_on_page: ms, hp_len: hp.length });
      return json(200, { ok: true, forwarded: false });
    }
  }
  delete data.jw_hp_note;
  delete data.company;

  data.client_ip_address = ip;
  data.client_user_agent = req.headers.get("user-agent") || "";
  data.received_at = new Date().toISOString();

  try {
    const r = await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-jw-secret": secret },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(step === "photo" ? 45000 : 12000),
    });
    if (!r.ok) {
      logReject("make_" + r.status, req, step);
      return json(502, { ok: false });
    }
    if (step === "photo") {
      try {
        const body = await r.json();
        return json(200, body && typeof body === "object" ? body : { ok: true });
      } catch (e) {
        return json(200, { ok: true });
      }
    }
    return json(200, { ok: true, forwarded: true });
  } catch (e) {
    logReject("make_timeout", req, step);
    return json(504, { ok: false });
  }
};
