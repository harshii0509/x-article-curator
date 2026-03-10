import { NextResponse } from "next/server";

const ALLOWED_ORIGINS: string[] = (() => {
  const raw = process.env.ALLOWED_ORIGINS ?? "";
  const origins = raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  return origins;
})();

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.length === 0) return true;
  if (origin.startsWith("chrome-extension://")) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

export function corsHeaders(request?: Request): Record<string, string> {
  const origin = request?.headers.get("origin") ?? null;
  const allowedOrigin =
    isAllowedOrigin(origin) && origin ? origin : ALLOWED_ORIGINS[0] ?? "";

  if (!allowedOrigin) {
    return {
      "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
  }

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

export function withCors<T>(
  body: T,
  init?: ResponseInit,
  request?: Request,
) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...corsHeaders(request),
    },
  });
}

export function optionsResponse(request?: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}
