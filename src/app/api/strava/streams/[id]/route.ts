import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Activity from "@/models/Activity";
import User from "@/models/User";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";

interface StravaStreamItem {
  type: string;
  data: number[];
  series_type: string;
  original_size: number;
  resolution: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid authorization header" },
      { status: 401 }
    );
  }

  const accessToken = authHeader.replace("Bearer ", "");

  try {
    // 1. Check Cache in DB First
    await dbConnect();
    const existingActivity = await Activity.findOne({ stravaId: id });

    // Caching Strategy: Return cached if exists.
    // User requested "not fetch API again" when revisiting.
    // We assume activity details (streams) don't change often.
    if (existingActivity) {
      console.log(`Serving activity ${id} from DB cache.`);
      return NextResponse.json({
        activity: existingActivity.data,
        streams: existingActivity.streams || {},
      });
    }

    // 2. Fetch from Strava API (Cache Miss)
    console.log(`Fetching activity ${id} from Strava API...`);
    const [activityResponse, streamsResponse] = await Promise.all([
      fetch(`${STRAVA_API_BASE}/activities/${id}?include_all_efforts=true`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      fetch(
        `${STRAVA_API_BASE}/activities/${id}/streams?keys=time,distance,heartrate,velocity_smooth,altitude,cadence,watts&key_by_type=true`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      ),
    ]);

    if (!activityResponse.ok) {
      const errorData = await activityResponse.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch activity details" },
        { status: activityResponse.status }
      );
    }

    const activityDetail = await activityResponse.json();
    
    // Process Streams
    const streams: Record<string, number[]> = {
      time: [],
      distance: [],
    };
    
    if (streamsResponse.ok) {
      const rawStreams: Record<string, StravaStreamItem> = await streamsResponse.json();
      
      for (const [key, value] of Object.entries(rawStreams)) {
        if (value && Array.isArray(value.data)) {
          streams[key] = value.data;
        }
      }
    }

    // 3. Save to DB for Caching
    // We need userId to associate.
    // We can get it from Session OR look up User by stravaId (which is usually in activityDetail.athlete.id)
    const session = await auth();
    let userId = session?.user?.id;

    if (!userId && activityDetail.athlete?.id) {
       // Look up internal user ID by Strava ID
       const user = await User.findOne({ stravaId: activityDetail.athlete.id.toString() });
       if (user) userId = user._id.toString();
    }

    if (userId) {
      await Activity.create({
        userId,
        stravaId: id,
        name: activityDetail.name,
        data: activityDetail,
        streams: streams,
        lastFetchedAt: new Date(),
      });
      console.log(`Activity ${id} cached to DB.`);
    }

    return NextResponse.json({
      activity: activityDetail,
      streams,
    });
  } catch (err) {
    console.error("Error fetching activity details:", err);
    return NextResponse.json(
      { error: "Failed to fetch activity details from Strava" },
      { status: 500 }
    );
  }
}
