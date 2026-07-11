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
    set completed_trip_count = 0, status = manual_status, updated_at = now()
    where user_id = target_user_id
      and country_code = upper(target_country_code);
  end if;
end;
$$;

revoke execute on function public.refresh_country_visit(uuid, text)
from public, anon, authenticated;
