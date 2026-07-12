"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CalendarDays, ChevronRight, MapPin, Pencil, Route, Trash2 } from "lucide-react";
import { CountryForm } from "@/components/countries/CountryForm";
import { WorldMap } from "@/components/map/WorldMap";
import { PlaceCard } from "@/components/places/PlaceCard";
import { PlaceForm } from "@/components/places/PlaceForm";
import { useTravel } from "@/components/providers/CountryProvider";
import { AiPanel } from "@/components/travel/AiPanel";
import { PhotoGallery } from "@/components/travel/PhotoGallery";
import { SavedLinksPanel } from "@/components/travel/SavedLinksPanel";
import { WeatherPanel } from "@/components/travel/WeatherPanel";
import { StatusBadge, VisibilityBadge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { continentLabels } from "@/lib/country-options";
import { formatDate } from "@/lib/utils";
import type { CountryFormInput } from "@/types/country";

export function CountryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    countries,
    places,
    trips,
    updateCountry,
    deleteCountry,
    createPlace,
    deletePlace,
    isLoading,
  } = useTravel();
  const [isEditing, setIsEditing] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const country = useMemo(
    () => countries.find((item) => item.id === params.id),
    [countries, params.id],
  );
  const countryPlaces = places.filter((place) => place.countryId === params.id);
  const countryTrips = trips.filter(
    (trip) =>
      trip.countryId === params.id ||
      trip.countries.some(
        (linked) => linked.countryCode === country?.countryCode,
      ),
  );
  const completedCountryTrips = countryTrips.filter((trip) => trip.status === "completed");
  const datedTrips = completedCountryTrips
    .filter((trip) => trip.startDate)
    .toSorted((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""));
  const totalDays = completedCountryTrips.reduce((sum, trip) => {
    if (!trip.startDate || !trip.endDate) return sum;
    const start = new Date(`${trip.startDate}T00:00:00`);
    const end = new Date(`${trip.endDate}T00:00:00`);
    return sum + Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);
  }, 0);
  const firstVisit = datedTrips.at(-1)?.startDate ?? country?.visitedFrom;
  const lastVisit = datedTrips[0]?.endDate ?? datedTrips[0]?.startDate ?? country?.visitedTo;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-64 animate-pulse rounded-3xl bg-white/70" />
        <div className="h-96 animate-pulse rounded-3xl bg-white/70" />
      </div>
    );
  }

  if (!country) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">Land nicht gefunden</h1>
        <p className="mt-2 text-sm text-slate-600">
          Vielleicht wurde es gelöscht oder existiert nur in einem anderen Datenmodus.
        </p>
        <LinkButton className="mt-6" href="/countries">
          Zurück zur Liste
        </LinkButton>
      </section>
    );
  }

  async function handleDelete() {
    if (!country) return;
    const confirmed = window.confirm(`${country.name} wirklich löschen?`);
    if (!confirmed) return;

    setDeleteError(null);
    try {
      await deleteCountry(country.id);
      router.push("/countries");
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Das Land konnte nicht gelöscht werden.",
      );
    }
  }

  async function handleUpdate(input: CountryFormInput) {
    if (!country) throw new Error("Land wurde nicht gefunden.");
    const updatedCountry = await updateCountry(country.id, input);
    setIsEditing(false);
    return updatedCountry;
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
        <div className="relative h-56 travel-photo sm:h-72">
          {country.coverPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="h-full w-full object-cover" src={country.coverPhotoUrl} />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/10 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={country.status} />
              <VisibilityBadge visibility={country.visibility} />
              {country.countryCode ? (
                <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {country.countryCode}
                </span>
              ) : null}
            </div>
            <p className="mt-4 text-sm font-semibold text-white/80">
              {continentLabels[country.continent]}
            </p>
            <h1 className="mt-1 text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              {country.name}
            </h1>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <p className="max-w-3xl text-base leading-7 text-slate-600">
              {country.shortNote || "Noch keine kurze Notiz gespeichert."}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => setIsEditing((value) => !value)} variant="secondary">
                <Pencil aria-hidden="true" size={17} />
                {isEditing ? "Bearbeiten schließen" : "Bearbeiten"}
              </Button>
              <Button onClick={handleDelete} variant="danger">
                <Trash2 aria-hidden="true" size={17} />
                Löschen
              </Button>
            </div>
          </div>

          {deleteError ? (
            <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
              {deleteError}
            </p>
          ) : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Bewertung</p>
              <p className="mt-2 text-2xl font-semibold">{country.personalRating}/10</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Beste Reisemonate</p>
              <p className="mt-2 text-base font-semibold">
                {country.bestTravelMonths || "Noch offen"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Reisen</p>
              <p className="mt-2 text-2xl font-semibold">{countryTrips.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Aufenthalt</p>
              <p className="mt-2 flex items-center gap-2 text-base font-semibold">
                <CalendarDays aria-hidden="true" size={17} />
                {totalDays > 0 ? `${totalDays} Tage` : "Noch offen"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1.5">{country.manualStatus === "visited" ? "Von dir als besucht markiert" : country.completedTripCount > 0 ? "Durch abgeschlossene Reise erkannt" : "Persönlicher Länderstatus"}</span>
            {firstVisit ? <span className="rounded-full bg-slate-100 px-3 py-1.5">Erster Besuch: {formatDate(firstVisit)}</span> : null}
            {lastVisit ? <span className="rounded-full bg-slate-100 px-3 py-1.5">Letzter Besuch: {formatDate(lastVisit)}</span> : null}
          </div>
        </div>
      </section>

      {isEditing ? (
        <CountryForm
          country={country}
          onSubmit={handleUpdate}
          submitLabel="Änderungen speichern"
        />
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Persönliche Notiz</h2>
          <p className="mt-4 whitespace-pre-line text-base leading-8 text-slate-700">
            {country.longNote ||
              "Noch keine längere Beschreibung. Schreib später auf, warum dieses Land auf deiner Liste steht oder was du dort erlebt hast."}
          </p>
        </article>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-950">Kartenposition</h2>
          <WorldMap countries={[country]} places={countryPlaces} />
        </section>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-blue-50 text-blue-600"><Route size={19} /></span>
          <div><h2 className="text-xl font-semibold text-slate-950">Deine Reisen</h2><p className="text-sm text-slate-500">Alle Aufenthalte in {country.name}, neueste zuerst.</p></div>
        </div>
        {countryTrips.length ? <ol className="mt-6 space-y-3">{countryTrips.toSorted((a, b) => (b.startDate ?? b.createdAt).localeCompare(a.startDate ?? a.createdAt)).map((trip) => <li key={trip.id}><a className="flex min-h-16 items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50/50" href={`/trips/${trip.id}?tab=overview`}><MapPin className="shrink-0 text-blue-600" size={18} /><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-slate-950">{trip.title}</strong><span className="mt-0.5 block text-xs text-slate-500">{trip.startDate ? formatDate(trip.startDate) : "Datum offen"}{trip.endDate ? ` – ${formatDate(trip.endDate)}` : ""} · {trip.status === "completed" ? "Abgeschlossen" : trip.status === "active" ? "Aktuell" : "Geplant"}</span></span><ChevronRight className="shrink-0 text-slate-400" size={18} /></a></li>)}</ol> : <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">Noch keine Reise mit diesem Land verknüpft.</div>}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Orte in {country.name}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Städte, Hotels, Aussichtspunkte, Restaurants und Aktivitäten.
          </p>
        </div>
        <PlaceForm countryId={country.id} onSubmit={createPlace} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {countryPlaces.length ? (
            countryPlaces.map((place) => (
              <PlaceCard key={place.id} onDelete={deletePlace} place={place} />
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
              Noch keine Orte gespeichert. Starte mit einer Stadt, einem Hotel oder
              einem Aussichtspunkt.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <WeatherPanel latitude={country.latitude} longitude={country.longitude} />
        <AiPanel
          context={`${country.name}: ${country.shortNote}. ${country.longNote}`}
          entityId={country.id}
          entityType="country"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <PhotoGallery countryId={country.id} />
        <SavedLinksPanel countryId={country.id} />
      </section>
    </div>
  );
}
