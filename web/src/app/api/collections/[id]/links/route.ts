import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { collectionLinks, collections, links } from "@/db/schema";
import { resolveAuth } from "@/lib/auth";
import { withCors, optionsResponse } from "@/lib/cors";

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
        eq(collections.id, collectionId),
        eq(collections.userId, auth.user.id),
      ),
    )
    .limit(1);

  if (!collection) {
    return withCors({ error: "Not found" }, { status: 404 }, request);
  }

  let body: { linkId?: number } = {};
  try {
    body = (await request.json()) ?? {};
  } catch {
    return withCors({ error: "Invalid JSON body" }, { status: 400 }, request);
  }

  const linkId = body.linkId;
  if (!linkId || !Number.isInteger(linkId)) {
    return withCors({ error: "Missing or invalid `linkId`" }, { status: 400 }, request);
  }

  const [link] = await db
    .select()
    .from(links)
    .where(eq(links.id, linkId))
    .limit(1);

  if (!link || link.userId !== auth.user.id) {
    return withCors({ error: "Link not found" }, { status: 404 }, request);
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
    return withCors({ ok: true }, { status: 200 }, request);
  }

  const now = Date.now();
  await db.insert(collectionLinks).values({
    collectionId,
    linkId,
    sortOrder: now,
    addedAt: now,
  });

  return withCors({ ok: true }, { status: 201 }, request);
}

export async function DELETE(request: Request) {
  const collectionId = parseId(request);
  if (!collectionId) {
    return withCors({ error: "Invalid collection id" }, { status: 400 }, request);
  }

  const url = new URL(request.url);
  const linkIdParam = url.searchParams.get("linkId");
  const linkId = linkIdParam ? Number(linkIdParam) : NaN;
  if (!Number.isInteger(linkId) || linkId <= 0) {
    return withCors({ error: "Invalid linkId" }, { status: 400 }, request);
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
        eq(collections.id, collectionId),
        eq(collections.userId, auth.user.id),
      ),
    )
    .limit(1);

  if (!collection) {
    return withCors({ error: "Not found" }, { status: 404 }, request);
  }

  await db
    .delete(collectionLinks)
    .where(
      and(
        eq(collectionLinks.collectionId, collectionId),
        eq(collectionLinks.linkId, linkId),
      ),
    );

  return withCors({ ok: true }, { status: 200 }, request);
}

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}
