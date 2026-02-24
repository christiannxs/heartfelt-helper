-- Artista associado à demanda (para relatórios por artista)
ALTER TABLE public.demands
ADD COLUMN IF NOT EXISTS artist_name TEXT;

COMMENT ON COLUMN public.demands.artist_name IS 'Nome do artista para o qual a demanda foi feita (lista fixa no app).';
