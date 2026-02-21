-- Cole no SQL Editor do Dashboard e rode para conferir se os 2 produtores batem com as demandas.
-- Assim você vê se display_name (perfil) = producer_name (demanda) para upload funcionar.

-- 1) Usuários com role produtor e seu display_name (o que get_producer_name retorna)
SELECT
  p.user_id,
  p.display_name AS "display_name (perfil)",
  TRIM(p.display_name) AS "trim(display_name)",
  LOWER(TRIM(COALESCE(p.display_name, ''))) AS "comparação (lower+trim)"
FROM public.profiles p
JOIN public.user_roles r ON r.user_id = p.user_id AND r.role = 'produtor'
ORDER BY p.display_name;

-- 2) Demandas concluídas e producer_name (só concluídas permitem upload)
SELECT
  id AS demand_id,
  name,
  producer_name AS "producer_name (demanda)",
  TRIM(producer_name) AS "trim(producer_name)",
  LOWER(TRIM(COALESCE(producer_name, ''))) AS "comparação (lower+trim)",
  status
FROM public.demands
WHERE status = 'concluido'
ORDER BY producer_name, name;

-- 3) Para cada produtor: demandas concluídas em que ELE pode fazer upload
-- (deve listar as demandas onde producer_name bate com seu display_name)
SELECT
  p.display_name AS produtor,
  d.id AS demand_id,
  d.name AS demanda,
  d.producer_name,
  d.status
FROM public.profiles p
JOIN public.user_roles r ON r.user_id = p.user_id AND r.role = 'produtor'
CROSS JOIN public.demands d
WHERE d.status = 'concluido'
  AND LOWER(TRIM(COALESCE(d.producer_name, ''))) = LOWER(COALESCE(TRIM(p.display_name), ''))
ORDER BY p.display_name, d.name;

-- Se a query 3 não retornar linhas para algum produtor, o display_name dele
-- não está igual (ignorando maiúsculas/espaços) ao producer_name de nenhuma demanda concluída.
-- Ajuste profiles.display_name ou crie demandas com esse producer_name.
