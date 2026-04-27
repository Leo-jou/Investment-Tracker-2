import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { isEmailAllowed, normalizeEmail } from "@/lib/auth/email";
import { isGoogleLoginConfigured } from "@/lib/auth/google";
import { ensureUserWorkspace } from "@/lib/db/portfolio-repository";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login"
  },
  providers: isGoogleLoginConfigured() ? [Google] : [],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;

      const googleProfile = profile as { email?: string; email_verified?: boolean } | undefined;
      const email = googleProfile?.email ? normalizeEmail(googleProfile.email) : "";

      if (!email || googleProfile?.email_verified !== true) return false;
      if (!isEmailAllowed(email, { failClosed: true })) return false;

      await ensureUserWorkspace(email);
      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        session.user.email = normalizeEmail(session.user.email);
      }
      return session;
    }
  }
});
