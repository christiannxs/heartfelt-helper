-- Ajusta o modelo de disponibilidade dos produtores:
-- Em vez de depender de marcação manual na tabela producer_availability,
-- a disponibilidade visível para atendentes/CEOs/Admin passa a ser
-- derivada automaticamente das demandas que já possuem prazo de entrega (due_at).
--
-- Regra: cada demanda com due_at não nulo "ocupa" o dia inteiro para aquele produtor.
-- Assim, o calendário mostra os dias já comprometidos para cada produtor.

CREATE OR REPLACE FUNCTION public.get_producer_availability_for_view()
RETURNS TABLE (producer_name TEXT, date DATE, slot_start TIME, slot_end TIME)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d.producer_name,
    d.due_at::date AS date,
    TIME '08:00:00' AS slot_start,
    TIME '18:00:00' AS slot_end
  FROM public.demands d
  WHERE
    d.due_at IS NOT NULL
    AND (
      public.has_role(auth.uid(), 'atendente')
      OR public.has_role(auth.uid(), 'ceo')
      OR public.has_role(auth.uid(), 'admin')
    );
$$;

