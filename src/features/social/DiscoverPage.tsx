"use client";

import Link from "next/link";
import { Search, Sparkles, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useSocial } from "@/components/providers/SocialProvider";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { FollowButton } from "@/components/social/FollowButton";
import { PublicTripCard } from "@/components/social/PublicTripCard";
import { EmptyState } from "@/components/ui/EmptyState";

export function DiscoverPage() {
  const { profiles, publications, currentProfile } = useSocial();
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const people = useMemo(
    () => profiles.filter((profile) => profile.id !== currentProfile?.id && (!normalized || profile.username.toLowerCase().includes(normalized) || profile.displayName.toLowerCase().includes(normalized) || profile.homeLocation.toLowerCase().includes(normalized))),
    [currentProfile?.id, normalized, profiles],
  );
  const trips = useMemo(
    () => publications.filter((trip) => !normalized || trip.title.toLowerCase().includes(normalized) || trip.destinationName.toLowerCase().includes(normalized) || trip.description.toLowerCase().includes(normalized)),
    [normalized, publications],
  );

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600"><Sparkles size={15} />JourneyOS Community</p><h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">Lass dich von echten Reisen inspirieren.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Finde Menschen, Reiseziele und öffentliche Reisen aus der Community.</p></div>
      </section>
      <label className="relative block max-w-2xl"><span className="sr-only">Community durchsuchen</span><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} /><input className="h-13 w-full rounded-lg border border-slate-200 bg-white pl-12 pr-4 text-base shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" onChange={(event) => setQuery(event.target.value)} placeholder="Username, Ort oder Reise suchen" value={query} /></label>

      <section>
        <div className="mb-4 flex items-center gap-2"><UsersRound className="text-blue-600" size={20} /><h2 className="text-xl font-semibold text-slate-950">Reisende</h2></div>
        {people.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {people.slice(0, 6).map((profile) => (
              <article className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={profile.id}><ProfileAvatar profile={profile} /><Link className="min-w-0 flex-1" href={`/u/${profile.username}`}><strong className="block truncate text-sm text-slate-950">{profile.displayName}</strong><span className="text-xs text-slate-500">@{profile.username}</span></Link><FollowButton profileId={profile.id} /></article>
            ))}
          </div>
        ) : <p className="text-sm text-slate-500">Keine passenden Profile gefunden.</p>}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-slate-950">Öffentliche Reisen</h2>
        {trips.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{trips.map((trip) => <PublicTripCard creator={profiles.find((profile) => profile.id === trip.userId)} key={trip.tripId} publication={trip} />)}</div>
        ) : <EmptyState description="Sobald jemand eine Reise veröffentlicht, erscheint sie hier." hideAction title="Noch keine öffentlichen Reisen" />}
      </section>
    </div>
  );
}
