"use client";

import { TripWizard } from "@/components/trips/TripWizard";

export function NewTripPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Neue Reise
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Erst die Idee festhalten. Details planst du danach.
        </p>
      </div>
      <TripWizard />
    </div>
  );
}
