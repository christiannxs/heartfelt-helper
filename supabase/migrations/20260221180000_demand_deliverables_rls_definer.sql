-- Corrige "new row violates row-level security policy" para produtor ao salvar comentários/entrega.
-- Usa uma única função SECURITY DEFINER que lê demands/profiles com privilégios do dono (sem RLS em cadeia)
-- e compara producer_name com trim para evitar falhas por espaços.

CREATE OR REPLACE FUNCTION public.can_manage_deliverable_for_demand(_demand_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _producer_display_name TEXT;
  _demand_producer_name TEXT;
BEGIN
  IF _uid IS NULL THEN
    RETURN false;
  END IF;
  -- Staff pode gerenciar qualquer entrega
  IF public.has_role(_uid, 'atendente') OR public.has_role(_uid, 'ceo') OR public.has_role(_uid, 'admin') THEN
    RETURN true;
  END IF;
  -- Produtor: só se a demanda for dele (producer_name = display_name do perfil)
  IF NOT public.has_role(_uid, 'produtor') THEN
    RETURN false;
  END IF;
  SELECT TRIM(display_name) INTO _producer_display_name
  FROM public.profiles WHERE user_id = _uid;
  SELECT TRIM(producer_name) INTO _demand_producer_name
  FROM public.demands WHERE id = _demand_id;
  RETURN _producer_display_name IS NOT NULL
    AND _demand_producer_name IS NOT NULL
    AND _producer_display_name = _demand_producer_name;
END;
$$;

-- Remove políticas antigas que podem conflitar ou falhar por RLS em subconsulta
DROP POLICY IF EXISTS "Atendente can manage all deliverables" ON public.demand_deliverables;
DROP POLICY IF EXISTS "CEO can manage all deliverables" ON public.demand_deliverables;
DROP POLICY IF EXISTS "Admin can manage all deliverables" ON public.demand_deliverables;
DROP POLICY IF EXISTS "Allow insert deliverable when user can upload to demand" ON public.demand_deliverables;
DROP POLICY IF EXISTS "Produtor can insert deliverable for own demand" ON public.demand_deliverables;
DROP POLICY IF EXISTS "Produtor can update deliverable for own demand" ON public.demand_deliverables;
DROP POLICY IF EXISTS "Allow deliverable insert and update for staff or own demand" ON public.demand_deliverables;
DROP POLICY IF EXISTS "Produtor can view own deliverables" ON public.demand_deliverables;
DROP POLICY IF EXISTS "Produtor can insert own deliverables" ON public.demand_deliverables;
DROP POLICY IF EXISTS "Produtor can update own deliverables" ON public.demand_deliverables;

-- Políticas únicas e claras usando a função SECURITY DEFINER
CREATE POLICY "Staff can manage all deliverables"
ON public.demand_deliverables
FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'atendente')
  OR public.has_role(auth.uid(), 'ceo')
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'atendente')
  OR public.has_role(auth.uid(), 'ceo')
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Produtor can select own deliverables"
ON public.demand_deliverables
FOR SELECT TO authenticated
USING (public.can_manage_deliverable_for_demand(demand_id));

CREATE POLICY "Produtor can insert own deliverables"
ON public.demand_deliverables
FOR INSERT TO authenticated
WITH CHECK (public.can_manage_deliverable_for_demand(demand_id));

CREATE POLICY "Produtor can update own deliverables"
ON public.demand_deliverables
FOR UPDATE TO authenticated
USING (public.can_manage_deliverable_for_demand(demand_id))
WITH CHECK (public.can_manage_deliverable_for_demand(demand_id));
