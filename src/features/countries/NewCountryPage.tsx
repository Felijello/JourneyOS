"use client";

import { CountryForm } from "@/components/countries/CountryForm";
import { useCountries } from "@/components/providers/CountryProvider";

export function NewCountryPage() {
  const { createCountry } = useCountries();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-graphite-950 dark:text-white sm:text-4xl">
          Neues Land
        </h1>
        <p className="mt-2 text-sm leading-6 text-graphite-600 dark:text-zinc-300">
          Speichere Status, Bewertung, Sichtbarkeit und erste Notizen. Details
          wie Orte, Fotos und Routen kommen später dazu.
        </p>
      </div>
      <CountryForm onSubmit={createCountry} submitLabel="Land speichern" />
    </div>
  );
}

