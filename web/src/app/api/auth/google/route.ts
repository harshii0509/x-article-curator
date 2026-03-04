import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  createRemoteJWKSet,
  jwtVerify,
  JWTPayload,
} from "jose";

import { db } from "@/db";
import { users } from "@/db/schema";

export const runtime = "nodejs";

const GOOGLE_ISSUERS = new Set([
  "https://accounts.google.com",
  "accounts.google.com",
]);

const googleJwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

interface GoogleIdTokenPayload extends JWTPayload {
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  sub?: string;
}

export async function POST(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Google login is not configured" },
      { status: 500 },
    );
  }

  let body: { credential?: string } = {};

  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const credential = body.credential;
  if (!credential) {
    return NextResponse.json(
      { error: "Missing credential" },
      { status: 400 },
    );
  }

  let payload: GoogleIdTokenPayload;

  try {
    const result = await jwtVerify(credential, googleJwks, {
      audience: clientId,
    });
    payload = result.payload as GoogleIdTokenPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid Google credential" },
      { status: 401 },
    );
  }

  if (!payload.sub) {
    return NextResponse.json(
      { error: "Invalid Google user" },
      { status: 400 },
    );
  }

  if (payload.iss && !GOOGLE_ISSUERS.has(payload.iss)) {
    return NextResponse.json(
      { error: "Invalid token issuer" },
      { status: 400 },
    );
  }

  const email = payload.email?.toLowerCase();
  const googleId = payload.sub;
  const name = payload.name;
  const image = payload.picture;

  if (!email) {
    return NextResponse.json(
      { error: "Google account does not have an email" },
      { status: 400 },
    );
  }

  // Try by googleId first.
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.googleId, googleId))
    .limit(1);

  // Fallback to email (handles users who signed up via email/password first).
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

    return NextResponse.json({
      ok: true,
      user: {
        id: inserted.id,
        email: inserted.email,
        apiToken: inserted.apiToken,
        name: inserted.name,
        image: inserted.image,
      },
    });
  }

  // Existing user: make sure we store googleId if missing, and refresh profile info.
  const [updated] = await db
    .update(users)
    .set({
      googleId: user.googleId ?? googleId,
      name: name ?? user.name,
      image: image ?? user.image,
    })
    .where(eq(users.id, user.id))
    .returning();

  return NextResponse.json({
    ok: true,
    user: {
      id: updated.id,
      email: updated.email,
      apiToken: updated.apiToken,
      name: updated.name,
      image: updated.image,
    },
  });
}

