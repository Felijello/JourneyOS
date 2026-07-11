"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useSocial } from "@/components/providers/SocialProvider";
import { cn } from "@/lib/utils";

export function LikeButton({ tripId, compact = false }: { tripId: string; compact?: boolean }) {
  const { currentProfile, likes, toggleTripLike } = useSocial();
  const [isSaving, setIsSaving] = useState(false);
  const [hasError, setHasError] = useState(false);
  const count = likes.filter((like) => like.tripId === tripId).length;
  const liked = likes.some((like) => like.tripId === tripId && like.userId === currentProfile?.id);

  async function handleClick() {
    setIsSaving(true);
    setHasError(false);
    try {
      await toggleTripLike(tripId);
    } catch {
      setHasError(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <button
      aria-label={liked ? "Like entfernen" : "Reise liken"}
      aria-pressed={liked}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition",
        liked ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-600 hover:bg-slate-100",
        compact && "min-h-9 px-2.5",
      )}
      disabled={isSaving}
      onClick={() => void handleClick()}
      type="button"
    >
      <Heart aria-hidden="true" fill={liked ? "currentColor" : "none"} size={17} />
      {count}
      {hasError ? <span className="sr-only">Like konnte nicht gespeichert werden.</span> : null}
    </button>
  );
}
