import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { articles } from "@/db/schema";
import { unfurlUrl } from "@/lib/unfurl";
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
    return withCors(
      { error: (error as Error).message },
      {
        status: 500,
      },
    );
  }

  if (auth.type === "unauthorized") {
    return withCors(
      { error: "Unauthorized" },
      {
        status: 401,
      },
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
    );
  }

  const allArticles = await db
    .select()
    .from(articles)
    .where(eq(articles.userId, auth.user.id))
    .orderBy(desc(articles.savedAt))
    .limit(limit)
    .offset(offset);

  return withCors(
    {
      articles: allArticles,
      page,
      limit,
    },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  let payload: { url?: string; tweetUrl?: string } = {};

  try {
    payload = (await request.json()) ?? {};
  } catch {
    return withCors(
      { error: "Invalid JSON body" },
      {
        status: 400,
      },
    );
  }

  const { url, tweetUrl } = payload;

  if (!url || typeof url !== "string") {
    return withCors(
      { error: "Missing or invalid `url`" },
      {
        status: 400,
      },
    );
  }
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return withCors(
        { error: "Only HTTP(S) URLs are allowed" },
        { status: 400 },
      );
    }
  } catch {
    return withCors(
      { error: "Invalid URL format" },
      { status: 400 },
    );
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

  if (auth.type === "unauthorized") {
    return withCors(
      { error: "Unauthorized" },
      {
        status: 401,
      },
    );
  }

  if (auth.type !== "user") {
    return withCors(
      { error: "User authentication required to save articles" },
      { status: 403 },
    );
  }

  const userId = auth.user.id;

  const where = and(eq(articles.url, url), eq(articles.userId, userId));

  const existing = await db
    .select()
    .from(articles)
    .where(where)
    .limit(1);

  if (existing.length > 0) {
    return withCors(
      {
        status: "duplicate" as const,
        article: existing[0],
      },
      {
        status: 200,
      },
    );
  }

  let metadata = {};
  try {
    metadata = await unfurlUrl(url);
  } catch (error) {
    // Log but do not fail the request; we still save the bare URL.
    console.error(`Failed to unfurl ${url}:`, error);
  }

  const now = Date.now();

  const [inserted] = await db.insert(articles).values({
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
      article: inserted,
    },
    {
      status: 201,
    },
  );
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

