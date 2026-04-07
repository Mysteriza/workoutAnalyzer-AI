import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Activity from "@/models/Activity";
import User from "@/models/User";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";

/**
 * Fetch athlete activities from Strava and cache summaries to MongoDB.
 * This ensures the activity list is persisted server-side and synced across devices.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid authorization header" },
      { status: 401 }
    );
  }

  const accessToken = authHeader.replace("Bearer ", "");
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get("page") || "1";
  const perPage = searchParams.get("per_page") || "30";

  try {
    const response = await fetch(
      `${STRAVA_API_BASE}/athlete/activities?page=${page}&per_page=${perPage}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch activities" },
        { status: response.status }
      );
    }

    const activities = await response.json();

    // Cache activity summaries to MongoDB for cross-device persistence
    if (activities.length > 0 && Array.isArray(activities)) {
      await dbConnect();

      const userId = session.user.id;
      const stravaId = session.user.stravaId;

      // Fallback: look up userId if not in session
      let effectiveUserId = userId;
      if (!effectiveUserId) {
        const user = await User.findOne({ stravaId });
        if (user) effectiveUserId = user._id.toString();
      }

      if (effectiveUserId) {
        const bulkOps = activities
          .filter((a: any) => a && a.id)
          .map((a: any) => ({
            updateOne: {
              filter: { userId: effectiveUserId, stravaId: a.id.toString() },
              update: {
                $set: {
                  name: a.name || "Untitled Activity",
                  "data.summary": {
                    type: a.type,
                    sport_type: a.sport_type,
                    distance: a.distance,
                    moving_time: a.moving_time,
                    elapsed_time: a.elapsed_time,
                    total_elevation_gain: a.total_elevation_gain,
                    average_speed: a.average_speed,
                    max_speed: a.max_speed,
                    average_heartrate: a.average_heartrate,
                    max_heartrate: a.max_heartrate,
                    start_date: a.start_date,
                    start_date_local: a.start_date_local,
                    has_heartrate: a.has_heartrate,
                    kudos_count: a.kudos_count,
                    suffer_score: a.suffer_score,
                    average_watts: a.average_watts,
                    calories: a.calories,
                    gear_id: a.gear_id,
                  },
                  lastFetchedAt: new Date(),
                },
              },
              upsert: true,
            },
          }));

        if (bulkOps.length > 0) {
          await Activity.bulkWrite(bulkOps, { ordered: false });
        }
      }
    }

    return NextResponse.json(activities);
  } catch (err) {
    console.error("Error fetching activities:", err);
    return NextResponse.json(
      { error: "Failed to fetch activities from Strava" },
      { status: 500 }
    );
  }
}
