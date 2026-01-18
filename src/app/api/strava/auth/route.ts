import { NextResponse } from "next/server";

const STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize";

export async function GET() {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  if (!clientId) {
    return NextResponse.json(
      { error: "Strava Client ID not configured" },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${baseUrl}/api/strava/callback`,
    response_type: "code",
    scope: "read,activity:read_all",
  });

  const authUrl = `${STRAVA_AUTH_URL}?${params.toString()}`;
  
  return NextResponse.redirect(authUrl);
}
