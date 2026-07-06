"use client";

import { useState } from "react";
import { Expand, MapPinned, Plus, X } from "lucide-react";
import { CountryCard } from "@/components/countries/CountryCard";
import { WorldMap } from "@/components/map/WorldMap";
import { useTravel } from "@/components/providers/CountryProvider";
import { TravelSearch } from "@/components/travel/TravelSearch";
import { LinkButton } from "@/components/ui/Button";
import { countryStatuses, statusMapColors } from "@/lib/country-options";

export function MapPage() {
  const { countries, places, routes, capabilityStatus } = useTravel();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mappedCountries = countries.filter(
    (country) => country.latitude != null && country.longitude != null,
  );

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
            <MapPinned size={14} />
            Weltkarte
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Deine Reise-Welt
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Marker heute, Länder-Flächen später. Öffne die Karte im Vollbild,
            suche Ziele und plane deine nächsten Orte direkt aus der Kartenansicht.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:text-slate-950"
            onClick={() => setIsFullscreen(true)}
            type="button"
          >
            <Expand size={17} />
            Vollbild
          </button>
          <LinkButton href="/countries/new">
            <Plus size={17} />
            Land hinzufügen
          </LinkButton>
        </div>
      </section>

      <section className="journey-card overflow-hidden rounded-3xl p-4">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TravelSearch className="max-w-xl" />
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={() => setIsFullscreen(true)}
            type="button"
          >
            <Expand size={17} />
            Karte groß öffnen
          </button>
        </div>
        <WorldMap countries={countries} places={places} routes={routes} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
        <article className="journey-card p-5">
          <h2 className="text-lg font-semibold text-slate-950">
            Legende & Kartenstatus
          </h2>
          <div className="mt-4 space-y-3">
            {countryStatuses.map((status) => (
              <div
                className="flex items-center gap-3 text-sm text-slate-600"
                key={status.value}
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: statusMapColors[status.value] }}
                />
                <span className="font-medium text-slate-800">{status.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            {capabilityStatus.maptiler
              ? "MapTiler-Key ist vorhanden. JourneyOS kann Premium-Kacheln nutzen."
              : "MapTiler-Key fehlt. Die Karte nutzt OpenStreetMap als sicheren Fallback."}
          </p>
        </article>

        <article className="journey-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">Auf der Karte</h2>
            <span className="text-sm font-semibold text-slate-500">
              {mappedCountries.length}/{countries.length} Länder
            </span>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {mappedCountries.slice(0, 4).map((country) => (
              <CountryCard country={country} key={country.id} />
            ))}
          </div>
        </article>
      </section>

      {isFullscreen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5">
          <div className="relative h-full overflow-hidden rounded-3xl border border-white/20 bg-white shadow-large">
            <div className="absolute left-4 right-4 top-4 z-[1001] flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <TravelSearch className="max-w-xl" />
              <button
                aria-label="Vollbildkarte schließen"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 md:w-auto"
                onClick={() => setIsFullscreen(false)}
                type="button"
              >
                <X size={18} />
                Schließen
              </button>
            </div>
            <WorldMap
              className="h-full rounded-none border-0 shadow-none"
              countries={countries}
              places={places}
              routes={routes}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
