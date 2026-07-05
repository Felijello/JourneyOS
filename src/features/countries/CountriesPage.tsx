"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { CountryCard } from "@/components/countries/CountryCard";
import { CountryFilters } from "@/components/countries/CountryFilters";
import { useCountries } from "@/components/providers/CountryProvider";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Continent, CountrySort, CountryStatus } from "@/types/country";

export function CountriesPage() {
  const { countries, isLoading, error } = useCountries();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CountryStatus | "all">("all");
  const [continent, setContinent] = useState<Continent | "all">("all");
  const [sort, setSort] = useState<CountrySort>("newest");

  const filteredCountries = useMemo(() => {
    return countries
      .filter((country) =>
        country.name.toLowerCase().includes(query.trim().toLowerCase()),
      )
      .filter((country) => (status === "all" ? true : country.status === status))
      .filter((country) =>
        continent === "all" ? true : country.continent === continent,
      )
      .toSorted((a, b) => {
        if (sort === "name") {
          return a.name.localeCompare(b.name, "de");
        }
        if (sort === "rating") {
          return b.personalRating - a.personalRating;
        }
        if (sort === "status") {
          return a.status.localeCompare(b.status, "de");
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [continent, countries, query, sort, status]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-graphite-950 dark:text-white sm:text-4xl">
            Länder
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite-600 dark:text-zinc-300">
            Suche, filtere und sortiere alles, was du besucht hast oder noch
            erleben willst.
          </p>
        </div>
        <LinkButton href="/countries/new">
          <Plus aria-hidden="true" size={17} />
          Land hinzufügen
        </LinkButton>
      </section>

      <CountryFilters
        continent={continent}
        onContinentChange={setContinent}
        onQueryChange={setQuery}
        onSortChange={setSort}
        onStatusChange={setStatus}
        query={query}
        sort={sort}
        status={status}
      />

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100 dark:bg-red-400/10 dark:text-red-200 dark:ring-red-400/20">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              className="h-60 animate-pulse rounded-xl bg-zinc-200 dark:bg-white/10"
              key={item}
            />
          ))}
        </div>
      ) : filteredCountries.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCountries.map((country) => (
            <CountryCard country={country} key={country.id} />
          ))}
        </div>
      ) : countries.length ? (
        <EmptyState
          actionHref="/countries"
          actionLabel="Filter zurücksetzen"
          description="Aendere Suche, Status oder Sortierung. Deine gespeicherten Länder sind noch da."
          title="Keine Treffer für diese Ansicht"
        />
      ) : (
        <EmptyState
          description="Starte mit einem Land, das du gut kennst. Danach fühlen sich die nächsten Einträge fast von selbst an."
          title="Deine Länderliste ist noch leer"
        />
      )}
    </div>
  );
}
