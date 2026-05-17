import { NextRequest, NextResponse } from "next/server";
import { requireAuth, badRequest, serverError } from "@/lib/api-utils";
import { checkRateLimit, getClientIp, buildRateLimitKey } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { paginationSchema } from "@/lib/validations";
import dbConnect from "@/lib/db";
import Activity from "@/models/Activity";
import User from "@/models/User";
import { getValidStravaAccessToken } from "@/lib/stravaToken";
import { STRAVA_API_BASE } from "@/utils/strava";

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(buildRateLimitKey(ip, "strava-activities"));
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { session, error } = await requireAuth();
    if (error) return error;

    const searchParams = request.nextUrl.searchParams;
    const rawPage = searchParams.get("page") || "1";
    const rawPerPage = searchParams.get("per_page") || "30";

    const parsed = paginationSchema.safeParse({ page: rawPage, per_page: rawPerPage });
    if (!parsed.success) {
      return badRequest("Invalid pagination parameters");
    }

    const { page, per_page } = parsed.data;

    await dbConnect();
    const accessToken = await getValidStravaAccessToken(session!.user.stravaId);

    const response = await fetch(
      `${STRAVA_API_BASE}/athlete/activities?page=${page}&per_page=${per_page}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
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

    if (activities.length > 0 && Array.isArray(activities)) {
      const userId = session!.user.id;
      const stravaId = session!.user.stravaId;

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

        logger.info("Activities", `Cached ${bulkOps.length} activities for user ${effectiveUserId}`);
      }
    }

    return NextResponse.json(activities);
  } catch (err) {
    return serverError(err, "strava activities");
  }
}
