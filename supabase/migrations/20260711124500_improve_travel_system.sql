-- Structured destinations, multi-country journeys, secure covers and visit derivation.

alter table public.trips
  add column if not exists destination_city text,
  add column if not exists destination_region text,
  add column if not exists destination_country_name text,
  add column if not exists destination_country_code text,
  add column if not exists destination_latitude numeric,
  add column if not exists destination_longitude numeric,
  add column if not exists destination_external_id text,
  add column if not exists cover_storage_path text,
  add column if not exists cover_position_x numeric not null default 50,
  add column if not exists cover_position_y numeric not null default 50,
  add column if not exists cover_zoom numeric not null default 1;

alter table public.trip_publications
  add column if not exists destination_city text,
  add column if not exists destination_region text,
  add column if not exists destination_country_name text,
  add column if not exists destination_country_code text,
  add column if not exists destination_latitude numeric,
  add column if not exists destination_longitude numeric,
  add column if not exists cover_storage_path text,
  add column if not exists cover_position_x numeric not null default 50,
  add column if not exists cover_position_y numeric not null default 50,
  add column if not exists cover_zoom numeric not null default 1,
  add column if not exists countries jsonb not null default '[]'::jsonb;

alter table public.countries
  add column if not exists manual_status public.country_status,
  add column if not exists completed_trip_count integer not null default 0;

update public.countries
set country_code = upper(country_code)
where country_code is not null;

update public.countries
set manual_status = status
where manual_status is null;

alter table public.countries
  alter column manual_status set default 'planned'::public.country_status,
  alter column manual_status set not null;

update public.trips
set destination_country_code = upper(destination_country_code)
where destination_country_code is not null;

update public.trips
set visibility = 'private'
where visibility = 'public' and status <> 'completed';

alter table public.trips
  drop constraint if exists trips_public_only_when_completed,
  add constraint trips_public_only_when_completed
    check (visibility <> 'public' or status = 'completed'),
  drop constraint if exists trips_cover_position_x_valid,
  add constraint trips_cover_position_x_valid check (cover_position_x between 0 and 100),
  drop constraint if exists trips_cover_position_y_valid,
  add constraint trips_cover_position_y_valid check (cover_position_y between 0 and 100),
  drop constraint if exists trips_cover_zoom_valid,
  add constraint trips_cover_zoom_valid check (cover_zoom between 1 and 3);

alter table public.trip_publications
  drop constraint if exists trip_publications_cover_position_x_valid,
  add constraint trip_publications_cover_position_x_valid check (cover_position_x between 0 and 100),
  drop constraint if exists trip_publications_cover_position_y_valid,
  add constraint trip_publications_cover_position_y_valid check (cover_position_y between 0 and 100),
  drop constraint if exists trip_publications_cover_zoom_valid,
  add constraint trip_publications_cover_zoom_valid check (cover_zoom between 1 and 3);

create unique index if not exists countries_user_country_code_unique
  on public.countries(user_id, country_code)
  where country_code is not null;

create table if not exists public.trip_countries (
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  country_id uuid references public.countries(id) on delete set null,
  country_code text not null,
  country_name text not null,
  continent text not null,
  latitude numeric,
  longitude numeric,
  source text not null default 'destination',
  created_at timestamptz not null default now(),
  primary key (trip_id, country_code),
  constraint trip_countries_code_valid check (country_code ~ '^[A-Z]{2}$'),
  constraint trip_countries_source_valid check (source in ('destination', 'manual', 'legacy'))
);

create index if not exists trip_countries_user_code_idx
  on public.trip_countries(user_id, country_code);

insert into public.trip_countries (
  trip_id, user_id, country_id, country_code, country_name, continent,
  latitude, longitude, source
)
select
  t.id, t.user_id, c.id, upper(c.country_code), c.name, c.continent,
  c.latitude, c.longitude, 'legacy'
from public.trips t
join public.countries c on c.id = t.country_id
where c.country_code is not null
on conflict (trip_id, country_code) do nothing;

alter table public.trip_countries enable row level security;

drop policy if exists "Trip countries are readable by owner" on public.trip_countries;
create policy "Trip countries are readable by owner"
on public.trip_countries for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Trip countries are insertable by owner" on public.trip_countries;
create policy "Trip countries are insertable by owner"
on public.trip_countries for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.trips t
    where t.id = trip_id and t.user_id = (select auth.uid())
  )
);

