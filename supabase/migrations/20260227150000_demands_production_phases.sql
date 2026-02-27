-- Fases da produção (checklist visível para todos; apenas produtores podem marcar)
ALTER TABLE public.demands
  ADD COLUMN IF NOT EXISTS phase_producao BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phase_gravacao BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phase_mix_master BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.demands.phase_producao IS 'Produção: marcado pelo produtor quando concluído';
COMMENT ON COLUMN public.demands.phase_gravacao IS 'Gravação: marcado pelo produtor quando concluído';
COMMENT ON COLUMN public.demands.phase_mix_master IS 'Mix | Master: marcado pelo produtor quando concluído';
