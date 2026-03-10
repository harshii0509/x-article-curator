"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { CollectionCard } from "@/components/collection-card";

type Collection = {
  id: number;
  title: string;
  description: string | null;
  slug: string;
  isPublic: number;
};

type ApiResponse =
  | { error: string }
  | { collections: Collection[] };

export default function CollectionsPage() {
  const [state, setState] = useState<{
    status: "loading" | "empty" | "ok" | "error";
    collections: Collection[];
    error?: string;
  }>({ status: "loading", collections: [] });

  useEffect(() => {
    async function load() {
      try {
        const token =
          typeof window !== "undefined"
            ? window.localStorage.getItem("nightstand-api-token")
            : null;

        if (!token) {
          setState({ status: "empty", collections: [] });
          return;
        }

        const res = await fetch("/api/collections", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data: ApiResponse = await res.json();

        if (!res.ok || "error" in data) {
          setState({
            status: "error",
            collections: [],
            error: (data as any).error ?? "Failed to load collections",
          });
          return;
        }

        if (!data.collections.length) {
          setState({ status: "empty", collections: [] });
          return;
        }

        setState({ status: "ok", collections: data.collections });
      } catch {
        setState({
          status: "error",
          collections: [],
          error: "Failed to load collections",
        });
      }
    }

    load();
  }, []);

  if (state.status === "loading") {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading your collections…
        </p>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
        <p className="text-sm text-red-600 dark:text-red-300">
          {state.error ?? "Something went wrong loading your collections."}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
      <header>
        <h1 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
          Collections
        </h1>
      </header>
      {state.status === "empty" ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
          No collections yet. You&apos;ll be able to group links into themed
          collections here.
        </div>
      ) : (
        <div className="grid gap-4">
          {state.collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}`}
              className="block"
            >
              <CollectionCard collection={collection as any} />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

