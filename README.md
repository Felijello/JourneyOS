# JourneyOS

JourneyOS ist ein persönliches Reise-Betriebssystem. Die App hilft dabei,
besuchte Länder, Wunschziele, Orte, Fotos, Trips, Tagespläne, Links, Budgets,
Packlisten, Wetterchecks und spätere AI-Reiseideen an einem Ort zu sammeln.

Die UI ist Deutsch. Code, Dateinamen, Variablen und Datenbankfelder sind Englisch.

## Features in V1

- Helles, responsives JourneyOS Dashboard mit Desktop-Sidebar und Mobile Bottom Navigation
- Statistik-Karten für besuchte, geplante, Wishlist- und gespeicherte Länder
- Länder anlegen, bearbeiten, löschen, suchen, filtern und sortieren
- Status: Besucht, Geplant, Will ich unbedingt hin, Vielleicht irgendwann, Kein Interesse
- Sichtbarkeit: private, family, public als Datenmodell-Vorbereitung
- Länder-Detailseiten mit Notizen, Bewertung, Reisezeit, Karte, Wetter, Orten, Fotos, Links und AI-Panel
- Orte innerhalb von Ländern anlegen, bearbeiten und löschen
- Trips anlegen, bearbeiten und löschen
- Trip-Detailseiten mit Tagesplanung, Tagespunkten, Packliste, Links, Fotos, Wetter und Routing-Hinweis
- Weltkarte und Detailkarten mit Leaflet-Markern
- Open-Meteo Wettercheck ohne API-Key
- Supabase Auth/Database/Storage vorbereitet
- Lokaler Demo-Modus mit `localStorage`, falls Supabase noch nicht bereit ist
- Gemini AI und OpenRouteService vorbereitet, ohne Pflicht für API-Keys

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase für Auth, Postgres und Storage
- Leaflet / React-Leaflet für Karten
- Open-Meteo für Wetter
- OpenRouteService vorbereitet für Routing
- Gemini API vorbereitet für AI-Texte
- Vercel-ready

## Lokal starten

```bash
npm install
npm run dev
```

Dann `http://localhost:3000` öffnen.

Für Checks:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Environment Variables

Kopiere `.env.example` nach `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_OPENROUTESERVICE_API_KEY=
NEXT_PUBLIC_MAPTILER_KEY=
GEMINI_API_KEY=
```

Pflicht für Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional:

- `NEXT_PUBLIC_OPENROUTESERVICE_API_KEY`: aktiviert spätere Routenberechnung
- `NEXT_PUBLIC_MAPTILER_KEY`: nutzt MapTiler statt OpenStreetMap-Fallback
- `GEMINI_API_KEY`: serverseitig, aktiviert AI-Generierung über `/api/ai/generate`

Ohne optionale Keys läuft JourneyOS weiter und zeigt Setup-Hinweise.

## Supabase Setup

1. Supabase-Projekt öffnen.
2. SQL Editor öffnen.
3. `supabase/schema.sql` ausführen.
4. Authentication -> Providers -> Email aktivieren.
5. Site URL und Redirect URLs für lokal und Vercel setzen.
6. `.env.local` mit Supabase URL und Anon Key füllen.
7. App neu starten.

Das Schema erstellt:

- `profiles`
- `countries`
- `places`
- `trips`
- `trip_days`
- `trip_day_items`
- `photos`
- `routes`
- `saved_links`
- `packing_items`
- `ai_generations`

RLS ist aktiviert. Nutzer können eigene Daten verwalten. Öffentliche Zeilen sind
für spätere Sharing-Features lesbar vorbereitet. `family` ist bewusst noch nicht
freigeschaltet; dafür braucht V2 eine Membership-/Einladungs-Tabelle.

## Storage Bucket

`supabase/schema.sql` erstellt den privaten Bucket `travel-photos` mit:

- maximal 6 MB
- erlaubten MIME Types: JPEG, PNG, WEBP, GIF
- Storage Policies pro User-Ordner

Uploads werden unter `userId/...` gespeichert. Die App nutzt Signed URLs für die
Anzeige, damit private Fotos nicht als öffentlicher Bucket behandelt werden.

## Seed Data

`supabase/seed.sql` enthält Beispiel-Länder. Nur in einer Entwicklungsumgebung
ausführen, während ein User angemeldet ist, weil RLS `auth.uid()` verwendet.

## Vercel Deployment

1. GitHub-Repository mit Vercel verbinden.
2. Environment Variables in Vercel setzen:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - optional `NEXT_PUBLIC_OPENROUTESERVICE_API_KEY`
   - optional `NEXT_PUBLIC_MAPTILER_KEY`
   - optional `GEMINI_API_KEY`
3. Deploy auslösen.
4. In Supabase die Vercel-Domain als Redirect URL eintragen.
5. `supabase/schema.sql` im Supabase SQL Editor ausführen.

## GitHub

Das Projekt ist für das Repository `Felijello/JourneyOS` vorbereitet. `.env.local`,
`.vercel`, `.next`, `node_modules` und Build-Artefakte werden nicht committed.

## Manual Test Checklist

- Dashboard auf Desktop und iPhone-Breite öffnen
- Bottom Navigation auf Mobile testen
- Land anlegen, bearbeiten und löschen
- Länder suchen, nach Status/Kontinent filtern und sortieren
- Country Detail öffnen, Ort hinzufügen, Ort löschen
- Foto-Upload mit Supabase-Login und Bucket testen
- Trip anlegen, bearbeiten und löschen
- Trip-Tag hinzufügen, Tagespunkt hinzufügen und löschen
- Packlistenpunkt hinzufügen, abhaken und löschen
- Saved Link mit Booking/GetYourGuide URL speichern
- Karte mit und ohne MapTiler-Key prüfen
- Wetterpanel bei Ländern mit Koordinaten prüfen
- AI-Buttons ohne Gemini-Key und mit Gemini-Key testen
- Vercel Deployment öffnen und Supabase Redirect URL prüfen

## Roadmap

- Öffentliche/private Profile und Familienfreigaben
- Länder-Polygone statt nur Marker
- Place Detail Pages mit Galerien und Bewertungen
- Routenberechnung mit OpenRouteService und GeoJSON-Anzeige
- Historische Klima-/Beste-Reisezeit-Auswertung
- Budgetauswertung und Hotelverwaltung
- EXIF/GPS-Auswertung für Fotos
- AI-Länderbeschreibungen, Place-Texte, Trip-Pläne, Zielvergleiche,
  Reisezeit-Checks, Routenoptimierung und Zielvorschläge

Die spätere AI soll locker, persönlich und hilfreich auf Deutsch schreiben, wie
ein Travel Buddy statt ein Reisebüro.
