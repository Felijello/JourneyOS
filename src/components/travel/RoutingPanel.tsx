"use client";

import { Route } from "lucide-react";
import { useTravel } from "@/components/providers/CountryProvider";
import { getRoutingSetupMessage } from "@/lib/services/routing";
import type { Place } from "@/types/country";

export function RoutingPanel({ places }: { places: Place[] }) {
  const { capabilityStatus } = useTravel();
  const message = getRoutingSetupMessage(places);

  return (
    <section className="journey-card p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
          <Route size={20} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Routing
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">
            {capabilityStatus.routing
              ? "OpenRouteService bereit"
              : "Routing vorbereitet - API-Key fehlt"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {capabilityStatus.routing
              ? message ??
                "Du kannst in einer nächsten Ausbaustufe Routen zwischen gespeicherten Orten generieren und als GeoJSON speichern."
              : "Lege NEXT_PUBLIC_OPENROUTESERVICE_API_KEY in .env.local und Vercel an. JourneyOS bleibt bis dahin voll nutzbar, nur automatische Routen sind deaktiviert."}
          </p>
        </div>
      </div>
    </section>
  );
}
