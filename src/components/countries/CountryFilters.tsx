"use client";

import { Search } from "lucide-react";
import { countryStatuses } from "@/lib/country-options";
import type { CountrySort, CountryStatus } from "@/types/country";

export function CountryFilters({
  query,
  status,
  sort,
  onQueryChange,
  onStatusChange,
  onSortChange,
}: {
  query: string;
  status: CountryStatus | "all";
  sort: CountrySort;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: CountryStatus | "all") => void;
  onSortChange: (value: CountrySort) => void;
}) {
  return (
    <section className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/5 md:grid-cols-[1fr_220px_180px]">
      <label className="relative block">
        <span className="sr-only">Land suchen</span>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite-500"
          size={18}
        />
        <input
          className="h-11 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-10 pr-3 text-sm text-graphite-950 outline-none transition placeholder:text-graphite-500 focus:border-moss-500 focus:ring-2 focus:ring-moss-500/20 dark:border-white/10 dark:bg-graphite-900 dark:text-white dark:placeholder:text-zinc-500"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Nach Land suchen..."
          value={query}
        />
      </label>

      <label>
        <span className="sr-only">Status filtern</span>
        <select
          className="h-11 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-graphite-800 outline-none transition focus:border-moss-500 focus:ring-2 focus:ring-moss-500/20 dark:border-white/10 dark:bg-graphite-900 dark:text-white"
          onChange={(event) =>
            onStatusChange(event.target.value as CountryStatus | "all")
          }
          value={status}
        >
          <option value="all">Alle Status</option>
          {countryStatuses.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="sr-only">Sortierung</span>
        <select
          className="h-11 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-graphite-800 outline-none transition focus:border-moss-500 focus:ring-2 focus:ring-moss-500/20 dark:border-white/10 dark:bg-graphite-900 dark:text-white"
          onChange={(event) => onSortChange(event.target.value as CountrySort)}
          value={sort}
        >
          <option value="newest">Neueste zuerst</option>
          <option value="name">Name A-Z</option>
          <option value="rating">Rating hoch</option>
        </select>
      </label>
    </section>
  );
}

