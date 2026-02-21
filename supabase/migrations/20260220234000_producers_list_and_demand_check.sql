-- Remover CHECK fixo de producer_name: produtores vêm dos usuários cadastrados (role produtor)
ALTER TABLE public.demands
  DROP CONSTRAINT IF EXISTS demands_producer_name_check;

-- Função para listar produtores (display_name dos usuários com role produtor)
-- Qualquer autenticado pode chamar (quem cria demanda precisa ver a lista)
CREATE OR REPLACE FUNCTION public.get_producers()
RETURNS TABLE (display_name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.display_name
  FROM public.profiles p
  JOIN public.user_roles r ON r.user_id = p.user_id AND r.role = 'produtor'
  ORDER BY p.display_name
$$;
