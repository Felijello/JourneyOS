# JourneyOS

JourneyOS ist ein persönliches Reise-Betriebssystem für Länder, Orte, Fotos,
Reisen, Tagespläne, Links, Budgets, Packlisten, Wetterchecks, Routing und
AI-Reiseideen. Zusätzlich ist JourneyOS eine private-first Reise-Community mit
Profilen, Follows, öffentlichen Reisetagebüchern, Likes und Reisegalerien.

## Community-Funktionen

- Eindeutige, suchbare Usernames und verpflichtendes Profil-Onboarding
- Profilbild, Bio, Anzeigename, Heimatort und Lieblingsreiseziele
- Öffentliche oder private Profile
- Folgen, Follower- und Gefolgt-Listen
- Öffentliche Reisen mit Beschreibung, Highlights und Erstellerprofil
- Reise-Likes
- Sichere Reisegalerie mit maximal 12 Fotos
- Strukturierte Länder- und Reisezielsuche mit Open-Meteo
- Mehrländer-Reisen und automatische Besuchserkennung
- Cover-Upload mit Fokuspunkt, Zoom und sicherem Storage-Pfad
- Private Planungsdaten bleiben getrennt von veröffentlichten Reisedaten

## JourneyOS UX V2

- Mobile Reisenerstellung in fünf klaren Schritten
- Automatisch gespeicherte und wiederherstellbare Reiseentwürfe
- Bewusste Sichtbarkeitswahl; nur abgeschlossene Reisen können öffentlich sein
- Reisedetail mit URL-basierten Bereichen für Übersicht, Tagesplan, Fotos und Packliste
- Persönliches Dashboard mit nächster Reise, Countdown und offenen Punkten
- Komprimierte Reisefotos, Coverauswahl und barrierearme Vollbildgalerie
- Länderhistorie mit Reisezeitstrahl, Aufenthaltsdauer und Herkunft des Besuchsstatus
- Echte In-App-Benachrichtigungen für Follows und Likes
- Datenexport und sichere Account-Löschung in den Einstellungen
- Serverseitig abgesicherte AI- und Routing-Endpunkte

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
npm test
npm run test:e2e
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
RESEND_API_KEY=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
```

Sicherheit:

- `GEMINI_API_KEY` ist nur serverseitig.
- `RESEND_API_KEY` ist nur serverseitig. Für Supabase-Auth-Mails muss Resend zusätzlich unter Authentication > Emails > SMTP Settings verbunden werden.
- `OPENROUTESERVICE_API_KEY` läuft über `/api/routing/directions`.
- Supabase URL/Anon Key und MapTiler Key dürfen clientseitig genutzt werden.
- `.env.local`, `.env`, `.vercel`, `.next` und `node_modules` werden nicht committed.

## Supabase Setup

1. Supabase-Projekt öffnen.
2. SQL Editor öffnen.
3. Bei einem neuen Projekt zuerst `supabase/schema.sql` ausführen.
4. Danach alle Dateien in `supabase/migrations` in zeitlicher Reihenfolge ausführen.
   Die Migrationen `social_platform` und `harden_social_rls` ergänzen Profile,
   Follows, Likes, Community-Reisen, Einstellungen und die sichere Reisegalerie.
   `improve_travel_system` ergänzt strukturierte Ziele, Mehrländer-Reisen,
   Cover-Fokus sowie die abgesicherte Besuchs- und Veröffentlichungslogik.
   `ux_v2_foundations` ergänzt Entwürfe, reisebezogene Orte,
   Benachrichtigungen, Galerie-Cover, sichere Benachrichtigungstrigger und
   die serverseitige Account-Löschung.
5. Authentication -> Providers -> Email und Passwort aktivieren.
6. Authentication -> URL Configuration setzen:
     - Site URL: `https://journey-os-wine.vercel.app`
     - Redirect URL: `https://journey-os-wine.vercel.app/**`
7. Redirect URLs setzen:
   - `https://journey-os-wine.vercel.app/auth/callback`
   - `https://journey-os-wine.vercel.app/reset-password`
   - `http://localhost:3000/auth/callback` optional für lokale Entwicklung
   - `http://localhost:3000/reset-password` optional für lokale Entwicklung
8. `.env.local` mit Supabase URL und Anon/Publishable Key füllen.
9. App neu starten und unter `/login` anmelden oder registrieren.

### Google Login

1. In Google Cloud einen OAuth-Client vom Typ `Web application` erstellen.
2. Als autorisierte Redirect-URI eintragen:
   - `https://cfuxasczjyvktqkaqixz.supabase.co/auth/v1/callback`
3. In Supabase unter Authentication -> Sign In / Providers -> Google den
   Client ID und das Client Secret eintragen und den Provider aktivieren.
