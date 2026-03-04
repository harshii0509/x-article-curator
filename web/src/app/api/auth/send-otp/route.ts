import { NextResponse } from "next/server";
import { and, gt, eq, lt, sql } from "drizzle-orm";
import { randomInt } from "node:crypto";

import { db } from "@/db";
import { otpCodes } from "@/db/schema";
import { sendOtpEmail } from "@/lib/email";

export const runtime = "nodejs";

const ONE_HOUR_MS = 60 * 60 * 1000;
const TEN_MINUTES_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  let body: { email?: string } = {};

  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 },
    );
  }

  const now = Date.now();
  const oneHourAgo = now - ONE_HOUR_MS;

  // Cleanup old codes to avoid unbounded growth.
  await db.delete(otpCodes).where(lt(otpCodes.expiresAt, oneHourAgo));

  const recentCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.email, email),
        gt(otpCodes.createdAt, oneHourAgo),
      ),
    );

  if (recentCount[0]?.count >= 5) {
    return NextResponse.json(
      { error: "Too many codes requested. Please try again later." },
      { status: 429 },
    );
  }

  const code = randomInt(100000, 1000000).toString();

  const expiresAt = now + TEN_MINUTES_MS;

  await db.insert(otpCodes).values({
    email,
    code,
    expiresAt,
    used: 0,
    createdAt: now,
  });

  await sendOtpEmail(email, code);

  return NextResponse.json({ ok: true });
}

