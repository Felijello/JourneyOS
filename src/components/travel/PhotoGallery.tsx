"use client";

import { ImagePlus } from "lucide-react";
import { useState } from "react";
import { useTravel } from "@/components/providers/CountryProvider";
import { visibilityOptions } from "@/lib/country-options";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { CountryVisibility } from "@/types/country";

const maxFileSize = 6 * 1024 * 1024;
const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function PhotoGallery({
  countryId,
  placeId,
  tripId,
}: {
  countryId?: string;
  placeId?: string;
  tripId?: string;
}) {
  const { dataSource, photos, createPhoto } = useTravel();
  const [message, setMessage] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<CountryVisibility>("private");
  const [isUploading, setIsUploading] = useState(false);

  const gallery = photos.filter(
    (photo) =>
      (!countryId || photo.countryId === countryId) &&
      (!placeId || photo.placeId === placeId) &&
      (!tripId || photo.tripId === tripId),
  );

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setMessage(null);

    if (!allowedTypes.includes(file.type)) {
      setMessage("Bitte lade nur JPEG, PNG, WEBP oder GIF hoch.");
      return;
    }

    if (file.size > maxFileSize) {
      setMessage("Bitte ein Bild unter 6 MB wählen.");
      return;
    }

    if (!isSupabaseConfigured || !supabase || dataSource !== "supabase") {
      setMessage(
        "Foto-Upload braucht eine aktive Supabase-Verbindung. Prüfe Env Vars, Login und schema.sql.",
      );
      return;
    }

    setIsUploading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw new Error(userError.message);
      if (!user) {
        throw new Error("Bitte melde dich an, bevor du Fotos hochlädst.");
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const ownerScope = countryId ?? placeId ?? tripId ?? "general";
      const path = `${user.id}/${ownerScope}/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("travel-photos")
        .upload(path, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(
          `${uploadError.message}. Prüfe bitte, ob der Bucket travel-photos und die Storage Policies angelegt sind.`,
        );
      }

      const { data: signedData, error: signedError } = await supabase.storage
        .from("travel-photos")
        .createSignedUrl(path, 60 * 60 * 24);

      if (signedError) {
        throw new Error(
          `${signedError.message}. Upload war erfolgreich, aber die Vorschau-URL konnte nicht erstellt werden.`,
        );
      }

      await createPhoto({
        userId: user.id,
        countryId,
        placeId,
        tripId,
        storagePath: path,
        publicUrl: signedData?.signedUrl ?? null,
        caption: file.name,
        visibility,
      });
      setMessage("Foto hochgeladen und gespeichert.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Foto konnte nicht hochgeladen werden.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Galerie</h2>
          <p className="mt-1 text-sm text-slate-500">
            Supabase Storage Bucket: <code>travel-photos</code>.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
            onChange={(event) => setVisibility(event.target.value as CountryVisibility)}
            value={visibility}
          >
            {visibilityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            <ImagePlus size={17} />
            {isUploading ? "Lade hoch..." : "Foto hochladen"}
            <input
              accept={allowedTypes.join(",")}
              className="sr-only"
              disabled={isUploading}
              onChange={handleUpload}
              type="file"
            />
          </label>
        </div>
      </div>
      {message ? <p className="mt-3 text-sm text-slate-500">{message}</p> : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {gallery.length ? (
          gallery.map((photo) => (
            <figure className="overflow-hidden rounded-2xl bg-slate-100" key={photo.id}>
              {photo.publicUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" className="h-40 w-full object-cover" src={photo.publicUrl} />
              ) : (
                <div className="h-40 travel-photo" />
              )}
              <figcaption className="px-3 py-2 text-xs font-medium text-slate-500">
                {photo.caption || "Reisefoto"}
              </figcaption>
            </figure>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500 sm:col-span-2 lg:col-span-3">
            Noch keine Fotos. EXIF/GPS-Erkennung ist als nächster Schritt vorbereitet.
          </div>
        )}
      </div>
    </section>
  );
}
