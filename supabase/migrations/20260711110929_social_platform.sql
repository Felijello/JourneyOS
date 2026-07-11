-- JourneyOS social platform: public-safe profiles, follows, trip publishing,
-- likes, preferences, and a dedicated trip gallery.

create extension if not exists pg_trgm with schema extensions;

alter table public.profiles
  add column if not exists username text,
  add column if not exists bio text not null default '',
  add column if not exists home_location text not null default '',
  add column if not exists favorite_destinations text[] not null default '{}',
  add column if not exists profile_visibility text not null default 'public',
  add column if not exists onboarding_completed boolean not null default false;

update public.profiles
set username = 'traveler_' || left(replace(id::text, '-', ''), 8)
where username is null or btrim(username) = '';

alter table public.profiles
  alter column username set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_username_format'
  ) then
    alter table public.profiles
      add constraint profiles_username_format
      check (username ~ '^[a-z0-9_]{3,24}$') not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_visibility_valid'
  ) then
    alter table public.profiles
      add constraint profiles_visibility_valid
      check (profile_visibility in ('private', 'public')) not valid;
  end if;
end $$;

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username));
create index if not exists profiles_username_search_idx
  on public.profiles using gin (username extensions.gin_trgm_ops);

-- E-mail remains in auth.users and must not be part of a public social profile.
alter table public.profiles drop column if exists email;

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_notifications boolean not null default true,
  social_notifications boolean not null default true,
  trip_reminders boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);

create index if not exists follows_following_id_idx on public.follows(following_id);
create index if not exists follows_follower_id_idx on public.follows(follower_id);

alter table public.trips
  add column if not exists destination_name text not null default '',
  add column if not exists description text not null default '',
  add column if not exists highlights text[] not null default '{}';

create table if not exists public.trip_publications (
  trip_id uuid primary key references public.trips(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  destination_name text not null default '',
  start_date date,
  end_date date,
  description text not null default '',
  highlights text[] not null default '{}',
  cover_photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trip_publications_user_id_idx
  on public.trip_publications(user_id, updated_at desc);
create index if not exists trip_publications_destination_idx
  on public.trip_publications using gin (destination_name extensions.gin_trgm_ops);

create table if not exists public.trip_likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  trip_id uuid not null references public.trip_publications(trip_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, trip_id)
);

create index if not exists trip_likes_trip_id_idx on public.trip_likes(trip_id);

create table if not exists public.travel_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  storage_path text not null unique,
  caption text not null default '',
  position smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint travel_photos_position_valid check (position between 0 and 11),
  unique (trip_id, position)
);

create index if not exists travel_photos_trip_id_idx
  on public.travel_photos(trip_id, position);

create or replace function public.sync_trip_publication()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.visibility = 'public' then
    insert into public.trip_publications (
      trip_id, user_id, title, destination_name, start_date, end_date,
      description, highlights, cover_photo_url, created_at, updated_at
    ) values (
      new.id, new.user_id, new.title, new.destination_name, new.start_date,
      new.end_date, new.description, new.highlights, new.cover_photo_url,
      new.created_at, now()
    )
    on conflict (trip_id) do update set
      user_id = excluded.user_id,
      title = excluded.title,
      destination_name = excluded.destination_name,
      start_date = excluded.start_date,
      end_date = excluded.end_date,
      description = excluded.description,
      highlights = excluded.highlights,
      cover_photo_url = excluded.cover_photo_url,
      updated_at = now();
  else
    delete from public.trip_publications where trip_id = new.id;
  end if;
  return new;
end;
$$;

revoke execute on function public.sync_trip_publication() from public, anon, authenticated;

drop trigger if exists sync_trip_publication_after_write on public.trips;
create trigger sync_trip_publication_after_write
after insert or update of visibility, title, destination_name, start_date, end_date,
  description, highlights, cover_photo_url
on public.trips
for each row execute function public.sync_trip_publication();

insert into public.trip_publications (
  trip_id, user_id, title, destination_name, start_date, end_date,
  description, highlights, cover_photo_url, created_at, updated_at
)
select id, user_id, title, destination_name, start_date, end_date,
  description, highlights, cover_photo_url, created_at, updated_at
