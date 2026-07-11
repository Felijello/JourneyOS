"use client";

import { useState } from "react";
import { ImagePlus, Replace, Trash2 } from "lucide-react";
import { useSocial } from "@/components/providers/SocialProvider";
import { Button } from "@/components/ui/Button";
import type { TripGalleryPhoto } from "@/types/social";

export function TripGallery({ tripId, editable = false }: { tripId: string; editable?: boolean }) {
  const { travelPhotos, uploadTripPhotos, deleteTripPhoto, replaceTripPhoto } = useSocial();
  const photos = travelPhotos.filter((photo) => photo.tripId === tripId).sort((a, b) => a.position - b.position);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const selected = photos.find((photo) => photo.id === selectedId) ?? photos[0];

  async function run(action: () => Promise<void>, success: string) {
    setIsSaving(true);
    setMessage(null);
    try {
      await action();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Das Foto konnte nicht gespeichert werden.");
    } finally {
      setIsSaving(false);
    }
  }

  async function upload(files?: FileList | null) {
    if (!files?.length) return;
    await run(() => uploadTripPhotos(tripId, Array.from(files)), "Galerie aktualisiert.");
  }

  async function replace(photo: TripGalleryPhoto, file?: File) {
    if (!file) return;
    await run(() => replaceTripPhoto(photo, file), "Foto ausgetauscht.");
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-lg font-semibold text-slate-950">Reisefotos</h2><p className="mt-1 text-sm text-slate-500">{photos.length} von 12 Bildern</p></div>
        {editable && photos.length < 12 ? (
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            <ImagePlus size={17} />Fotos hinzufügen
            <input accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={isSaving} multiple onChange={(event) => void upload(event.target.files)} type="file" />
          </label>
        ) : null}
      </div>

      {selected?.signedUrl ? (
        <div className="mt-5 overflow-hidden rounded-lg bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={selected.caption || "Reisefoto"} className="aspect-[16/9] w-full object-cover" src={selected.signedUrl} />
        </div>
      ) : null}

      {photos.length ? (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {photos.map((photo) => (
            <button aria-label={`${photo.caption || "Foto"} öffnen`} className={`overflow-hidden rounded-md ring-offset-2 ${selected?.id === photo.id ? "ring-2 ring-blue-500" : "hover:opacity-80"}`} key={photo.id} onClick={() => setSelectedId(photo.id)} type="button">
              {photo.signedUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" className="aspect-square w-full object-cover" src={photo.signedUrl} />
              ) : <span className="block aspect-square bg-slate-100" />}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          {editable ? "Füge die ersten Bilder deiner Reise hinzu." : "Für diese Reise wurden noch keine Fotos veröffentlicht."}
        </div>
      )}

      {editable && selected ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-200">
            <Replace size={16} />Austauschen
            <input accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={isSaving} onChange={(event) => void replace(selected, event.target.files?.[0])} type="file" />
          </label>
          <Button disabled={isSaving} onClick={() => void run(() => deleteTripPhoto(selected), "Foto gelöscht.")} variant="ghost"><Trash2 size={16} />Löschen</Button>
        </div>
      ) : null}
      {message ? <p aria-live="polite" className="mt-3 text-sm text-slate-600">{message}</p> : null}
    </section>
  );
}
