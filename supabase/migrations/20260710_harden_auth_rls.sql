-- JourneyOS auth/profile bootstrap and RLS hardening.
-- Non-destructive: no tables or user data are removed.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, email, display_name)
select id, email, coalesce(raw_user_meta_data ->> 'display_name', split_part(email, '@', 1))
from auth.users
on conflict (id) do update set email = excluded.email;

drop policy if exists "Countries are readable by owner or public" on public.countries;
create policy "Countries are readable by owner"
on public.countries for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Places are readable by owner or public" on public.places;
drop policy if exists "Places are manageable by owner" on public.places;
create policy "Places are readable by owner"
on public.places for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Places are insertable with owned country"
on public.places for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.countries c
    where c.id = country_id and c.user_id = (select auth.uid())
  )
);
create policy "Places are updatable with owned country"
on public.places for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.countries c
    where c.id = country_id and c.user_id = (select auth.uid())
  )
);
create policy "Places are deletable by owner"
on public.places for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Trips are readable by owner or public" on public.trips;
drop policy if exists "Trips are manageable by owner" on public.trips;
create policy "Trips are readable by owner"
on public.trips for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Trips are insertable by owner"
on public.trips for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and (
    country_id is null or exists (
      select 1 from public.countries c
      where c.id = country_id and c.user_id = (select auth.uid())
    )
  )
);
create policy "Trips are updatable by owner"
on public.trips for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and (
    country_id is null or exists (
      select 1 from public.countries c
      where c.id = country_id and c.user_id = (select auth.uid())
    )
  )
);
create policy "Trips are deletable by owner"
on public.trips for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Trip days are readable by owner" on public.trip_days;
drop policy if exists "Trip days are manageable by owner" on public.trip_days;
create policy "Trip days are readable by owner"
on public.trip_days for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Trip days are insertable with owned trip"
on public.trip_days for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.trips t
    where t.id = trip_id and t.user_id = (select auth.uid())
  )
);
create policy "Trip days are updatable with owned trip"
on public.trip_days for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.trips t
    where t.id = trip_id and t.user_id = (select auth.uid())
  )
);
create policy "Trip days are deletable by owner"
on public.trip_days for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Trip day items are readable by owner" on public.trip_day_items;
drop policy if exists "Trip day items are manageable by owner" on public.trip_day_items;
create policy "Trip day items are readable by owner"
on public.trip_day_items for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Trip day items are insertable with owned day"
on public.trip_day_items for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.trip_days d
    where d.id = trip_day_id and d.user_id = (select auth.uid())
  )
);
create policy "Trip day items are updatable with owned day"
on public.trip_day_items for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.trip_days d
    where d.id = trip_day_id and d.user_id = (select auth.uid())
  )
);
create policy "Trip day items are deletable by owner"
on public.trip_day_items for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Photos are readable by owner or public" on public.photos;
drop policy if exists "Photos are manageable by owner" on public.photos;
create policy "Photos are readable by owner"
on public.photos for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Photos are insertable by owner"
on public.photos for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Photos are updatable by owner"
on public.photos for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Photos are deletable by owner"
on public.photos for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Routes are readable by owner" on public.routes;
drop policy if exists "Routes are manageable by owner" on public.routes;
create policy "Routes are readable by owner"
on public.routes for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Routes are insertable with owned trip"
on public.routes for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and (
    trip_id is null or exists (
      select 1 from public.trips t
      where t.id = trip_id and t.user_id = (select auth.uid())
    )
  )
);
create policy "Routes are updatable by owner"
on public.routes for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Routes are deletable by owner"
on public.routes for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Saved links are readable by owner" on public.saved_links;
drop policy if exists "Saved links are manageable by owner" on public.saved_links;
create policy "Saved links are readable by owner"
on public.saved_links for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Saved links are insertable by owner"
on public.saved_links for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Saved links are updatable by owner"
on public.saved_links for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Saved links are deletable by owner"
on public.saved_links for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Packing items are readable by owner" on public.packing_items;
drop policy if exists "Packing items are manageable by owner" on public.packing_items;
create policy "Packing items are readable by owner"
on public.packing_items for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Packing items are insertable with owned trip"
on public.packing_items for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.trips t
    where t.id = trip_id and t.user_id = (select auth.uid())
  )
);
create policy "Packing items are updatable by owner"
on public.packing_items for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Packing items are deletable by owner"
on public.packing_items for delete to authenticated
using ((select auth.uid()) = user_id);

-- Public and family sharing remain data-model states only. Expose them later
-- through a dedicated safe view/API that omits private notes and metadata.

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'countries_valid_dates') then
    alter table public.countries
      add constraint countries_valid_dates
      check (visited_from is null or visited_to is null or visited_to >= visited_from)
      not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'countries_valid_coordinates') then
    alter table public.countries
      add constraint countries_valid_coordinates
      check (
        (latitude is null or latitude between -90 and 90)
        and (longitude is null or longitude between -180 and 180)
      ) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'places_valid_coordinates') then
    alter table public.places
      add constraint places_valid_coordinates
      check (
        (latitude is null and longitude is null)
        or (latitude between -90 and 90 and longitude between -180 and 180)
      ) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'trips_valid_dates') then
    alter table public.trips
      add constraint trips_valid_dates
      check (start_date is null or end_date is null or end_date >= start_date)
      not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'trips_non_negative_budget') then
    alter table public.trips
      add constraint trips_non_negative_budget
      check (budget_estimate is null or budget_estimate >= 0)
      not valid;
  end if;
end $$;
