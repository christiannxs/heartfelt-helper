-- Produtor pode criar demandas, apenas atribuídas a si mesmo (producer_name = seu display_name)
CREATE POLICY "Produtor can create demands" ON public.demands
FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'produtor')
  AND created_by = auth.uid()
  AND producer_name = public.get_producer_name(auth.uid())
);
