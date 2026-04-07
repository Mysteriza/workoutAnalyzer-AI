import dbConnect from "@/lib/db";
import GlobalUsage from "@/models/GlobalUsage";

const DAILY_QUOTA = 500;

export function getPacificDateKey(): string {
  const now = new Date();
  const pacificTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
  );
  return pacificTime.toISOString().split("T")[0];
}

/**
 * Get or create the global usage document.
 * Resets the counter if the date has changed.
 */
export async function getOrCreateGlobalUsage() {
  await dbConnect();
  const todayPacific = getPacificDateKey();

  // Atomically find or create, resetting if date changed
  const usage = await GlobalUsage.findOneAndUpdate(
    { lastReset: { $ne: todayPacific } },
    { $set: { usageCount: 0, lastReset: todayPacific } },
    { upsert: false, new: false }
  );

  if (usage) {
    return await GlobalUsage.findOne({});
  }

  let currentUsage = await GlobalUsage.findOne({});

  if (!currentUsage) {
    currentUsage = await GlobalUsage.create({
      usageCount: 0,
      lastReset: todayPacific,
    });
  }

  return currentUsage;
}

/**
 * Atomically increment the global usage counter.
 * Returns the updated usage document, or null if quota exceeded.
 */
export async function incrementGlobalUsage() {
  await dbConnect();
  const todayPacific = getPacificDateKey();

  // Atomic check-and-increment: only increment if under quota AND date matches
  const result = await GlobalUsage.findOneAndUpdate(
    {
      lastReset: todayPacific,
      usageCount: { $lt: DAILY_QUOTA },
    },
    { $inc: { usageCount: 1 } },
    { new: true }
  );

  if (result) {
    return result;
  }

  // Quota exceeded or document doesn't exist — try to create it
  let usage = await GlobalUsage.findOne({ lastReset: todayPacific });

  if (!usage) {
    usage = await GlobalUsage.create({
      usageCount: 1,
      lastReset: todayPacific,
    });
    return usage;
  }

  // Document exists but date might be old — reset if needed
  if (usage.lastReset !== todayPacific) {
    usage = await GlobalUsage.findOneAndUpdate(
      { _id: usage._id },
      { $set: { usageCount: 1, lastReset: todayPacific } },
      { new: true }
    );
    return usage!;
  }

  // Quota truly exceeded
  return usage;
}

/**
 * Check if the daily quota has been exceeded.
 */
export async function isQuotaExceeded(): Promise<boolean> {
  const usage = await getOrCreateGlobalUsage();
  return usage.usageCount >= DAILY_QUOTA;
}

export { DAILY_QUOTA };
