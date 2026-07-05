"use client";

import { MapPin, Star, Trash2 } from "lucide-react";
import { placeTypeLabels } from "@/lib/country-options";
import type { Place } from "@/types/country";

export function PlaceCard({
  place,
  onDelete,
}: {
  place: Place;
  onDelete?: (id: string) => void;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
            {placeTypeLabels[place.type]}
          </span>
          <h3 className="mt-3 text-lg font-semibold text-slate-950">{place.name}</h3>
        </div>
        {onDelete ? (
          <button
            className="rounded-full p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
            onClick={() => onDelete(place.id)}
            type="button"
          >
            <Trash2 aria-hidden="true" size={16} />
          </button>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {place.shortNote || "Noch keine kurze Ortsnotiz."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
          <Star aria-hidden="true" size={13} />
          {place.rating}/10
        </span>
        {place.latitude && place.longitude ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 ring-1 ring-slate-200">
            <MapPin aria-hidden="true" size={13} />
            Karte bereit
          </span>
        ) : null}
      </div>
    </article>
  );
}

