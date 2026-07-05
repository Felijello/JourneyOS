"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { placeTypes, visibilityOptions } from "@/lib/country-options";
import type { CountryVisibility, PlaceFormInput, PlaceType } from "@/types/country";

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
  const [visibility, setVisibility] = useState<CountryVisibility>("private");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    await onSubmit({
      countryId,
      name: name.trim(),
      type,
      rating,
      shortNote: shortNote.trim(),
      longNote: "",
      visibility,
      latitude: null,
      longitude: null,
      address: "",
    });
    setName("");
    setShortNote("");
  }

  return (
    <form
      className="grid gap-3 rounded-3xl border border-dashed border-blue-200 bg-blue-50/50 p-4 md:grid-cols-[1fr_160px_120px_140px_auto]"
      onSubmit={handleSubmit}
    >
      <input
        className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        onChange={(event) => setName(event.target.value)}
        placeholder="Ort hinzufügen, z. B. Kyoto"
        value={name}
      />
      <select
        className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none"
        onChange={(event) => setType(event.target.value as PlaceType)}
        value={type}
      >
        {placeTypes.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <input
        className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none"
        max={10}
        min={1}
        onChange={(event) => setRating(Number(event.target.value))}
        type="number"
        value={rating}
      />
      <select
        className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none"
        onChange={(event) => setVisibility(event.target.value as CountryVisibility)}
        value={visibility}
      >
        {visibilityOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Button className="rounded-2xl" type="submit">
        Ort speichern
      </Button>
      <input
        className="md:col-span-5 h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        onChange={(event) => setShortNote(event.target.value)}
        placeholder="Kurze Notiz zum Ort"
        value={shortNote}
      />
    </form>
  );
}

