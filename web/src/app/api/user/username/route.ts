import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { resolveAuth } from "@/lib/auth";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,PATCH,OPTIONS",
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

const USERNAME_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

function isValidUsername(value: string) {
  return USERNAME_REGEX.test(value);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const check = url.searchParams.get("check");

  if (!check || typeof check !== "string") {
    return withCors(
      { error: "Missing `check` query parameter" },
      { status: 400 },
    );
  }

  const candidate = check.trim();

  if (!isValidUsername(candidate)) {
    return withCors(
      {
        available: false,
        reason: "invalid_format",
      },
      { status: 200 },
    );
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, candidate))
    .limit(1);

  const available = existing.length === 0;

  return withCors(
    {
      available,
    },
    { status: 200 },
  );
}

export async function PATCH(request: Request) {
  let body: { username?: string } = {};

  try {
    body = (await request.json()) ?? {};
  } catch {
    return withCors(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const username = body.username?.trim() ?? "";

  if (!username) {
    return withCors(
      { error: "Missing `username`" },
      { status: 400 },
    );
  }

  if (!isValidUsername(username)) {
    return withCors(
      { error: "invalid_username_format" },
      { status: 400 },
    );
  }

  let auth;
  try {
    auth = await resolveAuth(request);
  } catch (error) {
    return withCors(
      { error: (error as Error).message },
      { status: 500 },
    );
  }

  if (auth.type !== "user") {
    return withCors(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const userId = auth.user.id;

  const conflict = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.username, username), ne(users.id, userId)))
    .limit(1);

  if (conflict.length > 0) {
    return withCors(
      { error: "username_taken" },
      { status: 409 },
    );
  }

  const [updated] = await db
    .update(users)
    .set({ username })
    .where(eq(users.id, userId))
    .returning();

  return withCors(
    {
      ok: true as const,
      username: updated.username,
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

