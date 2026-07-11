"use client";

import { useState } from "react";
import { Check, UserPlus } from "lucide-react";
import { useSocial } from "@/components/providers/SocialProvider";
import { Button } from "@/components/ui/Button";

export function FollowButton({ profileId }: { profileId: string }) {
  const { currentProfile, follows, followProfile, unfollowProfile } = useSocial();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFollowing = follows.some(
    (follow) => follow.followerId === currentProfile?.id && follow.followingId === profileId,
  );

  async function toggleFollow() {
    setIsSaving(true);
    setError(null);
    try {
      if (isFollowing) await unfollowProfile(profileId);
      else await followProfile(profileId);
    } catch {
      setError("Aktion fehlgeschlagen");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
    <Button disabled={isSaving} onClick={() => void toggleFollow()} variant={isFollowing ? "secondary" : "primary"}>
      {isFollowing ? <Check aria-hidden="true" size={17} /> : <UserPlus aria-hidden="true" size={17} />}
      {isFollowing ? "Gefolgt" : "Folgen"}
    </Button>
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </span>
  );
}
