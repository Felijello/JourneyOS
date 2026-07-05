# JourneyOS

JourneyOS ist ein persönliches Reise-Betriebssystem. V1 verwaltet Länder mit Status, Bewertung, Notizen, bester Reisezeit, Sichtbarkeit, Dashboard-Statistiken und einer Kartenansicht.

Die UI ist Deutsch. Code, Dateinamen, Variablen und Datenbankfelder sind Englisch.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase für Auth, Datenbank und später Storage
- Leaflet / React-Leaflet für Karten
- Vercel-ready Projektstruktur

## Lokal starten

```bash
npm install
npm run dev
```

Dann `http://localhost:3000` öffnen.

Ohne Supabase-Variablen startet JourneyOS automatisch im lokalen Browsermodus mit Beispieldaten. Änderungen werden in `localStorage` gespeichert.

## Umgebungsvariablen

Kopiere `.env.example` nach `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Die Werte findest du in Supabase unter Project Settings -> API.

## Supabase einrichten

1. Neues Supabase-Projekt erstellen.
2. In Supabase den SQL Editor öffnen.
3. `supabase/schema.sql` ausführen.
4. Authentication -> Providers -> Email aktivieren.
5. Optional Magic Links aktivieren und die Site URL auf deine lokale oder Vercel-URL setzen.
6. `.env.local` mit URL und Anon Key füllen.
7. App neu starten.
8. In JourneyOS unter Einstellungen per Magic Link anmelden.

Optional: `supabase/seed.sql` enthält Beispieldaten. Führe es nur in einer Entwicklungsumgebung aus und beachte, dass RLS einen angemeldeten User erwartet.

## Datenmodell V1

Implementiert:

- `profiles`
- `countries`

`countries` enthält:

- `name`
- `continent`
- `status`
- `personal_rating`
- `short_note`
- `long_note`
- `best_travel_months`
- `visibility`
- `latitude`
- `longitude`
- `created_at`
- `updated_at`

Vorbereitet als Schema-Kommentare:

- `places`
- `trips`
- `trip_days`
- `photos`
- `routes`
- `saved_links`
- `packing_items`
- `ai_generations`

## V1 Features

- Dashboard mit Kennzahlen für besucht, geplant, Wishlist und total gespeichert
- Länderübersicht mit Suche, Statusfilter und Sortierung
- Land hinzufügen, bearbeiten und löschen
- Detailseite pro Land
- Status-Badges und Sichtbarkeitsfeld
- Leaflet-Weltkarte mit Markern, wenn Koordinaten vorhanden sind
- Mobile Bottom Navigation
- Desktop Sidebar
- Loading-, Error- und Empty-States
- Supabase Auth per Magic Link, wenn Credentials vorhanden sind
- Lokaler Fallback ohne Secrets

## Deployment

Vercel:

1. GitHub-Repository verbinden.
2. Environment Variables in Vercel setzen:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy auslösen.
4. In Supabase die Vercel-Domain als Site URL / Redirect URL ergänzen.

## Roadmap

V2+ kann auf der vorhandenen Struktur aufbauen:

- Foto-Uploads und Galerien über Supabase Storage
- Sichtbarkeit pro Trip und Foto
- Country Detail Pages mit Historie, Ratings und Orten
- Places wie Städte, Hotels, Viewpoints, Restaurants und Aktivitäten
- Kartenmarker und Detailkarten
- Route Planning
- Day-by-day Trip Planning
- Wetterchecks und beste Reisezeit
- Aktivitätsvorschläge und gespeicherte Links
- Hotel Saving, Budgets und Packlisten
- AI-generierte Country-, Place- und Trip-Beschreibungen
- AI-Vergleich von Destinationen
- AI-Check für Reisezeitpunkte
- AI-Routenoptimierung
- AI-Zielvorschläge nach persönlichen Wünschen

Die spätere AI soll locker und persönlich auf Deutsch schreiben, nicht wie ein Reisebüro. Erste Tone-Guides liegen in `src/lib/ai/travel-prompts.ts`.