drop policy if exists "Trip countries are updatable by owner" on public.trip_countries;
create policy "Trip countries are updatable by owner"
on public.trip_countries for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.trips t
    where t.id = trip_id and t.user_id = (select auth.uid())
  )
);

drop policy if exists "Trip countries are deletable by owner" on public.trip_countries;
create policy "Trip countries are deletable by owner"
on public.trip_countries for delete to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.trip_countries from anon, authenticated;
grant select, insert, update, delete on public.trip_countries to authenticated;

create or replace function public.refresh_country_visit(
  target_user_id uuid,
  target_country_code text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  completed_count integer;
  association_count integer;
  selected_name text;
  selected_continent text;
  selected_latitude numeric;
  selected_longitude numeric;
  selected_country_id uuid;
begin
  select
    count(*) filter (where t.status = 'completed')::integer,
    count(*)::integer,
    max(tc.country_name),
    max(tc.continent),
    max(tc.latitude),
    max(tc.longitude)
  into
    completed_count,
    association_count,
    selected_name,
    selected_continent,
    selected_latitude,
    selected_longitude
  from public.trip_countries tc
  join public.trips t on t.id = tc.trip_id and t.user_id = tc.user_id
  where tc.user_id = target_user_id
    and tc.country_code = upper(target_country_code);

  if association_count > 0 then
    insert into public.countries (
      user_id, name, country_code, continent, status, manual_status,
      completed_trip_count, rating, visibility, latitude, longitude
    ) values (
      target_user_id,
      selected_name,
      upper(target_country_code),
      selected_continent,
      case when completed_count > 0
        then 'visited'::public.country_status
        else 'planned'::public.country_status
      end,
      'planned'::public.country_status,
      completed_count,
      7,
      'private',
      selected_latitude,
      selected_longitude
    )
    on conflict (user_id, country_code) where country_code is not null
    do update set
      name = excluded.name,
      continent = excluded.continent,
      latitude = coalesce(public.countries.latitude, excluded.latitude),
      longitude = coalesce(public.countries.longitude, excluded.longitude),
      completed_trip_count = excluded.completed_trip_count,
      status = case
        when public.countries.manual_status = 'visited' or excluded.completed_trip_count > 0
          then 'visited'::public.country_status
        else public.countries.manual_status
      end,
      updated_at = now()
    returning id into selected_country_id;

    update public.trip_countries
    set country_id = selected_country_id
    where user_id = target_user_id
      and country_code = upper(target_country_code)
      and country_id is distinct from selected_country_id;
  else
    update public.countries
    set
      completed_trip_count = 0,
      status = manual_status,
      updated_at = now()
    where user_id = target_user_id
      and country_code = upper(target_country_code);
  end if;
end;
$$;

revoke execute on function public.refresh_country_visit(uuid, text)
from public, anon, authenticated;

create or replace function public.refresh_trip_publication(target_trip_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_trip public.trips%rowtype;
  selected_countries jsonb;
begin
  select * into selected_trip
  from public.trips
  where id = target_trip_id;

  if not found then
    delete from public.trip_publications where trip_id = target_trip_id;
    return;
  end if;

  if selected_trip.visibility = 'public' and selected_trip.status = 'completed' then
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'countryCode', tc.country_code,
          'countryName', tc.country_name,
          'continent', tc.continent,
          'latitude', tc.latitude,
          'longitude', tc.longitude
        ) order by tc.country_name
      ),
      '[]'::jsonb
    ) into selected_countries
    from public.trip_countries tc
    where tc.trip_id = target_trip_id;

    insert into public.trip_publications (
      trip_id, user_id, title, destination_name, destination_city,
      destination_region, destination_country_name, destination_country_code,
      destination_latitude, destination_longitude, start_date, end_date,
      description, highlights, cover_photo_url, cover_storage_path,
      cover_position_x, cover_position_y, cover_zoom, countries,
      created_at, updated_at
    ) values (
      selected_trip.id, selected_trip.user_id, selected_trip.title,
      selected_trip.destination_name, selected_trip.destination_city,
      selected_trip.destination_region, selected_trip.destination_country_name,
      selected_trip.destination_country_code, selected_trip.destination_latitude,
      selected_trip.destination_longitude, selected_trip.start_date,
      selected_trip.end_date, selected_trip.description, selected_trip.highlights,
      selected_trip.cover_photo_url, selected_trip.cover_storage_path,
      selected_trip.cover_position_x, selected_trip.cover_position_y,
      selected_trip.cover_zoom, selected_countries, selected_trip.created_at, now()
    )
    on conflict (trip_id) do update set
      user_id = excluded.user_id,
      title = excluded.title,
      destination_name = excluded.destination_name,
      destination_city = excluded.destination_city,
      destination_region = excluded.destination_region,
      destination_country_name = excluded.destination_country_name,
      destination_country_code = excluded.destination_country_code,
      destination_latitude = excluded.destination_latitude,
      destination_longitude = excluded.destination_longitude,
      start_date = excluded.start_date,
      end_date = excluded.end_date,
      description = excluded.description,
      highlights = excluded.highlights,
      cover_photo_url = excluded.cover_photo_url,
      cover_storage_path = excluded.cover_storage_path,
      cover_position_x = excluded.cover_position_x,
      cover_position_y = excluded.cover_position_y,
      cover_zoom = excluded.cover_zoom,
      countries = excluded.countries,
      updated_at = now();
  else
    delete from public.trip_publications where trip_id = target_trip_id;
  end if;
