import type {
  Continent,
  Country,
  CountryStatus,
  CountryVisibility,
  PackingItem,
  Place,
  PlaceType,
  SavedLink,
  TravelPhoto,
  TravelState,
  Trip,
  TripDay,
  TripDayItem,
  TripStatus,
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
    shortLabel: "Wishlist",
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
  { value: "private", label: "Privat", description: "Nur für dich sichtbar." },
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

export const placeTypes: Array<{ value: PlaceType; label: string }> = [
  { value: "city", label: "Stadt" },
  { value: "beach", label: "Strand" },
  { value: "hotel", label: "Hotel" },
  { value: "viewpoint", label: "Aussichtspunkt" },
  { value: "restaurant", label: "Restaurant" },
  { value: "activity", label: "Aktivität" },
  { value: "museum", label: "Museum" },
  { value: "nature", label: "Natur" },
  { value: "airport", label: "Flughafen" },
  { value: "other", label: "Sonstiges" },
];

export const tripStatuses: Array<{ value: TripStatus; label: string }> = [
  { value: "idea", label: "Idee" },
  { value: "planned", label: "Geplant" },
  { value: "booked", label: "Gebucht" },
  { value: "completed", label: "Abgeschlossen" },
  { value: "cancelled", label: "Abgesagt" },
];

export const statusLabels = countryStatuses.reduce(
  (labels, status) => ({ ...labels, [status.value]: status.label }),
  {} as Record<CountryStatus, string>,
);

export const visibilityLabels = visibilityOptions.reduce(
  (labels, option) => ({ ...labels, [option.value]: option.label }),
  {} as Record<CountryVisibility, string>,
);

export const placeTypeLabels = placeTypes.reduce(
  (labels, option) => ({ ...labels, [option.value]: option.label }),
  {} as Record<PlaceType, string>,
);

export const tripStatusLabels = tripStatuses.reduce(
  (labels, option) => ({ ...labels, [option.value]: option.label }),
  {} as Record<TripStatus, string>,
);

export const statusStyles: Record<CountryStatus, string> = {
  visited:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-400/15 dark:text-emerald-200 dark:ring-emerald-400/30",
  planned:
    "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-sky-400/15 dark:text-sky-200 dark:ring-sky-400/30",
  must_visit:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-400/15 dark:text-amber-200 dark:ring-amber-400/30",
  maybe:
    "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-400/15 dark:text-violet-200 dark:ring-violet-400/30",
  no_interest:
    "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/10",
};

export const statusMapColors: Record<CountryStatus, string> = {
  visited: "#22c55e",
  planned: "#3b82f6",
  must_visit: "#f59e0b",
  maybe: "#8b5cf6",
  no_interest: "#94a3b8",
};

export const countryCoordinates: Record<
  string,
  { latitude: number; longitude: number; countryCode: string }
> = {
  japan: { latitude: 36.2048, longitude: 138.2529, countryCode: "JP" },
  island: { latitude: 64.9631, longitude: -19.0208, countryCode: "IS" },
  "costa rica": { latitude: 9.7489, longitude: -83.7534, countryCode: "CR" },
  italien: { latitude: 41.8719, longitude: 12.5674, countryCode: "IT" },
  norwegen: { latitude: 60.472, longitude: 8.4689, countryCode: "NO" },
  portugal: { latitude: 39.3999, longitude: -8.2245, countryCode: "PT" },
  marokko: { latitude: 31.7917, longitude: -7.0926, countryCode: "MA" },
  kanada: { latitude: 56.1304, longitude: -106.3468, countryCode: "CA" },
  neuseeland: { latitude: -40.9006, longitude: 174.886, countryCode: "NZ" },
  peru: { latitude: -9.19, longitude: -75.0152, countryCode: "PE" },
};

export const demoCoverPhotos = {
  slovenia:
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80",
  portugal:
    "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=80",
  japan:
    "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=900&q=80",
  canada:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  iceland:
    "https://images.unsplash.com/photo-1504829857797-ddff29c27927?auto=format&fit=crop&w=900&q=80",
  italy:
    "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=900&q=80",
};

export const seedCountries: Country[] = [
  {
    id: "seed-japan",
    name: "Japan",
    countryCode: "JP",
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
    coverPhotoUrl: demoCoverPhotos.japan,
    createdAt: "2026-07-01T08:30:00.000Z",
    updatedAt: "2026-07-01T08:30:00.000Z",
  },
  {
    id: "seed-iceland",
    name: "Island",
    countryCode: "IS",
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
    coverPhotoUrl: demoCoverPhotos.iceland,
    createdAt: "2026-06-20T10:15:00.000Z",
    updatedAt: "2026-06-21T12:15:00.000Z",
  },
  {
    id: "seed-italy",
    name: "Italien",
    countryCode: "IT",
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
    coverPhotoUrl: demoCoverPhotos.italy,
    visitedFrom: "2025-05-02",
    visitedTo: "2025-05-08",
    createdAt: "2026-05-12T09:00:00.000Z",
    updatedAt: "2026-05-12T09:00:00.000Z",
  },
  {
    id: "seed-canada",
    name: "Kanada",
    countryCode: "CA",
    continent: "North America",
    status: "visited",
    personalRating: 9,
    shortNote: "Seen, Berge, lange Straßen und dieses große Draußen-Gefühl.",
    longNote:
      "Kanada ist perfekt für Roadtrips und Naturtage. Später sollen hier Banff, Vancouver Island und Montreal als Orte sauber getrennt werden.",
    bestTravelMonths: "Juni bis September",
    visibility: "family",
    latitude: 56.1304,
    longitude: -106.3468,
    coverPhotoUrl: demoCoverPhotos.canada,
    createdAt: "2026-04-12T09:00:00.000Z",
    updatedAt: "2026-04-15T09:00:00.000Z",
  },
];

export const seedPlaces: Place[] = [
  {
    id: "place-tokyo",
    countryId: "seed-japan",
    name: "Tokyo",
    type: "city",
    latitude: 35.6762,
    longitude: 139.6503,
    address: "Tokyo, Japan",
    rating: 10,
    shortNote: "Neon, Essen, Viertel-Hopping und perfekte Zuglogik.",
    longNote: "Als Startpunkt ideal. Drei bis fünf Tage, dann weiter Richtung Kyoto.",
    visibility: "private",
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",
  },
  {
    id: "place-reykjavik",
    countryId: "seed-iceland",
    name: "Reykjavik",
    type: "city",
    latitude: 64.1466,
    longitude: -21.9426,
    address: "Reykjavik, Iceland",
    rating: 8,
    shortNote: "Guter Start für Roadtrip, Blue Lagoon und Food Spots.",
    longNote: "Praktisch für Ankunft und die ersten zwei Nächte.",
    visibility: "family",
    createdAt: "2026-06-22T10:00:00.000Z",
    updatedAt: "2026-06-22T10:00:00.000Z",
  },
  {
    id: "place-rome",
    countryId: "seed-italy",
    name: "Rom",
    type: "city",
    latitude: 41.9028,
    longitude: 12.4964,
    address: "Rom, Italien",
    rating: 8,
    shortNote: "Geschichte, Pasta, Espresso und lange Abende.",
    longNote: "Für Kurztrips sehr stark, aber nicht im Hochsommer.",
    visibility: "private",
    createdAt: "2026-05-12T12:00:00.000Z",
    updatedAt: "2026-05-12T12:00:00.000Z",
  },
];

export const seedTrips: Trip[] = [
  {
    id: "trip-iceland-ring",
    title: "Island Ringstraße",
    countryId: "seed-iceland",
    startDate: "2026-08-12",
    endDate: "2026-08-22",
    status: "planned",
    budgetEstimate: 2400,
    currency: "EUR",
    travelStyle: "Roadtrip, Natur, warme Jacke",
    visibility: "family",
    coverPhotoUrl: demoCoverPhotos.iceland,
    notes: "Route grob gegen den Uhrzeigersinn. Wetter und Packliste früh prüfen.",
    createdAt: "2026-06-25T08:00:00.000Z",
    updatedAt: "2026-06-25T08:00:00.000Z",
  },
];

export const seedTripDays: TripDay[] = [
  {
    id: "day-iceland-1",
    tripId: "trip-iceland-ring",
    dayNumber: 1,
    date: "2026-08-12",
    title: "Ankommen in Reykjavik",
    planText: "Mietwagen holen, entspannt einchecken, kurzer Stadtspaziergang.",
    createdAt: "2026-06-25T08:10:00.000Z",
    updatedAt: "2026-06-25T08:10:00.000Z",
  },
  {
    id: "day-iceland-2",
    tripId: "trip-iceland-ring",
    dayNumber: 2,
    date: "2026-08-13",
    title: "Golden Circle",
    planText: "Thingvellir, Geysir, Gullfoss. Abends Hotpot suchen.",
    createdAt: "2026-06-25T08:11:00.000Z",
    updatedAt: "2026-06-25T08:11:00.000Z",
  },
];

export const seedTripDayItems: TripDayItem[] = [
  {
    id: "item-iceland-hotel",
    tripDayId: "day-iceland-1",
    title: "Hotel in Reykjavik speichern",
    type: "hotel",
    startTime: "16:00",
    endTime: "17:00",
    notes: "Booking-Link noch ergänzen.",
    sortOrder: 1,
    createdAt: "2026-06-25T08:20:00.000Z",
    updatedAt: "2026-06-25T08:20:00.000Z",
  },
];

export const seedSavedLinks: SavedLink[] = [
  {
    id: "link-iceland-car",
    countryId: "seed-iceland",
    tripId: "trip-iceland-ring",
    title: "Mietwagenvergleich",
    url: "https://www.booking.com/cars/",
    provider: "Booking",
    notes: "Früh buchen, Allrad prüfen.",
    createdAt: "2026-06-25T09:00:00.000Z",
    updatedAt: "2026-06-25T09:00:00.000Z",
  },
];

export const seedPackingItems: PackingItem[] = [
  {
    id: "pack-rain-jacket",
    tripId: "trip-iceland-ring",
    title: "Regenjacke",
    category: "Kleidung",
    isPacked: false,
    createdAt: "2026-06-25T09:30:00.000Z",
    updatedAt: "2026-06-25T09:30:00.000Z",
  },
  {
    id: "pack-powerbank",
    tripId: "trip-iceland-ring",
    title: "Powerbank",
    category: "Technik",
    isPacked: true,
    createdAt: "2026-06-25T09:31:00.000Z",
    updatedAt: "2026-06-25T09:31:00.000Z",
  },
];

export const seedPhotos: TravelPhoto[] = [
  {
    id: "photo-italy-cover",
    countryId: "seed-italy",
    publicUrl: demoCoverPhotos.italy,
    caption: "Italien bleibt immer eine gute Idee.",
    visibility: "private",
    createdAt: "2026-05-12T09:00:00.000Z",
    updatedAt: "2026-05-12T09:00:00.000Z",
  },
];

export const seedTravelState: TravelState = {
  countries: seedCountries,
  places: seedPlaces,
  trips: seedTrips,
  tripDays: seedTripDays,
  tripDayItems: seedTripDayItems,
  photos: seedPhotos,
  routes: [],
  savedLinks: seedSavedLinks,
  packingItems: seedPackingItems,
  aiGenerations: [],
};

export function getCoordinatesForCountry(name: string) {
  return countryCoordinates[name.trim().toLowerCase()] ?? null;
}
