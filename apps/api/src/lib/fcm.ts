// Real Firebase Cloud Messaging (HTTP v1) sender. No SDK / extra dependency —
// it mints a Google OAuth2 access token from a service account using the
// jsonwebtoken we already depend on, then POSTs to the FCM v1 endpoint.
//
// Activate by setting ONE of:
//   FIREBASE_SERVICE_ACCOUNT       — the service-account JSON, inline
//   FIREBASE_SERVICE_ACCOUNT_PATH  — path to the service-account .json file
// (Download it from Firebase console → Project settings → Service accounts →
// "Generate new private key".) With neither set, fcmConfigured() is false and
// the notifier falls back to the push stub.
import jwt from "jsonwebtoken";
import { readFileSync } from "node:fs";

interface ServiceAccount { project_id: string; client_email: string; private_key: string }

let cachedSA: ServiceAccount | null | undefined; // undefined = not yet resolved
function serviceAccount(): ServiceAccount | null {
  if (cachedSA !== undefined) return cachedSA;
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT
      ? process.env.FIREBASE_SERVICE_ACCOUNT
      : process.env.FIREBASE_SERVICE_ACCOUNT_PATH
        ? readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf8")
        : null;
    cachedSA = raw ? (JSON.parse(raw) as ServiceAccount) : null;
  } catch (e) {
    console.error("[fcm] invalid service account:", (e as Error).message);
    cachedSA = null;
  }
  return cachedSA;
}

export function fcmConfigured(): boolean {
  return !!serviceAccount();
}

// --- OAuth2 access token (cached until ~1 min before expiry) ---
let token: { value: string; exp: number } | null = null;

async function accessToken(sa: ServiceAccount): Promise<string> {
  if (token && Date.now() < token.exp - 60_000) return token.value;
  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    { iss: sa.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 },
    sa.private_key,
    { algorithm: "RS256" },
  );
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!res.ok) throw new Error(`token endpoint ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  token = { value: data.access_token, exp: Date.now() + data.expires_in * 1000 };
  return token.value;
}

export interface FcmResult { sent: number; failed: number; invalidTokens: string[] }

/**
 * Send one notification to many device tokens via FCM v1 (one request per
 * token). Returns counts and any tokens the server rejected as unregistered so
 * the caller can prune them.
 */
export async function sendFcm(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<FcmResult> {
  const sa = serviceAccount();
  if (!sa || !tokens.length) return { sent: 0, failed: 0, invalidTokens: [] };
  const bearer = await accessToken(sa);
  const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;

  const result: FcmResult = { sent: 0, failed: 0, invalidTokens: [] };
  await Promise.all(
    tokens.map(async (deviceToken) => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { authorization: `Bearer ${bearer}`, "content-type": "application/json" },
          body: JSON.stringify({
            message: {
              token: deviceToken,
              notification: { title, body },
              data,
              android: { priority: "high" },
              apns: { headers: { "apns-priority": "10" } },
            },
          }),
        });
        if (res.ok) {
          result.sent++;
        } else {
          result.failed++;
          // 404 UNREGISTERED / 400 invalid → token is dead, mark for pruning
          if (res.status === 404 || res.status === 400) result.invalidTokens.push(deviceToken);
        }
      } catch {
        result.failed++;
      }
    }),
  );
  return result;
}
