export type CountryStatus =
  | "visited"
  | "planned"
  | "must_visit"
  | "maybe"
  | "no_interest";

export type CountryVisibility = "private" | "family" | "public";

export type Continent =
  | "Africa"
  | "Antarctica"
  | "Asia"
  | "Europe"
  | "North America"
  | "Oceania"
  | "South America";

export type PlaceType =
  | "city"
  | "beach"
  | "hotel"
  | "viewpoint"
  | "restaurant"
  | "activity"
  | "museum"
  | "nature"
  | "airport"
  | "other";

export type TripStatus = "idea" | "planned" | "booked" | "completed" | "cancelled";

export type TripDayItemType =
  | "hotel"
  | "activity"
  | "transport"
  | "food"
  | "note"
  | "route";

export type EntityType = "country" | "place" | "trip";

export type Country = {
  id: string;
  userId?: string | null;
  name: string;
  countryCode?: string | null;
  continent: Continent;
  status: CountryStatus;
  personalRating: number;
  shortNote: string;
  longNote: string;
  bestTravelMonths: string;
  visibility: CountryVisibility;
  latitude?: number | null;
  longitude?: number | null;
  coverPhotoUrl?: string | null;
  visitedFrom?: string | null;
  visitedTo?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CountryFormInput = Omit<
  Country,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

export type Place = {
  id: string;
  userId?: string | null;
  countryId: string;
  name: string;
  type: PlaceType;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  rating: number;
  shortNote: string;
  longNote: string;
  visibility: CountryVisibility;
  createdAt: string;
  updatedAt: string;
};

export type PlaceFormInput = Omit<
  Place,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

export type Trip = {
  id: string;
  userId?: string | null;
  title: string;
  countryId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: TripStatus;
  budgetEstimate?: number | null;
  currency: string;
  travelStyle: string;
  visibility: CountryVisibility;
  destinationName: string;
  description: string;
  highlights: string[];
  coverPhotoUrl?: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type TripFormInput = Omit<Trip, "id" | "userId" | "createdAt" | "updatedAt">;

export type TripDay = {
  id: string;
  userId?: string | null;
  tripId: string;
  dayNumber: number;
  date?: string | null;
  title: string;
  planText: string;
  createdAt: string;
  updatedAt: string;
};

export type TripDayItem = {
  id: string;
  userId?: string | null;
  tripDayId: string;
  placeId?: string | null;
  title: string;
  type: TripDayItemType;
  startTime?: string | null;
  endTime?: string | null;
  notes: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type TravelPhoto = {
  id: string;
  userId?: string | null;
  countryId?: string | null;
  placeId?: string | null;
  tripId?: string | null;
  storagePath?: string | null;
  publicUrl?: string | null;
  caption: string;
  takenAt?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  visibility: CountryVisibility;
  createdAt: string;
  updatedAt: string;
};

export type RoutePlan = {
  id: string;
  userId?: string | null;
  tripId?: string | null;
  name: string;
  routeGeojson?: unknown;
  distanceKm?: number | null;
  durationMinutes?: number | null;
  provider: "openrouteservice" | "manual";
  createdAt: string;
  updatedAt: string;
};

export type SavedLink = {
  id: string;
  userId?: string | null;
  countryId?: string | null;
  placeId?: string | null;
  tripId?: string | null;
  title: string;
  url: string;
  provider: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type PackingItem = {
  id: string;
  userId?: string | null;
  tripId: string;
  title: string;
  category: string;
  isPacked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AiGeneration = {
  id: string;
  userId?: string | null;
  entityType: EntityType;
  entityId?: string | null;
  prompt: string;
  result: string;
  provider: "gemini" | "demo";
  createdAt: string;
};

export type CountrySort = "newest" | "name" | "rating" | "status";

export type TravelState = {
  countries: Country[];
  places: Place[];
  trips: Trip[];
  tripDays: TripDay[];
  tripDayItems: TripDayItem[];
  photos: TravelPhoto[];
  routes: RoutePlan[];
  savedLinks: SavedLink[];
  packingItems: PackingItem[];
  aiGenerations: AiGeneration[];
};

export type RouteFormInput = Omit<
  RoutePlan,
  "id" | "userId" | "createdAt" | "updatedAt"
>;
