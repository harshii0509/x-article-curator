"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { safeGet, safeRemove } from "@/lib/storage";

type AuthState =
  | { status: "idle" }
  | { status: "authenticated"; email: string };

const TOKEN_KEY = "nightstand-api-token";

export function AuthHeader() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState>({ status: "idle" });

  useEffect(() => {
    const existing = safeGet(TOKEN_KEY);
    if (existing) {
      const email = safeGet(`${TOKEN_KEY}:email`) ?? "";
      setAuth({ status: "authenticated", email });
    }
  }, []);

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    safeRemove(TOKEN_KEY);
    safeRemove(`${TOKEN_KEY}:email`);
    setAuth({ status: "idle" });
    router.push("/");
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

  return null;
}

export function ApiTokenSection() {
  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const existing = safeGet(TOKEN_KEY);
    if (existing) setToken(existing);
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

