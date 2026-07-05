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
  mapCountryFromRow,
  mapCountryToRow,
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
  SavedLink,
  TravelPhoto,
  TravelState,
  Trip,
  TripDay,
  TripDayItem,
  TripFormInput,
} from "@/types/country";

type DataSource = "supabase" | "local";

type TravelContextValue = TravelState & {
  isLoading: boolean;
  error: string | null;
  dataSource: DataSource;
  capabilityStatus: {
    supabase: boolean;
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
  createTripDay: (input: Omit<TripDay, "id" | "createdAt" | "updatedAt">) => TripDay;
  updateTripDay: (id: string, input: Partial<TripDay>) => void;
  createTripDayItem: (
    input: Omit<TripDayItem, "id" | "createdAt" | "updatedAt">,
  ) => TripDayItem;
  updateTripDayItem: (id: string, input: Partial<TripDayItem>) => void;
  deleteTripDayItem: (id: string) => void;
  createSavedLink: (
    input: Omit<SavedLink, "id" | "createdAt" | "updatedAt">,
  ) => SavedLink;
  deleteSavedLink: (id: string) => void;
  createPackingItem: (
    input: Omit<PackingItem, "id" | "createdAt" | "updatedAt">,
  ) => PackingItem;
  togglePackingItem: (id: string) => void;
  deletePackingItem: (id: string) => void;
  createPhoto: (
    input: Omit<TravelPhoto, "id" | "createdAt" | "updatedAt">,
  ) => TravelPhoto;
  createAiGeneration: (
    input: Omit<AiGeneration, "id" | "createdAt">,
  ) => AiGeneration;
  refreshCountries: () => Promise<void>;
};

const TravelContext = createContext<TravelContextValue | null>(null);

const storageKey = "journeyos:travel-state:v2";
const legacyCountryStorageKey = "journeyos:countries:v1";

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

export function CountryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TravelState>(() => seedTravelState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>(
    isSupabaseConfigured ? "supabase" : "local",
  );

  const capabilityStatus = useMemo(
    () => ({
      supabase: isSupabaseConfigured && dataSource === "supabase",
      weather: true,
      routing: Boolean(process.env.NEXT_PUBLIC_OPENROUTESERVICE_API_KEY),
      ai: false,
      maptiler: Boolean(process.env.NEXT_PUBLIC_MAPTILER_KEY),
    }),
    [dataSource],
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
      setIsLoading(false);
      return;
    }

    const { data, error: requestError } = await supabase
      .from("countries")
      .select("*")
      .order("updated_at", { ascending: false });

    if (requestError) {
      setError(`${requestError.message} · Lokaler Demo-Modus bleibt aktiv.`);
      setState(localState);
      setDataSource("local");
    } else {
      setState({ ...localState, countries: (data ?? []).map(mapCountryFromRow) });
      setDataSource("supabase");
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshCountries();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refreshCountries]);

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
      const place = withDates({ ...input, userId: null }) as Place;
      persist((current) => ({ ...current, places: [place, ...current.places] }));
      return place;
    },
    [persist],
  );

  const updatePlace = useCallback(
    async (id: string, input: PlaceFormInput) => {
      const existing = state.places.find((place) => place.id === id);
      if (!existing) throw new Error("Ort wurde nicht gefunden.");
      const place = { ...existing, ...input, updatedAt: getIsoNow() };
      persist((current) => ({
        ...current,
        places: current.places.map((item) => (item.id === id ? place : item)),
      }));
      return place;
    },
    [persist, state.places],
  );

  const deletePlace = useCallback(
    async (id: string) => {
      persist((current) => ({
        ...current,
        places: current.places.filter((place) => place.id !== id),
        tripDayItems: current.tripDayItems.map((item) =>
          item.placeId === id ? { ...item, placeId: null } : item,
        ),
      }));
    },
    [persist],
  );

  const createTrip = useCallback(
    async (input: TripFormInput) => {
      const trip = withDates({ ...input, userId: null }) as Trip;
      persist((current) => ({ ...current, trips: [trip, ...current.trips] }));
      return trip;
    },
    [persist],
  );

  const updateTrip = useCallback(
    async (id: string, input: TripFormInput) => {
      const existing = state.trips.find((trip) => trip.id === id);
      if (!existing) throw new Error("Trip wurde nicht gefunden.");
      const trip = { ...existing, ...input, updatedAt: getIsoNow() };
      persist((current) => ({
        ...current,
        trips: current.trips.map((item) => (item.id === id ? trip : item)),
      }));
      return trip;
    },
    [persist, state.trips],
  );

  const deleteTrip = useCallback(
    async (id: string) => {
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
    [persist],
  );

  const createTripDay = useCallback(
    (input: Omit<TripDay, "id" | "createdAt" | "updatedAt">) => {
      const day = withDates(input) as TripDay;
      persist((current) => ({ ...current, tripDays: [...current.tripDays, day] }));
      return day;
    },
    [persist],
  );

  const updateTripDay = useCallback(
    (id: string, input: Partial<TripDay>) => {
      persist((current) => ({
        ...current,
        tripDays: current.tripDays.map((day) =>
          day.id === id ? { ...day, ...input, updatedAt: getIsoNow() } : day,
        ),
      }));
    },
    [persist],
  );

  const createTripDayItem = useCallback(
    (input: Omit<TripDayItem, "id" | "createdAt" | "updatedAt">) => {
      const item = withDates(input) as TripDayItem;
      persist((current) => ({
        ...current,
        tripDayItems: [...current.tripDayItems, item],
      }));
      return item;
    },
    [persist],
  );

  const updateTripDayItem = useCallback(
    (id: string, input: Partial<TripDayItem>) => {
      persist((current) => ({
        ...current,
        tripDayItems: current.tripDayItems.map((item) =>
          item.id === id ? { ...item, ...input, updatedAt: getIsoNow() } : item,
        ),
      }));
    },
    [persist],
  );

  const deleteTripDayItem = useCallback(
    (id: string) => {
      persist((current) => ({
        ...current,
        tripDayItems: current.tripDayItems.filter((item) => item.id !== id),
      }));
    },
    [persist],
  );

  const createSavedLink = useCallback(
    (input: Omit<SavedLink, "id" | "createdAt" | "updatedAt">) => {
      const link = withDates({
        ...input,
        provider: input.provider || inferProvider(input.url),
      }) as SavedLink;
      persist((current) => ({ ...current, savedLinks: [link, ...current.savedLinks] }));
      return link;
    },
    [persist],
  );

  const deleteSavedLink = useCallback(
    (id: string) => {
      persist((current) => ({
        ...current,
        savedLinks: current.savedLinks.filter((link) => link.id !== id),
      }));
    },
    [persist],
  );

  const createPackingItem = useCallback(
    (input: Omit<PackingItem, "id" | "createdAt" | "updatedAt">) => {
      const item = withDates(input) as PackingItem;
      persist((current) => ({
        ...current,
        packingItems: [item, ...current.packingItems],
      }));
      return item;
    },
    [persist],
  );

  const togglePackingItem = useCallback(
    (id: string) => {
      persist((current) => ({
        ...current,
        packingItems: current.packingItems.map((item) =>
          item.id === id
            ? { ...item, isPacked: !item.isPacked, updatedAt: getIsoNow() }
            : item,
        ),
      }));
    },
    [persist],
  );

  const deletePackingItem = useCallback(
    (id: string) => {
      persist((current) => ({
        ...current,
        packingItems: current.packingItems.filter((item) => item.id !== id),
      }));
    },
    [persist],
  );

  const createPhoto = useCallback(
    (input: Omit<TravelPhoto, "id" | "createdAt" | "updatedAt">) => {
      const photo = withDates(input) as TravelPhoto;
      persist((current) => ({ ...current, photos: [photo, ...current.photos] }));
      return photo;
    },
    [persist],
  );

  const createAiGeneration = useCallback(
    (input: Omit<AiGeneration, "id" | "createdAt">) => {
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
    [persist],
  );

  const value = useMemo(
    () => ({
      ...state,
      isLoading,
      error,
      dataSource,
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
      createAiGeneration,
      refreshCountries,
    }),
    [
      state,
      isLoading,
      error,
      dataSource,
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
      createAiGeneration,
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
