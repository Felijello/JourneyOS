"use client";

import { Database, Lock, Sparkles } from "lucide-react";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { useCountries } from "@/components/providers/CountryProvider";

export function SettingsPage() {
  const { dataSource } = useCountries();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-graphite-950 dark:text-white sm:text-4xl">
          Einstellungen & Info
        </h1>
        <p className="mt-2 text-sm leading-6 text-graphite-600 dark:text-zinc-300">
          V1 ist bewusst schlank. Diese Seite zeigt, was aktiv ist und wo die
          nächsten Ausbaustufen vorbereitet sind.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
          <Database className="text-moss-600" aria-hidden="true" size={24} />
          <h2 className="mt-4 text-lg font-semibold">Datenquelle</h2>
          <p className="mt-2 text-sm leading-6 text-graphite-600 dark:text-zinc-300">
            {dataSource === "supabase"
              ? "Supabase ist konfiguriert und wird für Länder genutzt."
              : "Supabase ist noch nicht konfiguriert. JourneyOS nutzt lokale Browserdaten."}
          </p>
        </article>
        <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
          <Lock className="text-moss-600" aria-hidden="true" size={24} />
          <h2 className="mt-4 text-lg font-semibold">Privatsphäre</h2>
          <p className="mt-2 text-sm leading-6 text-graphite-600 dark:text-zinc-300">
            Länder besitzen bereits private, Familie- und öffentliche
            Sichtbarkeit für spätere Sharing-Funktionen.
          </p>
        </article>
        <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
          <Sparkles className="text-moss-600" aria-hidden="true" size={24} />
          <h2 className="mt-4 text-lg font-semibold">AI später</h2>
          <p className="mt-2 text-sm leading-6 text-graphite-600 dark:text-zinc-300">
            AI-Generierungen sind als Schema-Idee vorbereitet, aber V1 erzeugt
            noch keine Texte oder Pläne.
          </p>
        </article>
      </section>

      <AuthPanel />
    </div>
  );
}
