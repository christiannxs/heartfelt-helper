-- Regra de negócio: apenas quem criou a demanda pode alterá-la (inclusive prazo/data).
-- Isso vale para todos os papéis (atendente, produtor, CEO, admin): se não for o criador,
-- pode no máximo mudar status onde já há política específica, mas NÃO editar campos gerais.

-- Remover políticas amplas de UPDATE em demands para CEO/Atendente/Admin.
DROP POLICY IF EXISTS "Atendente can update demands" ON public.demands;
DROP POLICY IF EXISTS "CEO can update demands" ON public.demands;
DROP POLICY IF EXISTS "Admin can update demands" ON public.demands;

-- Política única: somente o criador pode atualizar a demanda inteira.
CREATE POLICY "Creator can update own demand" ON public.demands
FOR UPDATE TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

