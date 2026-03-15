"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { LinkCard } from "@/components/link-card";
import { safeGet } from "@/lib/storage";

type LinkItem = {
  id: number;
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
  author: string | null;
  tweetUrl: string | null;
  savedAt: number;
  isRead: number | null;
};

type Collection = {
  id: number;
  title: string;
  description: string | null;
  isPublic: number;
};

type ApiResponse =
  | { error: string }
  | {
      collection: Collection;
      items: { link: LinkItem }[];
    };

export default function CollectionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [state, setState] = useState<{
    status: "loading" | "ok" | "error";
    collection: Collection | null;
    links: LinkItem[];
    error?: string;
  }>({ status: "loading", collection: null, links: [] });

  useEffect(() => {
    async function load() {
      try {
        const token = safeGet("nightstand-api-token");

        if (!token) {
          setState({
            status: "error",
            collection: null,
            links: [],
            error: "You need to sign in to view this collection.",
          });
          return;
        }

        const res = await fetch(`/api/collections/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data: ApiResponse = await res.json();

        if (!res.ok || "error" in data) {
          setState({
            status: "error",
            collection: null,
            links: [],
            error: (data as any).error ?? "Failed to load collection",
          });
          return;
        }

        setState({
          status: "ok",
          collection: data.collection,
          links: data.items.map((item) => item.link),
        });
      } catch {
        setState({
          status: "error",
          collection: null,
          links: [],
          error: "Failed to load collection",
        });
      }
    }

    load();
  }, [params.id]);

  if (state.status === "loading") {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
        <p className="text-sm text-ns-ink/50">
          Loading collection…
        </p>
      </main>
    );
  }

  if (state.status === "error" || !state.collection) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
        <p className="text-sm text-ns-error">
          {state.error ?? "Collection not found."}
        </p>
        <Link
          href="/collections"
          className="text-xs text-ns-ink/50 underline-offset-2 hover:underline"
        >
          Back to collections
        </Link>
      </main>
    );
  }

  const { collection, links } = state;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ns-ink/50">
          Collection
        </p>
        <h1 className="text-lg font-semibold text-ns-ink">
          {collection.title}
        </h1>
        {collection.description ? (
          <p className="text-sm text-ns-ink/60">
            {collection.description}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-3 text-xs text-ns-ink/50">
          <span>
            {links.length} link{links.length === 1 ? "" : "s"}
          </span>
          <Link
            href="/collections"
            className="underline-offset-2 hover:underline"
          >
            Back to collections
          </Link>
        </div>
      </header>
      <div className="space-y-4">
        {links.map((link) => (
          <LinkCard key={link.id} link={link as any} />
        ))}
      </div>
    </main>
  );
}

