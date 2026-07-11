import type { Profile } from "@/types/social";

export function ProfileAvatar({ profile, size = "md" }: { profile: Profile; size?: "sm" | "md" | "lg" }) {
  const dimensions = size === "lg" ? "size-24 text-2xl" : size === "sm" ? "size-10 text-xs" : "size-14 text-base";
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-slate-900 font-semibold text-white ${dimensions}`}>
      {profile.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={`Profilbild von ${profile.username}`} className="h-full w-full object-cover" src={profile.avatarUrl} />
      ) : (
        (profile.displayName || profile.username).slice(0, 2).toUpperCase()
      )}
    </span>
  );
}
