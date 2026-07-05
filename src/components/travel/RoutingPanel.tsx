"use client";

import { useMemo, useState } from "react";
import { Route } from "lucide-react";
import { useTravel } from "@/components/providers/CountryProvider";
import { Button } from "@/components/ui/Button";
import {
  getRouteablePlaces,
  getRoutingSetupMessage,
  type RouteCoordinate,
} from "@/lib/services/routing";
import type { Place } from "@/types/country";

type RoutingResponse = {
  routeGeojson?: {
    features?: Array<{
      properties?: {
        summary?: {
          distance?: number;
          duration?: number;
        };
      };
    }>;
  };
  error?: string;
};

export function RoutingPanel({ places }: { places: Place[] }) {
  const { capabilityStatus } = useTravel();
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const routeablePlaces = useMemo(() => getRouteablePlaces(places), [places]);
  const message = getRoutingSetupMessage(places, capabilityStatus.routing);
  const canGenerate = capabilityStatus.routing && routeablePlaces.length >= 2;

  async function generateRoute() {
    setIsLoading(true);
    setError(null);
    setResult(null);

    const coordinates: RouteCoordinate[] = routeablePlaces
      .slice(0, 5)
      .map((place) => [place.longitude as number, place.latitude as number]);

    const response = await fetch("/api/routing/directions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coordinates, profile: "driving-car" }),
    });
    const data = (await response.json()) as RoutingResponse;
    setIsLoading(false);

    if (!response.ok || data.error) {
      setError(data.error ?? "Route konnte nicht berechnet werden.");
      return;
    }

    const summary = data.routeGeojson?.features?.[0]?.properties?.summary;
    if (!summary) {
      setResult("Route berechnet, aber ohne Zusammenfassung zurückgegeben.");
      return;
    }

    const distanceKm = Math.round((summary.distance ?? 0) / 1000);
    const durationMinutes = Math.round((summary.duration ?? 0) / 60);
    setResult(`${distanceKm} km · ca. ${durationMinutes} Minuten`);
  }

  return (
    <section className="journey-card p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
          <Route size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Routing
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">
            {capabilityStatus.routing
              ? "OpenRouteService serverseitig bereit"
              : "Routing vorbereitet - API-Key fehlt"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>

          <Button
            className="mt-4 rounded-2xl"
            disabled={!canGenerate || isLoading}
            onClick={generateRoute}
            type="button"
            variant="secondary"
          >
            <Route size={16} />
            {isLoading ? "Berechne..." : "Route testen"}
          </Button>

          {result ? (
            <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {result}
            </p>
          ) : null}
          {error ? (
            <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
