import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { articles, users } from "@/db/schema";
import { unfurlUrl } from "@/lib/unfurl";

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

function getAuthSecret() {
  const secret = process.env.API_SECRET_KEY;
  if (!secret) {
    throw new Error("API_SECRET_KEY is not configured");
  }

  return secret;
}

async function resolveAuth(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : "";

  if (!token) {
    return { type: "unauthorized" as const };
  }

  const apiSecret = getAuthSecret();
  if (token === apiSecret) {
    return { type: "apiKey" as const };
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.apiToken, token))
    .limit(1);

  if (!user.length) {
    return { type: "unauthorized" as const };
  }

  return { type: "user" as const, user: user[0] };
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

  const baseQuery = db
    .select()
    .from(articles)
    .orderBy(desc(articles.savedAt))
    .limit(limit)
    .offset(offset);

  const allArticles =
    auth.type === "user"
      ? await baseQuery.where(eq(articles.userId, auth.user.id))
      : await baseQuery;

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

  const userId = auth.type === "user" ? auth.user.id : null;

  const where =
    userId === null
      ? and(eq(articles.url, url), isNull(articles.userId))
      : and(eq(articles.url, url), eq(articles.userId, userId));

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
  } catch {
    /* save with null metadata if unfurl fails */
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

