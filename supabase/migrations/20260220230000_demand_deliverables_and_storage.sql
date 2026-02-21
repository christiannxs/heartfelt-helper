-- Tabela de entregas (arquivo + comentários) por demanda concluída
CREATE TABLE public.demand_deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demand_id UUID NOT NULL REFERENCES public.demands(id) ON DELETE CASCADE,
    storage_path TEXT,
    file_name TEXT,
    comments TEXT,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (demand_id)
);
ALTER TABLE public.demand_deliverables ENABLE ROW LEVEL SECURITY;

-- Índices
CREATE INDEX idx_demand_deliverables_demand_id ON public.demand_deliverables(demand_id);

-- Trigger updated_at
CREATE TRIGGER update_demand_deliverables_updated_at
BEFORE UPDATE ON public.demand_deliverables
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS demand_deliverables: atendente e CEO veem/inserem/atualizam todos; produtor só as próprias demandas
CREATE POLICY "Atendente can manage all deliverables" ON public.demand_deliverables
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'atendente'))
WITH CHECK (public.has_role(auth.uid(), 'atendente'));

CREATE POLICY "CEO can manage all deliverables" ON public.demand_deliverables
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'ceo'))
WITH CHECK (public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "Produtor can view and update own deliverables" ON public.demand_deliverables
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'produtor')
  AND demand_id IN (
    SELECT id FROM public.demands
    WHERE producer_name = public.get_producer_name(auth.uid())
  )
);

CREATE POLICY "Produtor can insert and update own deliverables" ON public.demand_deliverables
FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'produtor')
  AND demand_id IN (
    SELECT id FROM public.demands
    WHERE producer_name = public.get_producer_name(auth.uid())
  )
);

CREATE POLICY "Produtor can update own deliverables row" ON public.demand_deliverables
FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'produtor')
  AND demand_id IN (
    SELECT id FROM public.demands
    WHERE producer_name = public.get_producer_name(auth.uid())
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'produtor')
  AND demand_id IN (
    SELECT id FROM public.demands
    WHERE producer_name = public.get_producer_name(auth.uid())
  )
);

-- Bucket para arquivos de entrega (privado; acesso via signed URL).
-- Se o INSERT falhar, crie o bucket no Dashboard: Storage > New bucket > id = demand-files, private, 50MB, MIME: audio/* e application/octet-stream
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'demand-files',
  'demand-files',
  false,
  52428800,
  ARRAY['audio/wav', 'audio/wave', 'audio/x-wav', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;

-- Storage: apenas demandas concluídas podem receber upload; path = demand_id/filename
CREATE OR REPLACE FUNCTION public.demands_uploadable_by_user(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.demands d
  WHERE d.status = 'concluido'
  AND (
    public.has_role(_user_id, 'ceo')
    OR public.has_role(_user_id, 'atendente')
    OR (public.has_role(_user_id, 'produtor') AND d.producer_name = public.get_producer_name(_user_id))
  );
$$;

-- Download: apenas CEO e atendente (produtor não baixa)
CREATE OR REPLACE FUNCTION public.demands_downloadable_by_user(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.demands
  WHERE public.has_role(_user_id, 'ceo') OR public.has_role(_user_id, 'atendente');
$$;

-- Políticas no storage.objects para o bucket demand-files (path = demand_id/file_name)
CREATE POLICY "Allow upload for concluido demands by allowed roles"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'demand-files'
  AND (storage.foldername(name))[1]::uuid IN (SELECT public.demands_uploadable_by_user(auth.uid()))
);

CREATE POLICY "Allow download only for CEO and atendente"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'demand-files'
  AND (storage.foldername(name))[1]::uuid IN (SELECT public.demands_downloadable_by_user(auth.uid()))
);

CREATE POLICY "Allow delete for same roles as upload (replace file)"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'demand-files'
  AND (storage.foldername(name))[1]::uuid IN (SELECT public.demands_uploadable_by_user(auth.uid()))
);
