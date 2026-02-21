-- Faz o Storage usar a mesma regra que a RPC (can_manage_deliverable_for_demand).
-- Corrige "new row violates row-level security policy" no upload quando o produtor
-- tem permissão por nome (demand.producer_name = profile.display_name) mas
-- demands_uploadable_by_user não incluía a demanda por alguma diferença sutil.

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
  RETURN public.can_manage_deliverable_for_demand(path_first_segment::uuid);
EXCEPTION
  WHEN invalid_text_representation THEN
    RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_upload_demand_file(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_deliverable_for_demand(uuid) TO authenticated;
