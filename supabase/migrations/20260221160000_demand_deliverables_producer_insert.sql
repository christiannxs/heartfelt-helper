-- Permite produtor inserir/atualizar linha de entrega para demandas que são dele (producer_name = seu display_name).
-- Resolve "new row violates row-level security policy" quando can_manage_deliverable_for_demand
-- falha por timing ou diferença de comparação (ex.: display_name vs producer_name).
-- Upload de arquivo no storage continua exigindo demanda concluída (demands_uploadable_by_user).

DROP POLICY IF EXISTS "Produtor can insert deliverable for own demand" ON public.demand_deliverables;
DROP POLICY IF EXISTS "Produtor can update deliverable for own demand" ON public.demand_deliverables;

CREATE POLICY "Produtor can insert deliverable for own demand"
ON public.demand_deliverables
FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'produtor')
  AND demand_id IN (
    SELECT id FROM public.demands
    WHERE producer_name = public.get_producer_name(auth.uid())
  )
);

CREATE POLICY "Produtor can update deliverable for own demand"
ON public.demand_deliverables
FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'produtor')
  AND demand_id IN (
    SELECT id FROM public.demands
    WHERE producer_name = public.get_producer_name(auth.uid())
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'produtor')
  AND demand_id IN (
    SELECT id FROM public.demands
    WHERE producer_name = public.get_producer_name(auth.uid())
  )
);
