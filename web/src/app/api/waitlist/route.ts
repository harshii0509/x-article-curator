import { NextResponse } from "next/server";

import { db } from "@/db";
import { waitlist } from "@/db/schema";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { sendWaitlistConfirmation } from "@/lib/email";

export const runtime = "nodejs";

const WAITLIST_RATE = { windowMs: 10 * 60_000, maxRequests: 5 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const rl = checkRateLimit(`waitlist:${ip}`, WAITLIST_RATE);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 1000) / 1000)) },
      },
    );
  }

  let body: { email?: string } = {};
  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  let isNew = false;
  try {
    await db.insert(waitlist).values({ email, ipAddress: ip, joinedAt: Date.now() });
    isNew = true;
  } catch {
    // Unique constraint violation = email already registered. Return ok silently
    // to prevent email enumeration.
  }

  // Fire-and-forget: send confirmation only for genuinely new sign-ups.
  // Never awaited so the response returns immediately regardless of email latency.
  if (isNew) {
    sendWaitlistConfirmation(email).catch((err) => {
      console.error("[waitlist] confirmation email failed:", err);
    });
  }

  return NextResponse.json({ ok: true, alreadyRegistered: !isNew });
}
