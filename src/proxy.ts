import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Protect all routes except static files, API routes, and auth endpoints
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
