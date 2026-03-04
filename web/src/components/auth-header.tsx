"use client";

import { useEffect, useRef, useState } from "react";

type AuthState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "authenticated"; email: string };

const TOKEN_KEY = "nightstand-api-token";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function AuthHeader() {
  const [auth, setAuth] = useState<AuthState>({ status: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = window.localStorage.getItem(TOKEN_KEY);
    if (existing) {
      const email =
        window.localStorage.getItem(`${TOKEN_KEY}:email`) ?? "";
      setAuth({ status: "authenticated", email });
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!GOOGLE_CLIENT_ID) return;
    if (window.google && window.google.accounts && window.google.accounts.id) {
      initializeGoogle();
      return;
    }

    const scriptId = "google-identity-services";
    if (document.getElementById(scriptId)) {
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initializeGoogle();
    };
    document.head.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeGoogle = () => {
    if (!GOOGLE_CLIENT_ID) return;
    if (!googleButtonRef.current) return;
    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      return;
    }
    if (googleButtonRef.current.hasChildNodes()) {
      setGoogleReady(true);
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    });
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      shape: "pill",
      width: 320,
      text: "continue_with",
    });
    setGoogleReady(true);
  };

  const handleGoogleCredential = async (response: { credential?: string }) => {
    if (!response.credential) return;
    setError(null);
    setAuth({ status: "loading" });
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok || !data.user?.apiToken) {
        setError(data.error ?? "Google sign-in failed");
        setAuth({ status: "idle" });
        return;
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem(TOKEN_KEY, data.user.apiToken);
        window.localStorage.setItem(
          `${TOKEN_KEY}:email`,
          data.user.email ?? "",
        );
      }
      setAuth({
        status: "authenticated",
        email: data.user.email ?? "",
      });
    } catch {
      setError("Google sign-in failed");
      setAuth({ status: "idle" });
    }
  };

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(`${TOKEN_KEY}:email`);
    }
    setAuth({ status: "idle" });
    setError(null);
  };

  if (auth.status === "authenticated") {
    return (
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex flex-col leading-tight">
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {auth.email}
          </span>
          <span className="text-[11px] text-zinc-500">
            Signed in
          </span>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-full border border-zinc-300 px-3 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Sign out
        </button>
      </div>
    );
  }

  const isLoading = auth.status === "loading";

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-xl bg-black/70 px-6 py-5 text-xs text-zinc-300 shadow-lg shadow-black/60">
        {error && (
          <p className="mb-3 text-[11px] text-red-400">
            {error}
          </p>
        )}
        <div className="flex justify-center">
          <div
            ref={googleButtonRef}
            className={`flex justify-center ${!googleReady || isLoading ? "opacity-50" : ""}`}
          />
        </div>
      </div>
    </div>
  );
}

export function ApiTokenSection() {
  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const existing = window.localStorage.getItem(TOKEN_KEY);
      if (existing) {
        setToken(existing);
      }
    }
  }, []);

  if (!token) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
          Extension API token
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-full border border-zinc-300 px-3 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p className="mt-2 break-all rounded-md bg-zinc-900/90 px-3 py-2 font-mono text-[11px] text-zinc-50 dark:bg-black">
        {token}
      </p>
      <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
        Paste this token into the extension options as the "Personal API token".
        Keep it secret — it identifies your account.
      </p>
    </div>
  );
}

