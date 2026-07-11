"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, ChevronDown, Globe2, ImagePlus, LockKeyhole, Save, X } from "lucide-react";
import { CountryAutocomplete } from "@/components/travel/CountryAutocomplete";
import { DestinationAutocomplete } from "@/components/travel/DestinationAutocomplete";
import { CoverUploader, type CoverCrop } from "@/components/trips/CoverUploader";
import { useSocial } from "@/components/providers/SocialProvider";
import { useTravel } from "@/components/providers/CountryProvider";
import { Button } from "@/components/ui/Button";
import { tripStatuses } from "@/lib/country-options";
import type { Country, Trip, TripCountry, TripFormInput, TripStatus } from "@/types/country";
import type { CountrySuggestion, DestinationSuggestion } from "@/types/location";

const defaultTrip: TripFormInput = {
  title: "",
  countryId: null,
  startDate: "",
  endDate: "",
  status: "idea",
  budgetEstimate: null,
  currency: "EUR",
  travelStyle: "",
  visibility: "private",
  destinationName: "",
  destinationCity: null,
  destinationRegion: null,
  destinationCountryName: null,
  destinationCountryCode: null,
  destinationLatitude: null,
  destinationLongitude: null,
  destinationExternalId: null,
  description: "",
  highlights: [],
  coverPhotoUrl: null,
  coverStoragePath: null,
  coverPositionX: 50,
  coverPositionY: 50,
  coverZoom: 1,
  countries: [],
  notes: "",
};

const fieldClass = "h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-base text-slate-950 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100";
const textAreaClass = "min-h-28 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-base leading-6 text-slate-950 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100";

function toTripCountry(country: CountrySuggestion, source: TripCountry["source"]): TripCountry {
  return {
    countryCode: country.countryCode,
    countryName: country.name,
    continent: country.continent,
    latitude: country.latitude ?? null,
    longitude: country.longitude ?? null,
    source,
  };
}

