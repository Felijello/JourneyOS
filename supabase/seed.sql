-- Run this only while authenticated in a development project.
-- RLS uses auth.uid(), so the inserted rows belong to the current user.

insert into public.countries (
  name,
  country_code,
  continent,
  status,
  rating,
  short_note,
  long_note,
  best_travel_months,
  visibility,
  latitude,
  longitude,
  cover_photo_url
) values
(
  'Japan',
  'JP',
  'Asia',
  'must_visit',
  10,
  'Tokyo, Onsen, Züge, Essen, alles klingt nach Volltreffer.',
  'Japan ist für eine spätere Reiseplanung perfekt: starke Städte, ruhige Natur, klare Routen und sehr viel Kultur.',
  'März bis Mai oder Oktober bis November',
  'private',
  36.2048,
  138.2529,
  'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=900&q=80'
),
(
  'Island',
  'IS',
  'Europe',
  'planned',
  9,
  'Roadtrip, Wasserfälle und Landschaften wie aus einer anderen Welt.',
  'Island ist als kompakter Roadtrip stark. Für V2 wären Route, Wettercheck, Budget und Packliste besonders sinnvoll.',
  'Juni bis September',
  'family',
  64.9631,
  -19.0208,
  'https://images.unsplash.com/photo-1504829857797-ddff29c27927?auto=format&fit=crop&w=900&q=80'
);
