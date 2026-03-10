import { NextResponse } from "next/server";
import { and, desc, eq, or } from "drizzle-orm";

import { db } from "@/db";
import { links, shares, collections, users } from "@/db/schema";
import { resolveAuth } from "@/lib/auth";

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

  const user = auth.user;

  const sharedWithMe = await db
    .select({
      share: shares,
      fromUser: users,
      link: links,
      collection: collections,
    })
    .from(shares)
    .leftJoin(users, eq(shares.fromUserId, users.id))
    .leftJoin(links, eq(shares.linkId, links.id))
    .leftJoin(collections, eq(shares.collectionId, collections.id))
    .where(
      or(
        eq(shares.toUserId, user.id),
        eq(shares.toEmail, user.email),
      ),
    )
    .orderBy(desc(shares.createdAt));

  return withCors({ items: sharedWithMe }, { status: 200 });
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

  let body: {
    toEmail?: string;
    linkId?: number;
    collectionId?: number;
    message?: string;
  } = {};

  try {
    body = (await request.json()) ?? {};
  } catch {
    return withCors({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { toEmail, linkId, collectionId, message } = body;

  if (!toEmail || typeof toEmail !== "string") {
    return withCors({ error: "Missing or invalid `toEmail`" }, { status: 400 });
  }

  const normalizedEmail = toEmail.toLowerCase().trim();

  if (!linkId && !collectionId) {
    return withCors(
      { error: "Either `linkId` or `collectionId` is required" },
      { status: 400 },
    );
  }

  if (linkId && collectionId) {
    return withCors(
      { error: "Only one of `linkId` or `collectionId` may be set" },
      { status: 400 },
    );
  }

  // Ensure the resource belongs to the sender.
  if (linkId) {
    const [link] = await db
      .select()
      .from(links)
      .where(and(eq(links.id, linkId), eq(links.userId, auth.user.id)))
      .limit(1);

    if (!link) {
      return withCors({ error: "Link not found" }, { status: 404 });
    }
  }

  if (collectionId) {
    const [collection] = await db
      .select()
      .from(collections)
      .where(
        and(eq(collections.id, collectionId), eq(collections.userId, auth.user.id)),
      )
      .limit(1);

    if (!collection) {
      return withCors({ error: "Collection not found" }, { status: 404 });
    }
  }

  const [recipientUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  const now = Date.now();

  const [created] = await db
    .insert(shares)
    .values({
      fromUserId: auth.user.id,
      toEmail: normalizedEmail,
      toUserId: recipientUser?.id ?? null,
      linkId: linkId ?? null,
      collectionId: collectionId ?? null,
      message: message ?? null,
      seen: 0,
      createdAt: now,
    })
    .returning();

  return withCors({ share: created }, { status: 201 });
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

