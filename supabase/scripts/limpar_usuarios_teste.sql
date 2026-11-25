-- ============================================================================
-- Script de Segurança Pré-Produção:
-- Remove os 5 usuários de teste do seed antes de colocar o sistema em produção.
-- ============================================================================

ALTER TABLE public.auditoria DROP CONSTRAINT IF EXISTS auditoria_usuario_id_fkey;

UPDATE public.lancamentos_contabeis SET criado_por = NULL WHERE criado_por IN (
  SELECT id FROM auth.users WHERE email LIKE '%@pagamentus.test'
);
UPDATE public.apuracoes_fiscais SET aprovado_por = NULL WHERE aprovado_por IN (
  SELECT id FROM auth.users WHERE email LIKE '%@pagamentus.test'
);
UPDATE public.obrigacoes_acessorias SET responsavel_id = NULL WHERE responsavel_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@pagamentus.test'
);

DELETE FROM public.usuarios_perfis
WHERE email IN (
  'admin@pagamentus.test',
  'contador@pagamentus.test',
  'rh@pagamentus.test',
  'financeiro@pagamentus.test',
  'cliente@pagamentus.test'
);

DELETE FROM auth.identities
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@pagamentus.test'
);

DELETE FROM auth.users
WHERE email IN (
  'admin@pagamentus.test',
  'contador@pagamentus.test',
  'rh@pagamentus.test',
  'financeiro@pagamentus.test',
  'cliente@pagamentus.test'
);
