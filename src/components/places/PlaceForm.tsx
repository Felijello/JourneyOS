"use client";

import { useState } from "react";
import { ChevronDown, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { placeTypes, visibilityOptions } from "@/lib/country-options";
import type { CountryVisibility, PlaceFormInput, PlaceType } from "@/types/country";

const fieldClass =
  "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

export function PlaceForm({
  countryId,
  onSubmit,
}: {
  countryId: string;
  onSubmit: (input: PlaceFormInput) => Promise<unknown>;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<PlaceType>("city");
  const [rating, setRating] = useState(8);
  const [shortNote, setShortNote] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [visibility, setVisibility] = useState<CountryVisibility>("private");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();
    const normalizedLatitude = latitude ? Number(latitude) : null;
    const normalizedLongitude = longitude ? Number(longitude) : null;

    if (!normalizedName) {
      setError("Wie heißt der Ort?");
      return;
    }
    if (normalizedName.length > 120) {
      setError("Der Ortsname darf höchstens 120 Zeichen lang sein.");
      return;
    }
    if (
      normalizedLatitude != null &&
      (!Number.isFinite(normalizedLatitude) || normalizedLatitude < -90 || normalizedLatitude > 90)
    ) {
      setError("Der Breitengrad muss zwischen -90 und 90 liegen.");
      return;
    }
    if (
      normalizedLongitude != null &&
      (!Number.isFinite(normalizedLongitude) || normalizedLongitude < -180 || normalizedLongitude > 180)
    ) {
      setError("Der Längengrad muss zwischen -180 und 180 liegen.");
      return;
    }
    if ((normalizedLatitude == null) !== (normalizedLongitude == null)) {
      setError("Bitte gib beide Koordinaten gemeinsam ein.");
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onSubmit({
        countryId,
        name: normalizedName,
        type,
        rating,
        shortNote: shortNote.trim(),
        longNote: "",
        visibility,
        latitude: normalizedLatitude,
        longitude: normalizedLongitude,
        address: address.trim(),
      });
      setName("");
      setShortNote("");
      setAddress("");
      setLatitude("");
      setLongitude("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Der Ort konnte nicht gespeichert werden.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4" onSubmit={handleSubmit}>
      {error ? (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-[1fr_170px]">
        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <MapPin aria-hidden="true" size={14} /> Ort
          </span>
          <input
            className={fieldClass}
            maxLength={120}
            onChange={(event) => setName(event.target.value)}
            placeholder="z. B. Kyoto"
            required
            value={name}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Typ</span>
          <select className={fieldClass} onChange={(event) => setType(event.target.value as PlaceType)} value={type}>
            {placeTypes.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-slate-600">Kurze Notiz</span>
        <input
          className={fieldClass}
          onChange={(event) => setShortNote(event.target.value)}
          placeholder="Warum willst du hierhin?"
          value={shortNote}
        />
      </label>

      <details className="group rounded-lg border border-blue-100 bg-white/70">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-3 text-xs font-semibold text-slate-600">
          Adresse, Bewertung & Koordinaten
          <ChevronDown aria-hidden="true" className="transition group-open:rotate-180" size={16} />
        </summary>
        <div className="grid gap-3 border-t border-blue-100 p-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Adresse</span>
            <input className={fieldClass} onChange={(event) => setAddress(event.target.value)} placeholder="Straße, Stadt, Land" value={address} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Bewertung: {rating}/10</span>
            <input className="h-11 w-full accent-blue-600" max={10} min={1} onChange={(event) => setRating(Number(event.target.value))} type="range" value={rating} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Sichtbarkeit</span>
            <select className={fieldClass} onChange={(event) => setVisibility(event.target.value as CountryVisibility)} value={visibility}>
              {visibilityOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Breitengrad</span>
            <input className={fieldClass} max={90} min={-90} onChange={(event) => setLatitude(event.target.value)} placeholder="35.6762" step="any" type="number" value={latitude} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Längengrad</span>
            <input className={fieldClass} max={180} min={-180} onChange={(event) => setLongitude(event.target.value)} placeholder="139.6503" step="any" type="number" value={longitude} />
          </label>
        </div>
      </details>

      <Button className="w-full sm:w-auto" disabled={isSaving} type="submit">
        <Plus aria-hidden="true" size={16} />
        {isSaving ? "Speichere..." : "Ort hinzufügen"}
      </Button>
    </form>
  );
}
