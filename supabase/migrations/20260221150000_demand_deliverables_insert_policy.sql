-- 1) Criar a função (obrigatório rodar antes da política)
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

-- 2) INSERT em demand_deliverables: quem pode enviar arquivo para a demanda pode inserir a linha
DROP POLICY IF EXISTS "Produtor can insert own deliverables" ON public.demand_deliverables;
DROP POLICY IF EXISTS "Allow insert deliverable when user can upload to demand" ON public.demand_deliverables;

CREATE POLICY "Allow insert deliverable when user can upload to demand"
ON public.demand_deliverables
FOR INSERT TO authenticated
WITH CHECK (public.can_manage_deliverable_for_demand(demand_id));
