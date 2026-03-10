import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { links } from "@/db/schema";
import { resolveAuth } from "@/lib/auth";
import { withCors, optionsResponse } from "@/lib/cors";

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idSegment = segments[segments.length - 1] || segments[segments.length - 2];

  const idNum = Number(idSegment);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    return withCors({ error: `Invalid link id: ${idSegment}` }, { status: 400 }, request);
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
      { error: "Unauthorized" },
      { status: 401 },
      request,
    );
  }

  const existing = await db
    .select()
    .from(links)
    .where(eq(links.id, idNum))
    .limit(1);

  if (!existing.length) {
    return withCors(
      { error: "Not found" },
      { status: 404 },
      request,
    );
  }

  const link = existing[0];

  // Only allow delete if it belongs to this user or is unowned (legacy rows).
  if (link.userId !== null && link.userId !== auth.user.id) {
    return withCors(
      { error: "Forbidden" },
      { status: 403 },
      request,
    );
  }

  await db.delete(links).where(eq(links.id, idNum));

  return withCors({ ok: true }, { status: 200 }, request);
}

export async function PATCH(request: Request) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idSegment = segments[segments.length - 1] || segments[segments.length - 2];

  const idNum = Number(idSegment);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    return withCors({ error: `Invalid link id: ${idSegment}` }, { status: 400 }, request);
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
    return withCors({ error: "Unauthorized" }, { status: 401 }, request);
  }

  const existing = await db
    .select()
    .from(links)
    .where(eq(links.id, idNum))
    .limit(1);

  if (!existing.length) {
    return withCors({ error: "Not found" }, { status: 404 }, request);
  }

  const link = existing[0];

  if (link.userId !== null && link.userId !== auth.user.id) {
    return withCors({ error: "Forbidden" }, { status: 403 }, request);
  }

  const nextIsRead = link.isRead ? 0 : 1;

  const [updated] = await db
    .update(links)
    .set({ isRead: nextIsRead })
    .where(eq(links.id, idNum))
    .returning();

  return withCors(
    {
      ok: true,
      link: updated,
    },
    { status: 200 },
    request,
  );
}

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}
