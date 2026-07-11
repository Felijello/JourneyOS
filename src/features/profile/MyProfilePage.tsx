"use client";

import { useSocial } from "@/components/providers/SocialProvider";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProfileView } from "@/features/profile/ProfileView";

export function MyProfilePage() {
  const { currentProfile } = useSocial();
  return currentProfile ? (
    <ProfileView profile={currentProfile} />
  ) : (
    <EmptyState actionHref="/onboarding" actionLabel="Profil einrichten" description="Vervollständige kurz deinen Username und deine Bio." title="Dein Profil ist noch nicht bereit" />
  );
}
