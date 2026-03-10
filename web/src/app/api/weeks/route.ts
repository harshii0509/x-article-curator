import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { publicWeeks, users } from "@/db/schema";
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

export async function GET(request: Request) {
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

  const rows = await db
    .select()
    .from(publicWeeks)
    .where(eq(publicWeeks.userId, auth.user.id));

  return withCors(
    {
      weeks: rows,
    },
    { status: 200 },
  );
}

export async function PATCH(request: Request) {
  let body: { weekStart?: number; isPublic?: boolean } = {};

  try {
    body = (await request.json()) ?? {};
  } catch {
    return withCors(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { weekStart, isPublic } = body;

  if (typeof weekStart !== "number" || !Number.isFinite(weekStart)) {
    return withCors(
      { error: "Invalid `weekStart`" },
      { status: 400 },
    );
  }

  if (typeof isPublic !== "boolean") {
    return withCors(
      { error: "Invalid `isPublic`" },
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

  // If making a week public, ensure the user has a username first.
  if (isPublic) {
    const [user] = await db
      .select({ username: users.username })
      .from(users)
      .where(eq(users.id, auth.user.id))
      .limit(1);

    if (!user || !user.username) {
      return withCors(
        { error: "username_required" },
        { status: 400 },
      );
    }
  }

  const now = Date.now();

  const existing = await db
    .select()
    .from(publicWeeks)
    .where(
      and(
        eq(publicWeeks.userId, auth.user.id),
        eq(publicWeeks.weekStart, weekStart),
      ),
    )
    .limit(1);

  let row;

  if (existing.length === 0) {
    const [inserted] = await db
      .insert(publicWeeks)
      .values({
        userId: auth.user.id,
        weekStart,
        isPublic: isPublic ? 1 : 0,
        createdAt: now,
      })
      .returning();
    row = inserted;
  } else {
    const [updated] = await db
      .update(publicWeeks)
      .set({
        isPublic: isPublic ? 1 : 0,
      })
      .where(
        and(
          eq(publicWeeks.userId, auth.user.id),
          eq(publicWeeks.weekStart, weekStart),
        ),
      )
      .returning();
    row = updated;
  }

  return withCors(
    {
      ok: true as const,
      week: row,
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

