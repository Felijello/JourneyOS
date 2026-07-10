"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getCoordinatesForCountry, seedTravelState } from "@/lib/country-options";
import {
  isSupabaseConfigured,
  mapAiGenerationFromRow,
  mapAiGenerationToRow,
  mapCountryFromRow,
  mapCountryToRow,
  mapPackingItemFromRow,
  mapPackingItemToRow,
  mapPhotoFromRow,
  mapPhotoToRow,
  mapPlaceFromRow,
  mapPlaceToRow,
  mapRouteFromRow,
  mapRouteToRow,
  mapSavedLinkFromRow,
  mapSavedLinkToRow,
  mapTripDayFromRow,
  mapTripDayItemFromRow,
  mapTripDayItemToRow,
  mapTripDayToRow,
  mapTripFromRow,
  mapTripToRow,
  supabase,
} from "@/lib/supabase/client";
import { getIsoNow } from "@/lib/utils";
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
  TravelState,
  Trip,
  TripDay,
  TripDayItem,
  TripFormInput,
} from "@/types/country";

type DataSource = "supabase" | "local";
type SupabaseAuthStatus = "unconfigured" | "signed_out" | "signed_in" | "error";

type ServerCapabilities = {
  ai: boolean;
  routing: boolean;
};

type TravelContextValue = TravelState & {
  isLoading: boolean;
  isDemoMode: boolean;
  error: string | null;
  dataSource: DataSource;
  supabaseStatus: {
    configured: boolean;
    authenticated: boolean;
    authStatus: SupabaseAuthStatus;
  };
  capabilityStatus: {
    supabase: boolean;
    supabaseAuthenticated: boolean;
    weather: boolean;
    routing: boolean;
    ai: boolean;
    maptiler: boolean;
  };
  createCountry: (input: CountryFormInput) => Promise<Country>;
  updateCountry: (id: string, input: CountryFormInput) => Promise<Country>;
  deleteCountry: (id: string) => Promise<void>;
  createPlace: (input: PlaceFormInput) => Promise<Place>;
  updatePlace: (id: string, input: PlaceFormInput) => Promise<Place>;
  deletePlace: (id: string) => Promise<void>;
  createTrip: (input: TripFormInput) => Promise<Trip>;
  updateTrip: (id: string, input: TripFormInput) => Promise<Trip>;
  deleteTrip: (id: string) => Promise<void>;
  createTripDay: (
    input: Omit<TripDay, "id" | "createdAt" | "updatedAt">,
  ) => Promise<TripDay>;
  updateTripDay: (id: string, input: Partial<TripDay>) => Promise<void>;
  createTripDayItem: (
    input: Omit<TripDayItem, "id" | "createdAt" | "updatedAt">,
  ) => Promise<TripDayItem>;
  updateTripDayItem: (id: string, input: Partial<TripDayItem>) => Promise<void>;
  deleteTripDayItem: (id: string) => Promise<void>;
  createSavedLink: (
    input: Omit<SavedLink, "id" | "createdAt" | "updatedAt">,
  ) => Promise<SavedLink>;
  deleteSavedLink: (id: string) => Promise<void>;
  createPackingItem: (
    input: Omit<PackingItem, "id" | "createdAt" | "updatedAt">,
  ) => Promise<PackingItem>;
  togglePackingItem: (id: string) => Promise<void>;
  deletePackingItem: (id: string) => Promise<void>;
  createPhoto: (
    input: Omit<TravelPhoto, "id" | "createdAt" | "updatedAt">,
  ) => Promise<TravelPhoto>;
  createRoute: (input: RouteFormInput) => Promise<RoutePlan>;
  createAiGeneration: (
    input: Omit<AiGeneration, "id" | "createdAt">,
  ) => Promise<AiGeneration>;
  enableDemoMode: () => void;
  leaveDemoMode: () => void;
  refreshCountries: () => Promise<void>;
};

