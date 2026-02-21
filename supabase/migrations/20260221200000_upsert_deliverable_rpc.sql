-- RPC que faz upsert em demand_deliverables com SECURITY DEFINER, contornando RLS.
-- A permissão é validada dentro da função com can_manage_deliverable_for_demand.

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

-- Permite usuários autenticados chamarem a RPC (a função valida permissão internamente)
GRANT EXECUTE ON FUNCTION public.upsert_demand_deliverable(UUID, TEXT, TEXT, TEXT, UUID) TO authenticated;
