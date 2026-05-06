import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { getValidStravaAccessToken } from "@/lib/stravaToken";

export async function POST() {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    await getValidStravaAccessToken(session.user.stravaId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error refreshing token:", err);
    return NextResponse.json(
      { error: "Failed to refresh Strava token" },
      { status: 500 }
    );
  }
}
