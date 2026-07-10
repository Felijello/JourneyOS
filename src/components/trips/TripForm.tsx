"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { tripStatuses, visibilityOptions } from "@/lib/country-options";
import type { Country, CountryVisibility, Trip, TripFormInput, TripStatus } from "@/types/country";

const defaultTrip: TripFormInput = {
  title: "",
  countryId: "",
  startDate: "",
  endDate: "",
  status: "idea",
  budgetEstimate: null,
  currency: "EUR",
  travelStyle: "",
  visibility: "private",
  coverPhotoUrl: "",
  notes: "",
};

export function TripForm({
  countries,
  trip,
  onSubmit,
  submitLabel,
  framed = true,
}: {
  countries: Country[];
  trip?: Trip;
  onSubmit: (input: TripFormInput) => Promise<Trip>;
  submitLabel: string;
  framed?: boolean;
}) {
  const router = useRouter();
  const [input, setInput] = useState<TripFormInput>(
    trip
      ? {
          title: trip.title,
          countryId: trip.countryId ?? "",
          startDate: trip.startDate ?? "",
          endDate: trip.endDate ?? "",
          status: trip.status,
          budgetEstimate: trip.budgetEstimate ?? null,
          currency: trip.currency,
          travelStyle: trip.travelStyle,
          visibility: trip.visibility,
          coverPhotoUrl: trip.coverPhotoUrl ?? "",
          notes: trip.notes,
        }
      : defaultTrip,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.title.trim()) {
      setError("Bitte gib dem Trip einen Titel.");
      return;
    }
    if (input.title.trim().length > 120) {
      setError("Der Titel darf höchstens 120 Zeichen lang sein.");
      return;
    }
    if (input.startDate && input.endDate && input.endDate < input.startDate) {
      setError("Das Enddatum darf nicht vor dem Startdatum liegen.");
      return;
    }
    if (input.budgetEstimate != null && input.budgetEstimate < 0) {
      setError("Das Budget darf nicht negativ sein.");
      return;
    }
    if (!/^[A-Za-z]{3}$/.test(input.currency.trim())) {
      setError("Bitte verwende einen dreistelligen Währungscode, z. B. EUR.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const saved = await onSubmit({
        ...input,
        title: input.title.trim(),
        countryId: input.countryId || null,
        startDate: input.startDate || null,
        endDate: input.endDate || null,
        currency: input.currency.trim().toUpperCase(),
        coverPhotoUrl: input.coverPhotoUrl?.trim() || null,
        travelStyle: input.travelStyle.trim(),
        notes: input.notes.trim(),
      });
      router.push(`/trips/${saved.id}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Der Trip konnte nicht gespeichert werden.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      className={
        framed
          ? "space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          : "space-y-4"
      }
      onSubmit={handleSubmit}
    >
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Titel</span>
          <input className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 outline-none" maxLength={120} required value={input.title} onChange={(event) => setInput({ ...input, title: event.target.value })} placeholder="z. B. Island Ringstraße" />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Land</span>
          <select className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 outline-none" value={input.countryId ?? ""} onChange={(event) => setInput({ ...input, countryId: event.target.value })}>
            <option value="">Noch offen</option>
            {countries.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}
          </select>
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Start</span>
          <input className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 outline-none" type="date" value={input.startDate ?? ""} onChange={(event) => setInput({ ...input, startDate: event.target.value })} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Ende</span>
          <input className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 outline-none" min={input.startDate ?? undefined} type="date" value={input.endDate ?? ""} onChange={(event) => setInput({ ...input, endDate: event.target.value })} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Status</span>
          <select className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 outline-none" value={input.status} onChange={(event) => setInput({ ...input, status: event.target.value as TripStatus })}>
            {tripStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Sichtbarkeit</span>
          <select className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 outline-none" value={input.visibility} onChange={(event) => setInput({ ...input, visibility: event.target.value as CountryVisibility })}>
            {visibilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Budget</span>
          <input className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 outline-none" min={0} step="0.01" type="number" value={input.budgetEstimate ?? ""} onChange={(event) => setInput({ ...input, budgetEstimate: event.target.value ? Number(event.target.value) : null })} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Währung</span>
          <input className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 uppercase outline-none" maxLength={3} value={input.currency} onChange={(event) => setInput({ ...input, currency: event.target.value.toUpperCase() })} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Reisestil</span>
          <input className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 outline-none" value={input.travelStyle} onChange={(event) => setInput({ ...input, travelStyle: event.target.value })} placeholder="Roadtrip, Food, Strand..." />
        </label>
      </div>
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-slate-700">Notizen</span>
        <textarea className="min-h-32 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none" value={input.notes} onChange={(event) => setInput({ ...input, notes: event.target.value })} />
      </label>
      <Button className="w-full rounded-2xl sm:w-auto" disabled={isSaving} type="submit">
        {isSaving ? "Speichere..." : submitLabel}
      </Button>
    </form>
  );
}
