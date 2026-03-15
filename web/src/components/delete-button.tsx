"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { safeGet } from "@/lib/storage";

interface DeleteButtonProps {
  linkId: number;
}

export function DeleteButton({ linkId }: DeleteButtonProps) {
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const stored = safeGet("nightstand-api-token");
    if (stored) setToken(stored);
  }, []);

  const handleDelete = async () => {
    if (!token) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/links/${linkId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          // Silently ignore for now; could surface a toast later.
          return;
        }

        router.refresh();
      } catch {
        // ignore
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      aria-label="Delete link"
      className="rounded-full border border-ns-ink/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ns-ink/60 hover:bg-ns-surface"
      disabled={isPending || !token}
    >
      {isPending ? "Removing…" : "Remove"}
    </button>
  );
}

