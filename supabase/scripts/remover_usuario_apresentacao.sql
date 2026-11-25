-- Script para remover o usuário de apresentação após a demonstração
-- Execute no SQL Editor do Supabase ou via CLI

ALTER TABLE public.auditoria DROP CONSTRAINT IF EXISTS auditoria_usuario_id_fkey;

DO $$
DECLARE
  v_uid UUID;
BEGIN
  SELECT id INTO v_uid
  FROM auth.users
  WHERE email = 'apresentacao@pagamentus.demo';

  IF v_uid IS NOT NULL THEN
    UPDATE public.lancamentos_contabeis SET criado_por = NULL WHERE criado_por = v_uid;
    UPDATE public.apuracoes_fiscais SET aprovado_por = NULL WHERE aprovado_por = v_uid;
    UPDATE public.obrigacoes_acessorias SET responsavel_id = NULL WHERE responsavel_id = v_uid;

    DELETE FROM public.usuarios_perfis WHERE usuario_id = v_uid;
    DELETE FROM auth.identities WHERE user_id = v_uid;
    DELETE FROM auth.users WHERE id = v_uid;
  END IF;
END $$;
