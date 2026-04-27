import dbConnect from "@/lib/db";
import GlobalUsage from "@/models/GlobalUsage";

const GEMINI_QUOTA = 500;
const GROQ_QUOTA = 300;

export function getPacificDateKey(): string {
  const now = new Date();
  const pacificTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
  );
  return pacificTime.toISOString().split("T")[0];
}

/**
 * Get or create the global usage document.
 * Resets the counters if the date has changed.
 */
export async function getOrCreateGlobalUsage() {
  await dbConnect();
  const todayPacific = getPacificDateKey();

  // Atomically find or create, resetting if date changed
  const usage = await GlobalUsage.findOneAndUpdate(
    { lastReset: { $ne: todayPacific } },
    { $set: { geminiCount: 0, groqCount: 0, lastReset: todayPacific } },
    { upsert: false, new: false }
  );

  if (usage) {
    return await GlobalUsage.findOne({});
  }

  let currentUsage = await GlobalUsage.findOne({});

  if (!currentUsage) {
    currentUsage = await GlobalUsage.create({
      geminiCount: 0,
      groqCount: 0,
      lastReset: todayPacific,
    });
  } else if (currentUsage.groqCount === undefined || currentUsage.geminiCount === undefined) {
    // Fix existing documents that might be missing the fields
    currentUsage = await GlobalUsage.findOneAndUpdate(
      { _id: currentUsage._id },
      { $set: { 
        geminiCount: currentUsage.geminiCount || 0, 
        groqCount: currentUsage.groqCount || 0 
      } },
      { new: true }
    );
  }

  return currentUsage;
}

/**
 * Atomically increment the global usage counter for a specific provider.
 */
export async function incrementGlobalUsage(provider: "Gemini" | "Groq") {
  await dbConnect();
  const todayPacific = getPacificDateKey();
  
  const incField = provider === "Groq" ? "groqCount" : "geminiCount";
  const limit = provider === "Groq" ? GROQ_QUOTA : GEMINI_QUOTA;

  // Ensure the document has the fields before incrementing
  await getOrCreateGlobalUsage();

  // Atomic check-and-increment
  const result = await GlobalUsage.findOneAndUpdate(
    {
      lastReset: todayPacific,
      $or: [
        { [incField]: { $lt: limit } },
        { [incField]: { $exists: false } }
      ]
    },
    { $inc: { [incField]: 1 } },
    { new: true }
  );

  if (result) {
    return result;
  }

  // Quota exceeded or document doesn't exist — try to create it
  let usage = await GlobalUsage.findOne({ lastReset: todayPacific });

  if (!usage) {
    usage = await GlobalUsage.create({
      geminiCount: provider === "Gemini" ? 1 : 0,
      groqCount: provider === "Groq" ? 1 : 0,
      lastReset: todayPacific,
    });
    return usage;
  }

  // Document exists but date might be old — reset if needed
  if (usage.lastReset !== todayPacific) {
    usage = await GlobalUsage.findOneAndUpdate(
      { _id: usage._id },
      { $set: { geminiCount: provider === "Gemini" ? 1 : 0, groqCount: provider === "Groq" ? 1 : 0, lastReset: todayPacific } },
      { new: true }
    );
    return usage!;
  }

  // Quota truly exceeded
  return usage;
}

/**
 * Check if the daily quota has been exceeded for a specific provider.
 */
export async function isQuotaExceeded(provider: "Gemini" | "Groq"): Promise<boolean> {
  const usage = await getOrCreateGlobalUsage();
  if (provider === "Groq") {
    return usage.groqCount >= GROQ_QUOTA;
  }
  return usage.geminiCount >= GEMINI_QUOTA;
}

export { GEMINI_QUOTA, GROQ_QUOTA };
