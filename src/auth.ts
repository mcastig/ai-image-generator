import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { upsertUser } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [GitHub],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "github" && profile) {
        const p = profile as unknown as {
          id: number;
          login: string;
          name?: string;
          email?: string;
          avatar_url?: string;
        };
        const user = await upsertUser({
          githubId: String(p.id),
          name: p.name ?? p.login ?? null,
          email: p.email ?? null,
          avatarUrl: p.avatar_url ?? null,
        });
        token.dbUserId = user.id;
        token.avatarUrl = p.avatar_url ?? null;
        token.userName = p.name ?? p.login;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as Record<string, unknown>).id = token.dbUserId;
        (session.user as unknown as Record<string, unknown>).avatarUrl = token.avatarUrl;
      }
      return session;
    },
  },
});
