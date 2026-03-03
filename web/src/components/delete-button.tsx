"use client";

import { useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  articleId: number;
}

export function DeleteButton({ articleId }: DeleteButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const user = session?.user as any;
  const token = user?.apiToken as string | undefined;

  const handleDelete = async () => {
    if (!token) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/articles/${articleId}`, {
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
      aria-label="Delete article"
      className="rounded-full border border-zinc-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
      disabled={isPending || !token}
    >
      {isPending ? "Removing…" : "Remove"}
    </button>
  );
}

