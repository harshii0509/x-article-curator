"use client";

import { useEffect, useRef, useState } from "react";

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
  const [codeDigits, setCodeDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [error, setError] = useState<string | null>(null);
  const codeInputsRef = useRef<Array<HTMLInputElement | null>>([]);

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
      setCodeDigits(["", "", "", "", "", ""]);
      setAuth({ status: "code-sent", email });
    } catch {
      setError("Failed to send code");
      setAuth({ status: "idle" });
    }
  };

  const handleVerifyCode = async () => {
    if (auth.status !== "code-sent") return;
    const code = codeDigits.join("").trim();
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
    setCodeDigits(["", "", "", "", "", ""]);
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

  const isCodeStep =
    auth.status === "code-sent" || auth.status === "verifying";

  const handleDigitChange = (index: number, value: string) => {
    const next = value.replace(/[^0-9]/g, "").slice(0, 1);
    setCodeDigits((prev) => {
      const copy = [...prev];
      copy[index] = next;
      return copy;
    });

    if (next && codeInputsRef.current[index + 1]) {
      codeInputsRef.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !codeDigits[index]) {
      if (codeInputsRef.current[index - 1]) {
        event.preventDefault();
        codeInputsRef.current[index - 1]?.focus();
      }
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-xl bg-black/70 px-6 py-5 text-xs text-zinc-300 shadow-lg shadow-black/60">
        {!isCodeStep ? (
          <>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Enter your email"
              className="mb-3 w-full rounded-md bg-zinc-900 px-3 py-2 text-[13px] text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={auth.status === "sending" || !emailInput.trim()}
              className="inline-flex w-full items-center justify-center rounded-md bg-[#F4C96B] px-2 py-2 text-[13px] font-medium text-zinc-950 hover:bg-[#f7d480] disabled:opacity-50 focus:outline-none"
            >
              {auth.status === "sending" ? "Sending code…" : "Send one-time OTP"}
            </button>
          </>
        ) : (
          <>
            <div className="mb-3 flex justify-between gap-2">
              {codeDigits.map((digit, index) => (
                <input
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  ref={(el) => {
                    codeInputsRef.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(index, e)}
                  className="h-9 w-9 rounded-md border border-zinc-700 bg-zinc-900 text-center text-[13px] text-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={auth.status === "verifying"}
              className="inline-flex w-full items-center justify-center rounded-md bg-zinc-200 px-2 py-2 text-[13px] font-medium text-zinc-950 hover:bg-zinc-100 disabled:opacity-60"
            >
              {auth.status === "verifying" ? "Verifying…" : "Verify code"}
            </button>
          </>
        )}
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

