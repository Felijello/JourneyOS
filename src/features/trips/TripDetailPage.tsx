"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Euro,
  MapPin,
  Pencil,
  Plane,
  Trash2,
} from "lucide-react";
import { AiPanel } from "@/components/travel/AiPanel";
import { PackingListPanel } from "@/components/trips/PackingListPanel";
import { PhotoGallery } from "@/components/travel/PhotoGallery";
import { RoutingPanel } from "@/components/travel/RoutingPanel";
import { SavedLinksPanel } from "@/components/travel/SavedLinksPanel";
import { TripDayPlanner } from "@/components/trips/TripDayPlanner";
import { TripForm } from "@/components/trips/TripForm";
import { WeatherPanel } from "@/components/travel/WeatherPanel";
import { WorldMap } from "@/components/map/WorldMap";
import { useTravel } from "@/components/providers/CountryProvider";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { tripStatusLabels, visibilityLabels } from "@/lib/country-options";
import { formatDate } from "@/lib/utils";

export function TripDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const {
    trips,
    countries,
    places,
    deleteTrip,
    updateTrip,
  } = useTravel();

  const trip = trips.find((item) => item.id === id);
  const country = countries.find((item) => item.id === trip?.countryId);
  const tripPlaces = places.filter((place) => place.countryId === trip?.countryId);

  if (!trip) {
    return (
      <EmptyState
        actionHref="/trips"
        actionLabel="Zur Trip-Übersicht"
        description="Dieser Trip existiert nicht mehr oder wurde lokal noch nicht geladen."
        title="Trip nicht gefunden"
      />
    );
  }

  const tripId = trip.id;

  async function handleDelete() {
    if (!window.confirm("Diesen Trip wirklich löschen?")) return;
    await deleteTrip(tripId);
    router.push("/trips");
  }

  const heroImage = trip.coverPhotoUrl ?? country?.coverPhotoUrl;

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-700"
        href="/trips"
      >
        <ArrowLeft size={16} />
        Alle Trips
      </Link>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-card">
        <div className="relative min-h-[260px]">
          {heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="absolute inset-0 h-full w-full object-cover" src={heroImage} />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-white to-emerald-100" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/25 to-transparent" />
          <div className="relative flex min-h-[260px] flex-col justify-end p-5 text-white sm:p-8">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800">
                {tripStatusLabels[trip.status]}
              </span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/30">
                {visibilityLabels[trip.visibility]}
              </span>
            </div>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              {trip.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
              {trip.notes || "Noch keine Notizen. Hier kann deine grobe Reiseidee wachsen."}
            </p>
          </div>
        </div>
        <div className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoChip icon={<MapPin size={17} />} label="Land" value={country?.name ?? "Offen"} />
          <InfoChip
            icon={<CalendarDays size={17} />}
            label="Zeitraum"
            value={
              trip.startDate
                ? `${formatDate(trip.startDate)}${trip.endDate ? ` - ${formatDate(trip.endDate)}` : ""}`
                : "Noch offen"
            }
          />
          <InfoChip
            icon={<Euro size={17} />}
            label="Budget"
            value={
              trip.budgetEstimate
                ? `${trip.budgetEstimate.toLocaleString("de-AT")} ${trip.currency}`
                : "Offen"
            }
          />
          <InfoChip icon={<Plane size={17} />} label="Reisestil" value={trip.travelStyle || "Offen"} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <TripDayPlanner trip={trip} />
          <div className="journey-card p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Trip bearbeiten
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  Basisdaten
                </h2>
              </div>
              <Pencil className="text-slate-400" size={20} />
            </div>
            <TripForm
              countries={countries}
              framed={false}
              onSubmit={(input) => updateTrip(tripId, input)}
              submitLabel="Änderungen speichern"
              trip={trip}
            />
            <Button className="mt-4 rounded-2xl" onClick={handleDelete} type="button" variant="danger">
              <Trash2 size={16} />
              Trip löschen
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          <WorldMap countries={country ? [country] : []} places={tripPlaces} />
          <WeatherPanel latitude={country?.latitude} longitude={country?.longitude} />
          <RoutingPanel places={tripPlaces} />
          <PackingListPanel tripId={tripId} />
          <PhotoGallery countryId={country?.id} tripId={tripId} />
          <SavedLinksPanel countryId={country?.id} tripId={tripId} />
          <AiPanel
            context={`${trip.title}. ${trip.notes}. ${country?.name ?? ""}`}
            entityId={tripId}
            entityType="trip"
          />
        </div>
      </section>
    </div>
  );
}

function InfoChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
      <span className="text-blue-600">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
