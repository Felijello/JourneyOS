"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CalendarDays, Pencil, Trash2 } from "lucide-react";
import { CountryForm } from "@/components/countries/CountryForm";
import { WorldMap } from "@/components/map/WorldMap";
import { useCountries } from "@/components/providers/CountryProvider";
import { StatusBadge, VisibilityBadge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { continentLabels } from "@/lib/country-options";
import { formatDate } from "@/lib/utils";
import type { CountryFormInput } from "@/types/country";

export function CountryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { countries, updateCountry, deleteCountry, isLoading } = useCountries();
  const [isEditing, setIsEditing] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const country = useMemo(
    () => countries.find((item) => item.id === params.id),
    [countries, params.id],
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-48 animate-pulse rounded-xl bg-zinc-200 dark:bg-white/10" />
        <div className="h-96 animate-pulse rounded-xl bg-zinc-200 dark:bg-white/10" />
      </div>
    );
  }

  if (!country) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
        <h1 className="text-2xl font-semibold text-graphite-950 dark:text-white">
          Land nicht gefunden
        </h1>
        <p className="mt-2 text-sm text-graphite-600 dark:text-zinc-300">
          Vielleicht wurde es gelöscht oder existiert nur in einem anderen Datenmodus.
        </p>
        <LinkButton className="mt-6" href="/countries">
          Zurück zur Liste
        </LinkButton>
      </section>
    );
  }

  async function handleDelete() {
    if (!country) {
      return;
    }

    const confirmed = window.confirm(`${country.name} wirklich löschen?`);
    if (!confirmed) {
      return;
    }

    setDeleteError(null);
    try {
      await deleteCountry(country.id);
      router.push("/countries");
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Das Land konnte nicht gelöscht werden.",
      );
    }
  }

  async function handleUpdate(input: CountryFormInput) {
    if (!country) {
      throw new Error("Land wurde nicht gefunden.");
    }

    const updatedCountry = await updateCountry(country.id, input);
    setIsEditing(false);
    return updatedCountry;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={country.status} />
              <VisibilityBadge visibility={country.visibility} />
            </div>
            <p className="mt-5 text-sm font-medium text-graphite-500 dark:text-zinc-400">
              {continentLabels[country.continent]}
            </p>
            <h1 className="mt-1 text-4xl font-semibold tracking-tight text-graphite-950 dark:text-white sm:text-5xl">
              {country.name}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-graphite-600 dark:text-zinc-300">
              {country.shortNote || "Noch keine kurze Notiz gespeichert."}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Button onClick={() => setIsEditing((value) => !value)} variant="secondary">
              <Pencil aria-hidden="true" size={17} />
              {isEditing ? "Bearbeiten schließen" : "Bearbeiten"}
            </Button>
            <Button onClick={handleDelete} variant="danger">
              <Trash2 aria-hidden="true" size={17} />
              Löschen
            </Button>
          </div>
        </div>

        {deleteError ? (
          <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100 dark:bg-red-400/10 dark:text-red-200 dark:ring-red-400/20">
            {deleteError}
          </p>
        ) : null}

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-white/5">
            <p className="text-sm text-graphite-500 dark:text-zinc-400">Bewertung</p>
            <p className="mt-2 text-2xl font-semibold">{country.personalRating}/10</p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-white/5">
            <p className="text-sm text-graphite-500 dark:text-zinc-400">
              Beste Reisemonate
            </p>
            <p className="mt-2 text-base font-semibold">
              {country.bestTravelMonths || "Noch offen"}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-white/5">
            <p className="text-sm text-graphite-500 dark:text-zinc-400">
              Aktualisiert
            </p>
            <p className="mt-2 flex items-center gap-2 text-base font-semibold">
              <CalendarDays aria-hidden="true" size={17} />
              {formatDate(country.updatedAt)}
            </p>
          </div>
        </div>
      </section>

      {isEditing ? (
        <CountryForm
          country={country}
          onSubmit={handleUpdate}
          submitLabel="Änderungen speichern"
        />
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h2 className="text-2xl font-semibold text-graphite-950 dark:text-white">
            Persönliche Notiz
          </h2>
          <p className="mt-4 whitespace-pre-line text-base leading-8 text-graphite-700 dark:text-zinc-300">
            {country.longNote ||
              "Noch keine längere Beschreibung. Schreib später auf, warum dieses Land auf deiner Liste steht oder was du dort erlebt hast."}
          </p>
        </article>
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-graphite-950 dark:text-white">
            Kartenposition
          </h2>
          <WorldMap countries={[country]} />
        </section>
      </section>
    </div>
  );
}
