"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronDown, ImagePlus, Save } from "lucide-react";
import { useSocial } from "@/components/providers/SocialProvider";
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
  destinationName: "",
  description: "",
  highlights: [],
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
  const { refreshSocial, travelPhotos, uploadTripPhotos } = useSocial();
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
          destinationName: trip.destinationName,
          description: trip.description,
          highlights: trip.highlights,
          coverPhotoUrl: trip.coverPhotoUrl ?? "",
          notes: trip.notes,
        }
      : defaultTrip,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);

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
        destinationName:
          input.destinationName.trim() ||
          countries.find((country) => country.id === input.countryId)?.name ||
          "",
        description: input.description.trim(),
        highlights: input.highlights.map((item) => item.trim()).filter(Boolean).slice(0, 8),
        notes: input.notes.trim(),
      });
      if (pendingPhotos.length) {
        await uploadTripPhotos(saved.id, pendingPhotos);
      }
      await refreshSocial();
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
            onChange={(event) => {
              const countryId = event.target.value;
              const country = countries.find((item) => item.id === countryId);
              setInput({
                ...input,
                countryId,
                destinationName: input.destinationName || country?.name || "",
              });
            }}
            value={input.countryId ?? ""}
          >
            <option value="">Noch offen</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>{country.name}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Ort oder Reiseziel</span>
        <input
          className={fieldClass}
          maxLength={100}
          onChange={(event) => setInput({ ...input, destinationName: event.target.value })}
          placeholder="z. B. Lissabon, Portugal"
          value={input.destinationName}
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Beschreibung</span>
        <textarea
          className="min-h-28 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-base text-slate-950 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          maxLength={1200}
          onChange={(event) => setInput({ ...input, description: event.target.value })}
          placeholder="Worum geht es bei dieser Reise? Öffentliche Reisen zeigen diesen Text auf deinem Profil."
          value={input.description}
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Highlights</span>
        <input
          className={fieldClass}
          onChange={(event) =>
            setInput({
              ...input,
              highlights: event.target.value.split(","),
            })
          }
          placeholder="Altstadt, Strand, Food Tour"
          value={input.highlights.join(", ")}
        />
        <span className="mt-1.5 block text-xs text-slate-400">Mit Kommas trennen, maximal 8.</span>
      </label>

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
              {visibilityOptions.filter((option) => option.value !== "family").map((option) => (
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

      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Reisefotos</p>
            <p className="mt-1 text-xs text-slate-500">Bis zu 12 Bilder, jeweils maximal 6 MB.</p>
          </div>
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            <ImagePlus aria-hidden="true" size={17} />
            Fotos auswählen
            <input
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              multiple
              onChange={(event) => {
                const existingCount = trip
                  ? travelPhotos.filter((photo) => photo.tripId === trip.id).length
                  : 0;
                setPendingPhotos(Array.from(event.target.files ?? []).slice(0, 12 - existingCount));
              }}
              type="file"
            />
          </label>
        </div>
        {pendingPhotos.length ? (
          <p className="mt-3 text-sm font-medium text-blue-700">
            {pendingPhotos.length} {pendingPhotos.length === 1 ? "Foto" : "Fotos"} ausgewählt
          </p>
        ) : null}
      </div>

      <Button className="w-full sm:w-auto" disabled={isSaving} type="submit">
        <Save aria-hidden="true" size={17} />
        {isSaving ? "Speichere..." : submitLabel}
      </Button>
    </form>
  );
}
