"use client";

import { ImagePlus } from "lucide-react";
import { useState } from "react";
import { useTravel } from "@/components/providers/CountryProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

export function PhotoGallery({ countryId, tripId }: { countryId?: string; tripId?: string }) {
  const { photos, createPhoto } = useTravel();
  const [message, setMessage] = useState<string | null>(null);
  const gallery = photos.filter(
    (photo) =>
      (!countryId || photo.countryId === countryId) &&
      (!tripId || photo.tripId === tripId),
  );

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Bitte nur Bilddateien hochladen.");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setMessage("Bitte ein Bild unter 6 MB wählen.");
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setMessage("Foto-Upload braucht Supabase Storage. Demo-Metadaten bleiben lokal.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const ownerFolder = user?.id ?? "demo";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${ownerFolder}/${countryId ?? "general"}/${crypto.randomUUID()}-${safeName}`;
    const { error } = await supabase.storage.from("travel-photos").upload(path, file);
    if (error) {
      setMessage(error.message);
      return;
    }
    const { data } = await supabase.storage
      .from("travel-photos")
      .createSignedUrl(path, 60 * 60 * 24);
    createPhoto({
      countryId,
      tripId,
      storagePath: path,
      publicUrl: data?.signedUrl ?? null,
      caption: file.name,
      visibility: "private",
    });
    setMessage("Foto hochgeladen.");
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
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
          <ImagePlus size={17} />
          Foto hochladen
          <input className="sr-only" onChange={handleUpload} type="file" />
        </label>
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
