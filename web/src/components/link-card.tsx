import type { ComponentPropsWithoutRef } from "react";

import type { InferSelectModel } from "drizzle-orm";

import { links } from "@/db/schema";
import { DeleteButton } from "@/components/delete-button";
import { MarkAsReadButton } from "@/components/mark-as-read-button";

type Link = InferSelectModel<typeof links>;

interface LinkCardProps extends ComponentPropsWithoutRef<"article"> {
  link: Link;
  readonly?: boolean;
}

export function LinkCard({
  link,
  className,
  readonly = false,
  ...props
}: LinkCardProps) {
  const read = Boolean(link.isRead);

  return (
    <article
      className={`flex gap-4 rounded-xl border border-ns-ink/10 bg-ns-surface p-4 shadow-sm shadow-zinc-100 ${
        read ? "opacity-60" : ""
      } ${className ?? ""}`}
      {...props}
    >
      {link.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={link.imageUrl}
          alt={link.title ?? ""}
          loading="lazy"
          className="h-20 w-24 flex-none rounded-md object-cover"
        />
      ) : (
        <div className="flex h-20 w-24 flex-none items-center justify-center rounded-md bg-ns-bg text-xs font-medium uppercase tracking-wide text-ns-ink/50">
          {link.siteName ?? "Link"}
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="text-xs font-medium uppercase tracking-[0.08em] text-ns-ink/50">
            {link.siteName ?? "Saved link"}
          </div>
          {!readonly && link.id != null ? (
            <div className="flex items-center gap-1.5">
              <MarkAsReadButton linkId={link.id} isRead={read} />
              <DeleteButton linkId={link.id} />
            </div>
          ) : null}
        </div>
        <a
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="line-clamp-2 text-sm font-semibold text-ns-ink underline-offset-2 hover:underline"
        >
          {link.title ?? link.url}
        </a>
        {link.description ? (
          <p className="line-clamp-2 text-xs text-ns-ink/60">
            {link.description}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 text-xs text-ns-ink/50">
          {link.author ? <span>{link.author}</span> : null}
          {link.author && link.tweetUrl ? <span>•</span> : null}
          {link.tweetUrl ? (
            <a
              href={link.tweetUrl}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-2 hover:underline"
            >
              View tweet
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

