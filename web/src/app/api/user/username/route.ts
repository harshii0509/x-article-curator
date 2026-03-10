import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { resolveAuth } from "@/lib/auth";
import { withCors, optionsResponse } from "@/lib/cors";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

export const runtime = "nodejs";

const USERNAME_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

function isValidUsername(value: string) {
  return USERNAME_REGEX.test(value);
}

const USERNAME_CHECK_RATE = { windowMs: 60_000, maxRequests: 30 };

export async function GET(request: Request) {
  const ip = getClientIP(request);
  const rl = checkRateLimit(`username-check:${ip}`, USERNAME_CHECK_RATE);
  if (!rl.allowed) {
    return withCors(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 1000) / 1000)) },
      },
      request,
    );
  }

  const url = new URL(request.url);
  const check = url.searchParams.get("check");

  if (!check || typeof check !== "string") {
    return withCors(
      { error: "Missing `check` query parameter" },
      { status: 400 },
      request,
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
      request,
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
    request,
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
      request,
    );
  }

  const username = body.username?.trim() ?? "";

  if (!username) {
    return withCors(
      { error: "Missing `username`" },
      { status: 400 },
      request,
    );
  }

  if (!isValidUsername(username)) {
    return withCors(
      { error: "invalid_username_format" },
      { status: 400 },
      request,
    );
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
    return withCors(
      { error: "Authentication required" },
      { status: 401 },
      request,
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
      request,
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
    request,
  );
}

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}
