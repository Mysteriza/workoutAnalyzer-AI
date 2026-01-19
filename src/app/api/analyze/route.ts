import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Analysis from "@/models/Analysis";
import User from "@/models/User";
import { MODEL_ID } from "@/app/api/model/route";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { prompt, activityId, forceRefresh } = await req.json();
    const session = await auth();

    if (!session || !session.user) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    
    await dbConnect();

    // @ts-ignore
    let userId = session.user.id;
    if (!userId) {
         // @ts-ignore
         const stravaId = session.user.stravaId;
         if (stravaId) {
            const user = await User.findOne({ stravaId });
            if (user) userId = user._id.toString();
         }
    }

    if (!userId) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingAnalysis = await Analysis.findOne({ userId, activityId });

    if (existingAnalysis) {
        if (forceRefresh) {
            const lastUpdate = new Date(existingAnalysis.updatedAt).getTime();
            const now = Date.now();
            const diff = (now - lastUpdate) / 1000;

            if (diff < 60) {
                return NextResponse.json({ 
                    error: "Cooldown active", 
                    retryAfter: Math.ceil(60 - diff),
                    content: existingAnalysis.content 
                }, { status: 429 });
            }
        } else {
            return NextResponse.json({ 
                content: existingAnalysis.content,
                isCached: true,
                updatedAt: existingAnalysis.updatedAt
            });
        }
    }

    const model = genAI.getGenerativeModel({ model: MODEL_ID });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    await Analysis.findOneAndUpdate(
        { userId, activityId },
        { content: text },
        { upsert: true, new: true }
    );

    return NextResponse.json({ 
        content: text,
        isCached: false,
        updatedAt: new Date()
    });

  } catch (error: unknown) {
    let errorMessage = "Failed to generate analysis";
    let errorCode = "UNKNOWN_ERROR";
    
    if (error instanceof Error) {
      const message = error.message;
      
      if (message.includes("429") || message.includes("Too Many Requests") || message.includes("quota")) {
        errorCode = "RATE_LIMIT";
        const retryMatch = message.match(/retry in (\d+)/i);
        const retrySeconds = retryMatch ? retryMatch[1] : "60";
        errorMessage = `API rate limit exceeded. Please wait ${retrySeconds} seconds before trying again.`;
      } else if (message.includes("404") || message.includes("not found")) {
        errorCode = "MODEL_NOT_FOUND";
        errorMessage = "AI model not available. Please contact support.";
      } else if (message.includes("401") || message.includes("403") || message.includes("API key")) {
        errorCode = "AUTH_ERROR";
        errorMessage = "API authentication failed. Please check configuration.";
      } else if (message.includes("500") || message.includes("503")) {
        errorCode = "SERVER_ERROR";
        errorMessage = "Gemini API is temporarily unavailable. Please try again later.";
      } else {
        errorMessage = message.length > 200 ? message.substring(0, 200) + "..." : message;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage, code: errorCode },
      { status: 500 }
    );
  }
}
