-- admin já incluído na migração 20260220230500_add_admin_enum.sql

-- Tabela de configuração da aplicação (ex.: setup inicial)
CREATE TABLE public.app_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT 'null'
);
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode ler (para getSetupStatus)
CREATE POLICY "Authenticated can read app_config" ON public.app_config
FOR SELECT TO authenticated USING (true);

-- Qualquer usuário autenticado pode inserir/atualizar (para setSetupComplete; em produção pode restringir)
CREATE POLICY "Authenticated can upsert app_config" ON public.app_config
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Permitir atualizar próprio perfil (display_name no setup)
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Permitir inserir/atualizar própria role no setup (criar conta com role)
CREATE POLICY "Users can insert own role" ON public.user_roles
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own role" ON public.user_roles
FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own roles" ON public.user_roles
FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Admin: mesmas permissões que CEO + criar demandas como atendente
CREATE POLICY "Admin can view all demands" ON public.demands
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can create demands" ON public.demands
FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'admin') AND created_by = auth.uid()
);

CREATE POLICY "Admin can manage all deliverables" ON public.demand_deliverables
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Atualizar funções de storage para incluir admin
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
    OR (public.has_role(_user_id, 'produtor') AND d.producer_name = public.get_producer_name(_user_id))
  );
$$;

CREATE OR REPLACE FUNCTION public.demands_downloadable_by_user(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.demands
  WHERE public.has_role(_user_id, 'ceo') OR public.has_role(_user_id, 'atendente') OR public.has_role(_user_id, 'admin');
$$;
