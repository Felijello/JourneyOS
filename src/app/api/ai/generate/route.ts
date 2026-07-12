import { NextResponse } from "next/server";
import { fetchWithTimeout, isRateLimited, readJsonBody } from "@/lib/server/request-guard";
import { getApiUser } from "@/lib/server/api-auth";

type AiRequest = {
  prompt?: string;
  context?: string;
};

const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) return NextResponse.json({ error: "Bitte melde dich erneut an." }, { status: 401 });
  if (isRateLimited(request, "ai-generate", 8)) {
    return NextResponse.json(
      { error: "Zu viele AI-Anfragen. Bitte warte kurz." },
      { status: 429 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI ist noch nicht konfiguriert." },
      { status: 503 },
    );
  }

  const parsed = await readJsonBody<AiRequest>(request, 5_000);
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const safeContext = parsed.data.context?.trim().slice(0, 2_500) ?? "";
  const safeTask = parsed.data.prompt?.trim().slice(0, 700) ?? "";
  if (!safeTask) {
    return NextResponse.json(
      { error: "Bitte gib eine konkrete AI-Aufgabe an." },
      { status: 400 },
    );
  }

  const prompt = [
    "Schreibe locker, persönlich und auf Deutsch wie ein guter Travel Buddy.",
    "Kling nicht wie ein Reisebüro. Sei hilfreich, ehrlich und konkret.",
    "Nutze nur den gegebenen Kontext. Erfinde keine privaten Details.",
    safeContext ? `Kontext: ${safeContext}` : "",
    `Aufgabe: ${safeTask}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    for (const model of models) {
      const response = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        },
      );

      if (!response.ok) continue;
      const data = await response.json();
      const result =
        data?.candidates?.[0]?.content?.parts
          ?.map((part: { text?: string }) => part.text)
          .filter(Boolean)
          .join("\n")
          .trim() ?? "";

      if (result) return NextResponse.json({ result });
    }
  } catch {
    return NextResponse.json(
      { error: "Die AI-Antwort hat zu lange gedauert." },
      { status: 504 },
    );
  }

  return NextResponse.json(
    { error: "Gemini konnte gerade keine Antwort liefern." },
    { status: 502 },
  );
}
