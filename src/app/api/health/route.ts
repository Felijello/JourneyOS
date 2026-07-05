import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ai: Boolean(process.env.GEMINI_API_KEY),
    routing: Boolean(process.env.OPENROUTESERVICE_API_KEY),
  });
}
