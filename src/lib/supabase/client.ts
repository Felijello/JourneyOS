import { createClient } from "@supabase/supabase-js";
import type {
  AiGeneration,
  Country,
  CountryFormInput,
  PackingItem,
  Place,
  PlaceFormInput,
  RouteFormInput,
  RoutePlan,
  SavedLink,
  TravelPhoto,
  Trip,
  TripDay,
  TripDayItem,
  TripFormInput,
} from "@/types/country";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

type CountryRow = {
  id: string;
  user_id: string | null;
  name: string;
  country_code: string | null;
  continent: Country["continent"];
  status: Country["status"];
  rating: number | null;
  personal_rating?: number | null;
  short_note: string | null;
  long_note: string | null;
  best_travel_months: string | null;
  visibility: Country["visibility"];
  latitude: number | null;
  longitude: number | null;
  cover_photo_url: string | null;
  visited_from: string | null;
  visited_to: string | null;
  created_at: string;
  updated_at: string;
};

type PlaceRow = {
  id: string;
  user_id: string | null;
  country_id: string;
  name: string;
  type: Place["type"];
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  rating: number | null;
  short_note: string | null;
  long_note: string | null;
  visibility: Place["visibility"];
  created_at: string;
  updated_at: string;
};

type TripRow = {
  id: string;
  user_id: string | null;
  title: string;
  country_id: string | null;
  start_date: string | null;
  end_date: string | null;
  status: Trip["status"];
  budget_estimate: number | null;
  currency: string | null;
  travel_style: string | null;
  visibility: Trip["visibility"];
  cover_photo_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type TripDayRow = {
  id: string;
  user_id: string | null;
  trip_id: string;
  day_number: number;
  date: string | null;
  title: string | null;
  plan_text: string | null;
  created_at: string;
  updated_at: string;
};

type TripDayItemRow = {
  id: string;
  user_id: string | null;
  trip_day_id: string;
  place_id: string | null;
  title: string;
  type: TripDayItem["type"];
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

type PhotoRow = {
  id: string;
  user_id: string | null;
  country_id: string | null;
  place_id: string | null;
  trip_id: string | null;
  storage_path: string | null;
  public_url: string | null;
  caption: string | null;
  taken_at: string | null;
  latitude: number | null;
  longitude: number | null;
  visibility: TravelPhoto["visibility"];
  created_at: string;
  updated_at: string;
};

type RouteRow = {
  id: string;
  user_id: string | null;
  trip_id: string | null;
  name: string;
  route_geojson: unknown;
  distance_km: number | null;
  duration_minutes: number | null;
  provider: RoutePlan["provider"];
  created_at: string;
  updated_at: string;
};

type SavedLinkRow = {
  id: string;
  user_id: string | null;
  country_id: string | null;
  place_id: string | null;
  trip_id: string | null;
  title: string;
  url: string;
  provider: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type PackingItemRow = {
  id: string;
  user_id: string | null;
  trip_id: string;
  title: string;
  category: string | null;
  is_packed: boolean | null;
  created_at: string;
  updated_at: string;
};

type AiGenerationRow = {
  id: string;
  user_id: string | null;
  entity_type: AiGeneration["entityType"];
  entity_id: string | null;
  prompt: string;
  result: string;
  provider: AiGeneration["provider"];
  created_at: string;
};

export function mapCountryFromRow(row: CountryRow): Country {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    countryCode: row.country_code,
    continent: row.continent,
    status: row.status,
    personalRating: row.rating ?? row.personal_rating ?? 7,
    shortNote: row.short_note ?? "",
    longNote: row.long_note ?? "",
    bestTravelMonths: row.best_travel_months ?? "",
    visibility: row.visibility,
    latitude: row.latitude,
    longitude: row.longitude,
    coverPhotoUrl: row.cover_photo_url,
    visitedFrom: row.visited_from,
    visitedTo: row.visited_to,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCountryToRow(input: CountryFormInput) {
  return {
    name: input.name,
    country_code: input.countryCode ?? null,
    continent: input.continent,
    status: input.status,
    rating: input.personalRating,
    short_note: input.shortNote,
    long_note: input.longNote,
    best_travel_months: input.bestTravelMonths,
    visibility: input.visibility,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    cover_photo_url: input.coverPhotoUrl ?? null,
    visited_from: input.visitedFrom ?? null,
    visited_to: input.visitedTo ?? null,
  };
}

export function mapPlaceFromRow(row: PlaceRow): Place {
  return {
    id: row.id,
    userId: row.user_id,
    countryId: row.country_id,
    name: row.name,
    type: row.type,
    latitude: row.latitude,
    longitude: row.longitude,
    address: row.address,
    rating: row.rating ?? 7,
    shortNote: row.short_note ?? "",
    longNote: row.long_note ?? "",
    visibility: row.visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPlaceToRow(input: PlaceFormInput) {
  return {
    country_id: input.countryId,
    name: input.name,
    type: input.type,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    address: input.address ?? null,
    rating: input.rating,
    short_note: input.shortNote,
    long_note: input.longNote,
    visibility: input.visibility,
  };
}

export function mapTripFromRow(row: TripRow): Trip {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    countryId: row.country_id,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    budgetEstimate: row.budget_estimate,
    currency: row.currency ?? "EUR",
    travelStyle: row.travel_style ?? "",
    visibility: row.visibility,
    coverPhotoUrl: row.cover_photo_url,
    notes: row.notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTripToRow(input: TripFormInput) {
  return {
    title: input.title,
    country_id: input.countryId ?? null,
    start_date: input.startDate ?? null,
    end_date: input.endDate ?? null,
    status: input.status,
    budget_estimate: input.budgetEstimate ?? null,
    currency: input.currency || "EUR",
    travel_style: input.travelStyle,
    visibility: input.visibility,
    cover_photo_url: input.coverPhotoUrl ?? null,
    notes: input.notes,
  };
}

export function mapTripDayFromRow(row: TripDayRow): TripDay {
  return {
    id: row.id,
    userId: row.user_id,
    tripId: row.trip_id,
    dayNumber: row.day_number,
    date: row.date,
    title: row.title ?? "",
    planText: row.plan_text ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTripDayToRow(input: Omit<TripDay, "id" | "createdAt" | "updatedAt">) {
  return {
    user_id: input.userId ?? undefined,
    trip_id: input.tripId,
    day_number: input.dayNumber,
    date: input.date ?? null,
    title: input.title,
    plan_text: input.planText,
  };
}

export function mapTripDayItemFromRow(row: TripDayItemRow): TripDayItem {
  return {
    id: row.id,
    userId: row.user_id,
    tripDayId: row.trip_day_id,
    placeId: row.place_id,
    title: row.title,
    type: row.type,
    startTime: row.start_time,
    endTime: row.end_time,
    notes: row.notes ?? "",
    sortOrder: row.sort_order ?? 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTripDayItemToRow(
  input: Omit<TripDayItem, "id" | "createdAt" | "updatedAt">,
) {
  return {
    user_id: input.userId ?? undefined,
    trip_day_id: input.tripDayId,
    place_id: input.placeId ?? null,
    title: input.title,
    type: input.type,
    start_time: input.startTime ?? null,
    end_time: input.endTime ?? null,
    notes: input.notes,
    sort_order: input.sortOrder,
  };
}

export function mapPhotoFromRow(row: PhotoRow): TravelPhoto {
  return {
    id: row.id,
    userId: row.user_id,
    countryId: row.country_id,
    placeId: row.place_id,
    tripId: row.trip_id,
    storagePath: row.storage_path,
    publicUrl: row.public_url,
    caption: row.caption ?? "",
    takenAt: row.taken_at,
    latitude: row.latitude,
    longitude: row.longitude,
    visibility: row.visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPhotoToRow(input: Omit<TravelPhoto, "id" | "createdAt" | "updatedAt">) {
  return {
    user_id: input.userId ?? undefined,
    country_id: input.countryId ?? null,
    place_id: input.placeId ?? null,
    trip_id: input.tripId ?? null,
    storage_path: input.storagePath ?? "",
    public_url: input.publicUrl ?? null,
    caption: input.caption,
    taken_at: input.takenAt ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    visibility: input.visibility,
  };
}

export function mapRouteFromRow(row: RouteRow): RoutePlan {
  return {
    id: row.id,
    userId: row.user_id,
    tripId: row.trip_id,
    name: row.name,
    routeGeojson: row.route_geojson,
    distanceKm: row.distance_km,
    durationMinutes: row.duration_minutes,
    provider: row.provider,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRouteToRow(input: RouteFormInput) {
  return {
    trip_id: input.tripId ?? null,
    name: input.name,
    route_geojson: input.routeGeojson ?? null,
    distance_km: input.distanceKm ?? null,
    duration_minutes: input.durationMinutes ?? null,
    provider: input.provider,
  };
}

export function mapSavedLinkFromRow(row: SavedLinkRow): SavedLink {
  return {
    id: row.id,
    userId: row.user_id,
    countryId: row.country_id,
    placeId: row.place_id,
    tripId: row.trip_id,
    title: row.title,
    url: row.url,
    provider: row.provider ?? "",
    notes: row.notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSavedLinkToRow(
  input: Omit<SavedLink, "id" | "createdAt" | "updatedAt">,
) {
  return {
    user_id: input.userId ?? undefined,
    country_id: input.countryId ?? null,
    place_id: input.placeId ?? null,
    trip_id: input.tripId ?? null,
    title: input.title,
    url: input.url,
    provider: input.provider,
    notes: input.notes,
  };
}

export function mapPackingItemFromRow(row: PackingItemRow): PackingItem {
  return {
    id: row.id,
    userId: row.user_id,
    tripId: row.trip_id,
    title: row.title,
    category: row.category ?? "Allgemein",
    isPacked: Boolean(row.is_packed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPackingItemToRow(
  input: Omit<PackingItem, "id" | "createdAt" | "updatedAt">,
) {
  return {
    user_id: input.userId ?? undefined,
    trip_id: input.tripId,
    title: input.title,
    category: input.category,
    is_packed: input.isPacked,
  };
}

export function mapAiGenerationFromRow(row: AiGenerationRow): AiGeneration {
  return {
    id: row.id,
    userId: row.user_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    prompt: row.prompt,
    result: row.result,
    provider: row.provider,
    createdAt: row.created_at,
  };
}

export function mapAiGenerationToRow(input: Omit<AiGeneration, "id" | "createdAt">) {
  return {
    user_id: input.userId ?? undefined,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    prompt: input.prompt,
    result: input.result,
    provider: input.provider,
  };
}
