"use client";

import { CountryForm } from "@/components/countries/CountryForm";
import { useCountries } from "@/components/providers/CountryProvider";

export function NewCountryPage() {
  const { createCountry } = useCountries();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-3xl font-semibold text-slate-950 sm:text-4xl">
          Land hinzufügen
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Schnell eintragen, später in Ruhe ergänzen.
        </p>
      </div>
      <CountryForm onSubmit={createCountry} submitLabel="Land speichern" />
    </div>
  );
}
