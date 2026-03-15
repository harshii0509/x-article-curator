"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { LinkCard } from "@/components/link-card";
import { CollectionCard } from "@/components/collection-card";
import { safeGet } from "@/lib/storage";

type Share = {
  id: number;
  message: string | null;
  seen: number;
  createdAt: number;
};

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
  slug: string;
  isPublic: number;
};

type FromUser = {
  id: number;
  email: string;
  name: string | null;
};

type ApiItem = {
  share: Share;
  fromUser: FromUser | null;
  link: LinkItem | null;
  collection: Collection | null;
};

type ApiResponse =
  | { error: string }
  | { items: ApiItem[] };

export default function SharedPage() {
  const [state, setState] = useState<{
    status: "loading" | "empty" | "ok" | "error";
    items: ApiItem[];
    error?: string;
  }>({ status: "loading", items: [] });

  useEffect(() => {
    async function load() {
      try {
        const token = safeGet("nightstand-api-token");

        if (!token) {
          setState({
            status: "error",
            items: [],
            error: "You need to sign in to view shares.",
          });
          return;
        }

        const res = await fetch("/api/shares", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data: ApiResponse = await res.json();

        if (!res.ok || "error" in data) {
          setState({
            status: "error",
            items: [],
            error: (data as any).error ?? "Failed to load shared items",
          });
          return;
        }

        if (!data.items.length) {
          setState({ status: "empty", items: [] });
          return;
        }

        setState({ status: "ok", items: data.items });
      } catch {
        setState({
          status: "error",
          items: [],
          error: "Failed to load shared items",
        });
      }
    }

    load();
  }, []);

  if (state.status === "loading") {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
        <p className="text-sm text-ns-ink/50">
          Loading items shared with you…
        </p>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
        <p className="text-sm text-ns-error">
          {state.error ?? "Something went wrong loading shared items."}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
      <header>
        <h1 className="text-sm font-semibold uppercase tracking-[0.14em] text-ns-ink/50">
          Shared with you
        </h1>
      </header>
      {state.status === "empty" ? (
        <div className="rounded-xl border border-dashed border-ns-ink/20 bg-ns-surface px-4 py-8 text-center text-sm text-ns-ink/60">
          Nothing has been shared with you yet.
        </div>
      ) : (
        <div className="space-y-6">
          {state.items.map((item) => (
            <div
              key={item.share.id}
              className="space-y-2 rounded-xl border border-ns-ink/10 bg-ns-surface p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ns-ink/50">
                    Shared by {item.fromUser?.name ?? item.fromUser?.email ?? "Someone"}
                  </p>
                  {item.share.message && (
                    <p className="text-xs text-ns-ink/60">
                      {item.share.message}
                    </p>
                  )}
                </div>
              </div>
              {item.link ? (
                <LinkCard link={item.link as any} />
              ) : item.collection ? (
                <Link href={`/c/${item.collection.slug}`} className="block">
                  <CollectionCard collection={item.collection as any} />
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

