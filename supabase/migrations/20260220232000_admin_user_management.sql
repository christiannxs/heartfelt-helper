-- Admin pode inserir user_roles para qualquer usuário (cadastro de atendentes, CEOs, produtores)
CREATE POLICY "Admin can insert any user role" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update any user role" ON public.user_roles
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete any user role" ON public.user_roles
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin pode visualizar todos os user_roles (para listar usuários cadastrados)
CREATE POLICY "Admin can view all user roles" ON public.user_roles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin pode atualizar profiles de qualquer usuário (display_name ao cadastrar)
CREATE POLICY "Admin can update any profile" ON public.profiles
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin pode visualizar todos os profiles (para listar usuários)
CREATE POLICY "Admin can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Permite anon ler app_config para verificar setup_complete (redirecionar Setup vs Auth)
CREATE POLICY "Anon can read app_config for setup check" ON public.app_config
FOR SELECT TO anon USING (true);
