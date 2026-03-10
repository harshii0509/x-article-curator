import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { collections, collectionLinks, links } from "@/db/schema";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
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
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  // URL shape: /api/collections/[id]/public → id is the penultimate segment.
  const idSegment = segments[segments.length - 2];
  const idNum = Number(idSegment);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    return withCors({ error: "Invalid collection id" }, { status: 400 });
  }

  const [collection] = await db
    .select()
    .from(collections)
    .where(and(eq(collections.id, idNum), eq(collections.isPublic, 1)))
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

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

