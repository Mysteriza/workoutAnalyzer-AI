import { NextRequest, NextResponse } from "next/server";

/**
 * Legacy OAuth callback handler.
 * Now redirects to settings since NextAuth handles OAuth at /api/auth/callback/strava.
 * This route is kept as a fallback for any direct Strava callback redirects.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get("error");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const redirectUrl = new URL("/settings", baseUrl);

  if (error) {
    redirectUrl.searchParams.set("error", error);
  } else {
    // NextAuth handles the OAuth flow; user is already authenticated
    redirectUrl.searchParams.set("success", "true");
  }

  return NextResponse.redirect(redirectUrl.toString());
}
