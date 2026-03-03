import { desc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";

import { db } from "@/db";
import { articles } from "@/db/schema";
import { groupByWeek } from "@/lib/week-utils";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import { ArticleCard } from "./article-card";
import { WeekGroup } from "./week-group";

export async function ArticleList() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as number | undefined;

  if (!userId) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
        No articles saved yet.
        <br />
        Use the browser extension on X / Twitter to send links here.
      </div>
    );
  }

  const allArticles = await db
    .select()
    .from(articles)
    .where(eq(articles.userId, userId))
    .orderBy(desc(articles.savedAt));

  if (!allArticles.length) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
        No articles saved yet.
        <br />
        Use the browser extension on X / Twitter to send links here.
      </div>
    );
  }

  const weeks = groupByWeek(allArticles);

  return (
    <div className="space-y-8">
      {weeks.map((week) => (
        <WeekGroup key={week.key.weekStart} label={week.label}>
          {week.items.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </WeekGroup>
      ))}
    </div>
  );
}

