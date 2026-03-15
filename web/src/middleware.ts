import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Waitlist mode: block all app routes so the public only sees the landing page.
 * Public routes that remain accessible:
 *   /              → landing page
 *   /c/[slug]      → public shared collection pages
 *   /u/...         → public shared user/week pages
 *   /api/*         → API routes (including /api/waitlist)
 */
export function middleware(request: NextRequest) {
  // Temporarily disabled for testing and development
  // return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/collections/:path*",
    "/shared/:path*",
  ],
};
