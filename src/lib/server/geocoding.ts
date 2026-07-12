import { getContinentForCountryCode, getFlagEmoji } from "@/lib/country-catalog";
import type { CountrySuggestion, DestinationSuggestion } from "@/types/location";

type OpenMeteoResult = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  feature_code?: string;
  country_code?: string;
  country?: string;
  admin1?: string;
  population?: number;
};

type MapTilerContext = {
  id: string;
  text: string;
  text_de?: string;
  properties?: { country_code?: string };
};

type MapTilerFeature = MapTilerContext & {
  center: [number, number];
  place_name: string;
  place_name_de?: string;
  place_type: string[];
  properties?: {
    country_code?: string;
    place_designation?: string;
  };
  context?: MapTilerContext[];
};

async function searchMapTiler(query: string, types: string) {
  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    key: apiKey,
    language: "de,en",
    limit: "10",
    autocomplete: "true",
    fuzzyMatch: "true",
    types,
  });
  const response = await fetch(
    `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?${params}`,
    { signal: AbortSignal.timeout(7000), next: { revalidate: 60 * 60 * 24 } },
  );
  if (!response.ok) throw new Error("MapTiler-Suche ist gerade nicht erreichbar.");
  const payload = (await response.json()) as { features?: MapTilerFeature[] };
  return payload.features ?? [];
}

async function searchOpenMeteo(query: string, language: "de" | "en", count = 10) {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=${count}&language=${language}&format=json`,
    { signal: AbortSignal.timeout(7000), next: { revalidate: 60 * 60 * 24 } },
  );
  if (!response.ok) throw new Error("Die Ortssuche ist gerade nicht erreichbar.");
  const payload = (await response.json()) as { results?: OpenMeteoResult[] };
  return payload.results ?? [];
}

function findCountry(feature: MapTilerFeature) {
  return feature.place_type.includes("country")
    ? feature
    : feature.context?.find((item) => item.id.startsWith("country."));
}

function findRegion(feature: MapTilerFeature) {
  return feature.context?.find((item) =>
    ["region.", "subregion.", "county."].some((prefix) => item.id.startsWith(prefix)),
  );
}

async function searchCountriesWithOpenMeteo(query: string): Promise<CountrySuggestion[]> {
  const [german, english] = await Promise.all([
    searchOpenMeteo(query, "de", 15),
    searchOpenMeteo(query, "en", 15),
  ]);
  const internationalNames = new Map(
    english
      .filter((item) => item.country_code)
      .map((item) => [item.country_code!.toUpperCase(), item.name]),
  );
  const candidates = [...german, ...english].filter(
    (item) => item.country_code && item.feature_code?.startsWith("PCL"),
  );
  const unique = new Map<string, CountrySuggestion>();
  for (const item of candidates) {
    const countryCode = item.country_code!.toUpperCase();
    if (unique.has(countryCode)) continue;
    unique.set(countryCode, {
      name: german.find((candidate) => candidate.country_code?.toUpperCase() === countryCode && candidate.feature_code?.startsWith("PCL"))?.name ?? item.name,
      internationalName: internationalNames.get(countryCode) ?? null,
      countryCode,
      continent: getContinentForCountryCode(countryCode),
      latitude: item.latitude,
      longitude: item.longitude,
      flag: getFlagEmoji(countryCode),
    });
  }
  return [...unique.values()].slice(0, 8);
}

async function searchDestinationsWithOpenMeteo(query: string): Promise<DestinationSuggestion[]> {
  const [german, english] = await Promise.all([
    searchOpenMeteo(query, "de", 20),
    searchOpenMeteo(query, "en", 20),
  ]);
  const germanById = new Map(german.map((item) => [item.id, item]));
  const normalizedQuery = query.trim().toLocaleLowerCase("de");
  const displayNames = new Intl.DisplayNames(["de"], { type: "region" });
  return [...english, ...german]
    .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index)
    .toSorted((a, b) => {
      const aExact = a.name.toLocaleLowerCase("de") === normalizedQuery ? 1 : 0;
      const bExact = b.name.toLocaleLowerCase("de") === normalizedQuery ? 1 : 0;
      return bExact - aExact || (b.population ?? 0) - (a.population ?? 0);
    })
    .filter((item) => item.country_code && item.country)
    .slice(0, 10)
    .map((item) => {
      const countryCode = item.country_code!.toUpperCase();
      const translated = germanById.get(item.id);
      const countryName = displayNames.of(countryCode) ?? translated?.country ?? item.country!;
      const region = translated?.admin1 ?? item.admin1 ?? null;
      const details = [region, countryName].filter((part, index, parts) => part && parts.indexOf(part) === index);
      return {
        externalId: String(item.id),
        name: item.name,
        displayName: `${item.name}${details.length ? `, ${details.join(", ")}` : ""}`,
        city: item.name,
        region,
        countryName,
        countryCode,
        continent: getContinentForCountryCode(countryCode),
        latitude: item.latitude,
        longitude: item.longitude,
        featureCode: item.feature_code ?? null,
        flag: getFlagEmoji(countryCode),
      };
    });
}

export async function searchCountries(query: string): Promise<CountrySuggestion[]> {
  try {
    const features = await searchMapTiler(query, "country");
    if (features?.length) {
      const unique = new Map<string, CountrySuggestion>();
      for (const feature of features) {
        const countryCode = feature.properties?.country_code?.toUpperCase();
        if (!countryCode || unique.has(countryCode)) continue;
        unique.set(countryCode, {
          name: feature.text_de ?? feature.text,
          internationalName: feature.text,
          countryCode,
          continent: getContinentForCountryCode(countryCode),
          latitude: feature.center[1],
          longitude: feature.center[0],
          flag: getFlagEmoji(countryCode),
        });
      }
      if (unique.size) return [...unique.values()].slice(0, 8);
    }
  } catch {
    // Open-Meteo keeps autocomplete usable if MapTiler is unavailable or rate-limited.
  }
  return searchCountriesWithOpenMeteo(query);
}

export async function searchDestinations(query: string): Promise<DestinationSuggestion[]> {
  try {
    const features = await searchMapTiler(
      query,
      "country,region,subregion,municipality,locality,place,poi",
    );
    if (features?.length) {
      const displayNames = new Intl.DisplayNames(["de"], { type: "region" });
      const results = features.flatMap((feature): DestinationSuggestion[] => {
        const country = findCountry(feature);
        const countryCode = (feature.properties?.country_code ?? country?.properties?.country_code)?.toUpperCase();
        if (!countryCode) return [];
        const countryName = displayNames.of(countryCode) ?? country?.text_de ?? country?.text ?? "";
        const regionNode = findRegion(feature);
        const region = regionNode?.text_de ?? regionNode?.text ?? null;
        const name = feature.text_de ?? feature.text;
        const details = [region, countryName].filter((part, index, parts) => part && part !== name && parts.indexOf(part) === index);
        return [{
          externalId: feature.id,
          name,
          displayName: `${name}${details.length ? `, ${details.join(", ")}` : ""}`,
          city: feature.place_type.some((type) => ["municipality", "locality", "place"].includes(type)) ? name : null,
          region,
          countryName,
          countryCode,
          continent: getContinentForCountryCode(countryCode),
          latitude: feature.center[1],
          longitude: feature.center[0],
          featureCode: feature.place_type[0] ?? null,
          flag: getFlagEmoji(countryCode),
        }];
      });
      if (results.length) return results.slice(0, 10);
    }
  } catch {
    // Fall back to the keyless provider so destination search never hard-fails.
  }
  return searchDestinationsWithOpenMeteo(query);
}