from public.trips
where visibility = 'public'
on conflict (trip_id) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_username text;
begin
  requested_username := lower(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'username', ''),
    '[^a-zA-Z0-9_]', '', 'g'
  ));

  if length(requested_username) < 3 then
    requested_username := 'traveler_' || left(replace(new.id::text, '-', ''), 8);
  end if;

  insert into public.profiles (
    id, username, display_name, avatar_url, onboarding_completed
  ) values (
    new.id,
    left(requested_username, 24),
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      split_part(coalesce(new.email, 'Traveler'), '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url',
    false
  )
  on conflict (id) do update set
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

insert into public.user_settings (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

drop trigger if exists set_user_settings_updated_at on public.user_settings;
create trigger set_user_settings_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_trip_publications_updated_at on public.trip_publications;
create trigger set_trip_publications_updated_at
before update on public.trip_publications
for each row execute function public.set_updated_at();

drop trigger if exists set_travel_photos_updated_at on public.travel_photos;
create trigger set_travel_photos_updated_at
before update on public.travel_photos
for each row execute function public.set_updated_at();

alter table public.user_settings enable row level security;
alter table public.follows enable row level security;
alter table public.trip_publications enable row level security;
alter table public.trip_likes enable row level security;
alter table public.travel_photos enable row level security;

drop policy if exists "Profiles are readable by owner" on public.profiles;
create policy "Profiles are readable by owner or community"
on public.profiles for select to authenticated
using ((select auth.uid()) = id or profile_visibility = 'public');

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "User settings are readable by owner"
on public.user_settings for select to authenticated
using ((select auth.uid()) = user_id);
create policy "User settings are insertable by owner"
on public.user_settings for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "User settings are updatable by owner"
on public.user_settings for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Follows are visible in community"
on public.follows for select to authenticated using (true);
create policy "Users can follow from their account"
on public.follows for insert to authenticated
with check (
  (select auth.uid()) = follower_id
  and exists (
    select 1 from public.profiles p
    where p.id = following_id and p.profile_visibility = 'public'
  )
);
create policy "Users can unfollow from their account"
on public.follows for delete to authenticated
using ((select auth.uid()) = follower_id);

create policy "Published trips are visible in community"
on public.trip_publications for select to authenticated using (true);

create policy "Trip likes are visible in community"
on public.trip_likes for select to authenticated using (true);
create policy "Users can like published trips"
on public.trip_likes for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.trip_publications p where p.trip_id = trip_id
  )
);
create policy "Users can remove their trip likes"
on public.trip_likes for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Travel photos are readable by owner or community"
on public.travel_photos for select to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.trip_publications p
    where p.trip_id = travel_photos.trip_id
  )
);
create policy "Travel photos are insertable for owned trips"
on public.travel_photos for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.trips t
    where t.id = trip_id and t.user_id = (select auth.uid())
  )
);
create policy "Travel photos are updatable by owner"
on public.travel_photos for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Travel photos are deletable by owner"
on public.travel_photos for delete to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.user_settings, public.follows,
  public.trip_publications, public.trip_likes, public.travel_photos
from anon, authenticated;

grant select, insert, update on public.user_settings to authenticated;
grant select, insert, delete on public.follows to authenticated;
grant select on public.trip_publications to authenticated;
grant select, insert, delete on public.trip_likes to authenticated;
grant select, insert, update, delete on public.travel_photos to authenticated;

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'profile-images',
  'profile-images',
  false,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Profile images are readable in community" on storage.objects;
create policy "Profile images are readable in community"
on storage.objects for select to authenticated
using (
  bucket_id = 'profile-images'
  and (
    (select auth.uid())::text = (storage.foldername(name))[1]
    or exists (
      select 1 from public.profiles p
      where p.avatar_url = name and p.profile_visibility = 'public'
    )
  )
);

create policy "Profile images are insertable by owner"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'profile-images'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);
create policy "Profile images are updatable by owner"
on storage.objects for update to authenticated
using (
  bucket_id = 'profile-images'
  and (select auth.uid())::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'profile-images'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);
create policy "Profile images are deletable by owner"
on storage.objects for delete to authenticated
using (
  bucket_id = 'profile-images'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "Published trip photos are readable in community" on storage.objects;
create policy "Published trip photos are readable in community"
on storage.objects for select to authenticated
using (
  bucket_id = 'travel-photos'
  and exists (
    select 1
    from public.travel_photos photo
    join public.trip_publications publication on publication.trip_id = photo.trip_id
    where photo.storage_path = name
  )
);
