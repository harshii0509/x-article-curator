import type { ComponentPropsWithoutRef } from "react";

import type { InferSelectModel } from "drizzle-orm";

import { collections } from "@/db/schema";

type Collection = InferSelectModel<typeof collections>;

interface CollectionCardProps extends ComponentPropsWithoutRef<"article"> {
  collection: Collection;
}

export function CollectionCard({
  collection,
  className,
  ...props
}: CollectionCardProps) {
  const linkLabel = collection.isPublic ? "Public collection" : "Private collection";

  return (
    <article
      className={`flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm shadow-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/60 ${
        className ?? ""
      }`}
      {...props}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {collection.title}
        </h2>
        <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          {linkLabel}
        </span>
      </div>
      {collection.description ? (
        <p className="line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">
          {collection.description}
        </p>
      ) : null}
    </article>
  );
}

