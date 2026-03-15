/** Client-side article list that fetches from the API using the saved API token. */
"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";

import { groupByWeek } from "@/lib/week-utils";
import { safeGet } from "@/lib/storage";
import { LinkCard } from "./link-card";
import { WeekGroup } from "./week-group";
import { UsernameDialog } from "./username-dialog";

const TOKEN_KEY = "nightstand-api-token";
const USERNAME_KEY = "nightstand-api-token:username";
const REFRESH_INTERVAL_MS = 10_000;

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

type WeeksResponse = {
  weeks?: { weekStart: number; isPublic: number }[];
  error?: string;
};

function useStoredToken(): string | null | undefined {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    setToken(safeGet(TOKEN_KEY));
  }, []);
  return token;
}

function fetcherWithAuth(url: string, token: string) {
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => res.json());
}

export function LinkList() {
  const token = useStoredToken();
  const [username, setUsername] = useState<string | null>(null);
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [publicWeeks, setPublicWeeks] = useState<Map<number, boolean>>(
    () => new Map(),
  );

  useEffect(() => {
    if (token) {
      const stored = safeGet(USERNAME_KEY);
      if (stored) setUsername(stored || null);
    }
  }, [token]);

  const {
    data: linksData,
    error: linksError,
    isLoading: linksLoading,
  } = useSWR<ApiResponse>(
    token ? ["/api/links", token] : null,
    ([url, t]) => fetcherWithAuth(url, t as string),
    { refreshInterval: REFRESH_INTERVAL_MS },
  );

  const { data: weeksData } = useSWR<WeeksResponse>(
    token ? ["/api/weeks", token] : null,
    ([url, t]) => fetcherWithAuth(url, t as string),
    { refreshInterval: REFRESH_INTERVAL_MS },
  );

  useEffect(() => {
    if (!weeksData?.weeks) return;
    setPublicWeeks((prev) => {
      const next = new Map(prev);
      for (const row of weeksData.weeks!) {
        next.set(row.weekStart, row.isPublic === 1);
      }
      return next;
    });
  }, [weeksData]);

  if (token === undefined) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
        Loading your saved articles…
      </div>
    );
  }

  if (token === null) {
    return null;
  }

  if (linksLoading && !linksData) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
        Loading your saved articles…
      </div>
    );
  }

  if (linksError || !linksData || "error" in linksData) {
    const message =
      linksData && "error" in linksData
        ? (linksData as ApiResponse & { error: string }).error
        : "Failed to load links";
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-50 px-4 py-8 text-center text-sm text-red-700 dark:border-red-500/60 dark:bg-red-950/40 dark:text-red-200">
        {message}
      </div>
    );
  }

  const links = linksData.links;
  if (!links.length) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
        No articles saved yet.
        <br />
        Use the browser extension to send links here.
      </div>
    );
  }

  const weeks = groupByWeek(links);

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
                <LinkCard key={link.id} link={link as Parameters<typeof LinkCard>[0]["link"]} />
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
