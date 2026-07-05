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
import { getCoordinatesForCountry, seedCountries } from "@/lib/country-options";
import {
  isSupabaseConfigured,
  mapCountryFromRow,
  mapCountryToRow,
  supabase,
} from "@/lib/supabase/client";
import { getIsoNow } from "@/lib/utils";
import type { Country, CountryFormInput } from "@/types/country";

type CountryContextValue = {
  countries: Country[];
  isLoading: boolean;
  error: string | null;
  dataSource: "supabase" | "local";
  createCountry: (input: CountryFormInput) => Promise<Country>;
  updateCountry: (id: string, input: CountryFormInput) => Promise<Country>;
  deleteCountry: (id: string) => Promise<void>;
  refreshCountries: () => Promise<void>;
};

const CountryContext = createContext<CountryContextValue | null>(null);

const storageKey = "journeyos:countries:v1";

function readLocalCountries() {
  if (typeof window === "undefined") {
    return seedCountries;
  }

  const stored = window.localStorage.getItem(storageKey);
  if (!stored) {
    window.localStorage.setItem(storageKey, JSON.stringify(seedCountries));
    return seedCountries;
  }

  try {
    return JSON.parse(stored) as Country[];
  } catch {
    window.localStorage.setItem(storageKey, JSON.stringify(seedCountries));
    return seedCountries;
  }
}

function writeLocalCountries(countries: Country[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(storageKey, JSON.stringify(countries));
  }
}

function enrichInput(input: CountryFormInput): CountryFormInput {
  if (input.latitude && input.longitude) {
    return input;
  }

  const coordinates = getCoordinatesForCountry(input.name);
  return coordinates
    ? {
        ...input,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      }
    : input;
}

export function CountryProvider({ children }: { children: ReactNode }) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dataSource: CountryContextValue["dataSource"] = isSupabaseConfigured
    ? "supabase"
    : "local";

  const refreshCountries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!supabase) {
      setCountries(readLocalCountries());
      setIsLoading(false);
      return;
    }

    const { data, error: requestError } = await supabase
      .from("countries")
      .select("*")
      .order("created_at", { ascending: false });

    if (requestError) {
      setError(requestError.message);
      setCountries([]);
    } else {
      setCountries((data ?? []).map(mapCountryFromRow));
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
    if (!supabase) {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshCountries();
    });

    return () => subscription.unsubscribe();
  }, [refreshCountries]);


  const createCountry = useCallback(
    async (rawInput: CountryFormInput) => {
      const input = enrichInput(rawInput);

      if (!supabase) {
        const now = getIsoNow();
        const country: Country = {
          ...input,
          id: crypto.randomUUID(),
          userId: null,
          createdAt: now,
          updatedAt: now,
        };
        const nextCountries = [country, ...countries];
        setCountries(nextCountries);
        writeLocalCountries(nextCountries);
        return country;
      }

      const { data, error: requestError } = await supabase
        .from("countries")
        .insert(mapCountryToRow(input))
        .select("*")
        .single();

      if (requestError) {
        throw new Error(requestError.message);
      }

      const country = mapCountryFromRow(data);
      setCountries((current) => [country, ...current]);
      return country;
    },
    [countries],
  );

  const updateCountry = useCallback(
    async (id: string, rawInput: CountryFormInput) => {
      const input = enrichInput(rawInput);

      if (!supabase) {
        const updatedCountry = countries.find((country) => country.id === id);
        if (!updatedCountry) {
          throw new Error("Land wurde nicht gefunden.");
        }

        const nextCountry: Country = {
          ...updatedCountry,
          ...input,
          updatedAt: getIsoNow(),
        };
        const nextCountries = countries.map((country) =>
          country.id === id ? nextCountry : country,
        );
        setCountries(nextCountries);
        writeLocalCountries(nextCountries);
        return nextCountry;
      }

      const { data, error: requestError } = await supabase
        .from("countries")
        .update(mapCountryToRow(input))
        .eq("id", id)
        .select("*")
        .single();

      if (requestError) {
        throw new Error(requestError.message);
      }

      const country = mapCountryFromRow(data);
      setCountries((current) =>
        current.map((item) => (item.id === id ? country : item)),
      );
      return country;
    },
    [countries],
  );

  const deleteCountry = useCallback(
    async (id: string) => {
      if (!supabase) {
        const nextCountries = countries.filter((country) => country.id !== id);
        setCountries(nextCountries);
        writeLocalCountries(nextCountries);
        return;
      }

      const { error: requestError } = await supabase
        .from("countries")
        .delete()
        .eq("id", id);

      if (requestError) {
        throw new Error(requestError.message);
      }

      setCountries((current) => current.filter((country) => country.id !== id));
    },
    [countries],
  );

  const value = useMemo(
    () => ({
      countries,
      isLoading,
      error,
      dataSource,
      createCountry,
      updateCountry,
      deleteCountry,
      refreshCountries,
    }),
    [
      countries,
      isLoading,
      error,
      dataSource,
      createCountry,
      updateCountry,
      deleteCountry,
      refreshCountries,
    ],
  );

  return (
    <CountryContext.Provider value={value}>{children}</CountryContext.Provider>
  );
}

export function useCountries() {
  const context = useContext(CountryContext);

  if (!context) {
    throw new Error("useCountries must be used inside CountryProvider.");
  }

  return context;
}
