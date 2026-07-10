# JourneyOS

JourneyOS ist ein persönliches Reise-Betriebssystem für Länder, Orte, Fotos,
Trips, Tagespläne, Links, Budgets, Packlisten, Wetterchecks, Routing und
AI-Reiseideen.

Die UI ist Deutsch. Code, Dateien, Variablen und Datenbankfelder sind Englisch.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, Postgres und Storage
- Leaflet / React-Leaflet
- MapTiler mit OpenStreetMap-Fallback
- OpenRouteService über serverseitige API-Route
- Open-Meteo ohne API-Key
- Gemini über serverseitige API-Route
- Vercel-ready

## Lokal Starten

```bash
npm install
npm run dev
```

Dann `http://localhost:3000` öffnen.

Checks:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## .env.local

Kopiere `.env.example` nach `.env.local` und fülle lokal echte Werte ein:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=https://journey-os-wine.vercel.app
OPENROUTESERVICE_API_KEY=
NEXT_PUBLIC_MAPTILER_KEY=
GEMINI_API_KEY=
```

Sicherheit:

- `GEMINI_API_KEY` ist nur serverseitig.
- `OPENROUTESERVICE_API_KEY` läuft über `/api/routing/directions`.
- Supabase URL/Anon Key und MapTiler Key dürfen clientseitig genutzt werden.
- `.env.local`, `.env`, `.vercel`, `.next` und `node_modules` werden nicht committed.

## Supabase Setup

1. Supabase-Projekt öffnen.
2. SQL Editor öffnen.
3. Den kompletten Inhalt von `supabase/schema.sql` ausführen.
4. Danach `supabase/migrations/20260710_harden_auth_rls.sql` ausführen.
5. Authentication -> Providers -> Email und Passwort aktivieren.
6. Authentication -> URL Configuration setzen:
   - Site URL: `https://journey-os-wine.vercel.app`
   - Redirect URL: `https://journey-os-wine.vercel.app/auth/callback`
7. Redirect URLs setzen:
   - `https://journey-os-wine.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` optional für lokale Entwicklung
8. `.env.local` mit Supabase URL und Anon/Publishable Key füllen.
9. App neu starten und unter `/login` anmelden oder registrieren.

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

RLS ist aktiv. Eigene Daten sind nur für den Besitzer verwaltbar. Öffentliche
Einträge sind für spätere Sharing-Features lesbar vorbereitet. `family` ist als
Feld vorbereitet, aber ohne Membership-Tabelle noch nicht fremdlesbar.

## Supabase Storage

`supabase/schema.sql` erstellt den privaten Bucket `travel-photos` und Policies:

- 6 MB Limit
- JPEG, PNG, WEBP, GIF
- Upload/Read/Update/Delete nur im eigenen User-Ordner
- Upload-Pfade: `userId/entityId/file`

Wenn Uploads fehlschlagen:

1. Prüfe, ob `supabase/schema.sql` vollständig ausgeführt wurde.
2. Prüfe, ob du angemeldet bist.
3. Prüfe in Supabase Storage, ob `travel-photos` existiert.
4. Prüfe die Policies auf `storage.objects`.

## API Integrationen Testen

Supabase:

- Einstellungen öffnen
- Magic Link Login ausführen
- Land/Ort/Trip anlegen
- Seite neu laden und prüfen, ob Daten bleiben

Storage:

- Angemeldet sein
- Country oder Trip Detail öffnen
- Foto unter 6 MB hochladen
- Sichtbarkeit wählen

MapTiler:

- `/map` öffnen
- Wenn `NEXT_PUBLIC_MAPTILER_KEY` fehlt, nutzt JourneyOS OpenStreetMap.
- Domain-Beschränkung im MapTiler Dashboard setzen.

OpenRouteService:

- In einem Trip mindestens zwei Orte mit Koordinaten speichern
- Trip Detail öffnen
- Routing-Modus Auto oder Zu Fuß wählen
- Route erstellen
- Distanz/Dauer und Kartenlinie prüfen

Open-Meteo:

- Land/Trip mit Koordinaten öffnen
- Reisezeit-Check ansehen
- Nahe Reisedaten zeigen Forecast, ferne Daten zeigen einen vorsichtigen Hinweis.

Gemini:

- Country oder Trip Detail öffnen
- AI Travel Buddy Button nutzen
- Ausgabe sollte locker und hilfreich auf Deutsch sein
- Generierungen werden bei Supabase-Login in `ai_generations` gespeichert.

## Vercel Setup

In Vercel Project Settings -> Environment Variables setzen:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `OPENROUTESERVICE_API_KEY`
- `NEXT_PUBLIC_MAPTILER_KEY`
- `GEMINI_API_KEY`

Danach Production neu deployen.

## Troubleshooting

- `relation "countries" does not exist`: `supabase/schema.sql` im SQL Editor ausführen.
- Supabase REST/API gibt `401`: Supabase URL und Anon/Publishable Key im Project Settings -> API erneut prüfen und App neu starten/deployen.
- Upload sagt Bucket fehlt: Storage-Teil im Schema ausführen und angemeldet sein.
- Supabase bleibt Demo-Modus: Env Vars, Login und RLS/Schema prüfen.
- AI fehlt: `GEMINI_API_KEY` in Vercel/local setzen und neu deployen.
- AI gibt `502`: Gemini-Key ist vorhanden, aber Google lehnt die Anfrage ab. Prüfe, ob der Key ein gültiger Google AI Studio/Gemini API Key ist und die API im Projekt aktiv ist.
- Routing fehlt: `OPENROUTESERVICE_API_KEY` serverseitig setzen und neu deployen.
- Karte lädt ohne MapTiler: `NEXT_PUBLIC_MAPTILER_KEY` setzen oder OSM-Fallback nutzen.
- Auth Redirect klappt nicht: Supabase Redirect URL auf lokale und Vercel-Domain setzen.

## Manual Test Checklist

- Dashboard Desktop und Mobile prüfen
- Bottom Navigation auf iPhone-Breite testen
- Land anlegen, bearbeiten, löschen
- Land suchen, Status/Kontinent filtern, sortieren
- Ort mit Koordinaten hinzufügen
- Trip anlegen, bearbeiten, löschen
- Trip-Tag und Tagespunkt hinzufügen
- Packlistenpunkt hinzufügen, abhaken, löschen
- Saved Link speichern und öffnen
- Foto hochladen und Galerie prüfen
- Wetterpanel prüfen
- Route zwischen zwei Orten erstellen
- AI-Buttons testen
- `/settings` Integrationsstatus prüfen

## Roadmap

- Echte Familienfreigaben über Memberships
- Länder-Polygone und farbige Flächen
- Place Detail Pages
- Bessere Routenplanung pro Trip-Day
- Historische Klima-/Beste-Reisezeit-Auswertung
- EXIF/GPS-Auswertung für Fotos
- AI-Routenoptimierung und Zielvorschläge
