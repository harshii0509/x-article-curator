import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { links } from "@/db/schema";
import { unfurlUrl } from "@/lib/unfurl";

async function main() {
  const rows = await db
    .select()
    .from(links)
    .where(
      and(
        isNull(links.title),
        isNull(links.description),
        isNull(links.imageUrl),
        isNull(links.siteName),
      ),
    );

  if (!rows.length) {
    console.log("No articles need backfill.");
    return;
  }

  console.log(`Backfilling metadata for ${rows.length} links...\n`);

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
        .update(links)
        .set({
          title: metadata.title ?? row.title,
          description: metadata.description ?? row.description,
          imageUrl: metadata.imageUrl ?? row.imageUrl,
          siteName: metadata.siteName ?? row.siteName,
          author: metadata.author ?? row.author,
        })
        .where(eq(links.id, row.id));

      console.log("   Updated.");
    } catch (error) {
      console.error("   Failed to unfurl:", (error as Error).message);
    }
  }

  console.log("\nBackfill complete.");
}

void main();

