-- Corrige permissão para salvar comentários e fazer upload: atendente/ceo/admin sempre;
-- produtor quando a demanda está em demands_uploadable_by_user OU quando a demanda é dele (nome igual).

CREATE OR REPLACE FUNCTION public.can_manage_deliverable_for_demand(_demand_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
  AND (
    public.has_role(auth.uid(), 'atendente')
    OR public.has_role(auth.uid(), 'ceo')
    OR public.has_role(auth.uid(), 'admin')
    OR _demand_id IN (SELECT public.demands_uploadable_by_user(auth.uid()))
    OR (
      public.has_role(auth.uid(), 'produtor')
      AND EXISTS (
        SELECT 1 FROM public.demands d
        WHERE d.id = _demand_id
        AND LOWER(TRIM(COALESCE(d.producer_name, ''))) = LOWER(COALESCE(public.get_producer_name(auth.uid()), ''))
      )
    )
  );
$$;
