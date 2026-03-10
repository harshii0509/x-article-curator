/** Client-side article list that fetches from the API using the saved API token. */
"use client";

import { useEffect, useState } from "react";

import { groupByWeek } from "@/lib/week-utils";
import { LinkCard } from "./link-card";
import { WeekGroup } from "./week-group";
import { UsernameDialog } from "./username-dialog";

type Link = {
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
  | { links: Link[]; page: number; limit: number };

export function LinkList() {
  const [state, setState] = useState<{
    status: "loading" | "no-token" | "empty" | "ok" | "error";
    links: Link[];
    error?: string;
  }>({ status: "loading", links: [] });
  const [publicWeeks, setPublicWeeks] = useState<Map<number, boolean>>(
    () => new Map(),
  );
  const [username, setUsername] = useState<string | null>(null);
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const token =
        typeof window !== "undefined"
          ? window.localStorage.getItem("nightstand-api-token")
          : null;

      if (!token) {
        if (!cancelled) {
          setState({ status: "no-token", links: [] });
        }
        return;
      }

      if (typeof window !== "undefined") {
        const storedUsername =
          window.localStorage.getItem("nightstand-api-token:username");
        if (storedUsername) {
          setUsername(storedUsername || null);
        }
      }

      try {
        const [linksRes, weeksRes] = await Promise.all([
          fetch("/api/links", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch("/api/weeks", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const linksData: ApiResponse = await linksRes.json();
        const weeksData: { weeks?: { weekStart: number; isPublic: number }[]; error?: string } =
          await weeksRes.json();

        if (!linksRes.ok || "error" in linksData) {
          if (!cancelled) {
            setState({
              status: "error",
              links: [],
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              error: (linksData as any).error ?? "Failed to load links",
            });
          }
          return;
        }

        if (!linksData.links.length) {
          if (!cancelled) {
            setState({ status: "empty", links: [] });
          }
        } else if (!cancelled) {
          setState({ status: "ok", links: linksData.links });
        }

        if (weeksRes.ok && weeksData.weeks && !cancelled) {
          const map = new Map<number, boolean>();
          for (const row of weeksData.weeks) {
            map.set(row.weekStart, row.isPublic === 1);
          }
          setPublicWeeks(map);
        }
      } catch {
        if (!cancelled) {
          setState({
            status: "error",
            links: [],
            error: "Failed to load links",
          });
        }
      }
    }

    load();
    const intervalId = window.setInterval(load, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
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

  const weeks = groupByWeek(state.links);

  return (
    <>
      <div className="space-y-8">
        {weeks.map((week) => {
          const weekStart = week.key.weekStart;
          const isPublic = publicWeeks.get(weekStart) ?? false;
          return (
            <WeekGroup
              key={weekStart}
              label={week.label}
              weekStart={weekStart}
              isPublic={isPublic}
              username={username}
              onToggle={(next) => {
                setPublicWeeks((prev) => {
                  const map = new Map(prev);
                  map.set(weekStart, next);
                  return map;
                });
              }}
              onUsernameRequired={() => setShowUsernameDialog(true)}
            >
              {week.items.map((link) => (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <LinkCard key={link.id} link={link as any} />
              ))}
            </WeekGroup>
          );
        })}
      </div>
      <UsernameDialog
        open={showUsernameDialog}
        onClose={() => setShowUsernameDialog(false)}
        onSaved={(nextUsername) => {
          setUsername(nextUsername);
          setShowUsernameDialog(false);
        }}
      />
    </>
  );
}

