import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { articles, users } from "@/db/schema";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "DELETE,OPTIONS",
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

async function resolveUserFromToken(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : "";

  if (!token) {
    return null;
  }

  const apiSecret = getAuthSecret();
  if (token === apiSecret) {
    // Global API key is not allowed for deletes.
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.apiToken, token))
    .limit(1);

  if (!user.length) {
    return null;
  }

  return user[0];
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idSegment = segments[segments.length - 1] || segments[segments.length - 2];

  const idNum = Number(idSegment);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    return withCors(
      { error: `Invalid article id: ${idSegment}` },
      {
        status: 400,
      },
    );
  }

  let user;
  try {
    user = await resolveUserFromToken(request);
  } catch (error) {
    return withCors(
      { error: (error as Error).message },
      {
        status: 500,
      },
    );
  }

  if (!user) {
    return withCors(
      { error: "Unauthorized" },
      {
        status: 401,
      },
    );
  }

  const existing = await db
    .select()
    .from(articles)
    .where(eq(articles.id, idNum))
    .limit(1);

  if (!existing.length) {
    return withCors(
      { error: "Not found" },
      {
        status: 404,
      },
    );
  }

  const article = existing[0];

  // Only allow delete if it belongs to this user or is unowned (legacy rows).
  if (article.userId !== null && article.userId !== user.id) {
    return withCors(
      { error: "Forbidden" },
      {
        status: 403,
      },
    );
  }

  await db.delete(articles).where(eq(articles.id, idNum));

  return withCors({ ok: true }, { status: 200 });
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

