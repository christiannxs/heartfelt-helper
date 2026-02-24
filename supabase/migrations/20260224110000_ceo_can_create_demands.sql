-- CEO pode criar demandas (como Admin e Atendente)
CREATE POLICY "CEO can create demands" ON public.demands
FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'ceo') AND created_by = auth.uid()
);
