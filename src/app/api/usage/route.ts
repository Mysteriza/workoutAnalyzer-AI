import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrCreateGlobalUsage, getPacificDateKey, DAILY_QUOTA } from "@/lib/usage";

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
      limit: DAILY_QUOTA,
      remaining: Math.max(0, DAILY_QUOTA - (globalUsage.usageCount || 0)),
    });
  } catch {
    return NextResponse.json({ error: "Failed to get usage" }, { status: 500 });
  }
}
