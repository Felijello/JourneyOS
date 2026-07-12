"use client";

import { useState, type ReactNode } from "react";
import { CalendarDays, CloudSun, Loader2, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { authenticatedFetch } from "@/lib/services/authenticated-fetch";

type TravelSearchResult = {
  destination?: {
    name: string;
    country?: string;
    admin1?: string;
    latitude: number;
    longitude: number;
  };
  weather?: {
    temperature?: number;
    windSpeed?: number;
    precipitation?: number;
  };
  description?: string;
  bestTravelTime?: string;
  weatherSummary?: string;
  answer?: string;
  aiAvailable?: boolean;
  error?: string;
};

export function TravelSearch({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<TravelSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setIsOpen(true);
    setIsLoading(true);
    setResult(null);

    try {
      let response: Response;
      try {
        response = await authenticatedFetch("/api/travel-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmedQuery }),
        });
      } catch {
        response = await fetch("/api/travel-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmedQuery }),
        });
      }
      const data = (await response.json()) as TravelSearchResult;
      setResult(
        response.ok
          ? data
          : { error: data.error ?? "Die Suche konnte nichts finden." },
      );
    } catch {
      setResult({ error: "Die Suche ist gerade nicht erreichbar." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("relative min-w-0 flex-1", className)}>
      <form
        className="flex h-12 min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white/86 px-4 shadow-sm"
        onSubmit={handleSubmit}
      >
        <Search aria-hidden="true" className="text-slate-400" size={18} />
        <input
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            if (result) setIsOpen(true);
          }}
          placeholder="Land oder Stadt suchen..."
          value={query}
        />
        <button
          className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? "Suche..." : "AI"}
        </button>
      </form>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-14 z-50 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">
                Reisezeit & Kurzbeschreibung
              </p>
              <button
                className="text-xs font-semibold text-slate-400 hover:text-slate-700"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                Schließen
              </button>
            </div>
          </div>
          <div className="max-h-[70vh] overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="animate-spin" size={16} />
                AI und Open-Meteo prüfen dein Ziel...
              </div>
            ) : result?.error ? (
              <p className="rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-700">
                {result.error}
              </p>
            ) : result ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Gefunden
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950">
                    {result.destination?.name}
                    {result.destination?.country
                      ? `, ${result.destination.country}`
                      : ""}
                  </h2>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <Metric
                    icon={<CloudSun size={16} />}
                    label="Temperatur"
                    value={
                      result.weather?.temperature != null
                        ? `${Math.round(result.weather.temperature)}°C`
                        : "Offen"
                    }
                  />
                  <Metric
                    label="Wind"
                    value={
                      result.weather?.windSpeed != null
                        ? `${Math.round(result.weather.windSpeed)} km/h`
                        : "Offen"
                    }
                  />
                  <Metric
                    label="Regen"
                    value={
                      result.weather?.precipitation != null
                        ? `${result.weather.precipitation} mm`
                        : "Offen"
                    }
                  />
                </div>

                <InsightCard
                  icon={<Sparkles size={16} />}
                  label={
                    result.aiAvailable
                      ? "AI Kurzbeschreibung"
                      : "Kurzbeschreibung"
                  }
                >
                  {result.description ?? result.answer}
                </InsightCard>
                <InsightCard
                  icon={<CalendarDays size={16} />}
                  label="Beste Reisezeit"
                >
                  {result.bestTravelTime}
                </InsightCard>
                <InsightCard icon={<CloudSun size={16} />} label="Wetter jetzt">
                  {result.weatherSummary}
                </InsightCard>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Gib ein Land oder eine Stadt ein und drück Enter.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InsightCard({
  children,
  icon,
  label,
}: {
  children?: ReactNode;
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-blue-50 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-700">
        {icon}
        {label}
      </div>
      <p className="text-sm leading-7 text-slate-700">{children ?? "Noch keine Daten."}</p>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="flex items-center gap-1 text-xs font-semibold text-slate-400">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
