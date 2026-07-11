"use client";

import Link from "next/link";
import { CalendarDays, Euro, Plane } from "lucide-react";
import { CoverImage } from "@/components/trips/CoverImage";
import { tripStatusLabels, visibilityLabels } from "@/lib/country-options";
import { formatDate } from "@/lib/utils";
import type { Country, Trip } from "@/types/country";

export function TripCard({ trip, country }: { trip: Trip; country?: Country }) {
  const countryLabel = trip.countries.length > 1
    ? "Mehrere Länder"
    : trip.countries[0]?.countryName ?? country?.name ?? "Reiseziel offen";
  return (
    <Link
      className="group block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-card"
      href={`/trips/${trip.id}`}
    >
      <div className="relative h-36 travel-photo">
        {trip.coverPhotoUrl || country?.coverPhotoUrl ? (
          <CoverImage
            positionX={trip.coverPositionX}
            positionY={trip.coverPositionY}
            src={trip.coverPhotoUrl ?? country?.coverPhotoUrl ?? ""}
            zoom={trip.coverPhotoUrl ? trip.coverZoom : 1}
          />
        ) : null}
        <span className="absolute right-3 top-3 rounded-full bg-white/92 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
          {tripStatusLabels[trip.status]}
        </span>
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {countryLabel} · {visibilityLabels[trip.visibility]}
        </p>
        <h2 className="mt-1 text-xl font-semibold text-slate-950">{trip.title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {trip.notes || "Noch keine Reisenotiz."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
            <CalendarDays size={13} />
            {trip.startDate ? formatDate(trip.startDate) : "Datum offen"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
            <Euro size={13} />
            {trip.budgetEstimate ? `${trip.budgetEstimate} ${trip.currency}` : "Budget offen"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
            <Plane size={13} />
            {trip.travelStyle || "Stil offen"}
          </span>
        </div>
      </div>
    </Link>
  );
}
