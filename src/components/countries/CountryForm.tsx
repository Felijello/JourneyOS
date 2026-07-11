"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LockKeyhole, Save, Star } from "lucide-react";
import { CountryAutocomplete } from "@/components/travel/CountryAutocomplete";
import { Button } from "@/components/ui/Button";
import {
  continentLabels,
  continents,
  countryStatuses,
  visibilityOptions,
} from "@/lib/country-options";
import { cn } from "@/lib/utils";
import type { Country, CountryFormInput, CountryStatus } from "@/types/country";
import type { CountrySuggestion } from "@/types/location";

const defaultInput: CountryFormInput = {
  name: "",
  countryCode: "",
  continent: "Europe",
  status: "visited",
  personalRating: 8,
  shortNote: "",
  longNote: "",
  bestTravelMonths: "",
  visibility: "private",
  latitude: null,
  longitude: null,
  coverPhotoUrl: "",
  visitedFrom: null,
  visitedTo: null,
};

const statusTones: Record<CountryStatus, string> = {
  visited: "border-emerald-300 bg-emerald-50 text-emerald-800",
  planned: "border-blue-300 bg-blue-50 text-blue-800",
  must_visit: "border-amber-300 bg-amber-50 text-amber-800",
  maybe: "border-violet-300 bg-violet-50 text-violet-800",
  no_interest: "border-slate-300 bg-slate-100 text-slate-700",
};

const fieldClass =
  "h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100";

function toInput(country?: Country): CountryFormInput {
  if (!country) return defaultInput;

  return {
    name: country.name,
    countryCode: country.countryCode ?? "",
    continent: country.continent,
    status: country.status,
    personalRating: country.personalRating,
    shortNote: country.shortNote,
    longNote: country.longNote,
    bestTravelMonths: country.bestTravelMonths,
    visibility: country.visibility,
    latitude: country.latitude ?? null,
    longitude: country.longitude ?? null,
    coverPhotoUrl: country.coverPhotoUrl ?? "",
    visitedFrom: country.visitedFrom ?? null,
    visitedTo: country.visitedTo ?? null,
  };
}

