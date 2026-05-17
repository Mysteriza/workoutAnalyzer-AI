import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return { session: null, error: unauthorized() };
  }
  return { session, error: null };
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function tooMany(message = "Too many requests") {
  return NextResponse.json({ error: message }, { status: 429 });
}

export function serverError(error: unknown, context = "request") {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`[API ${context}]`, message);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
