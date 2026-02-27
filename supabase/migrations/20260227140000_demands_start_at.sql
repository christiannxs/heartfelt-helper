-- Data e hora de início da demanda (quando o trabalho deve começar)
ALTER TABLE public.demands
ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ;

COMMENT ON COLUMN public.demands.start_at IS 'Data e hora de início prevista para a demanda.';
