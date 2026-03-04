import type { ComponentPropsWithoutRef } from "react";

import type { InferSelectModel } from "drizzle-orm";

import { articles } from "@/db/schema";
import { DeleteButton } from "@/components/delete-button";

type Article = InferSelectModel<typeof articles>;

interface ArticleCardProps extends ComponentPropsWithoutRef<"article"> {
  article: Article;
}

export function ArticleCard({ article, className, ...props }: ArticleCardProps) {
  const read = Boolean(article.isRead);

  return (
    <article
      className={`flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm shadow-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/60 ${
        read ? "opacity-60" : ""
      } ${className ?? ""}`}
      {...props}
    >
      {article.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.imageUrl}
          alt={article.title ?? ""}
          loading="lazy"
          className="h-20 w-24 flex-none rounded-md object-cover"
        />
      ) : (
        <div className="flex h-20 w-24 flex-none items-center justify-center rounded-md bg-zinc-100 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          {article.siteName ?? "Link"}
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400">
            {article.siteName ?? "Saved link"}
          </div>
          {article.id != null ? <DeleteButton articleId={article.id} /> : null}
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="line-clamp-2 text-sm font-semibold text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-50"
        >
          {article.title ?? article.url}
        </a>
        {article.description ? (
          <p className="line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">
            {article.description}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          {article.author ? <span>{article.author}</span> : null}
          {article.author && article.tweetUrl ? <span>•</span> : null}
          {article.tweetUrl ? (
            <a
              href={article.tweetUrl}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-2 hover:underline"
            >
              View tweet
            </a>
          ) : null}
          {read ? <span>• Read</span> : null}
        </div>
      </div>
    </article>
  );
}