4. Einen neuen Inkognito-Tab öffnen und `Mit Google fortfahren` testen.

Google Client ID und Client Secret gehören ausschließlich in die
Supabase-Provider-Einstellungen. Dafür sind keine zusätzlichen JourneyOS- oder
Vercel-Umgebungsvariablen erforderlich.

Unter Authentication -> Emails müssen die Buttons der Templates "Confirm signup"
und "Reset password" auf `{{ .ConfirmationURL }}` zeigen. Ein direkter Link auf
`{{ .SiteURL }}` bestätigt zwar den Token, ignoriert aber den gewünschten Callback.

Das Schema erstellt:

- `profiles`
- `countries`
- `places`
- `trips`
- `trip_countries`
- `trip_days`
- `trip_day_items`
- `photos`
- `routes`
- `saved_links`
- `packing_items`
- `ai_generations`
- `user_settings`
- `follows`
- `trip_publications`
- `trip_likes`
- `travel_photos`

RLS ist aktiv. Eigene Daten sind nur für den Besitzer verwaltbar. Öffentliche
Einträge sind für spätere Sharing-Features lesbar vorbereitet. `family` ist als
Feld vorbereitet, aber ohne Membership-Tabelle noch nicht fremdlesbar.

## Supabase Storage

JourneyOS verwendet zwei private Buckets:

- `travel-photos` für Länder-, Orts-, Reise- und Coverfotos
- `profile-images` für Profilbilder

Die Schema- und Social-Migrationen konfigurieren:

- 8 MB Bucket-Limit; die Galerie begrenzt einzelne Fotos zusätzlich auf 6 MB
- JPEG, PNG und WebP
- Upload/Read/Update/Delete nur im eigenen User-Ordner
- Upload-Pfade: `userId/entityId/file`
- Öffentliche Reisefotos und Cover sind ausschließlich lesbar, wenn eine sichere
  `trip_publications`-Zeile existiert
- Profilbilder anderer Nutzer sind nur bei öffentlichen Profilen lesbar

Wenn Uploads fehlschlagen:

1. Prüfe, ob `supabase/schema.sql` vollständig ausgeführt wurde.
2. Prüfe, ob du angemeldet bist.
3. Prüfe in Supabase Storage, ob `travel-photos` existiert.
4. Prüfe die Policies auf `storage.objects`.

## API Integrationen Testen

Supabase:

- Einstellungen öffnen
- Magic Link Login ausführen
- Google Login ausführen
- Land, Ort oder Reise anlegen
- Seite neu laden und prüfen, ob Daten bleiben
- Profil-Onboarding abschließen
- Username-Suche unter `/discover` testen
- Folgen und Entfolgen testen
- Abgeschlossene Reise privat anlegen, veröffentlichen und wieder privat stellen
- Prüfen, dass geplante Reisen nicht veröffentlicht werden können
- `Jap` in der Ländersuche eingeben und Japan auswählen
- `New York` in der Zielsuche auswählen und die automatische Länderübernahme prüfen
- Like setzen und wieder entfernen

Storage:

- Angemeldet sein
- Länder- oder Reisedetail öffnen
- Foto unter 6 MB hochladen
- Sichtbarkeit wählen
- Profilbild unter Einstellungen hochladen
- Cover hochladen, verschieben, zoomen, ersetzen und entfernen
- Bis zu 12 Reisefotos hochladen
- Reisefoto löschen und austauschen

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
- Google Login meldet Provider-Fehler: Google unter Authentication -> Sign In / Providers aktivieren und die Supabase Callback-URL im Google OAuth-Client freigeben.
- Registrierungsmail fehlt: Spam prüfen, im Login `Bestätigung erneut senden` nutzen und unter Supabase Authentication -> Logs nachsehen. Bei bestehenden Konten stattdessen `Passwort vergessen?` verwenden.
- Für zuverlässige Produktionsmails unter Authentication -> SMTP Settings einen eigenen Mail-Anbieter konfigurieren.

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
- Profil bearbeiten und Benachrichtigungen unter `/settings` prüfen
- Google Login und Rückleitung zum Dashboard testen
- Community-Suche und Profilseiten testen
- Follower-/Following-Listen testen
- Öffentlichen Trip und Likes testen
- Prüfen, dass private Reisen nicht in der Community erscheinen

## Roadmap

- Echte Familienfreigaben über Memberships
- Länder-Polygone und farbige Flächen
- Place Detail Pages
- Bessere Routenplanung pro Trip-Day
- Historische Klima-/Beste-Reisezeit-Auswertung
- EXIF/GPS-Auswertung für Fotos
- AI-Routenoptimierung und Zielvorschläge
