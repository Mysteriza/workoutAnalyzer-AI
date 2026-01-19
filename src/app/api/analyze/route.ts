import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Analysis from "@/models/Analysis";
import User from "@/models/User";

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

    // Get User ID
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

    // 1. Check Caching
    const existingAnalysis = await Analysis.findOne({ userId, activityId });

    if (existingAnalysis) {
        // COOLDOWN CHECK
        // If forceRefresh is requested, check if enough time passed (60s)
        if (forceRefresh) {
            const lastUpdate = new Date(existingAnalysis.updatedAt).getTime();
            const now = Date.now();
            const diff = (now - lastUpdate) / 1000; // seconds

            if (diff < 60) {
                return NextResponse.json({ 
                    error: "Cooldown active", 
                    retryAfter: Math.ceil(60 - diff),
                    content: existingAnalysis.content 
                }, { status: 429 });
            }
        } else {
            // Return cached content if forceRefresh is false
            console.log("Serving Analysis from Cache");
            return NextResponse.json({ 
                content: existingAnalysis.content,
                isCached: true,
                updatedAt: existingAnalysis.updatedAt
            });
        }
    }

    // Generate Content
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Save/Update DB
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

  } catch (error) {
    console.error("Analysis Error:", error);
    return NextResponse.json(
      { error: "Failed to generate analysis" },
      { status: 500 }
    );
  }
}
