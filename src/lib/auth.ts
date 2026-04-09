import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
// import { PrismaAdapter } from "@auth/prisma-adapter"; // Enable when DB is connected
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub;
        session.user.role = (token.role as string) || "VIEWER";
        session.user.organizationId = (token.organizationId as string) || "";
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || "VIEWER";
        token.organizationId = (user as any).organizationId || null;
      }
      return token;
    },
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = request.nextUrl.pathname.startsWith("/dashboard");
      const isOnApi = request.nextUrl.pathname.startsWith("/api") &&
                      !request.nextUrl.pathname.startsWith("/api/auth");

      if (isOnDashboard || isOnApi) {
        return isLoggedIn;
      }
      return true;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Helper to get session in server components/API routes
export async function getRequiredSession() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}
