"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronDown, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { tripStatuses, visibilityOptions } from "@/lib/country-options";
import type {
  Country,
  CountryVisibility,
  Trip,
  TripFormInput,
  TripStatus,
} from "@/types/country";

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

const fieldClass =
  "h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-base text-slate-950 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100";

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
      setError("Wie soll dein Trip heißen?");
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
      setError("Bitte verwende einen Währungscode wie EUR.");
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
      className={framed ? "space-y-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6" : "space-y-5"}
      onSubmit={handleSubmit}
    >
      {error ? (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Trip-Name</span>
          <input
            autoFocus={!trip}
            className={fieldClass}
            maxLength={120}
            onChange={(event) => setInput({ ...input, title: event.target.value })}
            placeholder="z. B. Sommer in Portugal"
            required
            value={input.title}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Land</span>
          <select
            className={fieldClass}
            onChange={(event) => setInput({ ...input, countryId: event.target.value })}
            value={input.countryId ?? ""}
          >
            <option value="">Noch offen</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>{country.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <CalendarDays aria-hidden="true" size={15} /> Start
          </span>
          <input
            className={fieldClass}
            onChange={(event) => setInput({ ...input, startDate: event.target.value })}
            type="date"
            value={input.startDate ?? ""}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Ende</span>
          <input
            className={fieldClass}
            min={input.startDate ?? undefined}
            onChange={(event) => setInput({ ...input, endDate: event.target.value })}
            type="date"
            value={input.endDate ?? ""}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Status</span>
          <select
            className={fieldClass}
            onChange={(event) => setInput({ ...input, status: event.target.value as TripStatus })}
            value={input.status}
          >
            {tripStatuses.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Notiz</span>
        <textarea
          className="min-h-24 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-base text-slate-950 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          onChange={(event) => setInput({ ...input, notes: event.target.value })}
          placeholder="Was möchtest du erleben?"
          value={input.notes}
        />
      </label>

      <details className="group rounded-lg border border-slate-200 bg-slate-50/70">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-semibold text-slate-700">
          Budget und weitere Details
          <ChevronDown aria-hidden="true" className="transition group-open:rotate-180" size={18} />
        </summary>
        <div className="grid gap-4 border-t border-slate-200 p-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Budget</span>
            <input
              className={fieldClass}
              min={0}
              onChange={(event) => setInput({ ...input, budgetEstimate: event.target.value ? Number(event.target.value) : null })}
              step="0.01"
              type="number"
              value={input.budgetEstimate ?? ""}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Währung</span>
            <input
              className={fieldClass}
              maxLength={3}
              onChange={(event) => setInput({ ...input, currency: event.target.value.toUpperCase() })}
              value={input.currency}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Reisestil</span>
            <input
              className={fieldClass}
              onChange={(event) => setInput({ ...input, travelStyle: event.target.value })}
              placeholder="Roadtrip, Food, Strand..."
              value={input.travelStyle}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Sichtbarkeit</span>
            <select
              className={fieldClass}
              onChange={(event) => setInput({ ...input, visibility: event.target.value as CountryVisibility })}
              value={input.visibility}
            >
              {visibilityOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Cover-Foto URL</span>
            <input
              className={fieldClass}
              onChange={(event) => setInput({ ...input, coverPhotoUrl: event.target.value })}
              placeholder="https://..."
              type="url"
              value={input.coverPhotoUrl ?? ""}
            />
          </label>
        </div>
      </details>

      <Button className="w-full sm:w-auto" disabled={isSaving} type="submit">
        <Save aria-hidden="true" size={17} />
        {isSaving ? "Speichere..." : submitLabel}
      </Button>
    </form>
  );
}
