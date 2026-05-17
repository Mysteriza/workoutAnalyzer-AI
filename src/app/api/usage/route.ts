import { NextResponse } from "next/server";
import { requireAuth, serverError } from "@/lib/api-utils";
import { checkRateLimit, getClientIp, buildRateLimitKey } from "@/lib/rate-limit";
import dbConnect from "@/lib/db";
import GlobalUsage from "@/models/GlobalUsage";
import { getPacificDateKey } from "@/lib/usage";

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(buildRateLimitKey(ip, "usage"));
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { session, error } = await requireAuth();
    if (error) return error;

    await dbConnect();

    const today = getPacificDateKey();
    const usage = await GlobalUsage.findOne({ date: today });

    return NextResponse.json({
      geminiCount: usage?.geminiCount || 0,
      groqCount: usage?.groqCount || 0,
      date: today,
    });
  } catch (err) {
    return serverError(err, "usage");
  }
}
