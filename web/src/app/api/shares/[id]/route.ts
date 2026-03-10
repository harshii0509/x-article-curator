import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { shares } from "@/db/schema";
import { resolveAuth } from "@/lib/auth";
import { withCors, optionsResponse } from "@/lib/cors";

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
    return withCors({ error: "Invalid share id" }, { status: 400 }, request);
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
    return withCors({ error: "Not found" }, { status: 404 }, request);
  }

  const [updated] = await db
    .update(shares)
    .set({ seen: 1 })
    .where(eq(shares.id, idNum))
    .returning();

  return withCors({ share: updated }, { status: 200 }, request);
}

export function OPTIONS(request: Request) {
  return optionsResponse(request);
}
