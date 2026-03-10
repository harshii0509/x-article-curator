import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { collections, collectionLinks, links, shares } from "@/db/schema";
import { resolveAuth } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { withCors, optionsResponse } from "@/lib/cors";

function parseId(request: Request): number | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idSegment =
    segments[segments.length - 1] || segments[segments.length - 2];
  const idNum = Number(idSegment);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    return null;
  }
  return idNum;
}

export async function GET(request: Request) {
  const idNum = parseId(request);
  if (!idNum) {
    return withCors({ error: "Invalid collection id" }, { status: 400 }, request);
  }

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

  const [collection] = await db
    .select()
    .from(collections)
    .where(
      and(
        eq(collections.id, idNum),
        eq(collections.userId, auth.user.id),
      ),
    )
    .limit(1);

  if (!collection) {
    return withCors({ error: "Not found" }, { status: 404 }, request);
  }

  const items = await db
    .select({
      collectionLinkId: collectionLinks.id,
      sortOrder: collectionLinks.sortOrder,
      link: links,
    })
    .from(collectionLinks)
    .innerJoin(links, eq(collectionLinks.linkId, links.id))
    .where(eq(collectionLinks.collectionId, collection.id));

  return withCors(
    {
      collection,
      items,
    },
    { status: 200 },
    request,
  );
}

export async function PATCH(request: Request) {
  const idNum = parseId(request);
  if (!idNum) {
    return withCors({ error: "Invalid collection id" }, { status: 400 }, request);
  }

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

  const [existing] = await db
    .select()
    .from(collections)
    .where(
      and(
        eq(collections.id, idNum),
        eq(collections.userId, auth.user.id),
      ),
    )
    .limit(1);

  if (!existing) {
    return withCors({ error: "Not found" }, { status: 404 }, request);
  }

  let body: {
    title?: string;
    description?: string | null;
    isPublic?: boolean;
  } = {};
  try {
    body = (await request.json()) ?? {};
  } catch {
    return withCors({ error: "Invalid JSON body" }, { status: 400 }, request);
  }

  const update: Partial<typeof existing> = {};

  if (typeof body.title === "string" && body.title.trim()) {
    update.title = body.title.trim();
    const baseSlug = slugify(update.title);
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const conflict = await db
        .select()
        .from(collections)
        .where(eq(collections.slug, slug))
        .limit(1);
      if (!conflict.length || conflict[0].id === existing.id) break;
      slug = `${baseSlug}-${counter++}`;
    }
    (update as any).slug = slug;
  }

  if ("description" in body) {
    update.description = body.description ?? null;
  }

  if (typeof body.isPublic === "boolean") {
    (update as any).isPublic = body.isPublic ? 1 : 0;
  }

  if (Object.keys(update).length === 0) {
    return withCors({ collection: existing }, { status: 200 }, request);
  }

  (update as any).updatedAt = Date.now();

  const [updated] = await db
    .update(collections)
    .set(update)
    .where(eq(collections.id, existing.id))
    .returning();

  return withCors({ collection: updated }, { status: 200 }, request);
}

export async function DELETE(request: Request) {
  const idNum = parseId(request);
  if (!idNum) {
    return withCors({ error: "Invalid collection id" }, { status: 400 }, request);
  }

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

  const [existing] = await db
    .select()
    .from(collections)
    .where(
      and(
        eq(collections.id, idNum),
        eq(collections.userId, auth.user.id),
      ),
    )
    .limit(1);

  if (!existing) {
    return withCors({ error: "Not found" }, { status: 404 }, request);
  }

  await db.delete(shares).where(eq(shares.collectionId, idNum));
  await db.delete(collectionLinks).where(eq(collectionLinks.collectionId, idNum));
  await db.delete(collections).where(eq(collections.id, idNum));

  return withCors({ ok: true }, { status: 200 }, request);
}

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}
