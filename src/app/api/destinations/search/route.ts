import { NextRequest, NextResponse } from "next/server";
import { searchDestinations } from "@/lib/server/geocoding";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 100) {
    return NextResponse.json({ results: [] });
  }
  try {
    return NextResponse.json({ results: await searchDestinations(query) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ortssuche fehlgeschlagen." },
      { status: 502 },
    );
  }
}
