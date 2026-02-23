-- Habilita Realtime na tabela demands para notificações in-app quando o status muda.
ALTER PUBLICATION supabase_realtime ADD TABLE public.demands;
