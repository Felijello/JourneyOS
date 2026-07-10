-- Address Supabase security and performance advisor findings.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

drop policy if exists "Profiles are readable by owner" on public.profiles;
create policy "Profiles are readable by owner"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Countries are insertable by owner" on public.countries;
create policy "Countries are insertable by owner"
on public.countries for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Countries are updatable by owner" on public.countries;
create policy "Countries are updatable by owner"
on public.countries for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Countries are deletable by owner" on public.countries;
create policy "Countries are deletable by owner"
on public.countries for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "AI generations are readable by owner" on public.ai_generations;
create policy "AI generations are readable by owner"
on public.ai_generations for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "AI generations are insertable by owner" on public.ai_generations;
create policy "AI generations are insertable by owner"
on public.ai_generations for insert to authenticated
with check ((select auth.uid()) = user_id);

create index if not exists trip_days_user_id_idx on public.trip_days(user_id);
create index if not exists trip_day_items_user_id_idx on public.trip_day_items(user_id);
create index if not exists trip_day_items_place_id_idx on public.trip_day_items(place_id);
create index if not exists photos_place_id_idx on public.photos(place_id);
create index if not exists routes_user_id_idx on public.routes(user_id);
create index if not exists saved_links_country_id_idx on public.saved_links(country_id);
create index if not exists saved_links_place_id_idx on public.saved_links(place_id);
create index if not exists saved_links_trip_id_idx on public.saved_links(trip_id);
create index if not exists packing_items_user_id_idx on public.packing_items(user_id);
