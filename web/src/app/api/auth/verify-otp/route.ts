import { NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { db } from "@/db";
import { otpCodes, users } from "@/db/schema";

export const runtime = "nodejs";

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

  const matches = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.email, email),
        eq(otpCodes.code, code),
        eq(otpCodes.used, 0),
        gt(otpCodes.expiresAt, now),
      ),
    )
    .limit(1);

  if (!matches.length) {
    return NextResponse.json(
      { error: "Invalid or expired code" },
      { status: 400 },
    );
  }

  const match = matches[0];

  await db
    .update(otpCodes)
    .set({ used: 1 })
    .where(eq(otpCodes.id, match.id));

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

