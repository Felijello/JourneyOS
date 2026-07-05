"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useTravel } from "@/components/providers/CountryProvider";
import { getMissingAiKeyMessage } from "@/lib/services/ai";
import type { EntityType } from "@/types/country";

export function AiPanel({
  entityType,
  entityId,
  context,
}: {
  entityType: EntityType;
  entityId?: string;
  context: string;
}) {
  const { createAiGeneration } = useTravel();
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(prompt: string) {
    setIsLoading(true);
    setError(null);
    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, context }),
    });
    const data = (await response.json()) as { result?: string; error?: string };
    setIsLoading(false);
    if (!response.ok || data.error) {
      setError(data.error ?? getMissingAiKeyMessage());
      return;
    }
    setResult(data.result ?? "");
    createAiGeneration({
      entityType,
      entityId,
      prompt,
      result: data.result ?? "",
      provider: "gemini",
    });
  }

  return (
    <section className="rounded-3xl border border-blue-100 bg-blue-50/70 p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="text-blue-600" size={18} />
        <h2 className="text-lg font-semibold text-slate-950">AI Travel Buddy</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Lockerer deutscher Ton ist vorbereitet. Ohne Gemini-Key bleiben die Buttons
        als Setup-Hinweis nutzbar.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          className="rounded-2xl"
          disabled={isLoading}
          onClick={() => generate("Schreibe eine entspannte Beschreibung.")}
          variant="secondary"
        >
          Beschreibung
        </Button>
        <Button
          className="rounded-2xl"
          disabled={isLoading}
          onClick={() => generate("Mach einen groben Reiseplan-Vorschlag.")}
          variant="secondary"
        >
          Plan-Idee
        </Button>
        <Button
          className="rounded-2xl"
          disabled={isLoading}
          onClick={() => generate("Prüfe, ob die Reisezeit sinnvoll wirkt.")}
          variant="secondary"
        >
          Datum checken
        </Button>
      </div>
      {error ? <p className="mt-3 text-sm font-medium text-blue-700">{error}</p> : null}
      {result ? (
        <p className="mt-4 whitespace-pre-line rounded-2xl bg-white p-4 text-sm leading-7 text-slate-700">
          {result}
        </p>
      ) : null}
    </section>
  );
}
