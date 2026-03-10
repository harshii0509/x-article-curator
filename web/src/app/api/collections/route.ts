import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { collections, collectionLinks, links } from "@/db/schema";
import { resolveAuth } from "@/lib/auth";
import { slugify } from "@/lib/slug";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function withCors<T>(body: T, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...corsHeaders,
    },
  });
}

export async function GET(request: Request) {
  let auth;
  try {
    auth = await resolveAuth(request);
  } catch (error) {
    return withCors(
      { error: (error as Error).message },
      {
        status: 500,
      },
    );
  }

  if (auth.type !== "user") {
    return withCors({ error: "Unauthorized" }, { status: 401 });
  }

  const userCollections = await db
    .select()
    .from(collections)
    .where(eq(collections.userId, auth.user.id))
    .orderBy(desc(collections.createdAt));

  return withCors({ collections: userCollections }, { status: 200 });
}

export async function POST(request: Request) {
  let auth;
  try {
    auth = await resolveAuth(request);
  } catch (error) {
    return withCors(
      { error: (error as Error).message },
      {
        status: 500,
      },
    );
  }

  if (auth.type !== "user") {
    return withCors({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { title?: string; description?: string; linkIds?: number[] } = {};
  try {
    body = (await request.json()) ?? {};
  } catch {
    return withCors({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, description, linkIds } = body;

  if (!title || typeof title !== "string") {
    return withCors({ error: "Missing or invalid `title`" }, { status: 400 });
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

  return withCors({ collection: created }, { status: 201 });
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

