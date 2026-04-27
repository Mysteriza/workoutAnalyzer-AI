import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrCreateGlobalUsage, getPacificDateKey } from "@/lib/usage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const globalUsage = await getOrCreateGlobalUsage();
    const todayPacific = getPacificDateKey();

    return NextResponse.json({
      geminiCount: globalUsage.geminiCount || 0,
      groqCount: globalUsage.groqCount || 0,
      lastReset: globalUsage.lastReset || todayPacific,
      geminiLimit: 500,
      groqLimit: 300,
    });
  } catch {
    return NextResponse.json({ error: "Failed to get usage" }, { status: 500 });
  }
}
