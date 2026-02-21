-- Função SECURITY DEFINER para checagem de permissão de entrega (evita RLS na subconsulta).
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

-- Políticas de demand_deliverables para produtor usando a função acima
DROP POLICY IF EXISTS "Produtor can view and update own deliverables" ON public.demand_deliverables;
DROP POLICY IF EXISTS "Produtor can insert and update own deliverables" ON public.demand_deliverables;
DROP POLICY IF EXISTS "Produtor can update own deliverables row" ON public.demand_deliverables;
DROP POLICY IF EXISTS "Produtor can view own deliverables" ON public.demand_deliverables;
DROP POLICY IF EXISTS "Produtor can insert own deliverables" ON public.demand_deliverables;
DROP POLICY IF EXISTS "Produtor can update own deliverables" ON public.demand_deliverables;

CREATE POLICY "Produtor can view own deliverables" ON public.demand_deliverables
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'produtor')
  AND public.can_manage_deliverable_for_demand(demand_id)
);

CREATE POLICY "Produtor can insert own deliverables" ON public.demand_deliverables
FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'produtor')
  AND public.can_manage_deliverable_for_demand(demand_id)
);

CREATE POLICY "Produtor can update own deliverables" ON public.demand_deliverables
FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'produtor')
  AND public.can_manage_deliverable_for_demand(demand_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'produtor')
  AND public.can_manage_deliverable_for_demand(demand_id)
);
