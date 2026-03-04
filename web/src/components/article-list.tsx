/** Client-side article list that fetches from the API using the saved API token. */
"use client";

import { useEffect, useState } from "react";

import { groupByWeek } from "@/lib/week-utils";
import { ArticleCard } from "./article-card";
import { WeekGroup } from "./week-group";

type Article = {
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

type ApiResponse =
  | { error: string }
  | { articles: Article[]; page: number; limit: number };

export function ArticleList() {
  const [state, setState] = useState<{
    status: "loading" | "no-token" | "empty" | "ok" | "error";
    articles: Article[];
    error?: string;
  }>({ status: "loading", articles: [] });

  useEffect(() => {
    async function load() {
      const token =
        typeof window !== "undefined"
          ? window.localStorage.getItem("nightstand-api-token")
          : null;

      if (!token) {
        setState({ status: "no-token", articles: [] });
        return;
      }

      try {
        const res = await fetch("/api/articles", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data: ApiResponse = await res.json();

        if (!res.ok || "error" in data) {
          setState({
            status: "error",
            articles: [],
            error: (data as any).error ?? "Failed to load articles",
          });
          return;
        }

        if (!data.articles.length) {
          setState({ status: "empty", articles: [] });
          return;
        }

        setState({ status: "ok", articles: data.articles });
      } catch {
        setState({
          status: "error",
          articles: [],
          error: "Failed to load articles",
        });
      }
    }

    load();
  }, []);

  if (state.status === "loading") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
        Loading your saved articles…
      </div>
    );
  }

  if (state.status === "no-token") {
    return null;
  }

  if (state.status === "empty") {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
        No articles saved yet.
        <br />
        Use the browser extension to send links here.
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-50 px-4 py-8 text-center text-sm text-red-700 dark:border-red-500/60 dark:bg-red-950/40 dark:text-red-200">
        {state.error ?? "Something went wrong loading your articles."}
      </div>
    );
  }

  const weeks = groupByWeek(state.articles);

  return (
    <div className="space-y-8">
      {weeks.map((week) => (
        <WeekGroup key={week.key.weekStart} label={week.label}>
          {week.items.map((article) => (
            <ArticleCard key={article.id} article={article as any} />
          ))}
        </WeekGroup>
      ))}
    </div>
  );
}

