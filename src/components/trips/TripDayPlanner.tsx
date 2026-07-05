"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, Clock, Plus, Trash2 } from "lucide-react";
import { useTravel } from "@/components/providers/CountryProvider";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import type { Trip, TripDayItemType } from "@/types/country";

const itemTypes: Array<{ value: TripDayItemType; label: string }> = [
  { value: "activity", label: "Aktivität" },
  { value: "hotel", label: "Hotel" },
  { value: "transport", label: "Transport" },
  { value: "food", label: "Food" },
  { value: "route", label: "Route" },
  { value: "note", label: "Notiz" },
];

function dateForDay(startDate: string | null | undefined, dayNumber: number) {
  if (!startDate) return null;
  const date = new Date(`${startDate}T00:00:00`);
  date.setDate(date.getDate() + dayNumber - 1);
  return date.toISOString().slice(0, 10);
}

export function TripDayPlanner({ trip }: { trip: Trip }) {
  const {
    tripDays,
    tripDayItems,
    createTripDay,
    updateTripDay,
    createTripDayItem,
    deleteTripDayItem,
  } = useTravel();
  const [itemTitleByDay, setItemTitleByDay] = useState<Record<string, string>>({});
  const [itemTypeByDay, setItemTypeByDay] = useState<Record<string, TripDayItemType>>({});

  const days = useMemo(
    () =>
      tripDays
        .filter((day) => day.tripId === trip.id)
        .toSorted((a, b) => a.dayNumber - b.dayNumber),
    [tripDays, trip.id],
  );

  function handleAddDay() {
    const dayNumber = days.length + 1;
    createTripDay({
      tripId: trip.id,
      userId: null,
      dayNumber,
      date: dateForDay(trip.startDate, dayNumber),
      title: `Tag ${dayNumber}`,
      planText: "",
    });
  }

  function handleAddItem(dayId: string) {
    const title = itemTitleByDay[dayId]?.trim();
    if (!title) return;
    const existingCount = tripDayItems.filter((item) => item.tripDayId === dayId).length;
    createTripDayItem({
      userId: null,
      tripDayId: dayId,
      placeId: null,
      title,
      type: itemTypeByDay[dayId] ?? "activity",
      startTime: null,
      endTime: null,
      notes: "",
      sortOrder: existingCount + 1,
    });
    setItemTitleByDay((current) => ({ ...current, [dayId]: "" }));
  }

  return (
    <section className="journey-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Tagesplanung
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Reise Tag für Tag bauen
          </h2>
        </div>
        <Button className="rounded-2xl" onClick={handleAddDay} type="button" variant="secondary">
          <CalendarPlus size={16} />
          Tag hinzufügen
        </Button>
      </div>

      <div className="mt-5 space-y-4">
        {days.length ? (
          days.map((day) => {
            const items = tripDayItems
              .filter((item) => item.tripDayId === day.id)
              .toSorted((a, b) => a.sortOrder - b.sortOrder);

            return (
              <article
                className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                key={day.id}
              >
                <div className="grid gap-3 md:grid-cols-[110px_1fr]">
                  <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                    <p className="text-xs font-semibold uppercase">Tag {day.dayNumber}</p>
                    <p className="mt-1 text-sm font-semibold">
                      {day.date ? formatDate(day.date) : "Datum offen"}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <input
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      onChange={(event) =>
                        updateTripDay(day.id, { title: event.target.value })
                      }
                      value={day.title}
                    />
                    <textarea
                      className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      onChange={(event) =>
                        updateTripDay(day.id, { planText: event.target.value })
                      }
                      placeholder="Was soll an diesem Tag passieren?"
                      value={day.planText}
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {items.map((item) => (
                    <div
                      className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2"
                      key={item.id}
                    >
                      <Clock className="text-slate-400" size={16} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-400">
                          {itemTypes.find((type) => type.value === item.type)?.label}
                        </p>
                      </div>
                      <button
                        aria-label="Tagespunkt löschen"
                        className="rounded-full p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        onClick={() => deleteTripDayItem(item.id)}
                        type="button"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_140px_auto]">
                  <input
                    className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    onChange={(event) =>
                      setItemTitleByDay((current) => ({
                        ...current,
                        [day.id]: event.target.value,
                      }))
                    }
                    placeholder="Hotel, Aktivität, Restaurant..."
                    value={itemTitleByDay[day.id] ?? ""}
                  />
                  <select
                    className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    onChange={(event) =>
                      setItemTypeByDay((current) => ({
                        ...current,
                        [day.id]: event.target.value as TripDayItemType,
                      }))
                    }
                    value={itemTypeByDay[day.id] ?? "activity"}
                  >
                    {itemTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    className="h-11 rounded-2xl"
                    onClick={() => handleAddItem(day.id)}
                    type="button"
                  >
                    <Plus size={16} />
                    Punkt
                  </Button>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
            <p className="text-sm font-semibold text-slate-800">
              Noch keine Reisetage angelegt.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Erstelle den ersten Tag und sammle Hotels, Aktivitäten und grobe
              Routenpunkte.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