end;
$$;

revoke execute on function public.refresh_trip_publication(uuid)
from public, anon, authenticated;

create or replace function public.sync_trip_publication()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_trip_publication(new.id);
  return new;
end;
$$;

revoke execute on function public.sync_trip_publication()
from public, anon, authenticated;

drop trigger if exists sync_trip_publication_after_write on public.trips;
create trigger sync_trip_publication_after_write
after insert or update of visibility, status, title, destination_name,
  destination_city, destination_region, destination_country_name,
  destination_country_code, destination_latitude, destination_longitude,
  start_date, end_date, description, highlights, cover_photo_url,
  cover_storage_path, cover_position_x, cover_position_y, cover_zoom
on public.trips
for each row execute function public.sync_trip_publication();

create or replace function public.sync_trip_country_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.refresh_country_visit(old.user_id, old.country_code);
    perform public.refresh_trip_publication(old.trip_id);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    if tg_op = 'INSERT'
      or new.user_id is distinct from old.user_id
      or new.country_code is distinct from old.country_code then
      perform public.refresh_country_visit(new.user_id, new.country_code);
    end if;
    perform public.refresh_trip_publication(new.trip_id);
  end if;
  return coalesce(new, old);
end;
$$;

revoke execute on function public.sync_trip_country_change()
from public, anon, authenticated;

drop trigger if exists sync_trip_country_after_write on public.trip_countries;
create trigger sync_trip_country_after_write
after insert or update of user_id, country_code, country_name, continent,
  latitude, longitude or delete
on public.trip_countries
for each row execute function public.sync_trip_country_change();

create or replace function public.sync_trip_status_visits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_code text;
begin
  if new.status is distinct from old.status then
    for selected_code in
      select country_code from public.trip_countries where trip_id = new.id
    loop
      perform public.refresh_country_visit(new.user_id, selected_code);
    end loop;
  end if;
  return new;
end;
$$;

revoke execute on function public.sync_trip_status_visits()
from public, anon, authenticated;

drop trigger if exists sync_trip_status_visits_after_update on public.trips;
create trigger sync_trip_status_visits_after_update
after update of status on public.trips
for each row execute function public.sync_trip_status_visits();

do $$
declare
  selected_record record;
begin
  for selected_record in
    select distinct user_id, country_code from public.trip_countries
  loop
    perform public.refresh_country_visit(
      selected_record.user_id,
      selected_record.country_code
    );
  end loop;
end;
$$;

delete from public.trip_publications publication
where not exists (
  select 1 from public.trips trip
  where trip.id = publication.trip_id
    and trip.visibility = 'public'
    and trip.status = 'completed'
);

do $$
declare
  selected_trip_id uuid;
begin
  for selected_trip_id in
    select id from public.trips
    where visibility = 'public' and status = 'completed'
  loop
    perform public.refresh_trip_publication(selected_trip_id);
  end loop;
end;
$$;

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'travel-photos',
  'travel-photos',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Published trip photos are readable in community" on storage.objects;
create policy "Published trip photos are readable in community"
on storage.objects for select to authenticated
using (
  bucket_id = 'travel-photos'
  and (
    exists (
      select 1
      from public.travel_photos photo
      join public.trip_publications publication
        on publication.trip_id = photo.trip_id
      where photo.storage_path = name
    )
    or exists (
      select 1
      from public.trip_publications publication
      where publication.cover_storage_path = name
    )
  )
);
