import { NextResponse } from "next/server";
import { and, desc, eq, or } from "drizzle-orm";

import { db } from "@/db";
import { links, shares, collections, users } from "@/db/schema";
import { resolveAuth } from "@/lib/auth";
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

  return withCors({ items: sharedWithMe }, { status: 200 }, request);
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

  let body: {
    toEmail?: string;
    linkId?: number;
    collectionId?: number;
    message?: string;
  } = {};

  try {
    body = (await request.json()) ?? {};
  } catch {
    return withCors({ error: "Invalid JSON body" }, { status: 400 }, request);
  }

  const { toEmail, linkId, collectionId, message } = body;

  if (!toEmail || typeof toEmail !== "string") {
    return withCors({ error: "Missing or invalid `toEmail`" }, { status: 400 }, request);
  }

  const normalizedEmail = toEmail.toLowerCase().trim();

  if (!linkId && !collectionId) {
    return withCors(
      { error: "Either `linkId` or `collectionId` is required" },
      { status: 400 },
      request,
    );
  }

  if (linkId && collectionId) {
    return withCors(
      { error: "Only one of `linkId` or `collectionId` may be set" },
      { status: 400 },
      request,
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
      return withCors({ error: "Link not found" }, { status: 404 }, request);
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
      return withCors({ error: "Collection not found" }, { status: 404 }, request);
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

  return withCors({ share: created }, { status: 201 }, request);
}

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}
