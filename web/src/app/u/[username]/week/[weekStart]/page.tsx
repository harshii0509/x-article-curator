import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { and, eq, gte, lte } from "drizzle-orm";

import { db } from "@/db";
import { links, publicWeeks, users } from "@/db/schema";
import { LinkCard } from "@/components/link-card";
import { formatWeekLabel } from "@/lib/week-utils";

type Params = {
  username: string;
  weekStart: string;
};

async function getData(params: Params) {
  const weekStartMs = Number(params.weekStart);
  if (!Number.isFinite(weekStartMs)) {
    return null;
  }

  const [row] = await db
    .select({
      user: users,
      week: publicWeeks,
    })
    .from(publicWeeks)
    .innerJoin(users, eq(publicWeeks.userId, users.id))
    .where(
      and(
        eq(users.username, params.username),
        eq(publicWeeks.weekStart, weekStartMs),
        eq(publicWeeks.isPublic, 1),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  const user = row.user;

  const start = new Date(weekStartMs);
  const end = new Date(weekStartMs);
  end.setDate(start.getDate() + 6);

  const items = await db
    .select()
    .from(links)
    .where(
      and(
        eq(links.userId, user.id),
        gte(links.savedAt, start.getTime()),
        lte(links.savedAt, end.getTime()),
      ),
    );

  return {
    user,
    weekStartMs,
    links: items,
  };
}

export async function generateMetadata(
  props: { params: Params } | { params: Promise<Params> },
): Promise<Metadata> {
  const resolved =
    "then" in (props as any).params
      ? await (props as { params: Promise<Params> }).params
      : (props as { params: Params }).params;
  const data = await getData(resolved);

  if (!data) {
    return {};
  }

  const weekLabel = formatWeekLabel(data.weekStartMs);
  const count = data.links.length;
  const name = data.user.name ?? data.user.username ?? "Someone";

  const title = `${name}'s Reading — ${weekLabel}`;
  const description = `${count} article${count === 1 ? "" : "s"} saved this week on Nightstand`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      title,
      description,
      card: "summary_large_image",
    },
  };
}

export default async function PublicWeekPage(
  props: { params: Params } | { params: Promise<Params> },
) {
  const resolved =
    "then" in (props as any).params
      ? await (props as { params: Promise<Params> }).params
      : (props as { params: Params }).params;
  const data = await getData(resolved);

  if (!data) {
    notFound();
  }

  const weekLabel = formatWeekLabel(data!.weekStartMs);
  const count = data!.links.length;
  const name = data!.user.name ?? data!.user.username ?? "Someone";

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          Weekly reading
        </p>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {name}&apos;s reading — {weekLabel}
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {count} article{count === 1 ? "" : "s"} saved this week on Nightstand
        </p>
      </header>
      <div className="space-y-4">
        {data!.links.map((link) => (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <LinkCard key={link.id} link={link as any} readonly />
        ))}
      </div>
    </main>
  );
}

