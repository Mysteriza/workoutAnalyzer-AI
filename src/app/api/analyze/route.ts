import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Analysis from "@/models/Analysis";
import User from "@/models/User";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    // Parse body once
    const { prompt, activityId } = await req.json();
    const session = await auth();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Generate Content
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Save to DB if user is logged in
    if (session && session.user && activityId) {
      await dbConnect();
      
      // Get User ID from DB (safest) or Session
      // @ts-ignore
      let userId = session.user.id; 

      if (!userId) {
         // Fallback look up by stravaId if session id is missing for some reason
         // @ts-ignore
         const stravaId = session.user.stravaId;
         if (stravaId) {
            const user = await User.findOne({ stravaId });
            if (user) userId = user._id.toString();
         }
      }

      if (userId) {
        // Save or Update Analysis
        await Analysis.findOneAndUpdate(
          { userId, activityId },
          { content: text },
          { upsert: true, new: true }
        );
      }
    }

    return NextResponse.json({ content: text });
  } catch (error) {
    console.error("Analysis Error:", error);
    return NextResponse.json(
      { error: "Failed to generate analysis" },
      { status: 500 }
    );
  }
}
