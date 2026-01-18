import { NextRequest, NextResponse } from "next/server";

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/settings?error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/settings?error=${encodeURIComponent("No authorization code received")}`
    );
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${baseUrl}/settings?error=${encodeURIComponent("Strava credentials not configured")}`
    );
  }

  try {
    const tokenResponse = await fetch(STRAVA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      return NextResponse.redirect(
        `${baseUrl}/settings?error=${encodeURIComponent(errorData.message || "Token exchange failed")}`
      );
    }

    const tokenData = await tokenResponse.json();

    const redirectUrl = new URL("/settings", baseUrl);
    redirectUrl.searchParams.set("access_token", tokenData.access_token);
    redirectUrl.searchParams.set("refresh_token", tokenData.refresh_token);
    redirectUrl.searchParams.set("expires_at", tokenData.expires_at.toString());
    redirectUrl.searchParams.set("athlete_id", tokenData.athlete.id.toString());
    redirectUrl.searchParams.set("success", "true");

    return NextResponse.redirect(redirectUrl.toString());
  } catch (err) {
    console.error("Token exchange error:", err);
    return NextResponse.redirect(
      `${baseUrl}/settings?error=${encodeURIComponent("Failed to exchange token")}`
    );
  }
}
