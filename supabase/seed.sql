insert into public.countries (
  name,
  continent,
  status,
  personal_rating,
  short_note,
  long_note,
  best_travel_months,
  visibility,
  latitude,
  longitude
) values
(
  'Japan',
  'Asia',
  'must_visit',
  10,
  'Tokyo, Onsen, Züge, Essen, alles klingt nach Volltreffer.',
  'Japan ist für eine spätere Reiseplanung perfekt: starke Städte, ruhige Natur, klare Routen und sehr viel Kultur.',
  'März bis Mai oder Oktober bis November',
  'private',
  36.2048,
  138.2529
),
(
  'Island',
  'Europe',
  'planned',
  9,
  'Roadtrip, Wasserfälle und Landschaften wie aus einer anderen Welt.',
  'Island ist als kompakter Roadtrip stark. Für V2 wären Route, Wettercheck, Budget und Packliste besonders sinnvoll.',
  'Juni bis September',
  'family',
  64.9631,
  -19.0208
);
