import { shell } from "electron";
import { randomBytes } from "crypto";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID ?? "";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://nightstand.com";
const REDIRECT_URI = "https://nightstand.com/auth/desktop-callback";

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export interface AuthResult {
  apiToken: string;
  user: {
    email: string;
    name: string | null;
    image: string | null;
    tokenExpiresAt: number | null;
  };
}

interface PendingAuth {
  state: string;
  resolve: (result: AuthResult) => void;
  reject: (err: Error) => void;
}

// Keyed by state — holds at most one pending auth at a time in practice
const pendingAuths = new Map<string, PendingAuth>();

export async function startGoogleAuth(): Promise<AuthResult> {
  const state = base64url(randomBytes(32));

  const params = new URLSearchParams({
    response_type: "code",
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  return new Promise<AuthResult>((resolve, reject) => {
    pendingAuths.set(state, { state, resolve, reject });
    shell.openExternal(authUrl);
  });
}

/** Called by index.ts when the OS routes the custom protocol URL to Electron. */
export function resolveDeepLink(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return;
  }

  const accessToken = parsed.searchParams.get("accessToken");
  const state = parsed.searchParams.get("state");
  const error = parsed.searchParams.get("error");

  if (!state) return;

  const pending = pendingAuths.get(state);
  if (!pending) return;
  pendingAuths.delete(state);

  if (error || !accessToken) {
    pending.reject(new Error(error ?? "No access token in deep link"));
    return;
  }

  // Exchange the Google access_token for a Nightstand API token
  exchangeAccessToken(accessToken)
    .then(pending.resolve)
    .catch(pending.reject);
}

async function exchangeAccessToken(accessToken: string): Promise<AuthResult> {
  const apiRes = await fetch(`${API_BASE_URL}/api/auth/google/extension`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
  });

  if (!apiRes.ok) {
    const body = await apiRes.text();
    throw new Error(`Backend auth failed: ${body}`);
  }

  const data = (await apiRes.json()) as {
    apiToken: string;
    user: { email: string; name: string | null; image: string | null };
  };

  return {
    apiToken: data.apiToken,
    user: {
      email: data.user.email,
      name: data.user.name,
      image: data.user.image,
      tokenExpiresAt: null,
    },
  };
}
