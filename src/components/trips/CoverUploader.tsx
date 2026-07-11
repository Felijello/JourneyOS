"use client";

import { ImagePlus, Move, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { CoverImage } from "@/components/trips/CoverImage";
import { Button } from "@/components/ui/Button";

export type CoverCrop = { positionX: number; positionY: number; zoom: number };

export function CoverUploader({
  currentUrl,
  file,
  crop,
  onFileChange,
  onCropChange,
  onRemove,
}: {
  currentUrl?: string | null;
  file: File | null;
  crop: CoverCrop;
  onFileChange: (file: File | null) => void;
  onCropChange: (crop: CoverCrop) => void;
  onRemove: () => void;
}) {
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  const previewRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ x: number; y: number; positionX: number; positionY: number } | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const imageUrl = previewUrl ?? currentUrl ?? null;

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Coverbild</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">JPG, PNG oder WebP, maximal 8 MB. Ziehe das Bild, um den Ausschnitt zu verschieben.</p>
        </div>
        <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
          <ImagePlus aria-hidden="true" size={17} />
          {imageUrl ? "Bild austauschen" : "Bild auswählen"}
          <input
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            ref={inputRef}
            type="file"
          />
        </label>
      </div>

      {imageUrl ? (
        <div className="mt-4 space-y-4">
          <div
            aria-label="Coverausschnitt verschieben"
            className="relative aspect-[16/8] touch-none overflow-hidden rounded-lg bg-slate-200 shadow-inner"
            onPointerDown={(event) => {
              dragRef.current = {
                x: event.clientX,
                y: event.clientY,
                positionX: crop.positionX,
                positionY: crop.positionY,
              };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              const drag = dragRef.current;
              const bounds = previewRef.current?.getBoundingClientRect();
              if (!drag || !bounds) return;
              const positionX = Math.max(0, Math.min(100, drag.positionX - ((event.clientX - drag.x) / bounds.width) * 100 / crop.zoom));
              const positionY = Math.max(0, Math.min(100, drag.positionY - ((event.clientY - drag.y) / bounds.height) * 100 / crop.zoom));
              onCropChange({ ...crop, positionX, positionY });
            }}
            onPointerUp={() => { dragRef.current = null; }}
            ref={previewRef}
          >
            <CoverImage positionX={crop.positionX} positionY={crop.positionY} src={imageUrl} zoom={crop.zoom} />
            <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-slate-950/65 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur"><Move aria-hidden="true" size={14} />Verschieben</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="block">
              <span className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600"><span>Zoom</span><span>{crop.zoom.toFixed(1)}×</span></span>
              <input
                aria-label="Coverbild zoomen"
                className="h-8 w-full accent-blue-600"
                max="3"
                min="1"
                onChange={(event) => onCropChange({ ...crop, zoom: Number(event.target.value) })}
                step="0.1"
                type="range"
                value={crop.zoom}
              />
            </label>
            <div className="flex gap-2">
              <Button onClick={() => onCropChange({ positionX: 50, positionY: 50, zoom: 1 })} type="button" variant="secondary"><RotateCcw aria-hidden="true" size={16} />Zurücksetzen</Button>
              <Button onClick={onRemove} type="button" variant="danger"><Trash2 aria-hidden="true" size={16} />Entfernen</Button>
            </div>
          </div>
        </div>
      ) : (
        <button className="mt-4 flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white text-sm font-semibold text-slate-500" onClick={() => inputRef.current?.click()} type="button"><ImagePlus aria-hidden="true" size={22} /><span>Coverbild hinzufügen</span></button>
      )}
    </section>
  );
}
