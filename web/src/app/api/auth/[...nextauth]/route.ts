import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

import { db } from "@/db";
import { users } from "@/db/schema";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token }) {
      const googleId = token.sub;

      if (!googleId || !token.email) {
        return token;
      }

      const existing = await db
        .select()
        .from(users)
        .where(eq(users.googleId, googleId))
        .limit(1);

      if (existing.length === 0) {
        const now = Date.now();
        const apiToken = randomUUID();

        const [created] = await db
          .insert(users)
          .values({
            googleId,
            email: token.email,
            name: token.name ?? null,
            image: (token.picture as string | null | undefined) ?? null,
            apiToken,
            createdAt: now,
          })
          .returning();

        const t = token as any;
        t.userId = created.id;
        t.apiToken = created.apiToken;
        return t;
      }

      const user = existing[0];
      const t = token as any;
      t.userId = user.id;
      t.apiToken = user.apiToken;
      return t;
    },
    async session({ session, token }) {
      const s = session as any;
      if (token && (token as any).userId) {
        s.user = s.user ?? {};
        s.user.id = (token as any).userId;
        s.user.apiToken = (token as any).apiToken;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

