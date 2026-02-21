-- Função para a política de INSERT no Storage: evita falha de RLS ao avaliar a permissão.
CREATE OR REPLACE FUNCTION public.can_upload_demand_file(bucket text, path_first_segment text)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF bucket <> 'demand-files' OR path_first_segment IS NULL OR path_first_segment = '' THEN
    RETURN false;
  END IF;
  RETURN (
    SELECT (path_first_segment::uuid) IN (SELECT public.demands_uploadable_by_user(auth.uid()))
  );
EXCEPTION
  WHEN invalid_text_representation THEN
    RETURN false;
END;
$$;

-- Recriar política de INSERT do bucket demand-files usando a função
DROP POLICY IF EXISTS "Allow upload for concluido demands by allowed roles" ON storage.objects;

CREATE POLICY "Allow upload for concluido demands by allowed roles"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  public.can_upload_demand_file(bucket_id, (storage.foldername(name))[1])
);
