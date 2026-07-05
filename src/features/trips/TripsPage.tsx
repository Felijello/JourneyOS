"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Plus, Search } from "lucide-react";
import { TripCard } from "@/components/trips/TripCard";
import { useTravel } from "@/components/providers/CountryProvider";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { tripStatuses } from "@/lib/country-options";
import type { TripStatus } from "@/types/country";

export function TripsPage() {
  const { trips, countries } = useTravel();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<TripStatus | "all">("all");

  const filteredTrips = useMemo(
    () =>
      trips
        .filter((trip) => trip.title.toLowerCase().includes(query.trim().toLowerCase()))
        .filter((trip) => (status === "all" ? true : trip.status === status))
        .toSorted(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),
    [query, status, trips],
  );

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
            <CalendarDays size={14} />
            Reiseplanung
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Trips
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Plane Reisen grob, speichere Budgets, Links, Tagesideen und
            Packlisten. Genau richtig für V1, ohne gleich alles zu verkomplizieren.
          </p>
        </div>
        <LinkButton href="/trips/new">
          <Plus aria-hidden="true" size={17} />
          Trip hinzufügen
        </LinkButton>
      </section>

      <section className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-[1fr_220px]">
        <label className="relative block">
          <span className="sr-only">Trip suchen</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nach Trip suchen..."
            value={query}
          />
        </label>
        <select
          className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          onChange={(event) => setStatus(event.target.value as TripStatus | "all")}
          value={status}
        >
          <option value="all">Alle Status</option>
          {tripStatuses.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </section>

      {filteredTrips.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTrips.map((trip) => (
            <TripCard
              country={countries.find((country) => country.id === trip.countryId)}
              key={trip.id}
              trip={trip}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          actionHref="/trips/new"
          actionLabel="Trip anlegen"
          description="Lege einen Trip an und sammle erste Tage, Links, Packliste und Budget."
          title="Noch keine Trips in dieser Ansicht"
        />
      )}
    </div>
  );
}
