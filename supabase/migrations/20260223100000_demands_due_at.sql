-- Prazo de entrega: o atendente pode estipular o limite para a demanda ser entregue
ALTER TABLE public.demands
ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ;

COMMENT ON COLUMN public.demands.due_at IS 'Prazo limite para entrega da demanda (estipulado pelo atendente).';
