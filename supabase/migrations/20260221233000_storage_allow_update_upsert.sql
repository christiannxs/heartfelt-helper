-- Upload com upsert: true exige política UPDATE no storage.objects (além de INSERT).
-- Sem isso, "new row violates row-level security policy" ao sobrescrever arquivo.

DROP POLICY IF EXISTS "Allow update for same as upload demand-files" ON storage.objects;
CREATE POLICY "Allow update for same as upload demand-files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'demand-files'
  AND public.can_upload_demand_file(bucket_id, (storage.foldername(name))[1]::text)
)
WITH CHECK (
  bucket_id = 'demand-files'
  AND public.can_upload_demand_file(bucket_id, (storage.foldername(name))[1]::text)
);
