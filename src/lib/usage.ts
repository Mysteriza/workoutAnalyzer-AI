import dbConnect from "@/lib/db";
import GlobalUsage from "@/models/GlobalUsage";

export function getPacificDateKey(): string {
  const now = new Date();
  const pacificTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  return pacificTime.toISOString().split("T")[0];
}

export async function getOrCreateGlobalUsage() {
  await dbConnect();
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

export async function incrementGlobalUsage() {
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
  
  return globalUsage;
}
