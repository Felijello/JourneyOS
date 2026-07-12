alter type public.trip_status add value if not exists 'active' after 'booked';

create table if not exists public.trip_drafts (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  draft_data jsonb not null default '{}'::jsonb,
  current_step smallint not null default 1 check (current_step between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trip_places (
  trip_id uuid not null references public.trips(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (trip_id, place_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('follow', 'like', 'packing_reminder', 'weather_reminder', 'trip_incomplete')),
  title text not null check (length(title) between 1 and 120),
  body text not null default '' check (length(body) <= 500),
  href text,
  entity_type text check (entity_type is null or entity_type in ('trip', 'profile', 'country')),
  entity_id uuid,
  dedupe_key text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.travel_photos
  add column if not exists is_cover boolean not null default false;

create unique index if not exists travel_photos_one_cover_per_trip_idx
  on public.travel_photos(trip_id)
  where is_cover;
create index if not exists trip_places_user_id_idx on public.trip_places(user_id);
create index if not exists trip_places_place_id_idx on public.trip_places(place_id);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
create unique index if not exists notifications_dedupe_idx
  on public.notifications(user_id, dedupe_key)
  where dedupe_key is not null;

drop trigger if exists set_trip_drafts_updated_at on public.trip_drafts;
create trigger set_trip_drafts_updated_at
before update on public.trip_drafts
for each row execute function public.set_updated_at();

alter table public.trip_drafts enable row level security;
alter table public.trip_places enable row level security;
alter table public.notifications enable row level security;

create policy "Trip drafts are readable by owner" on public.trip_drafts
for select to authenticated using ((select auth.uid()) = user_id);
create policy "Trip drafts are insertable by owner" on public.trip_drafts
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Trip drafts are updatable by owner" on public.trip_drafts
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Trip drafts are deletable by owner" on public.trip_drafts
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Trip places are readable by owner" on public.trip_places
for select to authenticated using ((select auth.uid()) = user_id);
create policy "Trip places are insertable for owned trips and places" on public.trip_places
for insert to authenticated with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.trips t where t.id = trip_id and t.user_id = (select auth.uid()))
  and exists (select 1 from public.places p where p.id = place_id and p.user_id = (select auth.uid()))
);
create policy "Trip places are updatable by owner" on public.trip_places
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Trip places are deletable by owner" on public.trip_places
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Notifications are readable by recipient" on public.notifications
for select to authenticated using ((select auth.uid()) = user_id);
create policy "Notifications are updatable by recipient" on public.notifications
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Notifications are deletable by recipient" on public.notifications
for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.trip_drafts to authenticated;
grant select, insert, update, delete on public.trip_places to authenticated;
grant select, update, delete on public.notifications to authenticated;

drop policy if exists "Users can like published trips" on public.trip_likes;
create policy "Users can like published trips" on public.trip_likes
for insert to authenticated with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.trip_publications publication
    where publication.trip_id = trip_likes.trip_id
  )
);

create or replace function public.create_social_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient uuid;
begin
  if tg_table_name = 'follows' then
    recipient := new.following_id;
    if recipient <> new.follower_id then
      insert into public.notifications(user_id, actor_id, type, title, body, href, entity_type, entity_id, dedupe_key)
      values (recipient, new.follower_id, 'follow', 'Neuer Follower', 'Jemand folgt jetzt deinen Reisen.', '/u/' || coalesce((select username from public.profiles where id = new.follower_id), ''), 'profile', new.follower_id, 'follow:' || new.follower_id::text)
      on conflict (user_id, dedupe_key) where dedupe_key is not null do nothing;
    end if;
  elsif tg_table_name = 'trip_likes' then
    select user_id into recipient from public.trip_publications where trip_id = new.trip_id;
    if recipient is not null and recipient <> new.user_id then
      insert into public.notifications(user_id, actor_id, type, title, body, href, entity_type, entity_id, dedupe_key)
      values (recipient, new.user_id, 'like', 'Deine Reise gefällt jemandem', 'Eine veröffentlichte Reise hat ein neues Like.', '/community/trips/' || new.trip_id::text, 'trip', new.trip_id, 'like:' || new.trip_id::text || ':' || new.user_id::text)
      on conflict (user_id, dedupe_key) where dedupe_key is not null do nothing;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.create_social_notification() from public, anon, authenticated;
grant execute on function public.create_social_notification() to postgres;

drop trigger if exists create_follow_notification on public.follows;
create trigger create_follow_notification
after insert on public.follows
for each row execute function public.create_social_notification();
drop trigger if exists create_like_notification on public.trip_likes;
create trigger create_like_notification
after insert on public.trip_likes
for each row execute function public.create_social_notification();

create or replace function public.delete_current_user()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'authentication required';
  end if;
  delete from auth.users where id = current_user_id;
end;
$$;

revoke all on function public.delete_current_user() from public, anon;
grant execute on function public.delete_current_user() to authenticated;
