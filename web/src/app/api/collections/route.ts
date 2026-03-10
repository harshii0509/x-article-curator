import { NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { collections, collectionLinks, links } from "@/db/schema";
import { resolveAuth } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { withCors, optionsResponse } from "@/lib/cors";

export const runtime = "nodejs";

export async function GET(request: Request) {
  let auth;
  try {
    auth = await resolveAuth(request);
  } catch (error) {
    console.error("Auth resolution failed:", error);
    return withCors(
      { error: "Internal server error" },
      { status: 500 },
      request,
    );
  }

  if (auth.type !== "user") {
    return withCors({ error: "Unauthorized" }, { status: 401 }, request);
  }

  const userCollections = await db
    .select()
    .from(collections)
    .where(eq(collections.userId, auth.user.id))
    .orderBy(desc(collections.createdAt));

  return withCors({ collections: userCollections }, { status: 200 }, request);
}

export async function POST(request: Request) {
  let auth;
  try {
    auth = await resolveAuth(request);
  } catch (error) {
    console.error("Auth resolution failed:", error);
    return withCors(
      { error: "Internal server error" },
      { status: 500 },
      request,
    );
  }

  if (auth.type !== "user") {
    return withCors({ error: "Unauthorized" }, { status: 401 }, request);
  }

  let body: { title?: string; description?: string; linkIds?: number[] } = {};
  try {
    body = (await request.json()) ?? {};
  } catch {
    return withCors({ error: "Invalid JSON body" }, { status: 400 }, request);
  }

  const { title, description, linkIds } = body;

  if (!title || typeof title !== "string") {
    return withCors({ error: "Missing or invalid `title`" }, { status: 400 }, request);
  }

  if (Array.isArray(linkIds) && linkIds.length > 0) {
    const ownedLinks = await db
      .select({ id: links.id })
      .from(links)
      .where(
        and(inArray(links.id, linkIds), eq(links.userId, auth.user.id)),
      );

    const ownedIds = new Set(ownedLinks.map((l) => l.id));
    const unauthorized = linkIds.filter((id) => !ownedIds.has(id));
    if (unauthorized.length > 0) {
      return withCors(
        { error: "One or more linkIds do not belong to you" },
        { status: 403 },
        request,
      );
    }
  }

  const now = Date.now();
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db
      .select()
      .from(collections)
      .where(eq(collections.slug, slug))
      .limit(1);
    if (!existing.length) break;
    slug = `${baseSlug}-${counter++}`;
  }

  const [created] = await db
    .insert(collections)
    .values({
      userId: auth.user.id,
      title,
      description: description ?? null,
      slug,
      isPublic: 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  if (Array.isArray(linkIds) && linkIds.length > 0) {
    const rows = linkIds.map((linkId, index) => ({
      collectionId: created.id,
      linkId,
      sortOrder: index,
      addedAt: now,
    }));
    await db.insert(collectionLinks).values(rows);
  }

  return withCors({ collection: created }, { status: 201 }, request);
}

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}
