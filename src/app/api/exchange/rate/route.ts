import { NextRequest, NextResponse } from "next/server";

const currencyCode = /^[A-Z]{3}$/;

export async function GET(request: NextRequest) {
  const base = request.nextUrl.searchParams.get("base")?.toUpperCase() ?? "EUR";
  const quote = request.nextUrl.searchParams.get("quote")?.toUpperCase() ?? "EUR";
  if (!currencyCode.test(base) || !currencyCode.test(quote)) {
    return NextResponse.json({ error: "Ungültige Währung." }, { status: 400 });
  }
  if (base === quote) return NextResponse.json({ base, quote, rate: 1 });

  try {
    const response = await fetch(`https://api.frankfurter.dev/v2/rate/${base}/${quote}`, {
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 60 * 60 * 6 },
    });
    if (!response.ok) throw new Error("Wechselkurs nicht verfügbar.");
    const payload = (await response.json()) as { rate?: number };
    if (typeof payload.rate !== "number") throw new Error("Wechselkurs nicht verfügbar.");
    return NextResponse.json({ base, quote, rate: payload.rate });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Wechselkurs nicht verfügbar." },
      { status: 502 },
    );
  }
}
