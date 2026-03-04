"use client";

import { useEffect, useState } from "react";

type AuthState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "code-sent"; email: string }
  | { status: "verifying"; email: string }
  | { status: "authenticated"; email: string };

const TOKEN_KEY = "nightstand-api-token";

export function AuthHeader() {
  const [auth, setAuth] = useState<AuthState>({ status: "idle" });
  const [emailInput, setEmailInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const existing = window.localStorage.getItem(TOKEN_KEY);
      if (existing) {
        const email =
          window.localStorage.getItem(`${TOKEN_KEY}:email`) ?? "";
        setAuth({ status: "authenticated", email });
      }
    }
  }, []);

  const handleSendCode = async () => {
    const email = emailInput.trim();
    if (!email) return;

    setError(null);
    setAuth({ status: "sending" });

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to send code");
        setAuth({ status: "idle" });
        return;
      }
      setAuth({ status: "code-sent", email });
    } catch {
      setError("Failed to send code");
      setAuth({ status: "idle" });
    }
  };

  const handleVerifyCode = async () => {
    if (auth.status !== "code-sent") return;
    const code = codeInput.trim();
    if (!code) return;

    setError(null);
    setAuth({ status: "verifying", email: auth.email });

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: auth.email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to verify code");
        setAuth({ status: "code-sent", email: auth.email });
        return;
      }

      const apiToken = data.user?.apiToken as string | undefined;
      if (typeof window !== "undefined" && apiToken) {
        window.localStorage.setItem(TOKEN_KEY, apiToken);
        window.localStorage.setItem(
          `${TOKEN_KEY}:email`,
          data.user?.email ?? auth.email,
        );
      }

      setAuth({
        status: "authenticated",
        email: data.user?.email ?? auth.email,
      });
    } catch {
      setError("Failed to verify code");
      setAuth({ status: "code-sent", email: auth.email });
    }
  };

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(`${TOKEN_KEY}:email`);
    }
    setAuth({ status: "idle" });
    setEmailInput("");
    setCodeInput("");
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
            Signed in with email
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

  return (
    <div className="mt-3 flex flex-col gap-2 text-xs text-zinc-600 dark:text-zinc-400">
      {error ? (
        <p className="text-[11px] text-red-500">{error}</p>
      ) : null}
      {auth.status === "idle" || auth.status === "sending" ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="you@example.com"
            className="h-8 min-w-[180px] flex-1 rounded-full border border-zinc-300 bg-transparent px-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-50"
          />
          <button
            type="button"
            onClick={handleSendCode}
            disabled={auth.status === "sending"}
            className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-medium text-zinc-50 shadow-sm hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {auth.status === "sending" ? "Sending…" : "Send code"}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="6-digit code"
            className="h-8 min-w-[120px] flex-1 rounded-full border border-zinc-300 bg-transparent px-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-50"
          />
          <button
            type="button"
            onClick={handleVerifyCode}
            disabled={auth.status === "verifying"}
            className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-medium text-zinc-50 shadow-sm hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {auth.status === "verifying" ? "Verifying…" : "Verify"}
          </button>
        </div>
      )}
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
        We&apos;ll email you a one-time code. No passwords, no Google account
        required.
      </p>
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
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
        After signing in, your personal API token for the browser extension will
        appear here.
      </div>
    );
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

