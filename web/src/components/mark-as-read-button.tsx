"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { safeGet } from "@/lib/storage";

interface MarkAsReadButtonProps {
  linkId: number;
  isRead: boolean;
}

export function MarkAsReadButton({ linkId, isRead }: MarkAsReadButtonProps) {
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const stored = safeGet("nightstand-api-token");
    if (stored) setToken(stored);
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
    ? "border-ns-success/50 text-ns-success-deep hover:bg-ns-success-tint"
    : "border-ns-ink/20 text-ns-ink/60 hover:bg-ns-surface";

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
