import { NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { db } from "@/db";
import { otpCodes, users } from "@/db/schema";

export const runtime = "nodejs";

const TEN_MINUTES_MS = 10 * 60 * 1000;

const failedAttempts = new Map<string, { count: number; first: number }>();

export async function POST(request: Request) {
  let body: { email?: string; code?: string } = {};

  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const email = body.email?.trim().toLowerCase();
  const code = body.code?.trim();

  if (!email || !code) {
    return NextResponse.json(
      { error: "Email and code are required" },
      { status: 400 },
    );
  }

  const now = Date.now();

  const bucket = failedAttempts.get(email);
  if (bucket && now - bucket.first < TEN_MINUTES_MS && bucket.count >= 5) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 },
    );
  }

  const updated = await db
    .update(otpCodes)
    .set({ used: 1 })
    .where(
      and(
        eq(otpCodes.email, email),
        eq(otpCodes.code, code),
        eq(otpCodes.used, 0),
        gt(otpCodes.expiresAt, now),
      ),
    )
    .returning();

  if (!updated.length) {
    const prev = failedAttempts.get(email);
    if (!prev || now - prev.first >= TEN_MINUTES_MS) {
      failedAttempts.set(email, { count: 1, first: now });
    } else {
      failedAttempts.set(email, { count: prev.count + 1, first: prev.first });
    }

    return NextResponse.json(
      { error: "Invalid or expired code" },
      { status: 400 },
    );
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let user = existing[0];

  if (!user) {
    const apiToken = randomUUID();
    const nowMs = Date.now();

    const inserted = await db
      .insert(users)
      .values({
        email,
        apiToken,
        createdAt: nowMs,
      })
      .returning();

    user = inserted[0];
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      apiToken: user.apiToken,
      name: user.name,
      image: user.image,
    },
  });
}

