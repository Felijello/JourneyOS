create extension if not exists "pgcrypto";

create type country_status as enum (
  'visited',
  'planned',
  'must_visit',
  'maybe',
  'no_interest'
);

create type country_visibility as enum (
  'private',
  'family',
  'public'
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  continent text not null check (
    continent in (
      'Africa',
      'Antarctica',
      'Asia',
      'Europe',
      'North America',
      'Oceania',
      'South America'
    )
  ),
  status country_status not null default 'visited',
  personal_rating integer not null default 7 check (personal_rating between 1 and 10),
  short_note text,
  long_note text,
  best_travel_months text,
  visibility country_visibility not null default 'private',
  latitude numeric,
  longitude numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists countries_user_id_idx on public.countries(user_id);
create index if not exists countries_status_idx on public.countries(status);
create index if not exists countries_visibility_idx on public.countries(visibility);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_countries_updated_at on public.countries;
create trigger set_countries_updated_at
before update on public.countries
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.countries enable row level security;

create policy "Profiles are readable by owner"
on public.profiles for select
using (auth.uid() = id);

create policy "Profiles are insertable by owner"
on public.profiles for insert
with check (auth.uid() = id);

create policy "Profiles are updatable by owner"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Countries are readable by owner"
on public.countries for select
using (auth.uid() = user_id);

create policy "Countries are insertable by owner"
on public.countries for insert
with check (auth.uid() = user_id);

create policy "Countries are updatable by owner"
on public.countries for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Countries are deletable by owner"
on public.countries for delete
using (auth.uid() = user_id);

-- Future schema ideas for V2+:
-- places: country_id, type, name, geo point, personal notes, rating, visibility.
-- trips: title, date range, visibility, rough budget, linked countries.
-- trip_days: trip_id, day_index, date, notes, weather snapshot.
-- photos: storage_path, country_id, place_id, trip_id, visibility, caption, taken_at.
-- routes: trip_id, origin_place_id, destination_place_id, transport_mode, geometry.
-- saved_links: country_id, place_id, trip_id, provider, url, notes.
-- packing_items: trip_id, name, category, packed boolean.
-- ai_generations: user_id, entity_type, entity_id, use_case, prompt, result, model, created_at.

