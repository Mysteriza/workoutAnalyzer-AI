import { NextResponse } from "next/server";

export const MODEL_ID = "gemini-3.1-flash-lite-preview";
export const MODEL_NAME = "Gemini 3.1 Flash Lite";
export const MODEL_LIMITS = {
  rpm: 15,
  tpm: 250000,
  rpd: 500,
};

export async function GET() {
  return NextResponse.json({
    id: MODEL_ID,
    name: MODEL_NAME,
    limits: MODEL_LIMITS,
  });
}
