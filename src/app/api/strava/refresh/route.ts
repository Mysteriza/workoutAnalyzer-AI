import { NextResponse } from "next/server";
import { requireAuth, serverError } from "@/lib/api-utils";
import { checkRateLimit, getClientIp, buildRateLimitKey } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(buildRateLimitKey(ip, "strava-refresh"), { windowMs: 60_000, maxRequests: 10 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { session, error } = await requireAuth();
    if (error) return error;

    await dbConnect();

    const user = await User.findOne({ stravaId: session!.user.stravaId });
    if (!user?.refreshToken) {
      return NextResponse.json({ error: "Strava account not connected" }, { status: 400 });
    }

    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      logger.error("Refresh", "Strava credentials not configured");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const refreshResponse = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: user.refreshToken,
      }),
    });

    if (!refreshResponse.ok) {
      logger.error("Refresh", `Strava refresh failed: ${refreshResponse.status}`);
      return NextResponse.json(
        { error: "Failed to refresh Strava token" },
        { status: 401 }
      );
    }

    const tokenData = await refreshResponse.json();

    await User.findByIdAndUpdate(user._id, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_at,
    });

    logger.info("Refresh", "Strava token refreshed successfully");
    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError(err, "strava refresh");
  }
}
