import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { collections, publicWeeks, users } from "@/db/schema";

const baseUrl = "https://yournightstand.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
  ];

  const publicWeekRows = await db
    .select({
      username: users.username,
      weekStart: publicWeeks.weekStart,
    })
    .from(publicWeeks)
    .innerJoin(users, eq(publicWeeks.userId, users.id))
    .where(eq(publicWeeks.isPublic, 1));

  const weekRoutes: MetadataRoute.Sitemap = publicWeekRows
    .filter((row) => row.username != null)
    .map((row) => ({
      url: `${baseUrl}/u/${row.username}/week/${row.weekStart}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  const publicCollectionRows = await db
    .select({ slug: collections.slug })
    .from(collections)
    .where(eq(collections.isPublic, 1));

  const collectionRoutes: MetadataRoute.Sitemap = publicCollectionRows.map(
    (row) => ({
      url: `${baseUrl}/c/${row.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }),
  );

  return [...staticRoutes, ...weekRoutes, ...collectionRoutes];
}
