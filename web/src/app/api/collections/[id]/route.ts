import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { collections, collectionLinks, links, shares } from "@/db/schema";
import { resolveAuth } from "@/lib/auth";
import { slugify } from "@/lib/slug";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,PATCH,DELETE,OPTIONS",
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
    return withCors({ error: "Invalid collection id" }, { status: 400 });
  }

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
    return withCors({ error: "Not found" }, { status: 404 });
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
  );
}

export async function PATCH(request: Request) {
  const idNum = parseId(request);
  if (!idNum) {
    return withCors({ error: "Invalid collection id" }, { status: 400 });
  }

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
    return withCors({ error: "Not found" }, { status: 404 });
  }

  let body: {
    title?: string;
    description?: string | null;
    isPublic?: boolean;
  } = {};
  try {
    body = (await request.json()) ?? {};
  } catch {
    return withCors({ error: "Invalid JSON body" }, { status: 400 });
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
    return withCors({ collection: existing }, { status: 200 });
  }

  (update as any).updatedAt = Date.now();

  const [updated] = await db
    .update(collections)
    .set(update)
    .where(eq(collections.id, existing.id))
    .returning();

  return withCors({ collection: updated }, { status: 200 });
}

export async function DELETE(request: Request) {
  const idNum = parseId(request);
  if (!idNum) {
    return withCors({ error: "Invalid collection id" }, { status: 400 });
  }

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
    return withCors({ error: "Not found" }, { status: 404 });
  }

  await db.delete(shares).where(eq(shares.collectionId, idNum));
  await db.delete(collectionLinks).where(eq(collectionLinks.collectionId, idNum));
  await db.delete(collections).where(eq(collections.id, idNum));

  return withCors({ ok: true }, { status: 200 });
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

