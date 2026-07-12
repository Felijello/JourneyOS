"use client";

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Globe2,
  Plane,
  Star,
  PackageCheck,
  ImageOff,
} from "lucide-react";
import Link from "next/link";
import { CoverImage } from "@/components/trips/CoverImage";
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
    trips,
    packingItems,
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextTrip = trips
    .filter((trip) => trip.startDate && trip.status !== "completed" && trip.status !== "cancelled" && new Date(`${trip.startDate}T00:00:00`) >= today)
    .toSorted((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime())[0];
  const daysUntil = nextTrip?.startDate ? Math.ceil((new Date(`${nextTrip.startDate}T00:00:00`).getTime() - today.getTime()) / 86_400_000) : null;
  const openPacking = nextTrip ? packingItems.filter((item) => item.tripId === nextTrip.id && !item.isPacked) : [];
  const incompleteTrips = trips.filter((trip) => !trip.coverPhotoUrl || !trip.startDate || !trip.endDate);

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Wohin geht&apos;s als Nächstes?
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Sammle Länder, plane Reisen und behalte deine Ideen im Blick.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <LinkButton href="/trips/new" variant="secondary">
            <CalendarDays aria-hidden="true" size={17} />
            Reise planen
          </LinkButton>
          <LinkButton href="/countries/new">
            Land hinzufügen
            <ArrowRight aria-hidden="true" size={17} />
          </LinkButton>
        </div>
      </section>

      {nextTrip ? (
        <Link className="group relative block min-h-72 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 shadow-card" href={`/trips/${nextTrip.id}?tab=overview`}>
          {nextTrip.coverPhotoUrl ? <div className="absolute inset-0 overflow-hidden"><CoverImage positionX={nextTrip.coverPositionX} positionY={nextTrip.coverPositionY} src={nextTrip.coverPhotoUrl} zoom={nextTrip.coverZoom} /></div> : <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-cyan-400 to-emerald-300" />}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/55 to-transparent" />
          <div className="relative flex min-h-72 max-w-2xl flex-col justify-end p-6 text-white sm:p-8">
            <p className="text-sm font-semibold text-blue-200">Deine nächste Reise</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">{daysUntil === 0 ? "Heute geht's los" : `Noch ${daysUntil} ${daysUntil === 1 ? "Tag" : "Tage"} bis ${nextTrip.destinationCity || nextTrip.destinationCountryName || nextTrip.title}`}</h2>
            <p className="mt-3 text-sm text-white/80">{nextTrip.title} · {nextTrip.startDate ? new Intl.DateTimeFormat("de-AT", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${nextTrip.startDate}T00:00:00`)) : "Datum offen"}</p>
            <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950">Reise öffnen<ArrowRight size={16} /></span>
          </div>
        </Link>
      ) : <EmptyState actionHref="/trips/new" actionLabel="Reise planen" description="Sobald du eine Reise mit Datum anlegst, erscheint hier dein persönlicher Countdown." title="Dein nächstes Abenteuer wartet" />}

      {(openPacking.length || incompleteTrips.length) ? <section><h2 className="text-xl font-semibold text-slate-950">Für dich als Nächstes</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{openPacking.length ? <Link className="journey-card flex items-center gap-4 p-5" href={`/trips/${nextTrip!.id}?tab=packing`}><span className="grid size-11 place-items-center rounded-lg bg-amber-50 text-amber-600"><PackageCheck /></span><div><p className="font-semibold text-slate-900">{openPacking.length} offene Packlistenpunkte</p><p className="mt-1 text-sm text-slate-500">Kurz abhaken, bevor es losgeht.</p></div></Link> : null}{incompleteTrips.length ? <Link className="journey-card flex items-center gap-4 p-5" href={`/trips/${incompleteTrips[0].id}?tab=overview`}><span className="grid size-11 place-items-center rounded-lg bg-blue-50 text-blue-600"><ImageOff /></span><div><p className="font-semibold text-slate-900">{incompleteTrips.length} unvollständige {incompleteTrips.length === 1 ? "Reise" : "Reisen"}</p><p className="mt-1 text-sm text-slate-500">Cover oder Reisedaten ergänzen.</p></div></Link> : null}</div></section> : null}

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
