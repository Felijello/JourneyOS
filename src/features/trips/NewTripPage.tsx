"use client";

import { TripForm } from "@/components/trips/TripForm";
import { useTravel } from "@/components/providers/CountryProvider";

export function NewTripPage() {
  const { countries, createTrip } = useTravel();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Neuer Trip
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Erst die Idee festhalten. Details planst du danach.
        </p>
      </div>
      <TripForm countries={countries} onSubmit={createTrip} submitLabel="Trip speichern" />
    </div>
  );
}
