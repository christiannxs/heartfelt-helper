-- Incluir "admin" no enum de roles (em migration separada: ADD VALUE não pode ser usado na mesma transação)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
