import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

function getPacificDateKey(): string {
  const now = new Date();
  const pacificTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  return pacificTime.toISOString().split("T")[0];
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // @ts-ignore
    const stravaId = session.user.stravaId;
    const user = await User.findOne({ stravaId });

    if (!user) {
      return NextResponse.json({ count: 0, lastReset: getPacificDateKey() });
    }

    const todayPacific = getPacificDateKey();
    
    if (user.usageLastReset !== todayPacific) {
      user.usageCount = 0;
      user.usageLastReset = todayPacific;
      await user.save();
    }

    return NextResponse.json({ 
      count: user.usageCount || 0, 
      lastReset: user.usageLastReset || todayPacific 
    });
  } catch {
    return NextResponse.json({ error: "Failed to get usage" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // @ts-ignore
    const stravaId = session.user.stravaId;
    const todayPacific = getPacificDateKey();

    const user = await User.findOne({ stravaId });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.usageLastReset !== todayPacific) {
      user.usageCount = 1;
      user.usageLastReset = todayPacific;
    } else {
      user.usageCount = (user.usageCount || 0) + 1;
    }
    
    await user.save();

    return NextResponse.json({ 
      count: user.usageCount, 
      lastReset: user.usageLastReset 
    });
  } catch {
    return NextResponse.json({ error: "Failed to update usage" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { count } = await req.json();

    await dbConnect();

    // @ts-ignore
    const stravaId = session.user.stravaId;
    const todayPacific = getPacificDateKey();

    const user = await User.findOneAndUpdate(
      { stravaId },
      { 
        $set: { usageCount: count, usageLastReset: todayPacific }
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      count: user.usageCount, 
      lastReset: user.usageLastReset 
    });
  } catch {
    return NextResponse.json({ error: "Failed to set usage" }, { status: 500 });
  }
}
