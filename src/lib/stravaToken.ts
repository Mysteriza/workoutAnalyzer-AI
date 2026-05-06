import User from "@/models/User";

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const TOKEN_EXPIRY_SKEW_SECONDS = 300;

interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export async function getValidStravaAccessToken(stravaId?: string) {
  if (!stravaId) {
    throw new Error("Missing Strava identity");
  }

  const user = await User.findOne({ stravaId });
  if (!user?.refreshToken) {
    throw new Error("Strava account is not connected");
  }

  const now = Math.floor(Date.now() / 1000);
  if (
    user.accessToken &&
    user.expiresAt &&
    user.expiresAt - TOKEN_EXPIRY_SKEW_SECONDS > now
  ) {
    return user.accessToken;
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Strava credentials are not configured");
  }

  const response = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: user.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Strava token");
  }

  const tokenData = (await response.json()) as StravaTokenResponse;

  await User.findByIdAndUpdate(user._id, {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: tokenData.expires_at,
  });

  return tokenData.access_token;
}