export function CountryForm({
  country,
  onSubmit,
  submitLabel,
}: {
  country?: Country;
  onSubmit: (input: CountryFormInput) => Promise<Country>;
  submitLabel: string;
}) {
  const router = useRouter();
  const [input, setInput] = useState<CountryFormInput>(() => toInput(country));
  const [countryQuery, setCountryQuery] = useState(country?.name ?? "");
  const [countrySelected, setCountrySelected] = useState(Boolean(country?.countryCode));
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const ratingLabel = useMemo(() => `${input.personalRating}/10`, [input.personalRating]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!countrySelected || !input.countryCode) {
      setFormError("Bitte wähle ein Land aus den Vorschlägen aus.");
      return;
    }
    if (input.name.trim().length > 100) {
      setFormError("Der Ländername darf höchstens 100 Zeichen lang sein.");
      return;
    }
    if (input.visitedFrom && input.visitedTo && input.visitedTo < input.visitedFrom) {
      setFormError("Das Enddatum darf nicht vor dem Startdatum liegen.");
      return;
    }
    if (input.latitude != null && (input.latitude < -90 || input.latitude > 90)) {
      setFormError("Der Breitengrad muss zwischen -90 und 90 liegen.");
      return;
    }
    if (input.longitude != null && (input.longitude < -180 || input.longitude > 180)) {
      setFormError("Der Längengrad muss zwischen -180 und 180 liegen.");
      return;
    }

    setIsSaving(true);
    try {
      const savedCountry = await onSubmit({
        ...input,
        name: input.name.trim(),
        countryCode: input.countryCode?.trim().toUpperCase() || null,
        shortNote: input.shortNote.trim(),
        longNote: input.longNote.trim(),
        bestTravelMonths: input.bestTravelMonths.trim(),
        coverPhotoUrl: input.coverPhotoUrl?.trim() || null,
        visitedFrom: input.visitedFrom || null,
        visitedTo: input.visitedTo || null,
      });
      router.push(`/countries/${savedCountry.id}`);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Das Land konnte nicht gespeichert werden.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      className="space-y-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
      onSubmit={handleSubmit}
    >
      {formError ? (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {formError}
        </p>
      ) : null}

      <CountryAutocomplete
        isSelection={countrySelected}
        label="Welches Land?"
        onQueryChange={(query) => {
          setCountryQuery(query);
          if (query !== input.name) setCountrySelected(false);
        }}
        onSelect={(selected: CountrySuggestion) => {
          setCountryQuery(selected.name);
          setCountrySelected(true);
          setInput({
            ...input,
            name: selected.name,
            countryCode: selected.countryCode,
            continent: selected.continent,
            latitude: selected.latitude ?? null,
            longitude: selected.longitude ?? null,
          });
        }}
        query={countryQuery}
      />

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-slate-700">Wo steht es für dich?</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {countryStatuses.map((status) => (
            <button
              aria-pressed={input.status === status.value}
              className={cn(
                "min-h-14 rounded-lg border px-3 py-2 text-left text-xs font-semibold leading-4 transition",
                input.status === status.value
                  ? statusTones[status.value]
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              )}
              key={status.value}
              onClick={() => setInput({ ...input, status: status.value })}
              type="button"
            >
              {status.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-[1fr_220px]">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Kurze Notiz</span>
          <input
            className={fieldClass}
            maxLength={180}
            onChange={(event) => setInput({ ...input, shortNote: event.target.value })}
            placeholder="Was verbindest du damit?"
            value={input.shortNote}
          />
        </label>

        <label className="block">
          <span className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Star aria-hidden="true" className="text-amber-500" size={16} />
              Bewertung
            </span>
            <strong className="text-slate-950">{ratingLabel}</strong>
          </span>
          <input
            aria-label="Persönliche Bewertung"
            className="h-12 w-full accent-blue-600"
            max={10}
            min={1}
            onChange={(event) =>
              setInput({ ...input, personalRating: Number(event.target.value) })
            }
            type="range"
            value={input.personalRating}
          />
        </label>
      </div>

      <details className="group rounded-lg border border-slate-200 bg-slate-50/70">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold text-slate-700">
          <span>Mehr Details hinzufügen</span>
          <ChevronDown
            aria-hidden="true"
            className="transition group-open:rotate-180"
            size={18}
          />
        </summary>
        <div className="space-y-5 border-t border-slate-200 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Kontinent</span>
              <select
                className={fieldClass}
                disabled
                value={input.continent}
              >
                {continents.map((continent) => (
                  <option key={continent} value={continent}>
                    {continentLabels[continent]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <LockKeyhole aria-hidden="true" size={15} />
                Sichtbarkeit
              </span>
              <select
                className={fieldClass}
                onChange={(event) =>
                  setInput({
                    ...input,
                    visibility: event.target.value as CountryFormInput["visibility"],
                  })
                }
                value={input.visibility}
              >
                {visibilityOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Reise von</span>
              <input
                className={fieldClass}
                onChange={(event) => setInput({ ...input, visitedFrom: event.target.value || null })}
                type="date"
                value={input.visitedFrom ?? ""}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Bis</span>
              <input
                className={fieldClass}
                min={input.visitedFrom ?? undefined}
                onChange={(event) => setInput({ ...input, visitedTo: event.target.value || null })}
                type="date"
                value={input.visitedTo ?? ""}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Beste Reisemonate</span>
            <input
              className={fieldClass}
              onChange={(event) => setInput({ ...input, bestTravelMonths: event.target.value })}
              placeholder="z. B. April bis Juni"
              value={input.bestTravelMonths}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Längere Notiz</span>
            <textarea
              className="min-h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-base leading-6 text-slate-950 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              onChange={(event) => setInput({ ...input, longNote: event.target.value })}
              placeholder="Erinnerungen, Ideen oder Dinge, die du nicht vergessen willst"
              value={input.longNote}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Ländercode</span>
              <input
                className={fieldClass}
                maxLength={2}
                placeholder="JP"
                readOnly
                value={input.countryCode ?? ""}
              />
            </label>
            <label className="block">
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

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Breitengrad</span>
              <input
                className={fieldClass}
                max={90}
                min={-90}
                placeholder="Wird oft automatisch erkannt"
                readOnly
                step="any"
                type="number"
                value={input.latitude ?? ""}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Längengrad</span>
              <input
                className={fieldClass}
                max={180}
                min={-180}
                placeholder="Wird oft automatisch erkannt"
                readOnly
                step="any"
                type="number"
                value={input.longitude ?? ""}
              />
            </label>
          </div>
        </div>
      </details>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-500">
          Name und Status reichen. Alles andere kannst du später ergänzen.
        </p>
        <Button className="w-full sm:w-auto" disabled={isSaving} type="submit">
          <Save aria-hidden="true" size={17} />
          {isSaving ? "Speichere..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
