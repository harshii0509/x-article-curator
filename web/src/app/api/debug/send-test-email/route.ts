import { NextResponse } from "next/server";
import { sendTestEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function GET() {
  try {
    await sendTestEmail("agarwal.harsh2021@gmail.com");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}

