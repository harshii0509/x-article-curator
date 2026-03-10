import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { links } from "@/db/schema";
import { resolveAuth } from "@/lib/auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "DELETE,PATCH,OPTIONS",
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

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idSegment = segments[segments.length - 1] || segments[segments.length - 2];

  const idNum = Number(idSegment);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    return withCors({ error: `Invalid link id: ${idSegment}` }, { status: 400 });
  }

  let auth;
  try {
    auth = await resolveAuth(request);
  } catch (error) {
    return withCors(
      { error: (error as Error).message },
      {
        status: 500,
      },
    );
  }

  if (auth.type !== "user") {
    return withCors(
      { error: "Unauthorized" },
      {
        status: 401,
      },
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
      {
        status: 404,
      },
    );
  }

  const link = existing[0];

  // Only allow delete if it belongs to this user or is unowned (legacy rows).
  if (link.userId !== null && link.userId !== auth.user.id) {
    return withCors(
      { error: "Forbidden" },
      {
        status: 403,
      },
    );
  }

  await db.delete(links).where(eq(links.id, idNum));

  return withCors({ ok: true }, { status: 200 });
}

export async function PATCH(request: Request) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idSegment = segments[segments.length - 1] || segments[segments.length - 2];

  const idNum = Number(idSegment);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    return withCors({ error: `Invalid link id: ${idSegment}` }, { status: 400 });
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
    return withCors({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db
    .select()
    .from(links)
    .where(eq(links.id, idNum))
    .limit(1);

  if (!existing.length) {
    return withCors({ error: "Not found" }, { status: 404 });
  }

  const link = existing[0];

  if (link.userId !== null && link.userId !== auth.user.id) {
    return withCors({ error: "Forbidden" }, { status: 403 });
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
  );
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