const TravelContext = createContext<TravelContextValue | null>(null);

const storageKey = "journeyos:travel-state:v2";
const legacyCountryStorageKey = "journeyos:countries:v1";
const demoModeStorageKey = "journeyos:demo-mode";

function readDemoMode() {
  return typeof window !== "undefined" &&
    window.localStorage.getItem(demoModeStorageKey) === "active";
}

function ensureTravelState(state: Partial<TravelState> | null): TravelState {
  return {
    countries: state?.countries?.length ? state.countries : seedTravelState.countries,
    places: state?.places ?? seedTravelState.places,
    trips: state?.trips ?? seedTravelState.trips,
    tripDays: state?.tripDays ?? seedTravelState.tripDays,
    tripDayItems: state?.tripDayItems ?? seedTravelState.tripDayItems,
    photos: state?.photos ?? seedTravelState.photos,
    routes: state?.routes ?? seedTravelState.routes,
    savedLinks: state?.savedLinks ?? seedTravelState.savedLinks,
    packingItems: state?.packingItems ?? seedTravelState.packingItems,
    aiGenerations: state?.aiGenerations ?? seedTravelState.aiGenerations,
  };
}

function readLocalState() {
  if (typeof window === "undefined") {
    return seedTravelState;
  }

  const stored = window.localStorage.getItem(storageKey);
  if (stored) {
    try {
      return ensureTravelState(JSON.parse(stored) as Partial<TravelState>);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }

  const legacyCountries = window.localStorage.getItem(legacyCountryStorageKey);
  if (legacyCountries) {
    try {
      const migrated = ensureTravelState({
        ...seedTravelState,
        countries: JSON.parse(legacyCountries) as Country[],
      });
      window.localStorage.setItem(storageKey, JSON.stringify(migrated));
      return migrated;
    } catch {
      window.localStorage.removeItem(legacyCountryStorageKey);
    }
  }

  window.localStorage.setItem(storageKey, JSON.stringify(seedTravelState));
  return seedTravelState;
}

function writeLocalState(state: TravelState) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }
}

function withDates<T extends object>(input: T) {
  const now = getIsoNow();
  return { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
}

function inferProvider(url: string) {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    if (host.includes("getyourguide")) return "GetYourGuide";
    if (host.includes("booking")) return "Booking";
    if (host.includes("google")) return "Google";
    if (host.includes("airbnb")) return "Airbnb";
    return host.split(".")[0] ?? "Link";
  } catch {
    return "Link";
  }
}

function enrichCountryInput(input: CountryFormInput): CountryFormInput {
  const coordinates = getCoordinatesForCountry(input.name);
  return {
    ...input,
    countryCode: input.countryCode || coordinates?.countryCode || null,
    latitude: input.latitude ?? coordinates?.latitude ?? null,
    longitude: input.longitude ?? coordinates?.longitude ?? null,
  };
}

async function requireSupabaseUser() {
  if (!supabase) throw new Error("Supabase ist nicht konfiguriert.");

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw new Error(error.message);
  if (!user) {
    throw new Error(
      "Bitte melde dich an, bevor du Daten in Supabase speicherst.",
    );
  }

  return user;
}

