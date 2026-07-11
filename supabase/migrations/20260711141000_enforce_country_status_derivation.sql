create or replace function public.enforce_country_status_derivation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.visited_from is not null then
    new.manual_status := 'visited'::public.country_status;
  end if;
  new.status := case
    when new.completed_trip_count > 0 or new.manual_status = 'visited'
      then 'visited'::public.country_status
    else new.manual_status
  end;
  return new;
end;
$$;

revoke execute on function public.enforce_country_status_derivation()
from public, anon, authenticated;

drop trigger if exists enforce_country_status_before_write on public.countries;
create trigger enforce_country_status_before_write
before insert or update of status, manual_status, completed_trip_count, visited_from
on public.countries
for each row execute function public.enforce_country_status_derivation();
