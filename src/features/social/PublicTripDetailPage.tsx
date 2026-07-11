"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import { useSocial } from "@/components/providers/SocialProvider";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { LikeButton } from "@/components/social/LikeButton";
import { TripGallery } from "@/components/trips/TripGallery";
import { CoverImage } from "@/components/trips/CoverImage";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

export function PublicTripDetailPage({ id }: { id: string }) {
  const { publications, profiles } = useSocial();
  const trip = publications.find((publication) => publication.tripId === id);
  if (!trip) return <EmptyState actionHref="/discover" actionLabel="Community entdecken" description="Die Reise ist privat, wurde gelöscht oder existiert nicht." title="Reise nicht gefunden" />;
  const creator = profiles.find((profile) => profile.id === trip.userId);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-700" href="/discover"><ArrowLeft size={16} />Zur Community</Link>
      <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-card">
        <div className="relative min-h-[320px]">
          {trip.coverPhotoUrl ? (
            <div className="absolute inset-0 overflow-hidden"><CoverImage positionX={trip.coverPositionX} positionY={trip.coverPositionY} src={trip.coverPhotoUrl} zoom={trip.coverZoom} /></div>
          ) : <div className="absolute inset-0 bg-[linear-gradient(135deg,#bfdbfe,#f8fafc_55%,#bbf7d0)]" />}
          <div className="absolute inset-0 bg-slate-950/45" />
          <div className="relative flex min-h-[320px] flex-col justify-end p-5 text-white sm:p-8">
            <span className="w-fit rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-700">Öffentliche Reise</span>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold sm:text-5xl">{trip.title}</h1>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/90"><span className="inline-flex items-center gap-1.5"><MapPin size={16} />{trip.destinationName || "Reiseziel offen"}</span>{trip.startDate ? <span className="inline-flex items-center gap-1.5"><CalendarDays size={16} />{formatDate(trip.startDate)}{trip.endDate ? ` – ${formatDate(trip.endDate)}` : ""}</span> : null}</div>
          </div>
        </div>
        <div className="p-5 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {creator ? <Link className="flex items-center gap-3" href={`/u/${creator.username}`}><ProfileAvatar profile={creator} /><span><strong className="block text-sm text-slate-950">{creator.displayName}</strong><span className="text-xs text-slate-500">@{creator.username}</span></span></Link> : <span />}
            <LikeButton tripId={trip.tripId} />
          </div>
          <p className="mt-7 max-w-3xl text-base leading-7 text-slate-700">{trip.description || "Noch keine Beschreibung."}</p>
          {trip.highlights.length ? <div className="mt-6"><h2 className="text-sm font-semibold text-slate-950">Highlights</h2><div className="mt-3 flex flex-wrap gap-2">{trip.highlights.map((highlight) => <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700" key={highlight}>{highlight}</span>)}</div></div> : null}
        </div>
      </article>
      <TripGallery tripId={trip.tripId} />
    </div>
  );
}
