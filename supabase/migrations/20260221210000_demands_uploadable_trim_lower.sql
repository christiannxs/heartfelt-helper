-- Alinha permissão de upload (Storage) com can_manage_deliverable_for_demand:
-- compara producer_name com display_name usando TRIM e LOWER para evitar
-- "new row violates row-level security policy" no storage.objects quando
-- o nome na demanda e no perfil diferem só por espaços ou maiúsculas/minúsculas.

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
      AND LOWER(TRIM(COALESCE(d.producer_name, ''))) = LOWER(TRIM(COALESCE(public.get_producer_name(_user_id), '')))
    )
  );
$$;
