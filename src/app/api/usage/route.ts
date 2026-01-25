import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrCreateGlobalUsage, getPacificDateKey } from "@/lib/usage";
import GlobalUsage from "@/models/GlobalUsage";
import dbConnect from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const globalUsage = await getOrCreateGlobalUsage();
    const todayPacific = getPacificDateKey();

    return NextResponse.json({
      count: globalUsage.usageCount || 0,
      lastReset: globalUsage.lastReset || todayPacific,
    });
  } catch {
    return NextResponse.json({ error: "Failed to get usage" }, { status: 500 });
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

    const todayPacific = getPacificDateKey();

    const globalUsage = await GlobalUsage.findOneAndUpdate(
      {},
      {
        $set: { usageCount: count, lastReset: todayPacific },
      },
      { new: true, upsert: true },
    );

    return NextResponse.json({
      count: globalUsage.usageCount,
      lastReset: globalUsage.lastReset,
    });
  } catch {
    return NextResponse.json({ error: "Failed to set usage" }, { status: 500 });
  }
}
