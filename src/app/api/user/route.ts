import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  try {
    const data = await req.json();
    const { age, weight, height, restingHeartRate, preferredActivity } = data;

    const stravaId = session.user.stravaId;

    // Mark as configured if meaningful values are provided
    const isConfigured =
      (age !== undefined && age !== 25) ||
      (weight !== undefined && weight !== 70) ||
      (restingHeartRate !== undefined && restingHeartRate !== 60);

    const user = await User.findOneAndUpdate(
      { stravaId },
      {
        $set: {
          "profile.age": age,
          "profile.weight": weight,
          "profile.height": height,
          "profile.restingHeartRate": restingHeartRate,
          "profile.preferredActivity": preferredActivity,
          "profile.isConfigured": isConfigured,
        },
      },
      { new: true }
    );

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
