-- Correção: adiciona a coluna start_at na tabela demands se ainda não existir.
-- Erro: "Could not find the 'start_at' column of 'demands' in the schema cache"
-- Execute este script no SQL Editor do Supabase (Dashboard) se as migrations não foram aplicadas.

ALTER TABLE public.demands
ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ;

COMMENT ON COLUMN public.demands.start_at IS 'Data e hora de início prevista para a demanda.';
