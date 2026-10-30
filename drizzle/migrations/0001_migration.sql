create policy "catalog read" on storage.objects for select to anon, authenticated using (bucket_id='catalog');
create policy "catalog admin insert" on storage.objects for insert to authenticated with check (bucket_id='catalog' and public.has_role(auth.uid(),'admin'));
create policy "catalog admin update" on storage.objects for update to authenticated using (bucket_id='catalog' and public.has_role(auth.uid(),'admin'));
create policy "catalog admin delete" on storage.objects for delete to authenticated using (bucket_id='catalog' and public.has_role(auth.uid(),'admin'));