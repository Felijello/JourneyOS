"use client";

import { SearchCombobox } from "@/components/ui/SearchCombobox";
import type { CountrySuggestion } from "@/types/location";

export function CountryAutocomplete({
  query,
  onQueryChange,
  onSelect,
  label = "Land suchen",
  isSelection = false,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (country: CountrySuggestion) => void;
  label?: string;
  isSelection?: boolean;
}) {
  return (
    <SearchCombobox<CountrySuggestion>
      endpoint="/api/countries/search"
      getKey={(country) => country.countryCode}
      label={label}
      isSelection={isSelection}
      noResultsText="Kein standardisiertes Land gefunden. Prüfe die Schreibweise."
      onQueryChange={onQueryChange}
      onSelect={onSelect}
      placeholder="z. B. Japan"
      query={query}
      renderOption={(country) => (
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="text-xl">{country.flag}</span>
          <div><strong className="block text-slate-900">{country.name}</strong>{country.internationalName && country.internationalName !== country.name ? <span className="text-xs text-slate-500">{country.internationalName}</span> : null}</div>
        </div>
      )}
    />
  );
}
