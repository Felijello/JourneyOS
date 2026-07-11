-- Tighten social constraints after the initial rollout.

drop policy if exists "Travel photos are updatable by owner" on public.travel_photos;
create policy "Travel photos are updatable for owned trips"
on public.travel_photos for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.trips t
    where t.id = trip_id and t.user_id = (select auth.uid())
  )
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_favorite_destinations_limit'
  ) then
    alter table public.profiles
      add constraint profiles_favorite_destinations_limit
      check (cardinality(favorite_destinations) <= 8) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_bio_length'
  ) then
    alter table public.profiles
      add constraint profiles_bio_length
      check (length(bio) <= 240) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'trips_highlights_limit'
  ) then
    alter table public.trips
      add constraint trips_highlights_limit
      check (cardinality(highlights) <= 8) not valid;
  end if;
end $$;

alter table public.profiles validate constraint profiles_username_format;
alter table public.profiles validate constraint profiles_visibility_valid;
alter table public.profiles validate constraint profiles_favorite_destinations_limit;
alter table public.profiles validate constraint profiles_bio_length;
alter table public.trips validate constraint trips_highlights_limit;
