-- Varredura: unifica permissão de upload em uma única fonte (demands_uploadable_by_user).
-- Assim Storage, RPC upsert_demand_deliverable e RLS usam a mesma regra; os 2 produtores
-- conseguem upload quando producer_name da demanda bate com display_name do perfil (trim + lower).

-- 1) get_producer_name: retorna TRIM(display_name) para evitar falha por espaços
CREATE OR REPLACE FUNCTION public.get_producer_name(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT TRIM(display_name) FROM public.profiles WHERE user_id = _user_id
$$;

-- 2) Única fonte de verdade: quem pode fazer upload para quais demandas (concluídas)
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
    OR public.has_role(_user_id, 'admin')
    OR (
      public.has_role(_user_id, 'produtor')
      AND LOWER(TRIM(COALESCE(d.producer_name, ''))) = LOWER(COALESCE(public.get_producer_name(_user_id), ''))
    )
  );
$$;

-- 3) can_manage_deliverable_for_demand delega para demands_uploadable_by_user (evita lógica duplicada)
CREATE OR REPLACE FUNCTION public.can_manage_deliverable_for_demand(_demand_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
  AND _demand_id IN (SELECT public.demands_uploadable_by_user(auth.uid()));
$$;

-- 4) Storage: política de INSERT já usa can_upload_demand_file -> demands_uploadable_by_user; garantir que a função existe
CREATE OR REPLACE FUNCTION public.can_upload_demand_file(bucket text, path_first_segment text)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF bucket <> 'demand-files' OR path_first_segment IS NULL OR path_first_segment = '' THEN
    RETURN false;
  END IF;
  RETURN (
    SELECT (path_first_segment::uuid) IN (SELECT public.demands_uploadable_by_user(auth.uid()))
  );
EXCEPTION
  WHEN invalid_text_representation THEN
    RETURN false;
END;
$$;

-- 5) Recriar política de INSERT no Storage para usar a função (garante uso da lógica unificada)
DROP POLICY IF EXISTS "Allow upload for concluido demands by allowed roles" ON storage.objects;
CREATE POLICY "Allow upload for concluido demands by allowed roles"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  public.can_upload_demand_file(bucket_id, (storage.foldername(name))[1]::text)
);

-- 6) Grants
GRANT EXECUTE ON FUNCTION public.demands_uploadable_by_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.demands_uploadable_by_user(uuid) TO service_role;
