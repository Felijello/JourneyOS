import { createClient } from "@supabase/supabase-js";
import type { Country, CountryFormInput } from "@/types/country";

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
  continent: Country["continent"];
  status: Country["status"];
  personal_rating: number;
  short_note: string | null;
  long_note: string | null;
  best_travel_months: string | null;
  visibility: Country["visibility"];
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
};

export function mapCountryFromRow(row: CountryRow): Country {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    continent: row.continent,
    status: row.status,
    personalRating: row.personal_rating,
    shortNote: row.short_note ?? "",
    longNote: row.long_note ?? "",
    bestTravelMonths: row.best_travel_months ?? "",
    visibility: row.visibility,
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCountryToRow(input: CountryFormInput) {
  return {
    name: input.name,
    continent: input.continent,
    status: input.status,
    personal_rating: input.personalRating,
    short_note: input.shortNote,
    long_note: input.longNote,
    best_travel_months: input.bestTravelMonths,
    visibility: input.visibility,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
  };
}

