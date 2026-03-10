import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { links } from "@/db/schema";
import { unfurlUrl } from "@/lib/unfurl";
import { resolveAuth } from "@/lib/auth";
import { withCors, optionsResponse } from "@/lib/cors";
import { validateHttpUrl } from "@/lib/url-validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pageParam = url.searchParams.get("page") ?? "1";
  const limitParam = url.searchParams.get("limit") ?? "50";

  const page = Number.isNaN(Number(pageParam)) ? 1 : Number(pageParam);
  const limit = Number.isNaN(Number(limitParam)) ? 50 : Number(limitParam);
  const offset = (page - 1) * limit;

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

  if (auth.type === "unauthorized") {
    return withCors(
      { error: "Unauthorized" },
      { status: 401 },
      request,
    );
  }

  // For the global API key, do not expose all users' articles.
  if (auth.type === "apiKey") {
    return withCors(
      {
        articles: [],
        page,
        limit,
      },
      { status: 200 },
      request,
    );
  }

  const allLinks = await db
    .select()
    .from(links)
    .where(eq(links.userId, auth.user.id))
    .orderBy(desc(links.savedAt))
    .limit(limit)
    .offset(offset);

  return withCors(
    {
        links: allLinks,
      page,
      limit,
    },
    { status: 200 },
    request,
  );
}

export async function POST(request: Request) {
  let payload: { url?: string; tweetUrl?: string } = {};

  try {
    payload = (await request.json()) ?? {};
  } catch {
    return withCors(
      { error: "Invalid JSON body" },
      { status: 400 },
      request,
    );
  }

  const { url, tweetUrl } = payload;

  if (!url || typeof url !== "string") {
    return withCors(
      { error: "Missing or invalid `url`" },
      { status: 400 },
      request,
    );
  }

  const urlCheck = validateHttpUrl(url);
  if (!urlCheck.valid) {
    return withCors(
      { error: urlCheck.reason },
      { status: 400 },
      request,
    );
  }

  if (tweetUrl != null) {
    if (typeof tweetUrl !== "string") {
      return withCors(
        { error: "Invalid `tweetUrl`" },
        { status: 400 },
        request,
      );
    }
    const tweetCheck = validateHttpUrl(tweetUrl);
    if (!tweetCheck.valid) {
      return withCors(
        { error: "Only HTTP(S) tweet URLs are allowed" },
        { status: 400 },
        request,
      );
    }
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

  if (auth.type === "unauthorized") {
    return withCors(
      { error: "Unauthorized" },
      { status: 401 },
      request,
    );
  }

  if (auth.type !== "user") {
    return withCors(
      { error: "User authentication required to save articles" },
      { status: 403 },
      request,
    );
  }

  const userId = auth.user.id;

  const where = and(eq(links.url, url), eq(links.userId, userId));

  const existing = await db
    .select()
    .from(links)
    .where(where)
    .limit(1);

  if (existing.length > 0) {
    return withCors(
      {
        status: "duplicate" as const,
        link: existing[0],
      },
      { status: 200 },
      request,
    );
  }

  let metadata = {};
  try {
    metadata = await unfurlUrl(url);
  } catch (error) {
    console.error(`Failed to unfurl ${url}:`, error);
  }

  const now = Date.now();

  const [inserted] = await db.insert(links).values({
    url,
    tweetUrl: tweetUrl ?? null,
    userId,
    ...metadata,
    savedAt: now,
    createdAt: now,
  }).returning();

  return withCors(
    {
        status: "created" as const,
        link: inserted,
    },
    { status: 201 },
    request,
  );
}

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}
