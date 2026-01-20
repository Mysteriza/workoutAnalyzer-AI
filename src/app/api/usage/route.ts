import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import GlobalUsage from "@/models/GlobalUsage";

function getPacificDateKey(): string {
  const now = new Date();
  const pacificTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  return pacificTime.toISOString().split("T")[0];
}

async function getOrCreateGlobalUsage() {
  const todayPacific = getPacificDateKey();
  
  let globalUsage = await GlobalUsage.findOne({});
  
  if (!globalUsage) {
    globalUsage = await GlobalUsage.create({
      usageCount: 0,
      lastReset: todayPacific
    });
  } else if (globalUsage.lastReset !== todayPacific) {
    globalUsage.usageCount = 0;
    globalUsage.lastReset = todayPacific;
    await globalUsage.save();
  }
  
  return globalUsage;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const globalUsage = await getOrCreateGlobalUsage();
    const todayPacific = getPacificDateKey();

    return NextResponse.json({ 
      count: globalUsage.usageCount || 0, 
      lastReset: globalUsage.lastReset || todayPacific 
    });
  } catch {
    return NextResponse.json({ error: "Failed to get usage" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const todayPacific = getPacificDateKey();
    
    let globalUsage = await GlobalUsage.findOne({});
    
    if (!globalUsage) {
      globalUsage = await GlobalUsage.create({
        usageCount: 1,
        lastReset: todayPacific
      });
    } else if (globalUsage.lastReset !== todayPacific) {
      globalUsage.usageCount = 1;
      globalUsage.lastReset = todayPacific;
      await globalUsage.save();
    } else {
      globalUsage.usageCount = (globalUsage.usageCount || 0) + 1;
      await globalUsage.save();
    }

    return NextResponse.json({ 
      count: globalUsage.usageCount, 
      lastReset: globalUsage.lastReset 
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

    const todayPacific = getPacificDateKey();
    
    const globalUsage = await GlobalUsage.findOneAndUpdate(
      {},
      { 
        $set: { usageCount: count, lastReset: todayPacific }
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({ 
      count: globalUsage.usageCount, 
      lastReset: globalUsage.lastReset 
    });
  } catch {
    return NextResponse.json({ error: "Failed to set usage" }, { status: 500 });
  }
}
