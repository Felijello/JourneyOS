"use client";

import Link from "next/link";
import { ArrowLeft, UsersRound } from "lucide-react";
import { useSocial } from "@/components/providers/SocialProvider";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { FollowButton } from "@/components/social/FollowButton";
import { EmptyState } from "@/components/ui/EmptyState";

export function ConnectionsPage({ username, mode }: { username: string; mode: "followers" | "following" }) {
  const { profiles, follows, currentProfile } = useSocial();
  const profile = profiles.find((item) => item.username.toLowerCase() === username.toLowerCase());
  if (!profile) return <EmptyState actionHref="/discover" actionLabel="Zur Suche" description="Dieses Profil ist nicht verfügbar." title="Profil nicht gefunden" />;

  const ids = mode === "followers"
    ? follows.filter((item) => item.followingId === profile.id).map((item) => item.followerId)
    : follows.filter((item) => item.followerId === profile.id).map((item) => item.followingId);
  const people = profiles.filter((item) => ids.includes(item.id));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-700" href={`/u/${profile.username}`}><ArrowLeft size={16} />Zurück zum Profil</Link>
      <div><p className="text-sm font-semibold text-blue-600">@{profile.username}</p><h1 className="mt-1 text-3xl font-semibold text-slate-950">{mode === "followers" ? "Follower" : "Gefolgt"}</h1></div>
      {people.length ? (
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white px-4 shadow-sm">
          {people.map((person) => (
            <div className="flex items-center gap-3 py-4" key={person.id}>
              <ProfileAvatar profile={person} />
              <Link className="min-w-0 flex-1" href={`/u/${person.username}`}><strong className="block truncate text-sm text-slate-950">{person.displayName}</strong><span className="block truncate text-xs text-slate-500">@{person.username}</span></Link>
              {currentProfile?.id !== person.id ? <FollowButton profileId={person.id} /> : null}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState description={mode === "followers" ? "Noch folgt diesem Profil niemand." : "Dieses Profil folgt noch niemandem."} hideAction icon={<UsersRound size={22} />} title="Noch leer" />
      )}
    </div>
  );
}
