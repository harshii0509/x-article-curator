import { NextResponse } from "next/server";
import { sendOtpEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function GET() {
  try {
    await sendOtpEmail("harshrise@gmail.com", "123456");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}

