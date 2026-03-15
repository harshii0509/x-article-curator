"use client";

import { useEffect, useState } from "react";
import { safeGet, safeSet } from "@/lib/storage";

const TOKEN_KEY = "nightstand-api-token";
const USERNAME_KEY = `${TOKEN_KEY}:username`;

type UsernameDialogProps = {
  open: boolean;
  onClose: () => void;
  onSaved: (username: string) => void;
};

type AvailabilityState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available" }
  | { status: "unavailable" }
  | { status: "invalid" };

const USERNAME_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

export function UsernameDialog({ open, onClose, onSaved }: UsernameDialogProps) {
  const [username, setUsername] = useState("");
  const [availability, setAvailability] = useState<AvailabilityState>({
    status: "idle",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSaving(false);
    const existing = safeGet(USERNAME_KEY);
    if (existing && !username) {
      setUsername(existing);
      setAvailability({ status: "idle" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const value = username.trim();
    if (!value) {
      setAvailability({ status: "idle" });
      return;
    }
    if (!USERNAME_REGEX.test(value)) {
      setAvailability({ status: "invalid" });
      return;
    }

    setAvailability({ status: "checking" });
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/user/username?check=${encodeURIComponent(value)}`, {
          method: "GET",
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) {
          setAvailability({ status: "invalid" });
          return;
        }
        if (data.available) {
          setAvailability({ status: "available" });
        } else {
          setAvailability({ status: "unavailable" });
        }
      } catch {
        if (!controller.signal.aborted) {
          setAvailability({ status: "invalid" });
        }
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [username, open]);

  if (!open) return null;

  const canSave =
    !saving && availability.status === "available" && username.trim().length > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;

    setSaving(true);
    setError(null);

    try {
      const token = safeGet(TOKEN_KEY);

      if (!token) {
        setError("You need to sign in to set a username.");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/user/username", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Failed to save username");
        setSaving(false);
        return;
      }

      safeSet(USERNAME_KEY, data.username ?? "");

      onSaved(data.username);
      setSaving(false);
      onClose();
    } catch {
      setError("Failed to save username");
      setSaving(false);
    }
  };

  let helperText: string | null = null;
  if (availability.status === "invalid" && username.trim()) {
    helperText =
      "Usernames must be 3-30 characters, lowercase letters, numbers, and dashes — cannot start or end with a dash.";
  } else if (availability.status === "unavailable") {
    helperText = "That username is taken. Try another.";
  } else if (availability.status === "available") {
    helperText = "Nice — this username is available.";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-sm rounded-xl border border-ns-ink/10 bg-ns-bg px-5 py-4 text-xs text-ns-ink shadow-lg shadow-black/20">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ns-ink/50">
              Choose a public username
            </p>
            <p className="mt-1 text-sm text-ns-ink">
              This is how your weekly reading page will be shared.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-ns-ink/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-ns-ink/50 hover:bg-ns-surface"
          >
            Close
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="block text-[11px] text-ns-ink/50">
              Username
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-ns-ink/50">nightstand.com/u/</span>
              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().trimStart())
                }
                className="w-full rounded-md border border-ns-ink/20 bg-ns-surface px-2 py-1.5 text-xs text-ns-ink outline-none ring-0 placeholder:text-ns-ink/50 focus:border-ns-ink/40"
                placeholder="your-name"
                autoFocus
              />
            </div>
            {helperText && (
              <p
                className={`mt-1 text-[11px] ${
                  availability.status === "available"
                    ? "text-ns-success-deep"
                    : "text-ns-error"
                }`}
              >
                {helperText}
              </p>
            )}
          </div>
          {error && (
            <p className="text-[11px] text-ns-error">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              disabled={!canSave}
              className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                !canSave
                  ? "bg-ns-ink/20 text-ns-ink/50"
                  : "bg-ns-accent text-ns-accent-fg hover:opacity-90"
              }`}
            >
              {saving
                ? "Saving…"
                : availability.status === "available"
                  ? "Save username"
                  : "Check availability"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

