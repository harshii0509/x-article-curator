import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { collectionLinks, collections, links } from "@/db/schema";
import { resolveAuth } from "@/lib/auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,DELETE,OPTIONS",
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
  const idIndex = segments.indexOf("collections") + 1;
  const idSegment = segments[idIndex];
  const idNum = Number(idSegment);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    return null;
  }
  return idNum;
}

export async function POST(request: Request) {
  const collectionId = parseId(request);
  if (!collectionId) {
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
        eq(collections.id, collectionId),
        eq(collections.userId, auth.user.id),
      ),
    )
    .limit(1);

  if (!collection) {
    return withCors({ error: "Not found" }, { status: 404 });
  }

  let body: { linkId?: number } = {};
  try {
    body = (await request.json()) ?? {};
  } catch {
    return withCors({ error: "Invalid JSON body" }, { status: 400 });
  }

  const linkId = body.linkId;
  if (!linkId || !Number.isInteger(linkId)) {
    return withCors({ error: "Missing or invalid `linkId`" }, { status: 400 });
  }

  const [link] = await db
    .select()
    .from(links)
    .where(eq(links.id, linkId))
    .limit(1);

  if (!link || link.userId !== auth.user.id) {
    return withCors({ error: "Link not found" }, { status: 404 });
  }

  const existing = await db
    .select()
    .from(collectionLinks)
    .where(
      and(
        eq(collectionLinks.collectionId, collectionId),
        eq(collectionLinks.linkId, linkId),
      ),
    )
    .limit(1);

  if (existing.length) {
    return withCors({ ok: true }, { status: 200 });
  }

  const now = Date.now();
  await db.insert(collectionLinks).values({
    collectionId,
    linkId,
    sortOrder: now,
    addedAt: now,
  });

  return withCors({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const collectionId = parseId(request);
  if (!collectionId) {
    return withCors({ error: "Invalid collection id" }, { status: 400 });
  }

  const url = new URL(request.url);
  const linkIdParam = url.searchParams.get("linkId");
  const linkId = linkIdParam ? Number(linkIdParam) : NaN;
  if (!Number.isInteger(linkId) || linkId <= 0) {
    return withCors({ error: "Invalid linkId" }, { status: 400 });
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
        eq(collections.id, collectionId),
        eq(collections.userId, auth.user.id),
      ),
    )
    .limit(1);

  if (!collection) {
    return withCors({ error: "Not found" }, { status: 404 });
  }

  await db
    .delete(collectionLinks)
    .where(
      and(
        eq(collectionLinks.collectionId, collectionId),
        eq(collectionLinks.linkId, linkId),
      ),
    );

  return withCors({ ok: true }, { status: 200 });
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

