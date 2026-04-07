import { NextResponse } from "next/server";

/**
 * Redirect to NextAuth's Strava provider for authentication.
 * This consolidates OAuth through NextAuth instead of a custom flow,
 * ensuring proper session creation and token storage in JWT.
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const callbackUrl = `${baseUrl}/settings`;

  // Redirect to NextAuth's built-in Strava sign-in
  return NextResponse.redirect(
    `${baseUrl}/api/auth/signin/strava?callbackUrl=${encodeURIComponent(callbackUrl)}`
  );
}
