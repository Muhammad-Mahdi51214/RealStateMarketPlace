-- Private buckets for sensitive documents and plot media
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'kyc-documents',
    'kyc-documents',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'application/pdf']
  ),
  (
    'ownership-documents',
    'ownership-documents',
    false,
    20971520,
    array['image/jpeg', 'image/png', 'application/pdf']
  ),
  (
    'plot-images',
    'plot-images',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do nothing;

-- Owners can upload into their own folder: {user_id}/...
create policy "KYC upload own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'kyc-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "KYC read own or admin"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'kyc-documents'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

create policy "Ownership docs upload own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'ownership-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Ownership docs read own or admin"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'ownership-documents'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

create policy "Plot images admin write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'plot-images'
    and public.is_admin()
  );

create policy "Plot images authenticated read"
  on storage.objects for select to authenticated
  using (bucket_id = 'plot-images');
