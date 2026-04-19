import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Strava credentials not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { refresh_token } = body;

    await dbConnect();

    if (!refresh_token) {
      return NextResponse.json(
        { error: "Missing refresh token" },
        { status: 400 }
      );
    }

    // Verify the refresh token belongs to the authenticated user
    const dbUser = await User.findOne({
      stravaId: session.user.stravaId,
      refreshToken: refresh_token,
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 403 }
      );
    }

    const response = await fetch(STRAVA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refresh_token,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to refresh token" },
        { status: response.status }
      );
    }

    const tokenData = await response.json();

    // Update tokens in database
    await User.findByIdAndUpdate(dbUser._id, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_at,
    });

    return NextResponse.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: tokenData.expires_at,
    });
  } catch (err) {
    console.error("Error refreshing token:", err);
    return NextResponse.json(
      { error: "Failed to refresh Strava token" },
      { status: 500 }
    );
  }
}
