import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [], // Providers are configured in auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLoginPage = nextUrl.pathname.startsWith("/login");
      const isPublicPage =
        nextUrl.pathname === "/" ||
        nextUrl.pathname.startsWith("/api") ||
        nextUrl.pathname.startsWith("/_next") ||
        nextUrl.pathname.startsWith("/static");

      if (isOnLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL("/settings", nextUrl));
        return true; // Allow access to login page
      }

      if (isPublicPage) {
        return true; // Allow access to public pages
      }

      // Block access to everything else if not logged in
      return isLoggedIn;
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
