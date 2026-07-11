"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, LoaderCircle, Save } from "lucide-react";
import { useSocial } from "@/components/providers/SocialProvider";
import { Button } from "@/components/ui/Button";
import type { Profile, ProfileInput } from "@/types/social";

const fieldClass =
  "h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-base text-slate-950 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100";

export function ProfileForm({ onboarding = false }: { onboarding?: boolean }) {
  const { currentProfile, isLoading } = useSocial();

  if (isLoading || !currentProfile) {
    return (
      <div className="flex min-h-48 items-center justify-center text-slate-400">
        <LoaderCircle className="animate-spin" size={22} />
      </div>
    );
  }

  return (
    <ProfileFormEditor
      key={`${currentProfile.id}:${currentProfile.updatedAt}`}
      onboarding={onboarding}
      profile={currentProfile}
    />
  );
}

function ProfileFormEditor({ onboarding, profile: currentProfile }: { onboarding: boolean; profile: Profile }) {
  const router = useRouter();
  const { saveProfile, uploadAvatar } = useSocial();
  const [input, setInput] = useState<ProfileInput>(() => ({
    username: currentProfile.username,
    displayName: currentProfile.displayName,
    avatarUrl: currentProfile.avatarUrl,
    bio: currentProfile.bio,
    homeLocation: currentProfile.homeLocation,
    favoriteDestinations: currentProfile.favoriteDestinations,
    profileVisibility: currentProfile.profileVisibility,
  }));
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setIsError(false);
    setMessage(null);
    try {
      await saveProfile(input, onboarding);
      setMessage(onboarding ? "Dein Profil ist bereit." : "Änderungen gespeichert.");
      if (onboarding) {
        router.replace("/");
        router.refresh();
      }
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Profil konnte nicht gespeichert werden.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAvatar(file?: File) {
    if (!file) return;
    setIsUploading(true);
    setMessage(null);
    try {
      await uploadAvatar(file);
      setMessage("Profilbild aktualisiert.");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Bild konnte nicht hochgeladen werden.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="flex items-center gap-4">
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-900 text-xl font-semibold text-white">
          {currentProfile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="Profilbild" className="h-full w-full object-cover" src={currentProfile.avatarUrl} />
          ) : (
            currentProfile.displayName.slice(0, 2).toUpperCase()
          )}
        </div>
        <div>
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            <Camera aria-hidden="true" size={17} />
            {isUploading ? "Wird hochgeladen..." : "Profilbild ändern"}
            <input
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={isUploading}
              onChange={(event) => void handleAvatar(event.target.files?.[0])}
              type="file"
            />
          </label>
          <p className="mt-2 text-xs text-slate-400">JPEG, PNG oder WebP, maximal 4 MB.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Username</span>
          <input
            className={fieldClass}
            maxLength={24}
            minLength={3}
            onChange={(event) =>
              setInput({
                ...input,
                username: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
              })
            }
            required
            value={input.username}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Anzeigename</span>
          <input
            className={fieldClass}
            maxLength={80}
            onChange={(event) => setInput({ ...input, displayName: event.target.value })}
            placeholder="Felix"
            value={input.displayName}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Bio</span>
        <textarea
          className="min-h-28 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-base outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          maxLength={240}
          onChange={(event) => setInput({ ...input, bio: event.target.value })}
          placeholder="Was für Reisen magst du?"
          value={input.bio}
        />
        <span className="mt-1 block text-right text-xs text-slate-400">{input.bio.length}/240</span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Heimatort</span>
          <input
            className={fieldClass}
            maxLength={100}
            onChange={(event) => setInput({ ...input, homeLocation: event.target.value })}
            placeholder="Wien"
            value={input.homeLocation}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Lieblingsziele</span>
          <input
            className={fieldClass}
            onChange={(event) =>
              setInput({
                ...input,
                favoriteDestinations: event.target.value.split(",").slice(0, 8),
              })
            }
            placeholder="Japan, Portugal, Island"
            value={input.favoriteDestinations.join(", ")}
          />
        </label>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-slate-700">Profil-Sichtbarkeit</legend>
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
          {(["public", "private"] as const).map((visibility) => (
            <button
              className={`min-h-11 rounded-md text-sm font-semibold transition ${
                input.profileVisibility === visibility
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500"
              }`}
              key={visibility}
              onClick={() => setInput({ ...input, profileVisibility: visibility })}
              type="button"
            >
              {visibility === "public" ? "Öffentlich" : "Privat"}
            </button>
          ))}
        </div>
      </fieldset>

      {message ? (
        <p
          aria-live="polite"
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            isError ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {message}
        </p>
      ) : null}

      <Button className="w-full sm:w-auto" disabled={isSaving || isUploading} type="submit">
        {isSaving ? <LoaderCircle className="animate-spin" size={17} /> : onboarding ? <Check size={17} /> : <Save size={17} />}
        {isSaving ? "Speichere..." : onboarding ? "Profil fertigstellen" : "Profil speichern"}
      </Button>
    </form>
  );
}
