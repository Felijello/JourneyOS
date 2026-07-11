"use client";

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Globe2,
  Plane,
  Star,
} from "lucide-react";
import { CountryCard } from "@/components/countries/CountryCard";
import { WorldMap } from "@/components/map/WorldMap";
import { useTravel } from "@/components/providers/CountryProvider";
import { useSocial } from "@/components/providers/SocialProvider";
import { PublicTripCard } from "@/components/social/PublicTripCard";
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
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card">
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
    isLoading,
    error,
  } = useTravel();
  const { publications, profiles } = useSocial();
  const visited = countries.filter((country) => country.status === "visited").length;
  const planned = countries.filter((country) => country.status === "planned").length;
  const wishlist = countries.filter((country) => country.status === "must_visit").length;
  const recentCountries = [...countries]
    .toSorted(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 4);

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Wohin geht&apos;s als Nächstes?
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Sammle Länder, plane Trips und behalte deine Ideen im Blick.
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

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
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
      </section>

      {error ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {error}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-card sm:p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Weltkarte
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Länderflächen zeigen deinen Status, Orte erscheinen als Marker.
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

      <section className="space-y-4">
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
                <div className="h-72 animate-pulse rounded-xl bg-white/70" key={item} />
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

      </section>

      {publications.length ? (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-600">Aus der Community</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Neue Reiseideen</h2>
            </div>
            <LinkButton href="/discover" variant="ghost">Entdecken<ArrowRight size={16} /></LinkButton>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {publications.slice(0, 3).map((publication) => (
              <PublicTripCard
                creator={profiles.find((profile) => profile.id === publication.userId)}
                key={publication.tripId}
                publication={publication}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
