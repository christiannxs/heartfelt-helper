-- Nome de quem solicitou a demanda (preenchido automaticamente ao criar)
ALTER TABLE public.demands
  ADD COLUMN IF NOT EXISTS solicitante_name TEXT;

COMMENT ON COLUMN public.demands.solicitante_name IS 'Nome de quem solicitou/criou a demanda (display_name do usuário no momento da criação).';
