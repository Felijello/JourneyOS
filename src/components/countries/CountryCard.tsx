"use client";

import Link from "next/link";
import { CalendarDays, Eye, Star } from "lucide-react";
import { StatusBadge, VisibilityBadge } from "@/components/ui/Badge";
import { continentLabels } from "@/lib/country-options";
import { formatDate } from "@/lib/utils";
import type { Country } from "@/types/country";

export function CountryCard({ country }: { country: Country }) {
  return (
    <Link
      className="group block rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-moss-200 hover:shadow-soft dark:border-white/10 dark:bg-white/5 dark:hover:border-moss-400/40"
      href={`/countries/${country.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-graphite-500 dark:text-zinc-400">
            {continentLabels[country.continent]}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-graphite-950 transition group-hover:text-moss-700 dark:text-white dark:group-hover:text-moss-200">
            {country.name}
          </h2>
        </div>
        <StatusBadge status={country.status} />
      </div>

      <p className="mt-4 min-h-12 text-sm leading-6 text-graphite-600 dark:text-zinc-300">
        {country.shortNote || "Noch keine kurze Notiz gespeichert."}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-graphite-700 dark:bg-white/10 dark:text-zinc-200">
          <Star aria-hidden="true" size={13} />
          {country.personalRating}/10
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-graphite-700 dark:bg-white/10 dark:text-zinc-200">
          <CalendarDays aria-hidden="true" size={13} />
          {country.bestTravelMonths || "Saison offen"}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-graphite-700 dark:bg-white/10 dark:text-zinc-200">
          <Eye aria-hidden="true" size={13} />
          <VisibilityBadge visibility={country.visibility} />
        </span>
      </div>

      <p className="mt-4 text-xs font-medium text-graphite-500 dark:text-zinc-500">
        Aktualisiert am {formatDate(country.updatedAt)}
      </p>
    </Link>
  );
}

