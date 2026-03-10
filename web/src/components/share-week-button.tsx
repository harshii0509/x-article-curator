"use client";

import { useState } from "react";
import { Check, Copy, Eye, EyeOff } from "lucide-react";

const TOKEN_KEY = "nightstand-api-token";
const USERNAME_KEY = `${TOKEN_KEY}:username`;

type ShareWeekButtonProps = {
  weekStart: number;
  isPublic: boolean;
  username: string | null;
  onToggled: (next: boolean) => void;
  onUsernameRequired: () => void;
};

export function ShareWeekButton({
  weekStart,
  isPublic,
  username,
  onToggled,
  onUsernameRequired,
}: ShareWeekButtonProps) {
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleToggle = async () => {
    if (pending) return;

    const storedUsername =
      typeof window !== "undefined"
        ? window.localStorage.getItem(USERNAME_KEY)
        : null;

    const effectiveUsername = username || storedUsername;

    if (!effectiveUsername) {
      onUsernameRequired();
      return;
    }

    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem(TOKEN_KEY)
        : null;

    if (!token) {
      onUsernameRequired();
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/weeks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          weekStart,
          isPublic: !isPublic,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "username_required") {
          onUsernameRequired();
          return;
        }
        // Silent failure; could add toast later.
        return;
      }

      onToggled(!isPublic);
    } finally {
      setPending(false);
    }
  };

  const handleCopy = async () => {
    if (copied) return;

    const storedUsername =
      typeof window !== "undefined"
        ? window.localStorage.getItem(USERNAME_KEY)
        : null;

    const effectiveUsername = username || storedUsername;
    if (!effectiveUsername) {
      onUsernameRequired();
      return;
    }

    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/u/${encodeURIComponent(
      effectiveUsername,
    )}/week/${weekStart}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
          isPublic
            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
            : "border-zinc-700 bg-zinc-900 text-zinc-300"
        }`}
      >
        {isPublic ? (
          <Eye className="h-3 w-3" />
        ) : (
          <EyeOff className="h-3 w-3" />
        )}
        <span>{isPublic ? "Public" : "Private"}</span>
      </button>
      {isPublic ? (
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-950 px-2 py-0.5 text-[11px] font-medium text-zinc-300 hover:bg-zinc-900"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy link</span>
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}

