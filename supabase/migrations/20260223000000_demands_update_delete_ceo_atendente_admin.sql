-- CEO, Atendente e Admin podem editar e apagar demandas

CREATE POLICY "Atendente can update demands" ON public.demands
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'atendente'))
WITH CHECK (public.has_role(auth.uid(), 'atendente'));

CREATE POLICY "Atendente can delete demands" ON public.demands
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'atendente'));

CREATE POLICY "CEO can update demands" ON public.demands
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'ceo'))
WITH CHECK (public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "CEO can delete demands" ON public.demands
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "Admin can update demands" ON public.demands
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete demands" ON public.demands
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
