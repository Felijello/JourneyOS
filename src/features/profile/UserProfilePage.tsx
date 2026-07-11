"use client";

import { useSocial } from "@/components/providers/SocialProvider";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProfileView } from "@/features/profile/ProfileView";

export function UserProfilePage({ username }: { username: string }) {
  const { profiles } = useSocial();
  const profile = profiles.find((item) => item.username.toLowerCase() === username.toLowerCase());
  return profile ? (
    <ProfileView profile={profile} />
  ) : (
    <EmptyState actionHref="/discover" actionLabel="Community entdecken" description="Das Profil ist privat, wurde umbenannt oder existiert nicht." title="Profil nicht gefunden" />
  );
}
