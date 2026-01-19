import { NextResponse } from "next/server";

export const MODEL_ID = "gemini-3-flash-preview";
export const MODEL_NAME = "Gemini 3 Flash";
export const MODEL_LIMITS = {
  rpm: 5,
  tpm: 250000,
  rpd: 20,
};

export async function GET() {
  return NextResponse.json({ 
    id: MODEL_ID,
    name: MODEL_NAME,
    limits: MODEL_LIMITS
  });
}
