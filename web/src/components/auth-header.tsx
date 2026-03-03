"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

export function AuthHeader() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <p className="text-xs text-zinc-500 dark:text-zinc-400">Checking login…</p>
    );
  }

  if (!session?.user) {
    return (
      <button
        type="button"
        onClick={() => signIn("google", { prompt: "select_account" })}
        className="mt-3 inline-flex items-center rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-medium text-zinc-50 shadow-sm hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Sign in with Google
      </button>
    );
  }

  const user = session.user as any;

  return (
    <div className="mt-3 flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.image}
          alt={user.name ?? "Profile"}
          className="h-7 w-7 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-semibold uppercase text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          {user.name?.[0] ?? "U"}
        </div>
      )}
      <div className="flex flex-1 flex-col leading-tight">
        <span className="font-medium text-zinc-900 dark:text-zinc-50">
          {user.name ?? user.email}
        </span>
        <span className="text-[11px]">{user.email}</span>
      </div>
      <button
        type="button"
        onClick={() => signOut()}
        className="rounded-full border border-zinc-300 px-3 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        Sign out
      </button>
    </div>
  );
}

export function ApiTokenSection() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const token = user?.apiToken as string | undefined;

  const [copied, setCopied] = useState(false);

  if (!session?.user) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
        Sign in with Google to get a personal API token for the browser
        extension.
      </div>
    );
  }

  if (!token) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
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
        Paste this token into the extension options as the \"Personal API
        token\". Keep it secret — it identifies your account.
      </p>
    </div>
  );
}

