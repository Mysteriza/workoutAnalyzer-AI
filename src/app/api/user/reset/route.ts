import { NextResponse } from "next/server";
import { requireAuth, serverError } from "@/lib/api-utils";
import { checkRateLimit, getClientIp, buildRateLimitKey } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Activity from "@/models/Activity";
import Analysis from "@/models/Analysis";
import mongoose from "mongoose";

export async function DELETE(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(buildRateLimitKey(ip, "user-reset"), {
      windowMs: 300_000,
      maxRequests: 2,
    });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests. Please wait before resetting again." }, { status: 429 });
    }

    const { session, error } = await requireAuth();
    if (error) return error;

    await dbConnect();
    const sessionDB = await mongoose.startSession();
    sessionDB.startTransaction();

    try {
      await Promise.all([
        User.findByIdAndDelete(session!.user.id).session(sessionDB),
        Activity.deleteMany({ userId: session!.user.id }).session(sessionDB),
        Analysis.deleteMany({ userId: session!.user.id }).session(sessionDB),
      ]);

      await sessionDB.commitTransaction();
      logger.info("User", `All data reset for user ${session!.user.id}`);
    } catch (txError) {
      await sessionDB.abortTransaction();
      logger.error("User", `Reset transaction failed for user ${session!.user.id}`, txError);
      throw txError;
    } finally {
      sessionDB.endSession();
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError(err, "user reset");
  }
}
