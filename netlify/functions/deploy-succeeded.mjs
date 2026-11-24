// netlify/functions/deploy-succeeded.mjs
// Netlify runs a function with this exact name after every successful deploy.
// On production deploys only, it tells IndexNow (Bing, Yandex, Seznam, Naver; ChatGPT search
// and Copilot read Bing's index) which pages changed, so new and updated posts get recrawled
// in hours instead of days. Pages count as changed when their sitemap.xml lastmod is within
// the last 3 days. The key file is /bf8b02397aa4556f88ead376e2840351.txt (added 2026-08-04).
// Added 2026-11-23 (AEO quick wins). Never blocks or fails a deploy.

const HOST = "jonathanwallace.ca";
const KEY = "bf8b02397aa4556f88ead376e2840351";
const WINDOW_DAYS = 3;

export function recentUrls(xml, now = new Date(), days = WINDOW_DAYS) {
  const cutoff = new Date(now.getTime() - days * 86400000).toISOString().slice(0, 10);
  const out = [];
  const re = /<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g;
  let m;
  while ((m = re.exec(xml))) {
    const loc = m[1].trim();
    if (m[2].trim().slice(0, 10) >= cutoff && loc.startsWith("https://" + HOST + "/")) out.push(loc);
  }
  return [...new Set(out)].slice(0, 10000);
}

export const handler = async (event) => {
  let deploy = {};
  try { deploy = (JSON.parse(event.body || "{}").payload) || {}; } catch (e) { deploy = {}; }
  if (deploy.context !== "production") {
    return { statusCode: 200, body: "skip: " + (deploy.context || "unknown context") };
  }
  try {
    const res = await fetch("https://" + HOST + "/sitemap.xml", { headers: { "User-Agent": "jonathanwallace.ca/1.0 (+indexnow)" } });
    if (!res.ok) return { statusCode: 200, body: "skip: sitemap " + res.status };
    const urlList = recentUrls(await res.text());
    if (!urlList.length) return { statusCode: 200, body: "skip: nothing changed in the last " + WINDOW_DAYS + " days" };
    const ping = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: "https://" + HOST + "/" + KEY + ".txt", urlList }),
    });
    console.log("IndexNow", ping.status, urlList.length, "urls");
    return { statusCode: 200, body: "indexnow " + ping.status + " for " + urlList.length + " urls" };
  } catch (e) {
    console.log("IndexNow error", String(e));
    return { statusCode: 200, body: "error (ignored): " + String(e) };
  }
};
