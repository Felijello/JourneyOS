import type {
  Continent,
  Country,
  CountryStatus,
  CountryVisibility,
} from "@/types/country";

export const countryStatuses: Array<{
  value: CountryStatus;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    value: "visited",
    label: "Besucht",
    shortLabel: "Besucht",
    description: "Orte, an denen du schon warst.",
  },
  {
    value: "planned",
    label: "Geplant",
    shortLabel: "Geplant",
    description: "Konkrete Reisen, die schon Form annehmen.",
  },
  {
    value: "must_visit",
    label: "Will ich unbedingt hin",
    shortLabel: "Must-see",
    description: "Ganz oben auf deiner Wunschliste.",
  },
  {
    value: "maybe",
    label: "Vielleicht irgendwann",
    shortLabel: "Vielleicht",
    description: "Spannend, aber noch ohne echtes Timing.",
  },
  {
    value: "no_interest",
    label: "Kein Interesse",
    shortLabel: "Kein Interesse",
    description: "Bewusst aussortiert, damit der Kopf frei bleibt.",
  },
];

export const visibilityOptions: Array<{
  value: CountryVisibility;
  label: string;
  description: string;
}> = [
  {
    value: "private",
    label: "Privat",
    description: "Nur für dich sichtbar.",
  },
  {
    value: "family",
    label: "Familie",
    description: "Später für vertraute Personen teilbar.",
  },
  {
    value: "public",
    label: "Öffentlich",
    description: "Vorbereitet für ein späteres Reiseprofil.",
  },
];

export const continents: Continent[] = [
  "Europe",
  "Asia",
  "Africa",
  "North America",
  "South America",
  "Oceania",
  "Antarctica",
];

export const continentLabels: Record<Continent, string> = {
  Africa: "Afrika",
  Antarctica: "Antarktis",
  Asia: "Asien",
  Europe: "Europa",
  "North America": "Nordamerika",
  Oceania: "Ozeanien",
  "South America": "Südamerika",
};

export const statusLabels = countryStatuses.reduce(
  (labels, status) => ({ ...labels, [status.value]: status.label }),
  {} as Record<CountryStatus, string>,
);

export const visibilityLabels = visibilityOptions.reduce(
  (labels, option) => ({ ...labels, [option.value]: option.label }),
  {} as Record<CountryVisibility, string>,
);

export const statusStyles: Record<CountryStatus, string> = {
  visited: "bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-400/15 dark:text-emerald-200 dark:ring-emerald-400/30",
  planned: "bg-sky-100 text-sky-800 ring-sky-200 dark:bg-sky-400/15 dark:text-sky-200 dark:ring-sky-400/30",
  must_visit: "bg-coral-100 text-coral-800 ring-coral-200 dark:bg-coral-400/15 dark:text-coral-200 dark:ring-coral-400/30",
  maybe: "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-400/15 dark:text-amber-200 dark:ring-amber-400/30",
  no_interest: "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/10",
};

export const countryCoordinates: Record<string, { latitude: number; longitude: number }> = {
  japan: { latitude: 36.2048, longitude: 138.2529 },
  island: { latitude: 64.9631, longitude: -19.0208 },
  "costa rica": { latitude: 9.7489, longitude: -83.7534 },
  italien: { latitude: 41.8719, longitude: 12.5674 },
  norwegen: { latitude: 60.472, longitude: 8.4689 },
  portugal: { latitude: 39.3999, longitude: -8.2245 },
  marokko: { latitude: 31.7917, longitude: -7.0926 },
  kanada: { latitude: 56.1304, longitude: -106.3468 },
  neuseeland: { latitude: -40.9006, longitude: 174.886 },
  peru: { latitude: -9.19, longitude: -75.0152 },
};

export const seedCountries: Country[] = [
  {
    id: "seed-japan",
    name: "Japan",
    continent: "Asia",
    status: "must_visit",
    personalRating: 10,
    shortNote: "Tokyo, Onsen, Züge, Essen, alles klingt nach Volltreffer.",
    longNote:
      "Japan ist für eine spätere Reiseplanung perfekt: starke Städte, ruhige Natur, klare Routen und sehr viel Kultur. Ideal wäre eine Mischung aus Tokyo, Kyoto, Alpen und ein paar Tagen langsamer Küstenzeit.",
    bestTravelMonths: "März bis Mai oder Oktober bis November",
    visibility: "private",
    latitude: 36.2048,
    longitude: 138.2529,
    createdAt: "2026-07-01T08:30:00.000Z",
    updatedAt: "2026-07-01T08:30:00.000Z",
  },
  {
    id: "seed-iceland",
    name: "Island",
    continent: "Europe",
    status: "planned",
    personalRating: 9,
    shortNote: "Roadtrip, Wasserfälle und Landschaften wie aus einer anderen Welt.",
    longNote:
      "Island ist als kompakter Roadtrip stark. Für V2 wären Route, Wettercheck, Budget und Packliste besonders sinnvoll, weil die Reise stark von Saison und Ausrüstung abhängt.",
    bestTravelMonths: "Juni bis September",
    visibility: "family",
    latitude: 64.9631,
    longitude: -19.0208,
    createdAt: "2026-06-20T10:15:00.000Z",
    updatedAt: "2026-06-21T12:15:00.000Z",
  },
  {
    id: "seed-italy",
    name: "Italien",
    continent: "Europe",
    status: "visited",
    personalRating: 8,
    shortNote: "Immer wieder gut: Essen, Städte, Meer und kurze Wege.",
    longNote:
      "Italien bleibt ein guter Kandidat für wiederkehrende Kurztrips. Später können Orte wie Rom, Florenz, Toskana, Amalfi oder Südtirol einzeln bewertet werden.",
    bestTravelMonths: "April bis Juni, September bis Oktober",
    visibility: "private",
    latitude: 41.8719,
    longitude: 12.5674,
    createdAt: "2026-05-12T09:00:00.000Z",
    updatedAt: "2026-05-12T09:00:00.000Z",
  },
];

export function getCoordinatesForCountry(name: string) {
  return countryCoordinates[name.trim().toLowerCase()] ?? null;
}
