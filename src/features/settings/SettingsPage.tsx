"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  CloudSun,
  Database,
  Lock,
  Map,
  Route,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { useTravel } from "@/components/providers/CountryProvider";

const roadmap = [
  "Öffentliche Reiseprofile für Familie und Freunde",
  "Detailkarten mit Routen, Orten und farbigen Länderflächen",
  "KI-Reisepläne, Zielvergleiche und Reisezeit-Checks",
  "EXIF-Auswertung für Fotos und automatische Kartenmarker",
  "Budgetauswertung, Hotelverwaltung und bessere Packlisten",
];

export function SettingsPage() {
  const { dataSource, capabilityStatus } = useTravel();
  const [aiAvailable, setAiAvailable] = useState(false);

  useEffect(() => {
    fetch("/api/health")
      .then((response) => response.json())
      .then((data: { ai?: boolean }) => setAiAvailable(Boolean(data.ai)))
      .catch(() => setAiAvailable(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
          <ShieldCheck size={14} />
          JourneyOS System
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Einstellungen & Info
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Hier siehst du, welche Integrationen aktiv sind. Alles Optionale ist
          so gebaut, dass JourneyOS auch ohne API-Keys stabil im Demo-Modus läuft.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatusCard
          active={dataSource === "supabase"}
          description={
            dataSource === "supabase"
              ? "Supabase ist verbunden. Länder werden in der Datenbank gespeichert."
              : "Lokaler Demo-Modus aktiv. Daten liegen im Browser-Storage."
          }
          icon={<Database size={22} />}
          title="Supabase"
        />
        <StatusCard
          active
          description="Open-Meteo braucht keinen API-Key und liefert Wetterdaten für Koordinaten."
          icon={<CloudSun size={22} />}
          title="Wetter"
        />
        <StatusCard
          active={capabilityStatus.routing}
          description={
            capabilityStatus.routing
              ? "OpenRouteService-Key ist vorhanden."
              : "NEXT_PUBLIC_OPENROUTESERVICE_API_KEY fehlt. Routing bleibt vorbereitet."
          }
          icon={<Route size={22} />}
          title="Routing"
        />
        <StatusCard
          active={aiAvailable}
          description={
            aiAvailable
              ? "Gemini-Key ist serverseitig gesetzt. AI-Buttons können Antworten erzeugen."
              : "GEMINI_API_KEY fehlt. AI-Module zeigen vorbereitete Zustände."
          }
          icon={<Bot size={22} />}
          title="Gemini AI"
        />
        <StatusCard
          active={capabilityStatus.maptiler}
          description={
            capabilityStatus.maptiler
              ? "MapTiler-Key ist vorhanden."
              : "NEXT_PUBLIC_MAPTILER_KEY fehlt. OpenStreetMap wird als Fallback genutzt."
          }
          icon={<Map size={22} />}
          title="Map Provider"
        />
        <StatusCard
          active
          description="Sichtbarkeit private/family/public ist im Datenmodell vorbereitet."
          icon={<Lock size={22} />}
          title="Privatsphäre"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <article className="journey-card p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 text-blue-600" size={22} />
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Roadmap</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                V1 legt den Kern. Die nächsten Versionen können ohne Umbau auf
                Orte, Fotos, Routen, AI und Sharing aufbauen.
              </p>
            </div>
          </div>
          <ul className="mt-5 space-y-3">
            {roadmap.map((item) => (
              <li className="flex gap-3 text-sm text-slate-600" key={item}>
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="journey-card p-5">
          <h2 className="text-xl font-semibold text-slate-950">Privacy-Konzept</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Private Daten bleiben standardmäßig privat. Länder, Orte, Trips,
            Fotos und Links tragen bereits Sichtbarkeit. In Supabase schützen
            Row-Level-Security-Policies die eigenen Daten; öffentliches Teilen
            kann später gezielt auf `public` erweitert werden.
          </p>
          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            Familienfreigaben sind als Feld vorbereitet. Für eine echte
            Familiengruppe braucht V2 eine zusätzliche Tabelle für Beziehungen
            oder Einladungen.
          </div>
        </article>
      </section>

      <AuthPanel />
    </div>
  );
}

function StatusCard({
  active,
  description,
  icon,
  title,
}: {
  active: boolean;
  description: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <article className="journey-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={active ? "text-emerald-600" : "text-amber-600"}>{icon}</div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
            active
              ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
              : "bg-amber-50 text-amber-700 ring-amber-100"
          }`}
        >
          {active ? "Aktiv" : "Fehlt"}
        </span>
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}
