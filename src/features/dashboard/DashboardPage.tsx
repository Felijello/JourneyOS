"use client";

import { ArrowRight, Globe2, MapPinned, Plane, Star } from "lucide-react";
import { CountryCard } from "@/components/countries/CountryCard";
import { useCountries } from "@/components/providers/CountryProvider";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { WorldMap } from "@/components/map/WorldMap";

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Globe2;
}) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-graphite-500 dark:text-zinc-400">
          {label}
        </span>
        <span className="flex size-9 items-center justify-center rounded-lg bg-mist-100 text-mist-700 dark:bg-mist-500/15 dark:text-mist-100">
          <Icon aria-hidden="true" size={18} />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-graphite-950 dark:text-white">
        {value}
      </p>
    </article>
  );
}

export function DashboardPage() {
  const { countries, isLoading, error } = useCountries();
  const visited = countries.filter((country) => country.status === "visited").length;
  const planned = countries.filter((country) => country.status === "planned").length;
  const wishlist = countries.filter((country) => country.status === "must_visit").length;
  const recentCountries = countries.slice(0, 3);

  return (
    <div className="space-y-8">
      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-graphite-950 dark:text-white sm:text-5xl">
                Dein Reisejahr, sauber sortiert.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-graphite-600 dark:text-zinc-300">
                JourneyOS sammelt besuchte Länder, konkrete Pläne und diese
                Orte, bei denen der Kopf sofort leiser wird.
              </p>
            </div>
            <LinkButton className="sm:shrink-0" href="/countries/new">
              Land hinzufügen
              <ArrowRight aria-hidden="true" size={17} />
            </LinkButton>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Globe2} label="Besucht" value={visited} />
            <StatCard icon={Plane} label="Geplant" value={planned} />
            <StatCard icon={Star} label="Wishlist" value={wishlist} />
            <StatCard icon={MapPinned} label="Gespeichert" value={countries.length} />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-graphite-950 p-6 text-white shadow-soft dark:border-white/10">
          <p className="text-sm font-medium text-mist-100">V1 Fokus</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            Erst Daten sauber machen. Danach wird es magisch.
          </h2>
          <p className="mt-4 text-sm leading-6 text-zinc-300">
            Länder, Status, Sichtbarkeit und Notizen sind bereits so
            modelliert, dass Fotos, Orte, Routen, Budgets und AI-Planung
            später andocken können.
          </p>
          <div className="mt-6 grid gap-2 text-sm text-zinc-200">
            <span className="rounded-lg bg-white/10 px-3 py-2">Private Daten vorbereitet</span>
            <span className="rounded-lg bg-white/10 px-3 py-2">Supabase Schema inklusive</span>
            <span className="rounded-lg bg-white/10 px-3 py-2">Karten-Komponente austauschbar</span>
          </div>
        </div>
      </section>

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100 dark:bg-red-400/10 dark:text-red-200 dark:ring-red-400/20">
          {error}
        </p>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-graphite-950 dark:text-white">
              Weltkarte
            </h2>
            <p className="mt-1 text-sm text-graphite-600 dark:text-zinc-300">
              V1 zeigt Marker für gespeicherte Länder mit Koordinaten.
            </p>
          </div>
        </div>
        <WorldMap countries={countries} />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-graphite-950 dark:text-white">
              Zuletzt bearbeitet
            </h2>
            <p className="mt-1 text-sm text-graphite-600 dark:text-zinc-300">
              Schneller Einstieg in deine wichtigsten Länder.
            </p>
          </div>
          <LinkButton href="/countries" variant="secondary">
            Alle ansehen
          </LinkButton>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                className="h-56 animate-pulse rounded-xl bg-zinc-200 dark:bg-white/10"
                key={item}
              />
            ))}
          </div>
        ) : recentCountries.length ? (
          <div className="grid gap-4 md:grid-cols-3">
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
      </section>
    </div>
  );
}

