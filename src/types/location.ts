import type { Continent } from "@/types/country";

export type CountrySuggestion = {
  name: string;
  internationalName?: string | null;
  countryCode: string;
  continent: Continent;
  latitude?: number | null;
  longitude?: number | null;
  flag: string;
};

export type DestinationSuggestion = {
  externalId: string;
  name: string;
  displayName: string;
  city?: string | null;
  region?: string | null;
  countryName: string;
  countryCode: string;
  continent: Continent;
  latitude: number;
  longitude: number;
  featureCode?: string | null;
  flag: string;
};
