create extension if not exists "pgcrypto";

do $$
begin
  create type public.country_status as enum (
    'visited',
    'planned',
    'must_visit',
    'maybe',
    'no_interest'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.country_visibility as enum ('private', 'family', 'public');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.place_type as enum (
    'city',
    'beach',
    'hotel',
    'viewpoint',
    'restaurant',
    'activity',
    'museum',
    'nature',
    'airport',
    'other'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.trip_status as enum (
    'idea',
    'planned',
    'booked',
    'completed',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.trip_day_item_type as enum (
    'hotel',
    'activity',
    'transport',
    'food',
    'note',
    'route'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.ai_entity_type as enum ('country', 'place', 'trip');
exception when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  country_code text check (country_code is null or length(country_code) = 2),
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
  status public.country_status not null default 'visited',
  rating integer not null default 7 check (rating between 1 and 10),
  short_note text not null default '',
  long_note text not null default '',
  best_travel_months text not null default '',
  visibility public.country_visibility not null default 'private',
  latitude numeric,
  longitude numeric,
  cover_photo_url text,
  visited_from date,
  visited_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.countries add column if not exists country_code text;
alter table public.countries add column if not exists rating integer not null default 7;
alter table public.countries add column if not exists cover_photo_url text;
alter table public.countries add column if not exists visited_from date;
alter table public.countries add column if not exists visited_to date;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'countries'
      and column_name = 'personal_rating'
  ) then
    execute 'update public.countries set rating = personal_rating where rating is null or rating = 7';
  end if;
end $$;

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  country_id uuid not null references public.countries(id) on delete cascade,
  name text not null,
  type public.place_type not null default 'other',
  latitude numeric,
  longitude numeric,
  address text,
  rating integer not null default 7 check (rating between 1 and 10),
  short_note text not null default '',
  long_note text not null default '',
  visibility public.country_visibility not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  country_id uuid references public.countries(id) on delete set null,
  start_date date,
  end_date date,
  status public.trip_status not null default 'idea',
  budget_estimate numeric,
  currency text not null default 'EUR',
  travel_style text not null default '',
  visibility public.country_visibility not null default 'private',
  cover_photo_url text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trip_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  day_number integer not null check (day_number > 0),
  date date,
  title text not null default '',
  plan_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, day_number)
);

create table if not exists public.trip_day_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  trip_day_id uuid not null references public.trip_days(id) on delete cascade,
  place_id uuid references public.places(id) on delete set null,
  title text not null,
  type public.trip_day_item_type not null default 'activity',
  start_time time,
  end_time time,
  notes text not null default '',
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  country_id uuid references public.countries(id) on delete set null,
  place_id uuid references public.places(id) on delete set null,
  trip_id uuid references public.trips(id) on delete set null,
  storage_path text not null,
  public_url text,
  caption text not null default '',
  taken_at timestamptz,
  latitude numeric,
  longitude numeric,
  visibility public.country_visibility not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete cascade,
  name text not null,
  route_geojson jsonb,
  distance_km numeric,
  duration_minutes integer,
  provider text not null default 'openrouteservice',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  country_id uuid references public.countries(id) on delete set null,
  place_id uuid references public.places(id) on delete set null,
  trip_id uuid references public.trips(id) on delete set null,
  title text not null,
  url text not null,
  provider text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.packing_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null,
  category text not null default 'Allgemein',
  is_packed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entity_type public.ai_entity_type not null,
  entity_id uuid,
  prompt text not null,
  result text not null,
  provider text not null default 'gemini',
  created_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists countries_user_id_idx on public.countries(user_id);
create index if not exists countries_status_idx on public.countries(status);
create index if not exists countries_visibility_idx on public.countries(visibility);
create index if not exists countries_country_code_idx on public.countries(country_code);
create index if not exists places_user_id_idx on public.places(user_id);
create index if not exists places_country_id_idx on public.places(country_id);
create index if not exists trips_user_id_idx on public.trips(user_id);
create index if not exists trips_country_id_idx on public.trips(country_id);
create index if not exists trip_days_trip_id_idx on public.trip_days(trip_id);
create index if not exists trip_day_items_trip_day_id_idx on public.trip_day_items(trip_day_id);
create index if not exists photos_user_id_idx on public.photos(user_id);
create index if not exists photos_country_id_idx on public.photos(country_id);
create index if not exists photos_trip_id_idx on public.photos(trip_id);
create index if not exists routes_trip_id_idx on public.routes(trip_id);
create index if not exists saved_links_user_id_idx on public.saved_links(user_id);
create index if not exists packing_items_trip_id_idx on public.packing_items(trip_id);
create index if not exists ai_generations_user_id_idx on public.ai_generations(user_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_countries_updated_at on public.countries;
create trigger set_countries_updated_at
before update on public.countries
for each row execute function public.set_updated_at();

drop trigger if exists set_places_updated_at on public.places;
create trigger set_places_updated_at
before update on public.places
for each row execute function public.set_updated_at();

drop trigger if exists set_trips_updated_at on public.trips;
create trigger set_trips_updated_at
before update on public.trips
for each row execute function public.set_updated_at();

drop trigger if exists set_trip_days_updated_at on public.trip_days;
create trigger set_trip_days_updated_at
before update on public.trip_days
for each row execute function public.set_updated_at();

drop trigger if exists set_trip_day_items_updated_at on public.trip_day_items;
create trigger set_trip_day_items_updated_at
before update on public.trip_day_items
for each row execute function public.set_updated_at();

drop trigger if exists set_photos_updated_at on public.photos;
create trigger set_photos_updated_at
before update on public.photos
for each row execute function public.set_updated_at();

drop trigger if exists set_routes_updated_at on public.routes;
create trigger set_routes_updated_at
before update on public.routes
for each row execute function public.set_updated_at();

drop trigger if exists set_saved_links_updated_at on public.saved_links;
create trigger set_saved_links_updated_at
before update on public.saved_links
for each row execute function public.set_updated_at();

drop trigger if exists set_packing_items_updated_at on public.packing_items;
create trigger set_packing_items_updated_at
before update on public.packing_items
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.countries enable row level security;
alter table public.places enable row level security;
alter table public.trips enable row level security;
alter table public.trip_days enable row level security;
alter table public.trip_day_items enable row level security;
alter table public.photos enable row level security;
alter table public.routes enable row level security;
alter table public.saved_links enable row level security;
alter table public.packing_items enable row level security;
alter table public.ai_generations enable row level security;

drop policy if exists "Profiles are readable by owner" on public.profiles;
create policy "Profiles are readable by owner"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Countries are readable by owner or public" on public.countries;
create policy "Countries are readable by owner or public"
on public.countries for select
using (auth.uid() = user_id or visibility = 'public');

drop policy if exists "Countries are insertable by owner" on public.countries;
create policy "Countries are insertable by owner"
on public.countries for insert
with check (auth.uid() = user_id);

drop policy if exists "Countries are updatable by owner" on public.countries;
create policy "Countries are updatable by owner"
on public.countries for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Countries are deletable by owner" on public.countries;
create policy "Countries are deletable by owner"
on public.countries for delete
using (auth.uid() = user_id);

drop policy if exists "Places are readable by owner or public" on public.places;
create policy "Places are readable by owner or public"
on public.places for select
using (auth.uid() = user_id or visibility = 'public');

drop policy if exists "Places are manageable by owner" on public.places;
create policy "Places are manageable by owner"
on public.places for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Trips are readable by owner or public" on public.trips;
create policy "Trips are readable by owner or public"
on public.trips for select
using (auth.uid() = user_id or visibility = 'public');

drop policy if exists "Trips are manageable by owner" on public.trips;
create policy "Trips are manageable by owner"
on public.trips for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Trip days are readable by owner" on public.trip_days;
create policy "Trip days are readable by owner"
on public.trip_days for select
using (auth.uid() = user_id);

drop policy if exists "Trip days are manageable by owner" on public.trip_days;
create policy "Trip days are manageable by owner"
on public.trip_days for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Trip day items are readable by owner" on public.trip_day_items;
create policy "Trip day items are readable by owner"
on public.trip_day_items for select
using (auth.uid() = user_id);

drop policy if exists "Trip day items are manageable by owner" on public.trip_day_items;
create policy "Trip day items are manageable by owner"
on public.trip_day_items for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Photos are readable by owner or public" on public.photos;
create policy "Photos are readable by owner or public"
on public.photos for select
using (auth.uid() = user_id or visibility = 'public');

drop policy if exists "Photos are manageable by owner" on public.photos;
create policy "Photos are manageable by owner"
on public.photos for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Routes are readable by owner" on public.routes;
create policy "Routes are readable by owner"
on public.routes for select
using (auth.uid() = user_id);

drop policy if exists "Routes are manageable by owner" on public.routes;
create policy "Routes are manageable by owner"
on public.routes for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Saved links are readable by owner" on public.saved_links;
create policy "Saved links are readable by owner"
on public.saved_links for select
using (auth.uid() = user_id);

drop policy if exists "Saved links are manageable by owner" on public.saved_links;
create policy "Saved links are manageable by owner"
on public.saved_links for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Packing items are readable by owner" on public.packing_items;
create policy "Packing items are readable by owner"
on public.packing_items for select
using (auth.uid() = user_id);

drop policy if exists "Packing items are manageable by owner" on public.packing_items;
create policy "Packing items are manageable by owner"
on public.packing_items for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "AI generations are readable by owner" on public.ai_generations;
create policy "AI generations are readable by owner"
on public.ai_generations for select
using (auth.uid() = user_id);

drop policy if exists "AI generations are insertable by owner" on public.ai_generations;
create policy "AI generations are insertable by owner"
on public.ai_generations for insert
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'travel-photos',
  'travel-photos',
  false,
  6291456,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Travel photos are readable by owner folder" on storage.objects;
create policy "Travel photos are readable by owner folder"
on storage.objects for select
using (
  bucket_id = 'travel-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Travel photos are insertable by owner folder" on storage.objects;
create policy "Travel photos are insertable by owner folder"
on storage.objects for insert
with check (
  bucket_id = 'travel-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Travel photos are updatable by owner folder" on storage.objects;
create policy "Travel photos are updatable by owner folder"
on storage.objects for update
using (
  bucket_id = 'travel-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'travel-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Travel photos are deletable by owner folder" on storage.objects;
create policy "Travel photos are deletable by owner folder"
on storage.objects for delete
using (
  bucket_id = 'travel-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Family sharing is intentionally not fully open yet. Add a membership table
-- such as family_memberships(owner_id, member_id, role) before exposing
-- visibility = 'family' rows to other users.
