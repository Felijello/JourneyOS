"use client";

import Link from "next/link";
import { MapPin, Pencil, Settings } from "lucide-react";
import { useSocial } from "@/components/providers/SocialProvider";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { FollowButton } from "@/components/social/FollowButton";
import { PublicTripCard } from "@/components/social/PublicTripCard";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Profile } from "@/types/social";

export function ProfileView({ profile }: { profile: Profile }) {
  const { currentProfile, follows, publications, profiles } = useSocial();
  const isOwn = currentProfile?.id === profile.id;
  const followers = follows.filter((follow) => follow.followingId === profile.id).length;
  const following = follows.filter((follow) => follow.followerId === profile.id).length;
  const trips = publications.filter((publication) => publication.userId === profile.id);

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <ProfileAvatar profile={profile} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600">@{profile.username}</p>
                <h1 className="mt-1 text-3xl font-semibold text-slate-950">{profile.displayName || profile.username}</h1>
                {profile.homeLocation ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={15} />{profile.homeLocation}</p>
                ) : null}
              </div>
              {isOwn ? (
                <div className="flex gap-2">
                  <LinkButton href="/settings"><Pencil size={16} />Bearbeiten</LinkButton>
                  <LinkButton href="/settings" variant="secondary"><Settings size={16} />Einstellungen</LinkButton>
                </div>
              ) : (
                <FollowButton profileId={profile.id} />
              )}
            </div>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-600">
              {profile.bio || "Hier entsteht gerade ein neues Reiseprofil."}
            </p>
            {profile.favoriteDestinations.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.favoriteDestinations.map((destination) => (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700" key={destination}>{destination}</span>
                ))}
              </div>
            ) : null}
            <div className="mt-6 flex gap-6 border-t border-slate-100 pt-5">
              <Link href={`/u/${profile.username}/followers`}><strong className="block text-xl text-slate-950">{followers}</strong><span className="text-xs text-slate-500">Follower</span></Link>
              <Link href={`/u/${profile.username}/following`}><strong className="block text-xl text-slate-950">{following}</strong><span className="text-xs text-slate-500">Gefolgt</span></Link>
              <div><strong className="block text-xl text-slate-950">{trips.length}</strong><span className="text-xs text-slate-500">Reisen</span></div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div><p className="text-sm font-semibold text-blue-600">Reisetagebuch</p><h2 className="mt-1 text-2xl font-semibold text-slate-950">Veröffentlichte Reisen</h2></div>
          {isOwn ? <Link className="text-sm font-semibold text-blue-700" href="/trips/new">Neue Reise</Link> : null}
        </div>
        {trips.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {trips.map((publication) => (
              <PublicTripCard creator={profiles.find((item) => item.id === publication.userId)} key={publication.tripId} publication={publication} />
            ))}
          </div>
        ) : (
          <EmptyState
            actionHref={isOwn ? "/trips/new" : undefined}
            actionLabel={isOwn ? "Reise anlegen" : undefined}
            description={isOwn ? "Stelle eine Reise auf öffentlich, damit sie hier erscheint." : "Dieses Profil hat noch keine Reise veröffentlicht."}
            hideAction={!isOwn}
            title="Noch keine öffentlichen Reisen"
          />
        )}
      </section>
    </div>
  );
}
