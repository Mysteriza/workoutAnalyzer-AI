import { NextResponse } from "next/server";
import { requireAuth, badRequest, notFound, serverError } from "@/lib/api-utils";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    await dbConnect();

    const user = await User.findById(session!.user.id).select("profile").lean();

    if (!user) {
      return notFound("User not found");
    }

    return NextResponse.json({
      profile: {
        age: user.profile?.age || null,
        weight: user.profile?.weight || null,
        height: user.profile?.height || null,
        restingHeartRate: user.profile?.restingHeartRate || null,
        preferredActivity: user.profile?.preferredActivity || null,
        isConfigured: user.profile?.isConfigured || false,
      },
    });
  } catch (err) {
    return serverError(err, "user profile");
  }
}
