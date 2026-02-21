-- Permitir leitura anônima de app_config para que visitantes
-- (não logados) possam verificar se o setup já foi feito e
-- saber se devem ir para /setup ou /auth
DROP POLICY IF EXISTS "Anonymous can read app_config" ON public.app_config;
CREATE POLICY "Anonymous can read app_config" ON public.app_config
FOR SELECT TO anon USING (true);
