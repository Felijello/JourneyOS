import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { CoverImage } from "@/components/trips/CoverImage";
import { LikeButton } from "@/components/social/LikeButton";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { formatDate } from "@/lib/utils";
import type { Profile, TripPublication } from "@/types/social";

export function PublicTripCard({ publication, creator }: { publication: TripPublication; creator?: Profile }) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-card">
      <Link className="block" href={`/community/trips/${publication.tripId}`}>
        <div className="relative aspect-[16/10] bg-slate-100">
          {publication.coverPhotoUrl ? (
            <CoverImage positionX={publication.coverPositionX} positionY={publication.coverPositionY} src={publication.coverPhotoUrl} zoom={publication.coverZoom} />
          ) : (
            <div className="h-full w-full bg-[linear-gradient(135deg,#dbeafe,#f8fafc_52%,#dcfce7)]" />
          )}
          <span className="absolute left-3 top-3 rounded-full bg-white/92 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
            Öffentlich
          </span>
        </div>
      </Link>
      <div className="p-4">
        {creator ? (
          <Link className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600" href={`/u/${creator.username}`}>
            <ProfileAvatar profile={creator} size="sm" />
            @{creator.username}
          </Link>
        ) : null}
        <Link href={`/community/trips/${publication.tripId}`}>
          <h3 className="text-lg font-semibold text-slate-950">{publication.title}</h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
          {publication.description || "Eine neue Reise aus der JourneyOS Community."}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-500">
          <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{publication.destinationName || "Reiseziel offen"}</span>
          {publication.startDate ? (
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} />{formatDate(publication.startDate)}</span>
          ) : null}
        </div>
        <div className="mt-4 border-t border-slate-100 pt-3">
          <LikeButton compact tripId={publication.tripId} />
        </div>
      </div>
    </article>
  );
}
