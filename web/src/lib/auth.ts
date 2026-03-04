import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";

export type AuthResult =
  | { type: "unauthorized" }
  | { type: "apiKey" }
  | { type: "user"; user: typeof users.$inferSelect };

function getAuthSecret() {
  const secret = process.env.API_SECRET_KEY;
  if (!secret) {
    throw new Error("API_SECRET_KEY is not configured");
  }
  return secret;
}

export async function resolveAuth(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : "";

  if (!token) {
    return { type: "unauthorized" };
  }

  const apiSecret = getAuthSecret();
  if (token === apiSecret) {
    return { type: "apiKey" };
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.apiToken, token))
    .limit(1);

  if (!user.length) {
    return { type: "unauthorized" };
  }

  return { type: "user", user: user[0] };
}

