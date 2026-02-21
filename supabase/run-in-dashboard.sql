-- Cole TUDO no SQL Editor do Dashboard e clique em Run.
-- Corrige "new row violates row-level security policy" (upload + comentários).
-- Lógica unificada: uma única fonte (demands_uploadable_by_user) para Storage, RPC e RLS.

-- 1) get_producer_name: retorna TRIM(display_name) para evitar falha por espaços
CREATE OR REPLACE FUNCTION public.get_producer_name(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT TRIM(display_name) FROM public.profiles WHERE user_id = _user_id
$$;

-- 2) Única fonte de verdade: quem pode fazer upload para quais demandas (concluídas)
CREATE OR REPLACE FUNCTION public.demands_uploadable_by_user(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.demands d
  WHERE d.status = 'concluido'
  AND (
    public.has_role(_user_id, 'ceo')
    OR public.has_role(_user_id, 'atendente')
    OR public.has_role(_user_id, 'admin')
    OR (
      public.has_role(_user_id, 'produtor')
      AND LOWER(TRIM(COALESCE(d.producer_name, ''))) = LOWER(COALESCE(public.get_producer_name(_user_id), ''))
    )
  );
$$;

-- 3) can_manage_deliverable_for_demand delega para demands_uploadable_by_user (evita lógica duplicada)
CREATE OR REPLACE FUNCTION public.can_manage_deliverable_for_demand(_demand_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
  AND _demand_id IN (SELECT public.demands_uploadable_by_user(auth.uid()));
$$;

-- 4) Função usada pela política de INSERT do Storage (bucket demand-files)
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

-- 5) Recriar política de INSERT no Storage
DROP POLICY IF EXISTS "Allow upload for concluido demands by allowed roles" ON storage.objects;
CREATE POLICY "Allow upload for concluido demands by allowed roles"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  public.can_upload_demand_file(bucket_id, (storage.foldername(name))[1]::text)
);

GRANT EXECUTE ON FUNCTION public.demands_uploadable_by_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.demands_uploadable_by_user(uuid) TO service_role;

-- 6) RPC de upsert (entrega/comentários) com SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.upsert_demand_deliverable(
  p_demand_id UUID,
  p_storage_path TEXT DEFAULT NULL,
  p_file_name TEXT DEFAULT NULL,
  p_comments TEXT DEFAULT NULL,
  p_uploaded_by UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _uploaded_by UUID := COALESCE(NULLIF(p_uploaded_by::text, ''), _uid);
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF NOT public.can_manage_deliverable_for_demand(p_demand_id) THEN
    RAISE EXCEPTION 'Sem permissão para esta demanda';
  END IF;

  INSERT INTO public.demand_deliverables (demand_id, storage_path, file_name, comments, uploaded_by)
  VALUES (p_demand_id, p_storage_path, p_file_name, p_comments, _uploaded_by)
  ON CONFLICT (demand_id) DO UPDATE SET
    storage_path = COALESCE(EXCLUDED.storage_path, demand_deliverables.storage_path),
    file_name = COALESCE(EXCLUDED.file_name, demand_deliverables.file_name),
    comments = COALESCE(EXCLUDED.comments, demand_deliverables.comments),
    uploaded_by = COALESCE(_uploaded_by, demand_deliverables.uploaded_by),
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_demand_deliverable(UUID, TEXT, TEXT, TEXT, UUID) TO authenticated;
