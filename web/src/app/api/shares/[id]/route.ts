import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { shares } from "@/db/schema";
import { resolveAuth } from "@/lib/auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "PATCH,OPTIONS",
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

function parseId(request: Request): number | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idSegment =
    segments[segments.length - 1] || segments[segments.length - 2];
  const idNum = Number(idSegment);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    return null;
  }
  return idNum;
}

export async function PATCH(request: Request) {
  const idNum = parseId(request);
  if (!idNum) {
    return withCors({ error: "Invalid share id" }, { status: 400 });
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
    return withCors({ error: "Unauthorized" }, { status: 401 });
  }

  const [existing] = await db
    .select()
    .from(shares)
    .where(
      and(
        eq(shares.id, idNum),
        eq(shares.toEmail, auth.user.email),
      ),
    )
    .limit(1);

  if (!existing) {
    return withCors({ error: "Not found" }, { status: 404 });
  }

  const [updated] = await db
    .update(shares)
    .set({ seen: 1 })
    .where(eq(shares.id, idNum))
    .returning();

  return withCors({ share: updated }, { status: 200 });
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

