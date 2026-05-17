import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { requireAuth, badRequest, notFound, serverError, tooMany } from "@/lib/api-utils";
import { checkRateLimit, getClientIp, buildRateLimitKey } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { analysisRequestSchema } from "@/lib/validations";
import dbConnect from "@/lib/db";
import Analysis from "@/models/Analysis";
import Activity from "@/models/Activity";
import { MODEL_ID } from "@/app/api/model/route";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function GET(req: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const rawId = searchParams.get("activityId");

    if (!rawId || !/^\d+$/.test(rawId)) {
      return badRequest("Valid activityId is required");
    }

    await dbConnect();

    const analysis = await Analysis.findOne({
      userId: session!.user.id,
      activityId: Number(rawId),
    });

    if (!analysis?.content?.trim()) {
      return NextResponse.json({ found: false }, { status: 404 });
    }

    return NextResponse.json({
      found: true,
      content: analysis.content,
      provider: analysis.provider || "Gemini",
      aiModel: analysis.aiModel || "gemini-3.0-flash",
      updatedAt: analysis.updatedAt,
    });
  } catch (error) {
    return serverError(error, "analyze GET");
  }
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(buildRateLimitKey(ip, "analyze"), { windowMs: 10_000, maxRequests: 5 });
    if (!rl.allowed) return tooMany();

    const { session, error } = await requireAuth();
    if (error) return error;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("Invalid JSON body");
    }

    const parsed = analysisRequestSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues.map((e: { message: string }) => e.message).join(", "));
    }

    const { prompt, systemInstruction, activityId, forceRefresh } = parsed.data;

    await dbConnect();

    const ownedActivity = await Activity.exists({
      userId: session!.user.id,
      stravaId: activityId.toString(),
    });

    if (!ownedActivity) {
      return notFound("Activity not found for this user");
    }

    const existingAnalysis = await Analysis.findOne({ userId: session!.user.id, activityId });

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
              provider: existingAnalysis.provider || "Gemini",
              aiModel: existingAnalysis.aiModel || "gemini-3.0-flash",
            },
            { status: 429 }
          );
        }
      } else {
        return NextResponse.json({
          content: existingAnalysis.content,
          isCached: true,
          provider: existingAnalysis.provider || "Gemini",
          aiModel: existingAnalysis.aiModel || "gemini-3.0-flash",
          updatedAt: existingAnalysis.updatedAt,
        });
      }
    }

    const { getOrCreateGlobalUsage, isQuotaExceeded, GEMINI_QUOTA, GROQ_QUOTA } =
      await import("@/lib/usage");

    await getOrCreateGlobalUsage();

    const geminiExceeded = await isQuotaExceeded("Gemini");
    const groqExceeded = await isQuotaExceeded("Groq");

    if (geminiExceeded && groqExceeded) {
      return NextResponse.json(
        {
          error: `All AI provider quotas exceeded (Gemini: ${GEMINI_QUOTA}, Groq: ${GROQ_QUOTA}). Please try again tomorrow.`,
          code: "QUOTA_EXCEEDED",
        },
        { status: 429 }
      );
    }

    let text = "";
    let usedModel = MODEL_ID;
    let geminiFailed = false;
    let geminiErrorMessage = "";

    const fullPrompt = systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt;

    if (!geminiExceeded) {
      try {
        logger.info("Analyze", `Using Gemini: ${MODEL_ID} for activity ${activityId}`);
        const model = genAI.getGenerativeModel({ model: MODEL_ID });
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        text = response.text();
        logger.info("Analyze", `Success via Gemini for activity ${activityId}`);
      } catch (geminiError: any) {
        logger.error("Analyze", `Gemini failed: ${geminiError.message}`);
        geminiFailed = true;
        geminiErrorMessage = geminiError.message;
      }
    } else {
      geminiFailed = true;
      geminiErrorMessage = "Gemini quota exceeded.";
    }

    if (geminiFailed) {
      const groqApiKey = process.env.GROQ_API_KEY;
      if (!groqApiKey || groqApiKey === "your_groq_api_key_here") {
        throw new Error(`Gemini failed and Groq fallback is not configured. Original error: ${geminiErrorMessage}`);
      }

      logger.info("Analyze", "Falling back to Groq API...");
      usedModel = "llama-3.3-70b-versatile";

      if (groqExceeded) {
        throw new Error(`Fallback unavailable: Groq daily limit reached. Original Gemini error: ${geminiErrorMessage}`);
      }

      const groqMessages = [];
      if (systemInstruction) {
        groqMessages.push({ role: "system", content: systemInstruction });
      }
      groqMessages.push({ role: "user", content: prompt });

      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: usedModel,
          messages: groqMessages,
          temperature: 0.7,
        }),
      });

      if (!groqResponse.ok) {
        const errorData = await groqResponse.json().catch(() => ({}));
        logger.error("Analyze", `Groq fallback failed: ${groqResponse.statusText}`, errorData);
        throw new Error(`Fallback to Groq failed: ${errorData.error?.message || groqResponse.statusText}. Original Gemini error: ${geminiErrorMessage}`);
      }

      const groqData = await groqResponse.json();
      text = groqData.choices[0].message.content;
      logger.info("Analyze", `Success via Groq (${usedModel}) for activity ${activityId}`);
    }

    const currentProvider = usedModel.includes("llama") ? "Groq" : "Gemini";

    await Analysis.findOneAndUpdate(
      { userId: session!.user.id, activityId },
      {
        content: text,
        provider: currentProvider,
        aiModel: usedModel,
      },
      { upsert: true, returnDocument: "after" }
    );

    await (await import("@/lib/usage")).incrementGlobalUsage(currentProvider as "Gemini" | "Groq");

    return NextResponse.json({
      content: text,
      isCached: false,
      updatedAt: new Date(),
      aiModel: usedModel,
      provider: currentProvider,
    });
  } catch (error: unknown) {
    logger.error("Analyze", "Error details", error);

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
        errorMessage = "Gemini API is temporarily unavailable. Please try again later.";
      } else {
        errorMessage = message.length > 200 ? message.substring(0, 200) + "..." : message;
      }
    }

    logger.error("Analyze", `${errorCode} - ${errorMessage}`);

    return NextResponse.json(
      { error: errorMessage, code: errorCode },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const rawId = searchParams.get("activityId");

    if (!rawId || !/^\d+$/.test(rawId)) {
      return badRequest("Valid activityId is required");
    }

    await dbConnect();

    await Analysis.deleteOne({
      userId: session!.user.id,
      activityId: Number(rawId),
    });

    logger.info("Analyze", `Deleted analysis for activity ${rawId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError(error, "analyze DELETE");
  }
}
