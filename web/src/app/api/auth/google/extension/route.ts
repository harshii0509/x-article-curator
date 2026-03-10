import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { users, shares } from "@/db/schema";
import { withCors, optionsResponse } from "@/lib/cors";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

export const runtime = "nodejs";

const AUTH_RATE = { windowMs: 60_000, maxRequests: 10 };

interface GoogleUserInfoResponse {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

const TOKEN_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const rl = checkRateLimit(`auth-ext:${ip}`, AUTH_RATE);
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

  let body: { accessToken?: string } = {};

  try {
    body = (await request.json()) ?? {};
  } catch {
    return withCors(
      { error: "Invalid JSON body" },
      { status: 400 },
      request,
    );
  }

  const accessToken = body.accessToken;
  if (!accessToken) {
    return withCors(
      { error: "Missing accessToken" },
      { status: 400 },
      request,
    );
  }

  let userInfo: GoogleUserInfoResponse;

  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      return withCors(
        { error: "Invalid Google access token" },
        { status: 401 },
        request,
      );
    }

    userInfo = (await res.json()) as GoogleUserInfoResponse;
  } catch {
    return withCors(
      { error: "Failed to verify Google access token" },
      { status: 500 },
      request,
    );
  }

  const email = userInfo.email?.toLowerCase();
  const googleId = userInfo.sub;
  const name = userInfo.name;
  const image = userInfo.picture;

  if (!email || !googleId) {
    return withCors(
      { error: "Google account did not return an email or id" },
      { status: 400 },
      request,
    );
  }

  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.googleId, googleId))
    .limit(1);

  if (!user) {
    const byEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    user = byEmail[0];
  }

  const nowMs = Date.now();

  if (!user) {
    const apiToken = randomUUID();
    const [inserted] = await db
      .insert(users)
      .values({
        email,
        googleId,
        name,
        image,
        apiToken,
        tokenExpiresAt: nowMs + TOKEN_LIFETIME_MS,
        createdAt: nowMs,
      })
      .returning();

    await db
      .update(shares)
      .set({ toUserId: inserted.id })
      .where(eq(shares.toEmail, email));

    return withCors(
      {
        ok: true,
        user: {
          id: inserted.id,
          email: inserted.email,
          apiToken: inserted.apiToken,
          name: inserted.name,
          image: inserted.image,
        },
      },
      { status: 200 },
      request,
    );
  }

  const needsNewToken =
    !user.tokenExpiresAt || user.tokenExpiresAt < nowMs + 7 * 24 * 60 * 60 * 1000;

  const newToken = needsNewToken ? randomUUID() : user.apiToken;
  const newExpiry = needsNewToken ? nowMs + TOKEN_LIFETIME_MS : user.tokenExpiresAt;

  const [updated] = await db
    .update(users)
    .set({
      googleId: user.googleId ?? googleId,
      name: name ?? user.name,
      image: image ?? user.image,
      apiToken: newToken,
      tokenExpiresAt: newExpiry,
    })
    .where(eq(users.id, user.id))
    .returning();

  await db
    .update(shares)
    .set({ toUserId: updated.id })
    .where(eq(shares.toEmail, updated.email));

  return withCors(
    {
      ok: true,
      user: {
        id: updated.id,
        email: updated.email,
        apiToken: updated.apiToken,
        name: updated.name,
        image: updated.image,
      },
    },
    { status: 200 },
    request,
  );
}

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}
