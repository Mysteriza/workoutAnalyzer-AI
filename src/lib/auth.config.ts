import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [], // Providers are configured in auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
       const isLoggedIn = !!auth?.user;
       const isOnLoginPage = nextUrl.pathname.startsWith('/login');
       
       if (isOnLoginPage && isLoggedIn) {
         return Response.redirect(new URL('/settings', nextUrl));
       }
       return true;
    },
  },
  pages: {
    signIn: '/login',
  }
} satisfies NextAuthConfig;
