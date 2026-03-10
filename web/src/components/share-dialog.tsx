"use client";

import { useState } from "react";

type ShareDialogProps = {
  open: boolean;
  onClose: () => void;
  resource:
    | { type: "link"; id: number; title: string | null }
    | { type: "collection"; id: number; title: string | null };
};

export function ShareDialog({ open, onClose, resource }: ShareDialogProps) {
  const [toEmail, setToEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status === "submitting") return;

    setStatus("submitting");
    setError(null);

    try {
      const token =
        typeof window !== "undefined"
          ? window.localStorage.getItem("nightstand-api-token")
          : null;

      if (!token) {
        setError("You need to sign in to share.");
        setStatus("error");
        return;
      }

      const body: any = {
        toEmail,
        message: message || undefined,
      };

      if (resource.type === "link") {
        body.linkId = resource.id;
      } else {
        body.collectionId = resource.id;
      }

      const res = await fetch("/api/shares", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error ?? "Failed to share");
        setStatus("error");
        return;
      }

      setStatus("success");
      setTimeout(() => {
        setStatus("idle");
        setToEmail("");
        setMessage("");
        onClose();
      }, 800);
    } catch {
      setError("Failed to share");
      setStatus("error");
    }
  };

  const disabled =
    status === "submitting" || !toEmail.trim() || !toEmail.includes("@");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-zinc-950 px-5 py-4 text-xs text-zinc-200 shadow-lg shadow-black/60">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Share
            </p>
            <p className="mt-1 text-sm text-zinc-100">
              {resource.title ?? "Untitled"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400 hover:bg-zinc-900"
          >
            Close
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="block text-[11px] text-zinc-400">
              Recipient email
            </label>
            <input
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100 outline-none ring-0 placeholder:text-zinc-500 focus:border-zinc-400"
              placeholder="name@example.com"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] text-zinc-400">
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100 outline-none ring-0 placeholder:text-zinc-500 focus:border-zinc-400"
              placeholder="A quick note to send along with this."
            />
          </div>
          {error && (
            <p className="text-[11px] text-red-400">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              disabled={disabled}
              className={`rounded-full px-3 py-1 text-[11px] font-medium text-zinc-900 ${
                disabled
                  ? "bg-zinc-600/60 text-zinc-300"
                  : "bg-[#F4C96B] hover:bg-[#f7d381]"
              }`}
            >
              {status === "submitting"
                ? "Sending…"
                : status === "success"
                  ? "Sent"
                  : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

