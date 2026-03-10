import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { users, shares } from "@/db/schema";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
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

interface GoogleUserInfoResponse {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export async function POST(request: Request) {
  let body: { accessToken?: string } = {};

  try {
    body = (await request.json()) ?? {};
  } catch {
    return withCors(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const accessToken = body.accessToken;
  if (!accessToken) {
    return withCors(
      { error: "Missing accessToken" },
      { status: 400 },
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
      );
    }

    userInfo = (await res.json()) as GoogleUserInfoResponse;
  } catch {
    return withCors(
      { error: "Failed to verify Google access token" },
      { status: 500 },
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
    );
  }

  const [updated] = await db
    .update(users)
    .set({
      googleId: user.googleId ?? googleId,
      name: name ?? user.name,
      image: image ?? user.image,
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
  );
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

