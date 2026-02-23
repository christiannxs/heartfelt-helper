-- Calendário de disponibilidade dos produtores: dias e horários em que estão disponíveis
-- para que atendentes, admin e CEOs saibam quando solicitar demandas.

CREATE TABLE public.producer_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    slot_start TIME NOT NULL,
    slot_end TIME NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT slot_end_after_start CHECK (slot_end > slot_start)
);

CREATE INDEX idx_producer_availability_user_date ON public.producer_availability (user_id, date);

COMMENT ON TABLE public.producer_availability IS 'Horários de disponibilidade dos produtores para atendentes/CEOs saberem quando solicitar demandas.';

ALTER TABLE public.producer_availability ENABLE ROW LEVEL SECURITY;

-- Produtor: pode ver, inserir, atualizar e apagar apenas os próprios registros
CREATE POLICY "Produtor can manage own availability"
ON public.producer_availability
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Atendente, CEO e Admin: podem apenas visualizar toda a disponibilidade
CREATE POLICY "Atendente CEO Admin can view all availability"
ON public.producer_availability
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'atendente')
  OR public.has_role(auth.uid(), 'ceo')
  OR public.has_role(auth.uid(), 'admin')
);

-- RPC para atendente/CEO/admin verem disponibilidade com nome do produtor (sem expor user_id)
CREATE OR REPLACE FUNCTION public.get_producer_availability_for_view()
RETURNS TABLE (producer_name TEXT, date DATE, slot_start TIME, slot_end TIME)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.display_name, a.date, a.slot_start, a.slot_end
  FROM public.producer_availability a
  JOIN public.profiles p ON p.user_id = a.user_id
  WHERE public.has_role(auth.uid(), 'atendente')
     OR public.has_role(auth.uid(), 'ceo')
     OR public.has_role(auth.uid(), 'admin');
$$;