export function CountryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TravelState>(() => seedTravelState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>("local");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [supabaseAuthStatus, setSupabaseAuthStatus] = useState<SupabaseAuthStatus>(
    isSupabaseConfigured ? "signed_out" : "unconfigured",
  );
  const [serverCapabilities, setServerCapabilities] = useState<ServerCapabilities>({
    ai: false,
    routing: false,
  });

  const supabaseStatus = useMemo(
    () => ({
      configured: isSupabaseConfigured,
      authenticated: supabaseAuthStatus === "signed_in",
      authStatus: supabaseAuthStatus,
    }),
    [supabaseAuthStatus],
  );

  const capabilityStatus = useMemo(
    () => ({
      supabase: isSupabaseConfigured,
      supabaseAuthenticated: supabaseAuthStatus === "signed_in",
      weather: true,
      routing: serverCapabilities.routing,
      ai: serverCapabilities.ai,
      maptiler: Boolean(process.env.NEXT_PUBLIC_MAPTILER_KEY),
    }),
    [serverCapabilities, supabaseAuthStatus],
  );

  const persist = useCallback((updater: (current: TravelState) => TravelState) => {
    setState((current) => {
      const nextState = updater(current);
      writeLocalState(nextState);
      return nextState;
    });
  }, []);

  const refreshCountries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const localState = readLocalState();

    if (!supabase) {
      setState(localState);
      setDataSource("local");
      setIsDemoMode(readDemoMode());
      setSupabaseAuthStatus("unconfigured");
      setIsLoading(false);
      return;
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      setState(localState);
      setDataSource("local");
      setIsDemoMode(readDemoMode());
      setSupabaseAuthStatus("error");
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!session?.user) {
      setState(localState);
      setDataSource("local");
      setIsDemoMode(readDemoMode());
      setSupabaseAuthStatus("signed_out");
      setError(null);
      setIsLoading(false);
      return;
    }

    setSupabaseAuthStatus("signed_in");
    setIsDemoMode(false);
    window.localStorage.removeItem(demoModeStorageKey);

    const [
      countriesResult,
      placesResult,
      tripsResult,
      tripDaysResult,
      tripDayItemsResult,
      photosResult,
      routesResult,
      savedLinksResult,
      packingItemsResult,
      aiGenerationsResult,
    ] = await Promise.all([
      supabase.from("countries").select("*").order("updated_at", { ascending: false }),
      supabase.from("places").select("*").order("updated_at", { ascending: false }),
      supabase.from("trips").select("*").order("updated_at", { ascending: false }),
      supabase.from("trip_days").select("*").order("day_number", { ascending: true }),
      supabase
        .from("trip_day_items")
        .select("*")
        .order("sort_order", { ascending: true }),
      supabase.from("photos").select("*").order("created_at", { ascending: false }),
      supabase.from("routes").select("*").order("updated_at", { ascending: false }),
      supabase.from("saved_links").select("*").order("updated_at", { ascending: false }),
      supabase
        .from("packing_items")
        .select("*")
        .order("updated_at", { ascending: false }),
      supabase
        .from("ai_generations")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    const requestError =
      countriesResult.error ??
      placesResult.error ??
      tripsResult.error ??
      tripDaysResult.error ??
      tripDayItemsResult.error ??
      photosResult.error ??
      routesResult.error ??
      savedLinksResult.error ??
      packingItemsResult.error ??
      aiGenerationsResult.error;

    if (requestError) {
      setState(localState);
      setDataSource("local");
      setError(
        `Supabase ist verbunden, aber die Daten konnten nicht geladen werden: ${requestError.message}. Prüfe schema.sql und RLS-Policies.`,
      );
    } else {
      setState({
        countries: (countriesResult.data ?? []).map(mapCountryFromRow),
        places: (placesResult.data ?? []).map(mapPlaceFromRow),
        trips: (tripsResult.data ?? []).map(mapTripFromRow),
        tripDays: (tripDaysResult.data ?? []).map(mapTripDayFromRow),
        tripDayItems: (tripDayItemsResult.data ?? []).map(mapTripDayItemFromRow),
        photos: (photosResult.data ?? []).map(mapPhotoFromRow),
        routes: (routesResult.data ?? []).map(mapRouteFromRow),
        savedLinks: (savedLinksResult.data ?? []).map(mapSavedLinkFromRow),
        packingItems: (packingItemsResult.data ?? []).map(mapPackingItemFromRow),
        aiGenerations: (aiGenerationsResult.data ?? []).map(mapAiGenerationFromRow),
      });
      setDataSource("supabase");
      setError(null);
    }

    setIsLoading(false);
  }, []);

  const enableDemoMode = useCallback(() => {
    window.localStorage.setItem(demoModeStorageKey, "active");
    writeLocalState(seedTravelState);
    setState(seedTravelState);
    setDataSource("local");
    setIsDemoMode(true);
    setError(null);
    setSupabaseAuthStatus(isSupabaseConfigured ? "signed_out" : "unconfigured");
  }, []);

  const leaveDemoMode = useCallback(() => {
    window.localStorage.removeItem(demoModeStorageKey);
    setIsDemoMode(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshCountries();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refreshCountries]);

  useEffect(() => {
    fetch("/api/health")
      .then((response) => response.json())
      .then((data: Partial<ServerCapabilities>) => {
        setServerCapabilities({
          ai: Boolean(data.ai),
          routing: Boolean(data.routing),
        });
      })
      .catch(() => {
        setServerCapabilities({ ai: false, routing: false });
      });
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshCountries();
    });

    return () => subscription.unsubscribe();
  }, [refreshCountries]);

  const createCountry = useCallback(
    async (rawInput: CountryFormInput) => {
      const input = enrichCountryInput(rawInput);

      if (supabase && dataSource === "supabase") {
        await requireSupabaseUser();
        const { data, error: requestError } = await supabase
          .from("countries")
          .insert(mapCountryToRow(input))
          .select("*")
          .single();

        if (requestError) throw new Error(requestError.message);

        const country = mapCountryFromRow(data);
        persist((current) => ({ ...current, countries: [country, ...current.countries] }));
        return country;
      }

      const country = withDates({ ...input, userId: null }) as Country;
      persist((current) => ({ ...current, countries: [country, ...current.countries] }));
      return country;
    },
    [dataSource, persist],
  );

  const updateCountry = useCallback(
    async (id: string, rawInput: CountryFormInput) => {
      const input = enrichCountryInput(rawInput);

      if (supabase && dataSource === "supabase") {
        await requireSupabaseUser();
        const { data, error: requestError } = await supabase
          .from("countries")
          .update(mapCountryToRow(input))
          .eq("id", id)
          .select("*")
          .single();

        if (requestError) throw new Error(requestError.message);

        const country = mapCountryFromRow(data);
        persist((current) => ({
          ...current,
          countries: current.countries.map((item) => (item.id === id ? country : item)),
        }));
        return country;
      }

      const existing = state.countries.find((country) => country.id === id);
      if (!existing) throw new Error("Land wurde nicht gefunden.");

      const updatedCountry = { ...existing, ...input, updatedAt: getIsoNow() };
      persist((current) => ({
        ...current,
        countries: current.countries.map((country) =>
          country.id === id ? updatedCountry : country,
        ),
      }));
      return updatedCountry;
    },
    [dataSource, persist, state.countries],
  );

  const deleteCountry = useCallback(
    async (id: string) => {
      if (supabase && dataSource === "supabase") {
        await requireSupabaseUser();
        const { error: requestError } = await supabase
          .from("countries")
          .delete()
          .eq("id", id);
        if (requestError) throw new Error(requestError.message);
      }

      persist((current) => ({
        ...current,
        countries: current.countries.filter((country) => country.id !== id),
        places: current.places.filter((place) => place.countryId !== id),
        photos: current.photos.filter((photo) => photo.countryId !== id),
        savedLinks: current.savedLinks.filter((link) => link.countryId !== id),
      }));
    },
    [dataSource, persist],
  );

  const createPlace = useCallback(
    async (input: PlaceFormInput) => {
      if (supabase && dataSource === "supabase") {
        await requireSupabaseUser();
        const { data, error: requestError } = await supabase
          .from("places")
          .insert(mapPlaceToRow(input))
          .select("*")
          .single();

        if (requestError) throw new Error(requestError.message);

        const place = mapPlaceFromRow(data);
        persist((current) => ({ ...current, places: [place, ...current.places] }));
        return place;
      }

      const place = withDates({ ...input, userId: null }) as Place;
      persist((current) => ({ ...current, places: [place, ...current.places] }));
      return place;
    },
    [dataSource, persist],
  );

  const updatePlace = useCallback(
    async (id: string, input: PlaceFormInput) => {
      if (supabase && dataSource === "supabase") {
        await requireSupabaseUser();
        const { data, error: requestError } = await supabase
          .from("places")
          .update(mapPlaceToRow(input))
          .eq("id", id)
          .select("*")
          .single();

        if (requestError) throw new Error(requestError.message);

        const place = mapPlaceFromRow(data);
        persist((current) => ({
          ...current,
          places: current.places.map((item) => (item.id === id ? place : item)),
        }));
        return place;
      }

      const existing = state.places.find((place) => place.id === id);
      if (!existing) throw new Error("Ort wurde nicht gefunden.");
      const place = { ...existing, ...input, updatedAt: getIsoNow() };
      persist((current) => ({
        ...current,
        places: current.places.map((item) => (item.id === id ? place : item)),
      }));
      return place;
    },
    [dataSource, persist, state.places],
  );

  const deletePlace = useCallback(
    async (id: string) => {
      if (supabase && dataSource === "supabase") {
        await requireSupabaseUser();
        const { error: requestError } = await supabase
          .from("places")
          .delete()
          .eq("id", id);
        if (requestError) throw new Error(requestError.message);
      }

      persist((current) => ({
        ...current,
        places: current.places.filter((place) => place.id !== id),
        tripDayItems: current.tripDayItems.map((item) =>
          item.placeId === id ? { ...item, placeId: null } : item,
        ),
      }));
    },
    [dataSource, persist],
  );

  const createTrip = useCallback(
    async (input: TripFormInput) => {
      if (supabase && dataSource === "supabase") {
        await requireSupabaseUser();
        const { data, error: requestError } = await supabase
          .from("trips")
          .insert(mapTripToRow(input))
          .select("*")
          .single();

        if (requestError) throw new Error(requestError.message);

        const trip = mapTripFromRow(data);
        persist((current) => ({ ...current, trips: [trip, ...current.trips] }));
        return trip;
      }

      const trip = withDates({ ...input, userId: null }) as Trip;
      persist((current) => ({ ...current, trips: [trip, ...current.trips] }));
      return trip;
    },
    [dataSource, persist],
  );

  const updateTrip = useCallback(
    async (id: string, input: TripFormInput) => {
      if (supabase && dataSource === "supabase") {
        await requireSupabaseUser();
        const { data, error: requestError } = await supabase
          .from("trips")
          .update(mapTripToRow(input))
          .eq("id", id)
          .select("*")
          .single();

        if (requestError) throw new Error(requestError.message);

        const trip = mapTripFromRow(data);
        persist((current) => ({
          ...current,
          trips: current.trips.map((item) => (item.id === id ? trip : item)),
        }));
        return trip;
      }

      const existing = state.trips.find((trip) => trip.id === id);
      if (!existing) throw new Error("Trip wurde nicht gefunden.");
      const trip = { ...existing, ...input, updatedAt: getIsoNow() };
      persist((current) => ({
        ...current,
        trips: current.trips.map((item) => (item.id === id ? trip : item)),
      }));
      return trip;
    },
    [dataSource, persist, state.trips],
  );

  const deleteTrip = useCallback(
    async (id: string) => {
      if (supabase && dataSource === "supabase") {
        await requireSupabaseUser();
        const { error: requestError } = await supabase
          .from("trips")
          .delete()
          .eq("id", id);
        if (requestError) throw new Error(requestError.message);
      }

      persist((current) => {
        const dayIds = current.tripDays
          .filter((day) => day.tripId === id)
          .map((day) => day.id);
        return {
          ...current,
          trips: current.trips.filter((trip) => trip.id !== id),
          tripDays: current.tripDays.filter((day) => day.tripId !== id),
          tripDayItems: current.tripDayItems.filter(
            (item) => !dayIds.includes(item.tripDayId),
          ),
          packingItems: current.packingItems.filter((item) => item.tripId !== id),
          savedLinks: current.savedLinks.filter((link) => link.tripId !== id),
        };
      });
    },
    [dataSource, persist],
  );

  const createTripDay = useCallback(
    async (input: Omit<TripDay, "id" | "createdAt" | "updatedAt">) => {
      if (supabase && dataSource === "supabase") {
        const user = await requireSupabaseUser();
        const { data, error: requestError } = await supabase
          .from("trip_days")
          .insert(mapTripDayToRow({ ...input, userId: user.id }))
          .select("*")
          .single();

        if (requestError) throw new Error(requestError.message);

        const day = mapTripDayFromRow(data);
        persist((current) => ({ ...current, tripDays: [...current.tripDays, day] }));
        return day;
      }

      const day = withDates(input) as TripDay;
      persist((current) => ({ ...current, tripDays: [...current.tripDays, day] }));
      return day;
    },
    [dataSource, persist],
  );

  const updateTripDay = useCallback(
    async (id: string, input: Partial<TripDay>) => {
      if (supabase && dataSource === "supabase") {
        await requireSupabaseUser();
        const { error: requestError } = await supabase
          .from("trip_days")
          .update({
            date: input.date ?? undefined,
            title: input.title ?? undefined,
            plan_text: input.planText ?? undefined,
          })
          .eq("id", id);

        if (requestError) throw new Error(requestError.message);
      }

      persist((current) => ({
        ...current,
        tripDays: current.tripDays.map((day) =>
          day.id === id ? { ...day, ...input, updatedAt: getIsoNow() } : day,
        ),
      }));
    },
    [dataSource, persist],
  );

  const createTripDayItem = useCallback(
    async (input: Omit<TripDayItem, "id" | "createdAt" | "updatedAt">) => {
      if (supabase && dataSource === "supabase") {
        const user = await requireSupabaseUser();
        const { data, error: requestError } = await supabase
          .from("trip_day_items")
          .insert(mapTripDayItemToRow({ ...input, userId: user.id }))
          .select("*")
          .single();

        if (requestError) throw new Error(requestError.message);

        const item = mapTripDayItemFromRow(data);
        persist((current) => ({
          ...current,
          tripDayItems: [...current.tripDayItems, item],
        }));
        return item;
      }

      const item = withDates(input) as TripDayItem;
      persist((current) => ({
        ...current,
        tripDayItems: [...current.tripDayItems, item],
      }));
      return item;
    },
    [dataSource, persist],
  );

  const updateTripDayItem = useCallback(
    async (id: string, input: Partial<TripDayItem>) => {
      if (supabase && dataSource === "supabase") {
        await requireSupabaseUser();
        const { error: requestError } = await supabase
          .from("trip_day_items")
          .update({
            place_id: input.placeId ?? undefined,
            title: input.title ?? undefined,
            type: input.type ?? undefined,
            start_time: input.startTime ?? undefined,
            end_time: input.endTime ?? undefined,
            notes: input.notes ?? undefined,
            sort_order: input.sortOrder ?? undefined,
          })
          .eq("id", id);

        if (requestError) throw new Error(requestError.message);
      }

      persist((current) => ({
        ...current,
        tripDayItems: current.tripDayItems.map((item) =>
          item.id === id ? { ...item, ...input, updatedAt: getIsoNow() } : item,
        ),
      }));
    },
    [dataSource, persist],
  );

  const deleteTripDayItem = useCallback(
    async (id: string) => {
      if (supabase && dataSource === "supabase") {
        await requireSupabaseUser();
        const { error: requestError } = await supabase
          .from("trip_day_items")
          .delete()
          .eq("id", id);
        if (requestError) throw new Error(requestError.message);
      }

      persist((current) => ({
        ...current,
        tripDayItems: current.tripDayItems.filter((item) => item.id !== id),
      }));
    },
    [dataSource, persist],
  );

  const createSavedLink = useCallback(
    async (input: Omit<SavedLink, "id" | "createdAt" | "updatedAt">) => {
      const normalizedInput = {
        ...input,
        provider: input.provider || inferProvider(input.url),
      };

      if (supabase && dataSource === "supabase") {
        const user = await requireSupabaseUser();
        const { data, error: requestError } = await supabase
          .from("saved_links")
          .insert(mapSavedLinkToRow({ ...normalizedInput, userId: user.id }))
          .select("*")
          .single();

        if (requestError) throw new Error(requestError.message);

        const link = mapSavedLinkFromRow(data);
        persist((current) => ({ ...current, savedLinks: [link, ...current.savedLinks] }));
        return link;
      }

      const link = withDates(normalizedInput) as SavedLink;
      persist((current) => ({ ...current, savedLinks: [link, ...current.savedLinks] }));
      return link;
    },
    [dataSource, persist],
  );

  const deleteSavedLink = useCallback(
    async (id: string) => {
      if (supabase && dataSource === "supabase") {
        await requireSupabaseUser();
        const { error: requestError } = await supabase
          .from("saved_links")
          .delete()
          .eq("id", id);
        if (requestError) throw new Error(requestError.message);
      }

      persist((current) => ({
        ...current,
        savedLinks: current.savedLinks.filter((link) => link.id !== id),
      }));
    },
    [dataSource, persist],
  );

  const createPackingItem = useCallback(
    async (input: Omit<PackingItem, "id" | "createdAt" | "updatedAt">) => {
      if (supabase && dataSource === "supabase") {
        const user = await requireSupabaseUser();
        const { data, error: requestError } = await supabase
          .from("packing_items")
          .insert(mapPackingItemToRow({ ...input, userId: user.id }))
          .select("*")
          .single();

        if (requestError) throw new Error(requestError.message);

        const item = mapPackingItemFromRow(data);
        persist((current) => ({
          ...current,
          packingItems: [item, ...current.packingItems],
        }));
        return item;
      }

      const item = withDates(input) as PackingItem;
      persist((current) => ({
        ...current,
        packingItems: [item, ...current.packingItems],
      }));
      return item;
    },
    [dataSource, persist],
  );

  const togglePackingItem = useCallback(
    async (id: string) => {
      const existing = state.packingItems.find((item) => item.id === id);
      if (!existing) return;

      if (supabase && dataSource === "supabase") {
        await requireSupabaseUser();
        const { error: requestError } = await supabase
          .from("packing_items")
          .update({ is_packed: !existing.isPacked })
          .eq("id", id);
        if (requestError) throw new Error(requestError.message);
      }

      persist((current) => ({
        ...current,
        packingItems: current.packingItems.map((item) =>
          item.id === id
            ? { ...item, isPacked: !item.isPacked, updatedAt: getIsoNow() }
            : item,
        ),
      }));
    },
    [dataSource, persist, state.packingItems],
  );

  const deletePackingItem = useCallback(
    async (id: string) => {
      if (supabase && dataSource === "supabase") {
        await requireSupabaseUser();
        const { error: requestError } = await supabase
          .from("packing_items")
          .delete()
          .eq("id", id);
        if (requestError) throw new Error(requestError.message);
      }

      persist((current) => ({
        ...current,
        packingItems: current.packingItems.filter((item) => item.id !== id),
      }));
    },
    [dataSource, persist],
  );

  const createPhoto = useCallback(
    async (input: Omit<TravelPhoto, "id" | "createdAt" | "updatedAt">) => {
      if (supabase && dataSource === "supabase") {
        const user = await requireSupabaseUser();
        const { data, error: requestError } = await supabase
          .from("photos")
          .insert(mapPhotoToRow({ ...input, userId: user.id }))
          .select("*")
          .single();

        if (requestError) throw new Error(requestError.message);

        const photo = mapPhotoFromRow(data);
        persist((current) => ({ ...current, photos: [photo, ...current.photos] }));
        return photo;
      }

      const photo = withDates(input) as TravelPhoto;
      persist((current) => ({ ...current, photos: [photo, ...current.photos] }));
      return photo;
    },
    [dataSource, persist],
  );

  const createRoute = useCallback(
    async (input: RouteFormInput) => {
      if (supabase && dataSource === "supabase") {
        await requireSupabaseUser();
        const { data, error: requestError } = await supabase
          .from("routes")
          .insert(mapRouteToRow(input))
          .select("*")
          .single();

        if (requestError) throw new Error(requestError.message);

        const route = mapRouteFromRow(data);
        persist((current) => ({ ...current, routes: [route, ...current.routes] }));
        return route;
      }

      const route = withDates({ ...input, userId: null }) as RoutePlan;
      persist((current) => ({ ...current, routes: [route, ...current.routes] }));
      return route;
    },
    [dataSource, persist],
  );

  const createAiGeneration = useCallback(
    async (input: Omit<AiGeneration, "id" | "createdAt">) => {
      if (supabase && dataSource === "supabase") {
        const user = await requireSupabaseUser();
        const { data, error: requestError } = await supabase
          .from("ai_generations")
          .insert(mapAiGenerationToRow({ ...input, userId: user.id }))
          .select("*")
          .single();

        if (requestError) throw new Error(requestError.message);

        const generation = mapAiGenerationFromRow(data);
        persist((current) => ({
          ...current,
          aiGenerations: [generation, ...current.aiGenerations],
        }));
        return generation;
      }

      const generation = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: getIsoNow(),
      } as AiGeneration;
      persist((current) => ({
        ...current,
        aiGenerations: [generation, ...current.aiGenerations],
      }));
      return generation;
    },
    [dataSource, persist],
  );

  const value = useMemo(
    () => ({
      ...state,
      isLoading,
      isDemoMode,
      error,
      dataSource,
      supabaseStatus,
      capabilityStatus,
      createCountry,
      updateCountry,
      deleteCountry,
      createPlace,
      updatePlace,
      deletePlace,
      createTrip,
      updateTrip,
      deleteTrip,
      createTripDay,
      updateTripDay,
      createTripDayItem,
      updateTripDayItem,
      deleteTripDayItem,
      createSavedLink,
      deleteSavedLink,
      createPackingItem,
      togglePackingItem,
      deletePackingItem,
      createPhoto,
      createRoute,
      createAiGeneration,
      enableDemoMode,
      leaveDemoMode,
      refreshCountries,
    }),
    [
      state,
      isLoading,
      isDemoMode,
      error,
      dataSource,
      supabaseStatus,
      capabilityStatus,
      createCountry,
      updateCountry,
      deleteCountry,
      createPlace,
      updatePlace,
      deletePlace,
      createTrip,
      updateTrip,
      deleteTrip,
      createTripDay,
      updateTripDay,
      createTripDayItem,
      updateTripDayItem,
      deleteTripDayItem,
      createSavedLink,
      deleteSavedLink,
      createPackingItem,
      togglePackingItem,
      deletePackingItem,
      createPhoto,
      createRoute,
      createAiGeneration,
      enableDemoMode,
      leaveDemoMode,
      refreshCountries,
    ],
  );

  return <TravelContext.Provider value={value}>{children}</TravelContext.Provider>;
}

export function useTravel() {
  const context = useContext(TravelContext);
  if (!context) throw new Error("useTravel must be used inside CountryProvider.");
  return context;
}

export const useCountries = useTravel;
