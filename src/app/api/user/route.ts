import { NextResponse } from "next/server";
import { requireAuth, badRequest, serverError } from "@/lib/api-utils";
import { checkRateLimit, getClientIp, buildRateLimitKey } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { profileSchema } from "@/lib/validations";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function PUT(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(buildRateLimitKey(ip, "user-update"));
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { session, error } = await requireAuth();
    if (error) return error;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON body");
    }

    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues.map((e: { message: string }) => e.message).join(", "));
    }

    const { age, weight, height, restingHeartRate, preferredActivity, isConfigured } = parsed.data;

    await dbConnect();

    await User.findByIdAndUpdate(session!.user.id, {
      $set: {
        "profile.age": age,
        "profile.weight": weight,
        "profile.height": height,
        "profile.restingHeartRate": restingHeartRate,
        "profile.preferredActivity": preferredActivity || undefined,
        "profile.isConfigured": isConfigured ?? true,
      },
    });

    logger.info("User", `Profile updated for user ${session!.user.id}`);

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (err) {
    return serverError(err, "user update");
  }
}
