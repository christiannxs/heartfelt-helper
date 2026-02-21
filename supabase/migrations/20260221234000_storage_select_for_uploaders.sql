-- SELECT no storage.objects para quem pode fazer upload (necessário para upsert).
-- Sem isso, produtor não “vê” o objeto no path da demanda e o fluxo de upsert pode falhar.

DROP POLICY IF EXISTS "Allow select for uploaders demand-files" ON storage.objects;
CREATE POLICY "Allow select for uploaders demand-files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'demand-files'
  AND public.can_upload_demand_file(bucket_id, (storage.foldername(name))[1]::text)
);
