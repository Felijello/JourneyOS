"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, CalendarDays, Clock3, Euro, MapPin, Pencil, Plane, Share2, Trash2, X } from "lucide-react";
import { AiPanel } from "@/components/travel/AiPanel";
import { PackingListPanel } from "@/components/trips/PackingListPanel";
import { TripGallery } from "@/components/trips/TripGallery";
import { CoverImage } from "@/components/trips/CoverImage";
import { RoutingPanel } from "@/components/travel/RoutingPanel";
import { SavedLinksPanel } from "@/components/travel/SavedLinksPanel";
import { TripDayPlanner } from "@/components/trips/TripDayPlanner";
import { TripForm } from "@/components/trips/TripForm";
import { WeatherPanel } from "@/components/travel/WeatherPanel";
import { WorldMap } from "@/components/map/WorldMap";
import { useTravel } from "@/components/providers/CountryProvider";
import { useSocial } from "@/components/providers/SocialProvider";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { tripStatusLabels, visibilityLabels } from "@/lib/country-options";
import { formatDate } from "@/lib/utils";

const tabs = [
  ["overview", "Übersicht"], ["days", "Tagesplan"], ["photos", "Fotos"], ["packing", "Packliste"],
] as const;

export function TripDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = tabs.some(([value]) => value === searchParams.get("tab")) ? searchParams.get("tab")! : "overview";
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { refreshSocial } = useSocial();
  const { trips, countries, places, routes, deleteTrip, updateTrip } = useTravel();
  const trip = trips.find((item) => item.id === id);
  const country = countries.find((item) => item.id === trip?.countryId);
  const linkedCountries = trip ? countries.filter((item) => trip.countries.some((linked) => linked.countryCode === item.countryCode)) : [];
  const linkedCountryIds = new Set(linkedCountries.map((item) => item.id));
  if (country) linkedCountryIds.add(country.id);
  const tripPlaces = places.filter((place) => linkedCountryIds.has(place.countryId));
  const tripRoutes = routes.filter((route) => route.tripId === id);

  if (!trip) return <EmptyState actionHref="/trips" actionLabel="Zur Reiseübersicht" description="Diese Reise existiert nicht mehr oder wurde noch nicht geladen." title="Reise nicht gefunden" />;

  const duration = trip.startDate && trip.endDate
    ? Math.max(1, Math.round((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86_400_000) + 1)
    : null;
  const heroImage = trip.coverPhotoUrl ?? country?.coverPhotoUrl;

  async function handleDelete() {
    if (!window.confirm("Diese Reise und ihre Bilder wirklich löschen?")) return;
    await deleteTrip(trip!.id);
    await refreshSocial();
    router.push("/trips");
  }

  async function shareTrip() {
    const url = `${window.location.origin}/community/trips/${trip!.id}`;
    try {
      if (navigator.share) await navigator.share({ title: trip!.title, url });
      else { await navigator.clipboard.writeText(url); setMessage("Link kopiert."); }
    } catch { /* The user may cancel the native share sheet. */ }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-700" href="/trips"><ArrowLeft size={16} />Alle Reisen</Link>
        <div className="flex gap-2">{trip.visibility === "public" ? <Button onClick={shareTrip} variant="secondary"><Share2 size={16} />Teilen</Button> : null}<Button onClick={() => setIsEditing(true)}><Pencil size={16} />Bearbeiten</Button></div>
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-card">
        <div className="relative min-h-[280px] sm:min-h-[360px]">
          {heroImage ? <div className="absolute inset-0 overflow-hidden"><CoverImage positionX={trip.coverPositionX} positionY={trip.coverPositionY} src={heroImage} zoom={trip.coverPhotoUrl ? trip.coverZoom : 1} /></div> : <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-white to-emerald-100" />}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
          <div className="relative flex min-h-[280px] flex-col justify-end p-5 text-white sm:min-h-[360px] sm:p-8">
            <div className="flex flex-wrap gap-2"><span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800">{tripStatusLabels[trip.status]}</span><span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold ring-1 ring-white/30">{visibilityLabels[trip.visibility]}</span></div>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold sm:text-5xl">{trip.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">{trip.destinationName || trip.countries.map((item) => item.countryName).join(", ")}</p>
          </div>
        </div>
        <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <InfoChip icon={<MapPin size={17} />} label="Ziel" value={trip.destinationName || "Offen"} />
          <InfoChip icon={<CalendarDays size={17} />} label="Zeitraum" value={trip.startDate ? `${formatDate(trip.startDate)}${trip.endDate ? ` – ${formatDate(trip.endDate)}` : ""}` : "Offen"} />
          <InfoChip icon={<Clock3 size={17} />} label="Dauer" value={duration ? `${duration} Tage` : "Offen"} />
          <InfoChip icon={<Euro size={17} />} label="Budget" value={trip.budgetEstimate ? `${trip.budgetEstimate.toLocaleString("de-AT")} ${trip.currency}` : "Offen"} />
          <InfoChip icon={<Plane size={17} />} label="Reisestil" value={trip.travelStyle || "Offen"} />
        </div>
      </section>
      {message ? <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}

      <nav aria-label="Reisebereiche" className="flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        {tabs.map(([value, label]) => <Link aria-current={tab === value ? "page" : undefined} className={`min-h-11 shrink-0 rounded-md px-4 py-3 text-sm font-semibold transition ${tab === value ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"}`} href={`/trips/${trip.id}?tab=${value}`} key={value}>{label}</Link>)}
      </nav>

      {tab === "overview" ? <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]"><div className="space-y-5"><section className="journey-card p-5"><h2 className="text-xl font-semibold text-slate-950">Über diese Reise</h2><p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{trip.description || trip.notes || "Noch keine Beschreibung. Ergänze später Erinnerungen, Ideen oder wichtige Details."}</p>{trip.highlights.length ? <div className="mt-5 flex flex-wrap gap-2">{trip.highlights.map((item) => <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700" key={item}>{item}</span>)}</div> : null}</section><WorldMap countries={linkedCountries.length ? linkedCountries : country ? [country] : []} places={tripPlaces} routes={tripRoutes} /><SavedLinksPanel countryId={country?.id} tripId={trip.id} /></div><aside className="space-y-5"><WeatherPanel latitude={trip.destinationLatitude ?? country?.latitude} longitude={trip.destinationLongitude ?? country?.longitude} startDate={trip.startDate} /><RoutingPanel places={tripPlaces} tripId={trip.id} /><AiPanel context={`${trip.title}. ${trip.description}. ${trip.destinationName}`} entityId={trip.id} entityType="trip" /></aside></div> : null}
      {tab === "days" ? <TripDayPlanner trip={trip} /> : null}
      {tab === "photos" ? <TripGallery editable tripId={trip.id} /> : null}
      {tab === "packing" ? <PackingListPanel tripId={trip.id} /> : null}

      {isEditing ? <div aria-modal="true" className="fixed inset-0 z-[1100] bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6" role="dialog"><div className="ml-auto h-full w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-4 shadow-2xl sm:p-6"><div className="mb-5 flex items-center justify-between"><div><p className="text-sm font-semibold text-blue-600">Reise bearbeiten</p><h2 className="mt-1 text-2xl font-semibold text-slate-950">{trip.title}</h2></div><button aria-label="Bearbeiten schließen" className="grid size-11 place-items-center rounded-lg bg-slate-100 text-slate-600" onClick={() => setIsEditing(false)} type="button"><X size={20} /></button></div><TripForm countries={countries} framed={false} onSubmit={async (input) => { const result = await updateTrip(trip.id, input); setIsEditing(false); return result; }} trip={trip} /><Button className="mt-5" onClick={handleDelete} variant="danger"><Trash2 size={16} />Reise löschen</Button></div></div> : null}
    </div>
  );
}

function InfoChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex min-w-0 items-center gap-3 rounded-lg bg-slate-50 px-4 py-3"><span className="shrink-0 text-blue-600">{icon}</span><div className="min-w-0"><p className="text-xs text-slate-400">{label}</p><p className="truncate text-sm font-semibold text-slate-800">{value}</p></div></div>; }
