import { createSign } from "node:crypto";
import { getStore } from "@netlify/blobs";

function env(name) {
  try {
    if (typeof Netlify !== "undefined" && Netlify.env) {
      const value = Netlify.env.get(name);
      if (value) return value;
    }
  } catch (e) {}
  return process.env[name] || "";
}

function store() {
  return getStore({ name: "ai30-selfies", consistency: "strong" });
}

export async function saveSelfieBlob(filename, bytes) {
  await store().set(filename, bytes, { metadata: { contentType: "image/jpeg" } });
}

export async function deleteTestBlobs() {
  try {
    const listed = await store().list();
    for (const blob of listed.blobs || []) {
      if (/^(Testy|Zztest)-/i.test(blob.key)) await store().delete(blob.key);
    }
  } catch (e) {}
}

async function driveToken(account) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claim = Buffer.from(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })).toString("base64url");
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  const signature = signer.sign(account.private_key).toString("base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claim}.${signature}`,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("token");
  return data.access_token;
}

function driveAccount() {
  const raw = env("AI30_GOOGLE_SERVICE_ACCOUNT_JSON");
  const folder = env("AI30_SELFIE_FOLDER_ID");
  if (!raw || !folder) return null;
  return { account: JSON.parse(raw), folder };
}

export async function uploadSelfieToDrive(bytes, filename) {
  const ready = driveAccount();
  const hook = env("AI30_SELFIE_WEBHOOK");
  if (ready) {
    const token = await driveToken(ready.account);
    const boundary = "bootcampselfie";
    const meta = JSON.stringify({ name: filename, parents: [ready.folder] });
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: image/jpeg\r\n\r\n`),
      bytes,
      Buffer.from(`\r\n--${boundary}--`),
    ]);
    const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    });
    if (!res.ok) throw new Error("drive");
    return { ok: true, drive: "saved" };
  }
  if (hook) {
    const res = await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, image: Buffer.from(bytes).toString("base64") }),
    });
    if (!res.ok) throw new Error("webhook");
    return { ok: true, drive: "saved" };
  }
  return { ok: false, drive: "not_connected" };
}

export async function listDriveSelfies() {
  const ready = driveAccount();
  if (!ready) return { drive: "not_connected", files: [] };
  try {
    const token = await driveToken(ready.account);
    const url = new URL("https://www.googleapis.com/drive/v3/files");
    url.searchParams.set("q", `'${String(ready.folder).replace(/'/g, "")}' in parents and trashed = false`);
    url.searchParams.set("fields", "files(name)");
    url.searchParams.set("pageSize", "200");
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return { drive: "error", files: [] };
    const data = await res.json();
    const files = (data.files || []).map((file) => file.name).filter((name) => /^(Testy|Zztest)-/i.test(name));
    return { drive: "connected", files };
  } catch (e) {
    return { drive: "error", files: [] };
  }
}
