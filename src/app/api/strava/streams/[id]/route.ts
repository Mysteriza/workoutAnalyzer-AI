import { NextRequest, NextResponse } from "next/server";
import { requireAuth, serverError } from "@/lib/api-utils";
import { checkRateLimit, getClientIp, buildRateLimitKey } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import dbConnect from "@/lib/db";
import Activity from "@/models/Activity";
import User from "@/models/User";
import { getValidStravaAccessToken } from "@/lib/stravaToken";
import { STRAVA_API_BASE } from "@/utils/strava";

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
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(buildRateLimitKey(ip, "strava-streams"));
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: "Invalid activity ID" }, { status: 400 });
    }

    const { session, error } = await requireAuth();
    if (error) return error;

    await dbConnect();
    const accessToken = await getValidStravaAccessToken(session!.user.stravaId);

    let userId = session!.user.id;
    if (!userId && session!.user.stravaId) {
      const user = await User.findOne({ stravaId: session!.user.stravaId });
      if (user) userId = user._id.toString();
    }

    if (!userId) {
      return NextResponse.json({ error: "User profile not found in DB" }, { status: 401 });
    }

    const existingActivity = await Activity.findOne({ stravaId: id, userId });

    if (existingActivity?.data?.id) {
      logger.info("Streams", `Serving activity ${id} from DB cache`);
      return NextResponse.json({
        activity: existingActivity.data,
        streams: existingActivity.streams || {},
      });
    }

    logger.info("Streams", `Fetching activity ${id} from Strava API...`);
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

    const streams: Record<string, number[]> = {
      time: [],
      distance: [],
    };

    if (streamsResponse.ok) {
      const rawStreams: Record<string, StravaStreamItem> =
        await streamsResponse.json();

      for (const [key, value] of Object.entries(rawStreams)) {
        if (value && Array.isArray(value.data)) {
          streams[key] = value.data;
        }
      }
    }

    await Activity.findOneAndUpdate(
      { stravaId: id, userId },
      {
        $set: {
          name: activityDetail.name,
          data: activityDetail,
          streams,
          lastFetchedAt: new Date(),
        },
      },
      { upsert: true }
    );

    logger.info("Streams", `Activity ${id} cached to DB.`);

    return NextResponse.json({
      activity: activityDetail,
      streams,
    });
  } catch (err) {
    return serverError(err, "strava streams");
  }
}
