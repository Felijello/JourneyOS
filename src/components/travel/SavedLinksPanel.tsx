"use client";

import { ExternalLink, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useTravel } from "@/components/providers/CountryProvider";

export function SavedLinksPanel({
  countryId,
  tripId,
  placeId,
}: {
  countryId?: string;
  tripId?: string;
  placeId?: string;
}) {
  const { savedLinks, createSavedLink, deleteSavedLink } = useTravel();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const links = savedLinks.filter(
    (link) =>
      (!countryId || link.countryId === countryId) &&
      (!tripId || link.tripId === tripId) &&
      (!placeId || link.placeId === placeId),
  );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Gespeicherte Links</h2>
      <p className="mt-1 text-sm text-slate-500">
        Für GetYourGuide, Booking, Hotels, Restaurants oder lose Ideen.
      </p>
      <form
        className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          if (!url.trim()) return;
          createSavedLink({
            countryId,
            tripId,
            placeId,
            title: title.trim() || "Neuer Link",
            url: url.trim(),
            provider: "",
            notes: "",
          });
          setUrl("");
          setTitle("");
        }}
      >
        <input
          className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Titel"
          value={title}
        />
        <input
          className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none"
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://..."
          type="url"
          value={url}
        />
        <Button className="rounded-2xl" type="submit">
          Speichern
        </Button>
      </form>
      <div className="mt-4 space-y-2">
        {links.length ? (
          links.map((link) => (
            <div
              className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2"
              key={link.id}
            >
              <a
                className="min-w-0 text-sm font-semibold text-slate-700 hover:text-blue-700"
                href={link.url}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink className="mr-2 inline" size={14} />
                {link.title} <span className="text-slate-400">· {link.provider}</span>
              </a>
              <button
                className="text-slate-400 hover:text-rose-600"
                onClick={() => deleteSavedLink(link.id)}
                type="button"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        ) : (
          <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Noch keine Links gespeichert.
          </p>
        )}
      </div>
    </section>
  );
}

