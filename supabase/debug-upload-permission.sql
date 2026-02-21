-- Diagnóstico de permissão de upload (rodar no SQL Editor com o usuário logado não dá;
-- use no Dashboard para checar dados). Substitua DEMAND_ID e USER_ID pelos UUIDs reais.
-- Ou rode via RPC/API como o próprio usuário.

-- Exemplo: ver se a demanda está em demands_uploadable_by_user para o usuário
-- (troque 'SEU-USER-UUID' pelo auth.uid() do produtor, e 'DEMAND-UUID' pelo id da demanda)
/*
SELECT 
  'SEU-USER-UUID'::uuid AS user_id,
  'DEMAND-UUID'::uuid AS demand_id,
  (SELECT public.get_producer_name('SEU-USER-UUID'::uuid)) AS producer_name_from_profile,
  (SELECT producer_name FROM public.demands WHERE id = 'DEMAND-UUID'::uuid) AS producer_name_on_demand,
  (SELECT 'DEMAND-UUID'::uuid IN (SELECT public.demands_uploadable_by_user('SEU-USER-UUID'::uuid))) AS demand_in_uploadable,
  (SELECT public.can_manage_deliverable_for_demand('DEMAND-UUID'::uuid)) AS can_manage;
*/

-- Se demand_in_uploadable ou can_manage forem false, o upload será bloqueado.
-- Confira: producer_name na demanda deve bater (com trim/lower) com display_name do perfil.
