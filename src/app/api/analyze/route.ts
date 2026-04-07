import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Analysis from "@/models/Analysis";
import { MODEL_ID } from "@/app/api/model/route";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * GET — Check if analysis already exists in MongoDB for this activity.
 * Returns cached analysis or 404 if not found.
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const activityId = searchParams.get("activityId");

    if (!activityId || !Number.isInteger(Number(activityId)) || Number(activityId) <= 0) {
      return NextResponse.json(
        { error: "Valid activityId is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const analysis = await Analysis.findOne({
      userId: session.user.id,
      activityId: Number(activityId),
    });

    if (!analysis || !analysis.content?.trim()) {
      return NextResponse.json({ found: false }, { status: 404 });
    }

    return NextResponse.json({
      found: true,
      content: analysis.content,
      updatedAt: analysis.updatedAt,
    });
  } catch (error) {
    console.error("[Analyze GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analysis" },
      { status: 500 }
    );
  }
}

/**
 * POST — Generate new AI analysis and save to MongoDB.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, activityId, forceRefresh } = body;
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Validate activityId — must be a positive integer
    if (
      activityId === undefined ||
      activityId === null ||
      !Number.isInteger(activityId) ||
      activityId <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid activityId. Must be a positive integer." },
        { status: 400 }
      );
    }

    // userId is always available from JWT (set during sign-in)
    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json(
        { error: "User session invalid. Please sign in again." },
        { status: 401 }
      );
    }

    await dbConnect();

    // Check for existing analysis with atomic cooldown check
    const existingAnalysis = await Analysis.findOne({ userId, activityId });

    if (existingAnalysis && existingAnalysis.content?.trim().length > 0) {
      if (forceRefresh) {
        const lastUpdate = new Date(existingAnalysis.updatedAt).getTime();
        const now = Date.now();
        const diffSeconds = (now - lastUpdate) / 1000;

        if (diffSeconds < 5) {
          return NextResponse.json(
            {
              error: "Cooldown active",
              retryAfter: Math.ceil(5 - diffSeconds),
              content: existingAnalysis.content,
            },
            { status: 429 }
          );
        }
      } else {
        return NextResponse.json({
          content: existingAnalysis.content,
          isCached: true,
          updatedAt: existingAnalysis.updatedAt,
        });
      }
    }

    // Check quota using global atomic increment (shared API key)
    const { getOrCreateGlobalUsage, isQuotaExceeded, DAILY_QUOTA } =
      await import("@/lib/usage");

    await getOrCreateGlobalUsage();
    if (await isQuotaExceeded()) {
      return NextResponse.json(
        {
          error: `Daily analysis quota exceeded (${DAILY_QUOTA}/${DAILY_QUOTA}). Please try again tomorrow.`,
          code: "QUOTA_EXCEEDED",
        },
        { status: 429 }
      );
    }

    // Generate AI analysis
    console.log(`[Analyze] Using model: ${MODEL_ID} for activity: ${activityId}`);
    const model = genAI.getGenerativeModel({ model: MODEL_ID });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log(`[Analyze] Successfully generated analysis for activity: ${activityId}`);

    // Save analysis
    await Analysis.findOneAndUpdate(
      { userId, activityId },
      { content: text },
      { upsert: true, new: true }
    );

    // Increment global quota atomically
    await (await import("@/lib/usage")).incrementGlobalUsage();

    return NextResponse.json({
      content: text,
      isCached: false,
      updatedAt: new Date(),
    });
  } catch (error: unknown) {
    console.error("[Analyze] Error details:", error);

    let errorMessage = "Failed to generate analysis";
    let errorCode = "UNKNOWN_ERROR";

    if (error instanceof Error) {
      const message = error.message;

      if (
        message.includes("429") ||
        message.includes("Too Many Requests") ||
        message.includes("quota")
      ) {
        errorCode = "RATE_LIMIT";
        const retryMatch = message.match(/retry in (\d+)/i);
        const retrySeconds = retryMatch ? retryMatch[1] : "5";
        errorMessage = `API rate limit exceeded. Please wait ${retrySeconds} seconds before trying again.`;
      } else if (message.includes("404") || message.includes("not found")) {
        errorCode = "MODEL_NOT_FOUND";
        errorMessage = `Model '${MODEL_ID}' not available. Please contact support.`;
      } else if (
        message.includes("401") ||
        message.includes("403") ||
        message.includes("API key") ||
        message.includes("api_key") ||
        message.includes("invalid")
      ) {
        errorCode = "AUTH_ERROR";
        errorMessage = "API authentication failed. Check your GEMINI_API_KEY.";
      } else if (message.includes("500") || message.includes("503")) {
        errorCode = "SERVER_ERROR";
        errorMessage =
          "Gemini API is temporarily unavailable. Please try again later.";
      } else {
        errorMessage =
          message.length > 200 ? message.substring(0, 200) + "..." : message;
      }
    }

    console.error(`[Analyze] Returning error: ${errorCode} - ${errorMessage}`);

    return NextResponse.json(
      { error: errorMessage, code: errorCode },
      { status: 500 }
    );
  }
}
