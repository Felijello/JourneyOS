"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import { useTravel } from "@/components/providers/CountryProvider";
import { Button } from "@/components/ui/Button";
import type { PackingItem } from "@/types/country";

export function PackingListPanel({ tripId }: { tripId: string }) {
  const { packingItems, createPackingItem, togglePackingItem, deletePackingItem } =
    useTravel();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Allgemein");

  const items = useMemo(
    () => packingItems.filter((item) => item.tripId === tripId),
    [packingItems, tripId],
  );
  const packedCount = items.filter((item) => item.isPacked).length;

  function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    createPackingItem({
      tripId,
      title: title.trim(),
      category: category.trim() || "Allgemein",
      isPacked: false,
    });
    setTitle("");
  }

  return (
    <section className="journey-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Packliste
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            {packedCount}/{items.length} erledigt
          </h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
          V1
        </span>
      </div>

      <form className="mt-5 grid gap-2 sm:grid-cols-[1fr_130px_auto]" onSubmit={handleAdd}>
        <input
          className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="z. B. Reisepass, Ladegerät..."
          value={title}
        />
        <input
          className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          onChange={(event) => setCategory(event.target.value)}
          placeholder="Kategorie"
          value={category}
        />
        <Button className="h-11 rounded-2xl" type="submit">
          <Plus size={16} />
          Hinzufügen
        </Button>
      </form>

      <div className="mt-5 space-y-2">
        {items.length ? (
          items.map((item: PackingItem) => (
            <div
              className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
              key={item.id}
            >
              <button
                aria-label={item.isPacked ? "Als ungepackt markieren" : "Als gepackt markieren"}
                className="text-blue-600"
                onClick={() => togglePackingItem(item.id)}
                type="button"
              >
                {item.isPacked ? <CheckCircle2 size={20} /> : <Circle size={20} />}
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-semibold ${
                    item.isPacked ? "text-slate-400 line-through" : "text-slate-800"
                  }`}
                >
                  {item.title}
                </p>
                <p className="text-xs text-slate-400">{item.category}</p>
              </div>
              <button
                aria-label="Packlistenpunkt löschen"
                className="rounded-full p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                onClick={() => deletePackingItem(item.id)}
                type="button"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
            Noch nichts auf der Liste. Fang mit den Dingen an, die du sonst
            garantiert erst am Flughafen vermisst.
          </p>
        )}
      </div>
    </section>
  );
}
