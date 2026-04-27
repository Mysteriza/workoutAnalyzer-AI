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
    let { age, weight, height, restingHeartRate, preferredActivity } = data;

    age = Number(age);
    weight = Number(weight);
    height = Number(height);
    restingHeartRate = Number(restingHeartRate);

    if (
      isNaN(age) || age < 10 || age > 120 ||
      isNaN(weight) || weight < 30 || weight > 250 ||
      isNaN(height) || height < 100 || height > 250 ||
      isNaN(restingHeartRate) || restingHeartRate < 30 || restingHeartRate > 200
    ) {
      return NextResponse.json(
        { error: "Invalid physiological data. Please provide realistic values." },
        { status: 400 }
      );
    }

    const stravaId = session.user.stravaId;

    // Explicit save always marks as configured
    const user = await User.findOneAndUpdate(
      { stravaId },
      {
        $set: {
          "profile.age": age,
          "profile.weight": weight,
          "profile.height": height,
          "profile.restingHeartRate": restingHeartRate,
          "profile.preferredActivity": preferredActivity,
          "profile.isConfigured": true,
        },
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: user.profile,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
