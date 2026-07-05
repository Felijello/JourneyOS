"use client";

import Link from "next/link";
import { CalendarDays, ImageIcon, NotebookText, Star } from "lucide-react";
import { StatusBadge, VisibilityBadge } from "@/components/ui/Badge";
import { continentLabels } from "@/lib/country-options";
import { formatDate } from "@/lib/utils";
import type { Country } from "@/types/country";

export function CountryCard({ country }: { country: Country }) {
  return (
    <Link
      className="group block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-card"
      href={`/countries/${country.id}`}
    >
      <div className="relative h-36 travel-photo">
        {country.coverPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            src={country.coverPhotoUrl}
          />
        ) : null}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" />
        <div className="absolute right-3 top-3">
          <StatusBadge status={country.status} />
        </div>
        {country.countryCode ? (
          <span className="absolute bottom-3 left-3 rounded-lg bg-white/92 px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm">
            {country.countryCode}
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {continentLabels[country.continent]}
        </p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            {country.name}
          </h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
            <Star aria-hidden="true" size={13} />
            {country.personalRating}/10
          </span>
        </div>

        <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">
          {country.shortNote || "Noch keine kurze Notiz gespeichert."}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
            <CalendarDays aria-hidden="true" size={13} />
            {country.bestTravelMonths || "Saison offen"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
            <NotebookText aria-hidden="true" size={13} />
            Notizen
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
            <ImageIcon aria-hidden="true" size={13} />
            Fotos
          </span>
          <VisibilityBadge visibility={country.visibility} />
        </div>

        <p className="mt-4 text-xs font-medium text-slate-400">
          Aktualisiert am {formatDate(country.updatedAt)}
        </p>
      </div>
    </Link>
  );
}
