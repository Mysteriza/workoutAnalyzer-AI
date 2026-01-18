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
    const { age, weight, height, restingHeartRate } = data;

    // @ts-ignore
    const stravaId = session.user.stravaId;

    const user = await User.findOneAndUpdate(
      { stravaId },
      {
        $set: {
          "profile.age": age,
          "profile.weight": weight,
          "profile.height": height,
          "profile.restingHeartRate": restingHeartRate,
        },
      },
      { new: true }
    );

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update profile", details: error },
      { status: 500 }
    );
  }
}
