-- Comparação case-insensitive entre display_name e producer_name para evitar
-- "new row violates row-level security policy" quando o nome difere só por maiúsculas/minúsculas.

CREATE OR REPLACE FUNCTION public.can_manage_deliverable_for_demand(_demand_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _producer_display_name TEXT;
  _demand_producer_name TEXT;
BEGIN
  IF _uid IS NULL THEN
    RETURN false;
  END IF;
  -- Staff pode gerenciar qualquer entrega
  IF public.has_role(_uid, 'atendente') OR public.has_role(_uid, 'ceo') OR public.has_role(_uid, 'admin') THEN
    RETURN true;
  END IF;
  -- Produtor: só se a demanda for dele (producer_name = display_name do perfil, case-insensitive)
  IF NOT public.has_role(_uid, 'produtor') THEN
    RETURN false;
  END IF;
  SELECT TRIM(display_name) INTO _producer_display_name
  FROM public.profiles WHERE user_id = _uid;
  SELECT TRIM(producer_name) INTO _demand_producer_name
  FROM public.demands WHERE id = _demand_id;
  RETURN _producer_display_name IS NOT NULL
    AND _demand_producer_name IS NOT NULL
    AND LOWER(_producer_display_name) = LOWER(_demand_producer_name);
END;
$$;
