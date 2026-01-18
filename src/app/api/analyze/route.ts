import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AnalysisRequest } from "@/types";
import { buildAnalysisPrompt, SYSTEM_PROMPT } from "@/utils/gemini";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key not configured" },
      { status: 500 }
    );
  }

  try {
    const body: AnalysisRequest = await request.json();
    const { activity, streamSample, userProfile } = body;

    if (!activity || !userProfile) {
      return NextResponse.json(
        { error: "Missing required data" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: SYSTEM_PROMPT,
    });

    const prompt = buildAnalysisPrompt(activity, streamSample || [], userProfile);

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ content: text });
  } catch (err: unknown) {
    console.error("Error analyzing activity:", err);
    
    let errorMessage = "Failed to analyze activity";
    if (err instanceof Error) {
      errorMessage = err.message;
      console.error("Error details:", err.stack);
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

