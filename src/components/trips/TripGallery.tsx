"use client";

/* Signed Supabase URLs are short-lived and cannot be reused by the Next image optimizer. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Replace, Star, Trash2, X } from "lucide-react";
import { useSocial } from "@/components/providers/SocialProvider";
import { Button } from "@/components/ui/Button";
import { compressImage } from "@/lib/images/compress-image";
import type { TripGalleryPhoto } from "@/types/social";

export function TripGallery({ tripId, editable = false }: { tripId: string; editable?: boolean }) {
  const { travelPhotos, uploadTripPhotos, deleteTripPhoto, replaceTripPhoto, setTripPhotoAsCover } = useSocial();
  const photos = travelPhotos.filter((photo) => photo.tripId === tripId).toSorted((a, b) => a.position - b.position);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const selected = photos.find((photo) => photo.id === selectedId) ?? photos[0];

  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const index = photos.findIndex((photo) => photo.id === selected?.id);
      if (event.key === "Escape") setIsFullscreen(false);
      if (event.key === "ArrowRight" && photos[index + 1]) setSelectedId(photos[index + 1].id);
      if (event.key === "ArrowLeft" && photos[index - 1]) setSelectedId(photos[index - 1].id);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen, photos, selected?.id]);

  async function run(action: () => Promise<void>, success: string) {
    setIsSaving(true); setMessage(null);
    try { await action(); setMessage(success); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Das Foto konnte nicht gespeichert werden."); }
    finally { setIsSaving(false); }
  }

  async function upload(files?: FileList | null) {
    if (!files?.length) return;
    await run(async () => {
      const compressed = await Promise.all(Array.from(files).map((file) => compressImage(file, 1800, 0.8)));
      await uploadTripPhotos(tripId, compressed);
    }, "Galerie aktualisiert.");
  }

  async function replace(photo: TripGalleryPhoto, file?: File) {
    if (!file) return;
    await run(async () => replaceTripPhoto(photo, await compressImage(file, 1800, 0.8)), "Foto ausgetauscht.");
  }

  function move(direction: -1 | 1) {
    if (!selected) return;
    const index = photos.findIndex((photo) => photo.id === selected.id);
    const next = photos[index + direction];
    if (next) setSelectedId(next.id);
  }

  return <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold text-slate-950">Reisefotos</h2><p className="mt-1 text-sm text-slate-500">{photos.length} von 12 Bildern</p></div>{editable && photos.length < 12 ? <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm"><ImagePlus size={17} />Fotos hinzufügen<input accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={isSaving} multiple onChange={(event) => void upload(event.target.files)} type="file" /></label> : null}</div>
    {selected?.signedUrl ? <button aria-label="Foto im Vollbild öffnen" className="mt-5 block w-full overflow-hidden rounded-lg bg-slate-100" onClick={() => setIsFullscreen(true)} type="button"><img alt={selected.caption || "Reisefoto"} className="aspect-[16/9] w-full object-cover" decoding="async" loading="lazy" src={selected.signedUrl} /></button> : null}
    {photos.length ? <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">{photos.map((photo) => <button aria-label={`${photo.caption || "Foto"} öffnen`} className={`relative overflow-hidden rounded-md ring-offset-2 ${selected?.id === photo.id ? "ring-2 ring-blue-500" : "hover:opacity-80"}`} key={photo.id} onClick={() => setSelectedId(photo.id)} type="button">{photo.signedUrl ? <img alt="" className="aspect-square w-full object-cover" decoding="async" loading="lazy" src={photo.signedUrl} /> : <span className="block aspect-square bg-slate-100" />}{photo.isCover ? <span className="absolute left-1 top-1 rounded bg-white/90 p-1 text-amber-600"><Star fill="currentColor" size={12} /></span> : null}</button>)}</div> : <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">{editable ? "Füge die ersten Bilder deiner Reise hinzu." : "Für diese Reise wurden noch keine Fotos veröffentlicht."}</div>}
    {editable && selected ? <div className="mt-4 flex flex-wrap gap-2"><label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-700"><Replace size={16} />Austauschen<input accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={isSaving} onChange={(event) => void replace(selected, event.target.files?.[0])} type="file" /></label><Button disabled={isSaving || selected.isCover} onClick={() => void run(() => setTripPhotoAsCover(selected), "Cover aktualisiert.")} variant="secondary"><Star size={16} />{selected.isCover ? "Aktuelles Cover" : "Als Cover"}</Button><Button disabled={isSaving} onClick={() => { if (window.confirm(`Foto „${selected.caption || "Reisefoto"}“ wirklich löschen?`)) void run(() => deleteTripPhoto(selected), "Foto gelöscht."); }} variant="ghost"><Trash2 size={16} />Löschen</Button></div> : null}
    {message ? <p aria-live="polite" className="mt-3 text-sm text-slate-600">{message}</p> : null}
    {isFullscreen && selected?.signedUrl ? <div aria-label="Vollbildgalerie" aria-modal="true" className="fixed inset-0 z-[1200] grid place-items-center bg-slate-950/95 p-3" role="dialog"><button aria-label="Vollbild schließen" className="absolute right-4 top-4 grid size-12 place-items-center rounded-full bg-white/10 text-white" onClick={() => setIsFullscreen(false)} type="button"><X /></button><button aria-label="Vorheriges Foto" className="absolute left-3 grid size-12 place-items-center rounded-full bg-white/10 text-white disabled:opacity-30" disabled={photos[0]?.id === selected.id} onClick={() => move(-1)} type="button"><ChevronLeft /></button><img alt={selected.caption || "Reisefoto"} className="max-h-[85vh] max-w-[90vw] object-contain" src={selected.signedUrl} /><button aria-label="Nächstes Foto" className="absolute right-3 grid size-12 place-items-center rounded-full bg-white/10 text-white disabled:opacity-30" disabled={photos.at(-1)?.id === selected.id} onClick={() => move(1)} type="button"><ChevronRight /></button><p className="absolute bottom-4 text-sm font-semibold text-white">{photos.findIndex((photo) => photo.id === selected.id) + 1} / {photos.length}</p></div> : null}
  </section>;
}
