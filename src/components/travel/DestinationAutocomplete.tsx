"use client";

import { MapPin } from "lucide-react";
import { SearchCombobox } from "@/components/ui/SearchCombobox";
import type { DestinationSuggestion } from "@/types/location";

export function DestinationAutocomplete({
  query,
  onQueryChange,
  onSelect,
  isSelection = false,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (destination: DestinationSuggestion) => void;
  isSelection?: boolean;
}) {
  return (
    <SearchCombobox<DestinationSuggestion>
      endpoint="/api/destinations/search"
      getKey={(destination) => destination.externalId}
      label="Reiseziel suchen"
      isSelection={isSelection}
      noResultsText="Kein passender Ort gefunden. Versuche eine Stadt oder Region."
      onQueryChange={onQueryChange}
      onSelect={onSelect}
      placeholder="z. B. New York"
      query={query}
      renderOption={(destination) => (
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-8 place-items-center rounded-md bg-blue-50 text-blue-700"><MapPin aria-hidden="true" size={16} /></span>
          <div className="min-w-0"><strong className="block truncate text-slate-900">{destination.name}</strong><span className="block truncate text-xs text-slate-500">{destination.region ? `${destination.region}, ` : ""}{destination.countryName} {destination.flag}</span></div>
        </div>
      )}
    />
  );
}
