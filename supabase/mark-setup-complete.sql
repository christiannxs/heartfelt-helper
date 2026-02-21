-- Marcar o setup inicial como já concluído (quando as contas já existem, ex.: após deploy no Vercel).
-- Cole no SQL Editor do Dashboard do Supabase (projeto que a app Vercel usa) e execute.

INSERT INTO public.app_config (key, value)
VALUES ('setup_complete', 'true')
ON CONFLICT (key) DO UPDATE SET value = 'true';
