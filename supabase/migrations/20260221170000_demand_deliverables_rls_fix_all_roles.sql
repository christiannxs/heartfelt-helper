-- Garante que qualquer usuário com permissão consiga inserir/atualizar demand_deliverables.
-- Útil quando migrações anteriores não foram todas aplicadas (ex.: falta política Admin).
-- Condição: atendente/ceo/admin podem qualquer linha; produtor só demandas dele.

DROP POLICY IF EXISTS "Allow deliverable insert and update for staff or own demand" ON public.demand_deliverables;

CREATE POLICY "Allow deliverable insert and update for staff or own demand"
ON public.demand_deliverables
FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'atendente')
  OR public.has_role(auth.uid(), 'ceo')
  OR public.has_role(auth.uid(), 'admin')
  OR (
    public.has_role(auth.uid(), 'produtor')
    AND demand_id IN (
      SELECT id FROM public.demands
      WHERE producer_name = public.get_producer_name(auth.uid())
    )
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'atendente')
  OR public.has_role(auth.uid(), 'ceo')
  OR public.has_role(auth.uid(), 'admin')
  OR (
    public.has_role(auth.uid(), 'produtor')
    AND demand_id IN (
      SELECT id FROM public.demands
      WHERE producer_name = public.get_producer_name(auth.uid())
    )
  )
);
