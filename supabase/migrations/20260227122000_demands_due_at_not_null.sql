-- Regra: toda demanda precisa ter data e hora de prazo de entrega.
-- 1) Preenche due_at onde ainda é nulo usando created_at como fallback.
-- 2) Torna a coluna obrigatória (NOT NULL) para novas e antigas linhas.

UPDATE public.demands
SET due_at = created_at
WHERE due_at IS NULL;

ALTER TABLE public.demands
ALTER COLUMN due_at SET NOT NULL;

