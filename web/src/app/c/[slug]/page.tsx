import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { db } from "@/db";
import { collections, collectionLinks, links } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { LinkCard } from "@/components/link-card";
import { PublicCollectionJsonLd, SITE_URL } from "@/components/json-ld";

type Params = {
  slug: string;
};

export async function generateMetadata(
  props: { params: Params } | { params: Promise<Params> },
): Promise<Metadata> {
  const resolved =
    "then" in (props as { params: Params | Promise<Params> }).params
      ? await (props as { params: Promise<Params> }).params
      : (props as { params: Params }).params;

  const [collection] = await db
    .select()
    .from(collections)
    .where(eq(collections.slug, resolved.slug))
    .limit(1);

  if (!collection || collection.isPublic !== 1) {
    return {};
  }

  const [row] = await db
    .select({ value: count() })
    .from(collectionLinks)
    .where(eq(collectionLinks.collectionId, collection.id));
  const linkCount = row?.value ?? 0;

  const title = `${collection.title} - Nightstand Collection`;
  const description =
    collection.description ?? `${linkCount} link${linkCount === 1 ? "" : "s"} shared on Nightstand`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PublicCollectionPage({ params }: { params: Params }) {
  const [collection] = await db
    .select()
    .from(collections)
    .where(eq(collections.slug, params.slug))
    .limit(1);

  if (!collection || collection.isPublic !== 1) {
    notFound();
  }

  const items = await db
    .select({
      link: links,
    })
    .from(collectionLinks)
    .innerJoin(links, eq(collectionLinks.linkId, links.id))
    .where(eq(collectionLinks.collectionId, collection.id));

  const linksOnly = items.map((item) => item.link);
  const pageUrl = `${SITE_URL}/c/${params.slug}`;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
      <PublicCollectionJsonLd
        title={collection.title}
        description={collection.description}
        linkCount={linksOnly.length}
        pageUrl={pageUrl}
      />
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          Public collection
        </p>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {collection.title}
        </h1>
        {collection.description ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {collection.description}
          </p>
        ) : null}
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {linksOnly.length} link{linksOnly.length === 1 ? "" : "s"}
        </p>
      </header>
      <div className="space-y-4">
        {linksOnly.map((link) => (
          <LinkCard key={link.id} link={link as any} />
        ))}
      </div>
    </main>
  );
}

