"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface MarkAsReadButtonProps {
  linkId: number;
  isRead: boolean;
}

export function MarkAsReadButton({ linkId, isRead }: MarkAsReadButtonProps) {
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("nightstand-api-token");
      if (stored) {
        setToken(stored);
      }
    }
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!token) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/links/${linkId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) return;

        router.refresh();
      } catch {
        // ignore
      }
    });
  };

  const readClasses = isRead
    ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
    : "border-zinc-200 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800";

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isRead ? "Mark as unread" : "Mark as read"}
      className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${readClasses}`}
      disabled={isPending || !token}
    >
      {isPending ? "Updating…" : isRead ? "Read ✓" : "Read"}
    </button>
  );
}
