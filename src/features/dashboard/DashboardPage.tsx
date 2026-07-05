"use client";

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Globe2,
  MapPinned,
  Plane,
  Sparkles,
  Star,
} from "lucide-react";
import { CountryCard } from "@/components/countries/CountryCard";
import { WorldMap } from "@/components/map/WorldMap";
import { useTravel } from "@/components/providers/CountryProvider";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { countryStatuses, statusMapColors } from "@/lib/country-options";

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  helper: string;
  icon: typeof Globe2;
  tone: "green" | "blue" | "amber" | "violet" | "slate";
}) {
  const tones = {
    green: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-card">
      <div className="flex items-center gap-4">
        <span
          className={`flex size-12 items-center justify-center rounded-full ${tones[tone]}`}
        >
          <Icon aria-hidden="true" size={21} />
        </span>
        <div>
          <p className="text-xs font-semibold text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
        </div>
      </div>
      <p className="mt-4 text-xs font-medium text-slate-500">{helper}</p>
    </article>
  );
}

export function DashboardPage() {
  const {
    countries,
    trips,
    isLoading,
    error,
    capabilityStatus,
  } = useTravel();
  const visited = countries.filter((country) => country.status === "visited").length;
  const planned = countries.filter((country) => country.status === "planned").length;
  const wishlist = countries.filter((country) => country.status === "must_visit").length;
  const upcomingTrips = trips.filter((trip) =>
    ["idea", "planned", "booked"].includes(trip.status),
  ).length;
  const recentCountries = [...countries]
    .toSorted(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Guten Morgen, Felix! ✈️
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Bereit für dein nächstes Abenteuer?
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <LinkButton href="/trips/new" variant="secondary">
            <CalendarDays aria-hidden="true" size={17} />
            Trip planen
          </LinkButton>
          <LinkButton href="/countries/new">
            Land hinzufügen
            <ArrowRight aria-hidden="true" size={17} />
          </LinkButton>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          helper="Deine echten Reise-Erinnerungen"
          icon={CheckCircle2}
          label="Besuchte Länder"
          tone="green"
          value={visited}
        />
        <StatCard
          helper="Konkrete Ziele im Blick"
          icon={Plane}
          label="Geplante Länder"
          tone="blue"
          value={planned}
        />
        <StatCard
          helper="Ganz oben auf der Wunschliste"
          icon={Star}
          label="Wunschliste"
          tone="amber"
          value={wishlist}
        />
        <StatCard
          helper="Alle gespeicherten Länder"
          icon={Globe2}
          label="Insgesamt"
          tone="violet"
          value={countries.length}
        />
        <StatCard
          helper="Ideen, Pläne und Buchungen"
          icon={CalendarDays}
          label="Upcoming Trips"
          tone="slate"
          value={upcomingTrips}
        />
      </section>

      {error ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {error}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Weltkarte
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Marker heute, Länder-Flächen später. Die Architektur ist dafür vorbereitet.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {countryStatuses.map((status) => (
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
                key={status.value}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: statusMapColors[status.value] }}
                />
                {status.shortLabel}
              </span>
            ))}
          </div>
        </div>
        <WorldMap countries={countries} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                Kürzlich aktualisiert
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Länder, die gerade oben auf deinem Reise-Radar sind.
              </p>
            </div>
            <LinkButton href="/countries" variant="ghost">
              Alle Länder
              <ArrowRight aria-hidden="true" size={16} />
            </LinkButton>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  className="h-72 animate-pulse rounded-3xl bg-white/70"
                  key={item}
                />
              ))}
            </div>
          ) : recentCountries.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {recentCountries.map((country) => (
                <CountryCard country={country} key={country.id} />
              ))}
            </div>
          ) : (
            <EmptyState
              description="Lege dein erstes Land an und JourneyOS baut daraus automatisch Statistiken, Kartenmarker und Detailseiten."
              title="Noch keine Länder gespeichert"
            />
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles aria-hidden="true" className="text-blue-600" size={18} />
              <h2 className="font-semibold text-slate-950">AI & Reise-Tools</h2>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <p className="rounded-2xl bg-slate-50 px-3 py-2 text-slate-600">
                Wetter: Open-Meteo aktiv, kein API-Key nötig.
              </p>
              <p className="rounded-2xl bg-slate-50 px-3 py-2 text-slate-600">
                Routing:{" "}
                {capabilityStatus.routing ? "OpenRouteService bereit." : "API-Key fehlt."}
              </p>
              <p className="rounded-2xl bg-slate-50 px-3 py-2 text-slate-600">
                AI: Gemini serverseitig vorbereitet.
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/70 p-5 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
              <MapPinned aria-hidden="true" size={22} />
            </div>
            <h2 className="mt-3 font-semibold text-slate-950">Nächster Schritt</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Orte und Trips füttern später Routen, Wetter-Checks und AI-Reisepläne.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
