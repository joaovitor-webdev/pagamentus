-- ============================================================================
-- Script de Segurança Pré-Produção:
-- Remove os 5 usuários de teste do seed antes de colocar o sistema em produção.
-- ============================================================================

DELETE FROM public.usuarios_perfis
WHERE email IN (
  'admin@pagamentus.test',
  'contador@pagamentus.test',
  'rh@pagamentus.test',
  'financeiro@pagamentus.test',
  'cliente@pagamentus.test'
);

DELETE FROM auth.users
WHERE email IN (
  'admin@pagamentus.test',
  'contador@pagamentus.test',
  'rh@pagamentus.test',
  'financeiro@pagamentus.test',
  'cliente@pagamentus.test'
);
