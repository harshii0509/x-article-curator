import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  // Auth is handled purely via client-side token; nothing to clear on the server.
  return NextResponse.json({ ok: true });
}

