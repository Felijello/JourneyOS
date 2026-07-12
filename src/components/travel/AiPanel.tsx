"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { useTravel } from "@/components/providers/CountryProvider";
import { Button } from "@/components/ui/Button";
import { getMissingAiKeyMessage } from "@/lib/services/ai";
import { authenticatedFetch } from "@/lib/services/authenticated-fetch";
import type { EntityType } from "@/types/country";

const aiActions = [
  {
    label: "Beschreibung",
    prompt: "Schreibe eine entspannte, persönliche Beschreibung.",
  },
  {
    label: "Place-Text",
    prompt: "Schreibe eine lockere Place-Beschreibung mit konkreten Tipps.",
  },
  {
    label: "Plan-Idee",
    prompt: "Mach einen groben, realistischen Reiseplan-Vorschlag.",
  },
  {
    label: "Ziele vergleichen",
    prompt: "Vergleiche dieses Ziel mit zwei passenden Alternativen.",
  },
  {
    label: "Datum checken",
    prompt:
      "Prüfe, ob die Reisezeit sinnvoll wirkt. Sei ehrlich, aber nicht dramatisch.",
  },
  {
    label: "Route optimieren",
    prompt:
      "Optimiere eine grobe Route oder Tagesplanung aus dem Kontext. Achte auf realistische Wege.",
  },
];

export function AiPanel({
  entityType,
  entityId,
  context,
}: {
  entityType: EntityType;
  entityId?: string;
  context: string;
}) {
  const { capabilityStatus, createAiGeneration } = useTravel();
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(prompt: string) {
    if (!capabilityStatus.ai) {
      setError(getMissingAiKeyMessage());
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authenticatedFetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, context }),
      });
      const data = (await response.json()) as { result?: string; error?: string };

      if (!response.ok || data.error) {
        setError(data.error ?? getMissingAiKeyMessage());
        return;
      }

      const generatedResult = data.result ?? "";
      setResult(generatedResult);
      await createAiGeneration({
        entityType,
        entityId,
        prompt,
        result: generatedResult,
        provider: "gemini",
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "AI konnte gerade keine Antwort liefern.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-blue-100 bg-blue-50/70 p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="text-blue-600" size={18} />
        <h2 className="text-lg font-semibold text-slate-950">AI Travel Buddy</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {capabilityStatus.ai
          ? "Gemini ist serverseitig verbunden. JourneyOS sendet nur den relevanten Kontext dieser Ansicht."
          : "AI vorbereitet - API-Key fehlt oder ist serverseitig nicht verfügbar."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {aiActions.map((action) => (
          <Button
            className="rounded-2xl"
            disabled={!capabilityStatus.ai || isLoading}
            key={action.label}
            onClick={() => generate(action.prompt)}
            variant="secondary"
          >
            {action.label}
          </Button>
        ))}
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
