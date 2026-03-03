import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { articles } from "@/db/schema";
import { unfurlUrl } from "@/lib/unfurl";

async function main() {
  const rows = await db
    .select()
    .from(articles)
    .where(
      and(
        isNull(articles.title),
        isNull(articles.description),
        isNull(articles.imageUrl),
        isNull(articles.siteName),
      ),
    );

  if (!rows.length) {
    console.log("No articles need backfill.");
    return;
  }

  console.log(`Backfilling metadata for ${rows.length} articles...\n`);

  for (const row of rows) {
    console.log(`→ ${row.id}: ${row.url}`);

    try {
      const metadata = await unfurlUrl(row.url);

      if (
        !metadata.title &&
        !metadata.description &&
        !metadata.imageUrl &&
        !metadata.siteName &&
        !metadata.author
      ) {
        console.log("   No metadata found, skipping.");
        continue;
      }

      await db
        .update(articles)
        .set({
          title: metadata.title ?? row.title,
          description: metadata.description ?? row.description,
          imageUrl: metadata.imageUrl ?? row.imageUrl,
          siteName: metadata.siteName ?? row.siteName,
          author: metadata.author ?? row.author,
        })
        .where(eq(articles.id, row.id));

      console.log("   Updated.");
    } catch (error) {
      console.error("   Failed to unfurl:", (error as Error).message);
    }
  }

  console.log("\nBackfill complete.");
}

void main();