export function TripForm({
  countries,
  trip,
  onSubmit,
  framed = true,
}: {
  countries: Country[];
  trip?: Trip;
  onSubmit: (input: TripFormInput) => Promise<Trip>;
  framed?: boolean;
}) {
  const router = useRouter();
  const { uploadTripCover, deleteTripCover, refreshCountries } = useTravel();
  const { refreshSocial, travelPhotos, uploadTripPhotos } = useSocial();
  const initialInput = trip ? { ...defaultTrip, ...trip } : defaultTrip;
  const [input, setInput] = useState<TripFormInput>(initialInput);
  const [destinationQuery, setDestinationQuery] = useState(trip?.destinationName ?? "");
  const [destinationSelected, setDestinationSelected] = useState(
    Boolean(trip?.destinationCountryCode && trip?.destinationLatitude != null),
  );
  const [countryQuery, setCountryQuery] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [crop, setCrop] = useState<CoverCrop>({
    positionX: initialInput.coverPositionX,
    positionY: initialInput.coverPositionY,
    zoom: initialInput.coverZoom,
  });
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canPublish = input.status === "completed";
  const primaryLabel = input.visibility === "public" && canPublish
    ? "Reise veröffentlichen"
    : "Reise speichern";

  function selectDestination(destination: DestinationSuggestion) {
    const linkedCountry = toTripCountry(
      {
        name: destination.countryName,
        countryCode: destination.countryCode,
        continent: destination.continent,
        latitude: null,
        longitude: null,
        flag: destination.flag,
      },
      "destination",
    );
    const remaining = input.countries.filter(
      (country) =>
        country.source !== "destination" &&
        country.countryCode !== destination.countryCode,
    );
    const nextCountries = [linkedCountry, ...remaining];
    const existingCountry = countries.find(
      (country) => country.countryCode?.toUpperCase() === destination.countryCode,
    );
    setDestinationQuery(destination.displayName);
    setDestinationSelected(true);
    setInput({
      ...input,
      destinationName: destination.displayName,
      destinationCity: destination.city,
      destinationRegion: destination.region,
      destinationCountryName: destination.countryName,
      destinationCountryCode: destination.countryCode,
      destinationLatitude: destination.latitude,
      destinationLongitude: destination.longitude,
      destinationExternalId: destination.externalId,
      countries: nextCountries,
      countryId: nextCountries.length === 1 ? existingCountry?.id ?? null : null,
    });
  }

  function addCountry(country: CountrySuggestion) {
    if (input.countries.some((item) => item.countryCode === country.countryCode)) {
      setCountryQuery("");
      return;
    }
    const nextCountries = [...input.countries, toTripCountry(country, "manual")];
    setInput({ ...input, countries: nextCountries, countryId: null });
    setCountryQuery("");
  }

  function removeCountry(code: string) {
    const nextCountries = input.countries.filter((country) => country.countryCode !== code);
    const existing = nextCountries.length === 1
      ? countries.find((country) => country.countryCode === nextCountries[0].countryCode)
      : null;
    setInput({
      ...input,
      countries: nextCountries,
      countryId: existing?.id ?? null,
      ...(input.destinationCountryCode === code
        ? {
            destinationName: "",
            destinationCity: null,
            destinationRegion: null,
            destinationCountryName: null,
            destinationCountryCode: null,
            destinationLatitude: null,
            destinationLongitude: null,
            destinationExternalId: null,
          }
        : {}),
    });
    if (input.destinationCountryCode === code) {
      setDestinationQuery("");
      setDestinationSelected(false);
    }
  }

  function changeStatus(status: TripStatus) {
    if (
      input.visibility === "public" &&
      status !== "completed" &&
      !window.confirm("Die Reise wird automatisch privat, weil nur abgeschlossene Reisen veröffentlicht werden können. Fortfahren?")
    ) return;
    setInput({
      ...input,
      status,
      visibility: status === "completed" ? input.visibility : "private",
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.title.trim()) return setError("Bitte gib deiner Reise einen Namen.");
    if (!destinationSelected || !input.destinationCountryCode) return setError("Bitte wähle ein Reiseziel aus den Vorschlägen aus.");
    if (!input.countries.length) return setError("Mindestens ein Land muss mit der Reise verknüpft sein.");
    if (!input.startDate || !input.endDate) return setError("Bitte wähle Start- und Enddatum aus.");
    if (input.endDate < input.startDate) return setError("Das Enddatum darf nicht vor dem Startdatum liegen.");
    if (input.visibility === "public" && input.status !== "completed") return setError("Nur abgeschlossene Reisen können veröffentlicht werden.");
    if (input.budgetEstimate != null && input.budgetEstimate < 0) return setError("Das Budget darf nicht negativ sein.");

    setIsSaving(true);
    setError(null);
    try {
      const saved = await onSubmit({
        ...input,
        title: input.title.trim(),
        startDate: input.startDate || null,
        endDate: input.endDate || null,
        destinationName: input.destinationName.trim(),
        description: input.description.trim(),
        highlights: input.highlights.map((item) => item.trim()).filter(Boolean).slice(0, 8),
        notes: input.notes.trim(),
        travelStyle: input.travelStyle.trim(),
        currency: input.currency.trim().toUpperCase(),
        coverPositionX: crop.positionX,
        coverPositionY: crop.positionY,
        coverZoom: crop.zoom,
        coverPhotoUrl: removeCover ? null : input.coverPhotoUrl,
        coverStoragePath: removeCover ? null : input.coverStoragePath,
      });
      if (coverFile) await uploadTripCover(saved.id, coverFile, crop, saved);
      else if (removeCover && trip) await deleteTripCover(saved.id);
      if (pendingPhotos.length) await uploadTripPhotos(saved.id, pendingPhotos);
      await Promise.all([refreshCountries(), refreshSocial()]);
      router.push(`/trips/${saved.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Die Reise konnte nicht gespeichert werden.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className={framed ? "space-y-7 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6" : "space-y-7"} onSubmit={handleSubmit}>
      {error ? <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">{error}</p> : null}

      <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Name der Reise</span><input autoFocus={!trip} className={fieldClass} maxLength={120} onChange={(event) => setInput({ ...input, title: event.target.value })} placeholder="z. B. Sommer in Portugal" required value={input.title} /></label>

      <DestinationAutocomplete
        isSelection={destinationSelected}
        onQueryChange={(query) => {
          setDestinationQuery(query);
          if (query !== input.destinationName) setDestinationSelected(false);
        }}
        onSelect={selectDestination}
        query={destinationQuery}
      />

      <section className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
        <div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-md bg-blue-100 text-blue-700"><Globe2 aria-hidden="true" size={18} /></span><div><h3 className="text-sm font-semibold text-slate-900">Land oder Länder</h3><p className="mt-1 text-xs leading-5 text-slate-500">Das Land des Reiseziels wird automatisch übernommen. Weitere Länder kannst du ergänzen.</p></div></div>
        <div className="mt-3 flex flex-wrap gap-2">
          {input.countries.map((country) => <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-white px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200" key={country.countryCode}>{country.countryName}<button aria-label={`${country.countryName} entfernen`} className="text-slate-400 hover:text-rose-600" onClick={() => removeCountry(country.countryCode)} type="button"><X size={15} /></button></span>)}
          {!input.countries.length ? <span className="text-sm text-slate-500">Noch kein Land ausgewählt.</span> : null}
        </div>
        <div className="mt-4"><CountryAutocomplete label="Weiteres Land hinzufügen" onQueryChange={setCountryQuery} onSelect={addCountry} query={countryQuery} /></div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block"><span className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700"><CalendarDays aria-hidden="true" size={15} />Start</span><input className={fieldClass} onChange={(event) => setInput({ ...input, startDate: event.target.value })} required type="date" value={input.startDate ?? ""} /></label>
        <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Ende</span><input className={fieldClass} min={input.startDate ?? undefined} onChange={(event) => setInput({ ...input, endDate: event.target.value })} required type="date" value={input.endDate ?? ""} /></label>
        <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Reisestatus</span><select className={fieldClass} onChange={(event) => changeStatus(event.target.value as TripStatus)} value={input.status}>{tripStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
      </div>

      <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Beschreibung</span><textarea className={textAreaClass} maxLength={1200} onChange={(event) => setInput({ ...input, description: event.target.value })} placeholder="Was macht diese Reise besonders?" value={input.description} /></label>
      <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Highlights</span><input className={fieldClass} onChange={(event) => setInput({ ...input, highlights: event.target.value.split(",") })} placeholder="Altstadt, Strand, Food Tour" value={input.highlights.join(", ")} /><span className="mt-1.5 block text-xs text-slate-400">Mit Kommas trennen, maximal 8.</span></label>
      <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Reisenotiz</span><textarea className={textAreaClass} onChange={(event) => setInput({ ...input, notes: event.target.value })} placeholder="Private Gedanken, Erinnerungen oder Planung" value={input.notes} /></label>

      <CoverUploader crop={crop} currentUrl={removeCover ? null : input.coverPhotoUrl} file={coverFile} onCropChange={setCrop} onFileChange={(file) => { if (file && file.size > 8 * 1024 * 1024) { setError("Das Coverbild darf maximal 8 MB groß sein."); return; } setCoverFile(file); setRemoveCover(false); setError(null); }} onRemove={() => { setCoverFile(null); setRemoveCover(true); }} />

      <section className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-slate-800">Galerie</p><p className="mt-1 text-xs text-slate-500">Bis zu 12 Reisefotos, jeweils maximal 6 MB.</p></div><label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"><ImagePlus aria-hidden="true" size={17} />Fotos auswählen<input accept="image/jpeg,image/png,image/webp" className="sr-only" multiple onChange={(event) => { const existingCount = trip ? travelPhotos.filter((photo) => photo.tripId === trip.id).length : 0; setPendingPhotos(Array.from(event.target.files ?? []).slice(0, 12 - existingCount)); }} type="file" /></label></div>{pendingPhotos.length ? <p className="mt-3 text-sm font-medium text-blue-700">{pendingPhotos.length} {pendingPhotos.length === 1 ? "Foto" : "Fotos"} ausgewählt</p> : null}</section>

      <details className="group rounded-lg border border-slate-200 bg-slate-50/70"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-semibold text-slate-700">Budget und weitere Details<ChevronDown aria-hidden="true" className="transition group-open:rotate-180" size={18} /></summary><div className="grid gap-4 border-t border-slate-200 p-4 sm:grid-cols-3"><label><span className="mb-2 block text-sm font-semibold text-slate-700">Budget</span><input className={fieldClass} min={0} onChange={(event) => setInput({ ...input, budgetEstimate: event.target.value ? Number(event.target.value) : null })} step="0.01" type="number" value={input.budgetEstimate ?? ""} /></label><label><span className="mb-2 block text-sm font-semibold text-slate-700">Währung</span><input className={fieldClass} maxLength={3} onChange={(event) => setInput({ ...input, currency: event.target.value.toUpperCase() })} value={input.currency} /></label><label><span className="mb-2 block text-sm font-semibold text-slate-700">Reisestil</span><input className={fieldClass} onChange={(event) => setInput({ ...input, travelStyle: event.target.value })} placeholder="Roadtrip, Food, Strand" value={input.travelStyle} /></label></div></details>

      <fieldset><legend className="text-sm font-semibold text-slate-900">Sichtbarkeit</legend><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className={`cursor-pointer rounded-lg border p-4 transition ${input.visibility === "private" ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 bg-white"}`}><input checked={input.visibility === "private"} className="sr-only" name="visibility" onChange={() => setInput({ ...input, visibility: "private" })} type="radio" /><span className="flex items-center gap-2 font-semibold text-slate-900"><LockKeyhole size={18} />Privat{input.visibility === "private" ? <Check className="ml-auto text-blue-600" size={18} /> : null}</span><span className="mt-2 block text-xs leading-5 text-slate-500">Nur du kannst diese Reise und deine Planung sehen.</span></label><label aria-disabled={!canPublish} className={`rounded-lg border p-4 transition ${!canPublish ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-70" : "cursor-pointer"} ${input.visibility === "public" ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 bg-white"}`}><input checked={input.visibility === "public"} className="sr-only" disabled={!canPublish} name="visibility" onChange={() => setInput({ ...input, visibility: "public" })} type="radio" /><span className="flex items-center gap-2 font-semibold text-slate-900"><Globe2 size={18} />Öffentlich{input.visibility === "public" ? <Check className="ml-auto text-blue-600" size={18} /> : null}</span><span className="mt-2 block text-xs leading-5 text-slate-500">Erscheint auf deinem Profil und unter Entdecken.</span></label></div>{!canPublish ? <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800">Nur abgeschlossene Reisen können veröffentlicht werden. Dadurch bleiben zukünftige Reisepläne und Aufenthaltsdaten geschützt.</p> : null}</fieldset>

      <Button className="w-full sm:w-auto" disabled={isSaving} type="submit"><Save aria-hidden="true" size={17} />{isSaving ? "Speichere..." : primaryLabel}</Button>
    </form>
  );
}
