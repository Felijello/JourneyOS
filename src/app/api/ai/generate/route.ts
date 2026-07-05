import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  const body = (await request.json().catch(() => null)) as {
    prompt?: string;
    context?: string;
  } | null;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "AI vorbereitet – GEMINI_API_KEY fehlt. Lege den Key in Vercel oder .env.local an.",
      },
      { status: 400 },
    );
  }

  const prompt = [
    "Schreibe locker, persönlich und auf Deutsch wie ein guter Travel Buddy.",
    "Kling nicht wie ein Reisebüro. Sei hilfreich, ehrlich und konkret.",
    body?.context ? `Kontext: ${body.context}` : "",
    body?.prompt ? `Aufgabe: ${body.prompt}` : "Erstelle eine kurze Reiseidee.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    },
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Gemini konnte gerade keine Antwort liefern." },
      { status: 502 },
    );
  }

  const data = await response.json();
  const result =
    data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text)
      .filter(Boolean)
      .join("\n") ?? "";

  return NextResponse.json({ result });
}
