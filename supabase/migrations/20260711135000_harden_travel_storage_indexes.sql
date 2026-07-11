create index if not exists travel_photos_user_id_idx
  on public.travel_photos(user_id);

create index if not exists trip_countries_country_id_idx
  on public.trip_countries(country_id)
  where country_id is not null;

drop policy if exists "Travel photos are readable by owner folder" on storage.objects;
create policy "Travel photos are readable by owner folder"
on storage.objects for select to authenticated
using (
  bucket_id = 'travel-photos'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "Travel photos are insertable by owner folder" on storage.objects;
create policy "Travel photos are insertable by owner folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'travel-photos'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "Travel photos are updatable by owner folder" on storage.objects;
create policy "Travel photos are updatable by owner folder"
on storage.objects for update to authenticated
using (
  bucket_id = 'travel-photos'
  and (select auth.uid())::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'travel-photos'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "Travel photos are deletable by owner folder" on storage.objects;
create policy "Travel photos are deletable by owner folder"
on storage.objects for delete to authenticated
using (
  bucket_id = 'travel-photos'
  and (select auth.uid())::text = (storage.foldername(name))[1]
);
