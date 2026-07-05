"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  continentLabels,
  continents,
  countryStatuses,
  visibilityOptions,
} from "@/lib/country-options";
import type { Country, CountryFormInput } from "@/types/country";

const defaultInput: CountryFormInput = {
  name: "",
  countryCode: "",
  continent: "Europe",
  status: "visited",
  personalRating: 7,
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

function toInput(country?: Country): CountryFormInput {
  if (!country) {
    return defaultInput;
  }

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
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const ratingLabel = useMemo(() => `${input.personalRating}/10`, [input.personalRating]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!input.name.trim()) {
      setFormError("Bitte gib einen Ländernamen ein.");
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
        error instanceof Error
          ? error.message
          : "Das Land konnte nicht gespeichert werden.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-6"
      onSubmit={handleSubmit}
    >
      {formError ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100 dark:bg-red-400/10 dark:text-red-200 dark:ring-red-400/20">
          {formError}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-graphite-800 dark:text-zinc-200">
            Land
          </span>
          <input
            className="h-12 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-base text-graphite-950 outline-none transition focus:border-moss-500 focus:ring-2 focus:ring-moss-500/20 dark:border-white/10 dark:bg-graphite-900 dark:text-white"
            onChange={(event) => setInput({ ...input, name: event.target.value })}
            placeholder="z. B. Japan"
            value={input.name}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-graphite-800 dark:text-zinc-200">
            Kontinent
          </span>
          <select
            className="h-12 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-base text-graphite-950 outline-none transition focus:border-moss-500 focus:ring-2 focus:ring-moss-500/20 dark:border-white/10 dark:bg-graphite-900 dark:text-white"
            onChange={(event) =>
              setInput({
                ...input,
                continent: event.target.value as CountryFormInput["continent"],
              })
            }
            value={input.continent}
          >
            {continents.map((continent) => (
              <option key={continent} value={continent}>
                {continentLabels[continent]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-graphite-800 dark:text-zinc-200">
            Ländercode
          </span>
          <input
            className="h-12 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-base uppercase text-graphite-950 outline-none transition focus:border-moss-500 focus:ring-2 focus:ring-moss-500/20 dark:border-white/10 dark:bg-graphite-900 dark:text-white"
            maxLength={2}
            onChange={(event) =>
              setInput({ ...input, countryCode: event.target.value.toUpperCase() })
            }
            placeholder="JP"
            value={input.countryCode ?? ""}
          />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-semibold text-graphite-800 dark:text-zinc-200">
            Cover-Foto-URL optional
          </span>
          <input
            className="h-12 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-base text-graphite-950 outline-none transition focus:border-moss-500 focus:ring-2 focus:ring-moss-500/20 dark:border-white/10 dark:bg-graphite-900 dark:text-white"
            onChange={(event) =>
              setInput({ ...input, coverPhotoUrl: event.target.value })
            }
            placeholder="https://..."
            type="url"
            value={input.coverPhotoUrl ?? ""}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-graphite-800 dark:text-zinc-200">
            Status
          </span>
          <select
            className="h-12 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-base text-graphite-950 outline-none transition focus:border-moss-500 focus:ring-2 focus:ring-moss-500/20 dark:border-white/10 dark:bg-graphite-900 dark:text-white"
            onChange={(event) =>
              setInput({
                ...input,
                status: event.target.value as CountryFormInput["status"],
              })
            }
            value={input.status}
          >
            {countryStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="flex items-center justify-between text-sm font-semibold text-graphite-800 dark:text-zinc-200">
            Bewertung
            <span className="text-graphite-500 dark:text-zinc-400">{ratingLabel}</span>
          </span>
          <input
            className="h-12 w-full accent-moss-600"
            max={10}
            min={1}
            onChange={(event) =>
              setInput({ ...input, personalRating: Number(event.target.value) })
            }
            type="range"
            value={input.personalRating}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-graphite-800 dark:text-zinc-200">
            Sichtbarkeit
          </span>
          <select
            className="h-12 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-base text-graphite-950 outline-none transition focus:border-moss-500 focus:ring-2 focus:ring-moss-500/20 dark:border-white/10 dark:bg-graphite-900 dark:text-white"
            onChange={(event) =>
              setInput({
                ...input,
                visibility: event.target.value as CountryFormInput["visibility"],
              })
            }
            value={input.visibility}
          >
            {visibilityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="space-y-2 block">
        <span className="text-sm font-semibold text-graphite-800 dark:text-zinc-200">
          Kurze Notiz
        </span>
        <input
          className="h-12 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-base text-graphite-950 outline-none transition focus:border-moss-500 focus:ring-2 focus:ring-moss-500/20 dark:border-white/10 dark:bg-graphite-900 dark:text-white"
          onChange={(event) => setInput({ ...input, shortNote: event.target.value })}
          placeholder="Ein Satz, der sofort wieder das Gefühl trifft."
          value={input.shortNote}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-graphite-800 dark:text-zinc-200">
            Besuch von optional
          </span>
          <input
            className="h-12 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-base text-graphite-950 outline-none transition focus:border-moss-500 focus:ring-2 focus:ring-moss-500/20 dark:border-white/10 dark:bg-graphite-900 dark:text-white"
            onChange={(event) =>
              setInput({ ...input, visitedFrom: event.target.value || null })
            }
            type="date"
            value={input.visitedFrom ?? ""}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-graphite-800 dark:text-zinc-200">
            Besuch bis optional
          </span>
          <input
            className="h-12 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-base text-graphite-950 outline-none transition focus:border-moss-500 focus:ring-2 focus:ring-moss-500/20 dark:border-white/10 dark:bg-graphite-900 dark:text-white"
            onChange={(event) =>
              setInput({ ...input, visitedTo: event.target.value || null })
            }
            type="date"
            value={input.visitedTo ?? ""}
          />
        </label>
      </div>

      <label className="space-y-2 block">
        <span className="text-sm font-semibold text-graphite-800 dark:text-zinc-200">
          Längere Beschreibung
        </span>
        <textarea
          className="min-h-36 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-base leading-7 text-graphite-950 outline-none transition focus:border-moss-500 focus:ring-2 focus:ring-moss-500/20 dark:border-white/10 dark:bg-graphite-900 dark:text-white"
          onChange={(event) => setInput({ ...input, longNote: event.target.value })}
          placeholder="Was reizt dich daran, was war besonders, welche Route wäre spannend?"
          value={input.longNote}
        />
      </label>

      <label className="space-y-2 block">
        <span className="text-sm font-semibold text-graphite-800 dark:text-zinc-200">
          Beste Reisemonate
        </span>
        <input
          className="h-12 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-base text-graphite-950 outline-none transition focus:border-moss-500 focus:ring-2 focus:ring-moss-500/20 dark:border-white/10 dark:bg-graphite-900 dark:text-white"
          onChange={(event) =>
            setInput({ ...input, bestTravelMonths: event.target.value })
          }
          placeholder="z. B. April bis Juni, September"
          value={input.bestTravelMonths}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-graphite-800 dark:text-zinc-200">
            Breitengrad optional
          </span>
          <input
            className="h-12 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-base text-graphite-950 outline-none transition focus:border-moss-500 focus:ring-2 focus:ring-moss-500/20 dark:border-white/10 dark:bg-graphite-900 dark:text-white"
            onChange={(event) =>
              setInput({
                ...input,
                latitude: event.target.value ? Number(event.target.value) : null,
              })
            }
            placeholder="Automatisch für bekannte Länder"
            type="number"
            value={input.latitude ?? ""}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-graphite-800 dark:text-zinc-200">
            Längengrad optional
          </span>
          <input
            className="h-12 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-base text-graphite-950 outline-none transition focus:border-moss-500 focus:ring-2 focus:ring-moss-500/20 dark:border-white/10 dark:bg-graphite-900 dark:text-white"
            onChange={(event) =>
              setInput({
                ...input,
                longitude: event.target.value ? Number(event.target.value) : null,
              })
            }
            placeholder="Automatisch für bekannte Länder"
            type="number"
            value={input.longitude ?? ""}
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 border-t border-zinc-200 pt-5 dark:border-white/10 sm:flex-row sm:justify-end">
        <Button
          className="w-full sm:w-auto"
          disabled={isSaving}
          type="submit"
        >
          <Save aria-hidden="true" size={17} />
          {isSaving ? "Speichere..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
