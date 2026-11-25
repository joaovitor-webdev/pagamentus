-- ============================================================================
-- PAGAMENTUS - Migration 0009: Fase 4 (Contabilidade, Múltiplas Partidas e
-- Apropriação Automática da Folha de Pagamento)
-- ============================================================================

-- 1. Contas analíticas padrão para apropriação da folha nas empresas PJ existentes
INSERT INTO public.plano_contas (empresa_id, codigo, nome, tipo, natureza, grupo)
SELECT e.id, c.codigo, c.nome, 'ANALITICA', c.natureza, c.grupo
FROM public.empresas e
CROSS JOIN (
  VALUES
    ('2.1.01.001', 'Salários a Pagar', 'CREDORA', 'PASSIVO'),
    ('2.1.02.001', 'INSS a Recolher', 'CREDORA', 'PASSIVO'),
    ('2.1.02.002', 'IRRF a Recolher', 'CREDORA', 'PASSIVO'),
    ('2.1.02.003', 'FGTS a Recolher', 'CREDORA', 'PASSIVO'),
    ('4.1.01.002', 'Despesa com FGTS', 'DEVEDORA', 'DESPESA')
) AS c(codigo, nome, natureza, grupo)
WHERE e.tipo_pessoa = 'PJ'
ON CONFLICT (empresa_id, codigo) DO NOTHING;

-- 2. Suporte a estorno em lancamentos_contabeis
ALTER TABLE public.lancamentos_contabeis
  ADD COLUMN IF NOT EXISTS estornado BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS estorno_de_id UUID REFERENCES public.lancamentos_contabeis(id);

-- 3. Validação no banco: só permite FECHAR competência se status anterior for CONFERIDA
CREATE OR REPLACE FUNCTION public.fn_validar_transicao_competencia()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status_folha = 'FECHADA' AND OLD.status_folha <> 'CONFERIDA' THEN
    RAISE EXCEPTION 'A competência só pode ser FECHADA após estar CONFERIDA (status atual: %).', OLD.status_folha;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_transicao_competencia ON public.competencias;
CREATE TRIGGER trg_validar_transicao_competencia
  BEFORE UPDATE ON public.competencias
  FOR EACH ROW EXECUTE FUNCTION public.fn_validar_transicao_competencia();

-- 4. Apropriação automática da folha ao FECHAR competência
CREATE OR REPLACE FUNCTION public.apropriar_folha_contabil(
  p_empresa_id UUID,
  p_competencia CHAR(7)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_comp_id UUID;
  v_total_proventos NUMERIC(14,2);
  v_total_inss NUMERIC(14,2);
  v_total_irrf NUMERIC(14,2);
  v_total_fgts NUMERIC(14,2);
  v_c_desp_sal UUID;
  v_c_sal_pagar UUID;
  v_c_inss_rec UUID;
  v_c_irrf_rec UUID;
  v_c_desp_fgts UUID;
  v_c_fgts_rec UUID;
BEGIN
  SELECT id INTO v_comp_id FROM public.competencias WHERE empresa_id = p_empresa_id AND ano_mes = p_competencia LIMIT 1;
  SELECT COALESCE(SUM(total_proventos), 0), COALESCE(SUM(inss_valor), 0), COALESCE(SUM(irrf_valor), 0), COALESCE(SUM(fgts_valor), 0)
  INTO v_total_proventos, v_total_inss, v_total_irrf, v_total_fgts
  FROM public.folha_calculos WHERE empresa_id = p_empresa_id AND competencia = p_competencia;

  SELECT id INTO v_c_desp_sal FROM public.plano_contas WHERE empresa_id = p_empresa_id AND codigo = '4.1.01.001' LIMIT 1;
  SELECT id INTO v_c_sal_pagar FROM public.plano_contas WHERE empresa_id = p_empresa_id AND codigo = '2.1.01.001' LIMIT 1;
  SELECT id INTO v_c_inss_rec FROM public.plano_contas WHERE empresa_id = p_empresa_id AND codigo = '2.1.02.001' LIMIT 1;
  SELECT id INTO v_c_irrf_rec FROM public.plano_contas WHERE empresa_id = p_empresa_id AND codigo = '2.1.02.002' LIMIT 1;
  SELECT id INTO v_c_desp_fgts FROM public.plano_contas WHERE empresa_id = p_empresa_id AND codigo = '4.1.01.002' LIMIT 1;
  SELECT id INTO v_c_fgts_rec FROM public.plano_contas WHERE empresa_id = p_empresa_id AND codigo = '2.1.02.003' LIMIT 1;

  IF v_total_proventos > 0 AND v_c_desp_sal IS NOT NULL AND v_c_sal_pagar IS NOT NULL THEN
    INSERT INTO public.lancamentos_contabeis (empresa_id, competencia_id, data_lancamento, historico, conta_debito_id, conta_credito_id, valor, origem, criado_por)
    VALUES (p_empresa_id, v_comp_id, CURRENT_DATE, 'Apropriação de Salários - Comp. ' || p_competencia, v_c_desp_sal, v_c_sal_pagar, v_total_proventos, 'FOLHA', auth.uid());
  END IF;

  IF v_total_inss > 0 AND v_c_sal_pagar IS NOT NULL AND v_c_inss_rec IS NOT NULL THEN
    INSERT INTO public.lancamentos_contabeis (empresa_id, competencia_id, data_lancamento, historico, conta_debito_id, conta_credito_id, valor, origem, criado_por)
    VALUES (p_empresa_id, v_comp_id, CURRENT_DATE, 'Retenção de INSS s/ Folha - Comp. ' || p_competencia, v_c_sal_pagar, v_c_inss_rec, v_total_inss, 'FOLHA', auth.uid());
  END IF;

  IF v_total_irrf > 0 AND v_c_sal_pagar IS NOT NULL AND v_c_irrf_rec IS NOT NULL THEN
    INSERT INTO public.lancamentos_contabeis (empresa_id, competencia_id, data_lancamento, historico, conta_debito_id, conta_credito_id, valor, origem, criado_por)
    VALUES (p_empresa_id, v_comp_id, CURRENT_DATE, 'Retenção de IRRF s/ Folha - Comp. ' || p_competencia, v_c_sal_pagar, v_c_irrf_rec, v_total_irrf, 'FOLHA', auth.uid());
  END IF;

  IF v_total_fgts > 0 AND v_c_desp_fgts IS NOT NULL AND v_c_fgts_rec IS NOT NULL THEN
    INSERT INTO public.lancamentos_contabeis (empresa_id, competencia_id, data_lancamento, historico, conta_debito_id, conta_credito_id, valor, origem, criado_por)
    VALUES (p_empresa_id, v_comp_id, CURRENT_DATE, 'Apropriação de FGTS - Comp. ' || p_competencia, v_c_desp_fgts, v_c_fgts_rec, v_total_fgts, 'FOLHA', auth.uid());
  END IF;
END;
$$;

-- 5. Estorno automático ao REABRIR competência
CREATE OR REPLACE FUNCTION public.estornar_apropriacao_folha(
  p_empresa_id UUID,
  p_competencia CHAR(7)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT * FROM public.lancamentos_contabeis
    WHERE empresa_id = p_empresa_id
      AND origem = 'FOLHA'
      AND estornado = FALSE
      AND historico LIKE '%' || p_competencia || '%'
  LOOP
    INSERT INTO public.lancamentos_contabeis (empresa_id, competencia_id, data_lancamento, historico, conta_debito_id, conta_credito_id, valor, origem, estorno_de_id, criado_por)
    VALUES (v_rec.empresa_id, v_rec.competencia_id, CURRENT_DATE, 'ESTORNO: ' || v_rec.historico, v_rec.conta_credito_id, v_rec.conta_debito_id, v_rec.valor, 'ESTORNO', v_rec.id, auth.uid());

    UPDATE public.lancamentos_contabeis SET estornado = TRUE WHERE id = v_rec.id;
  END LOOP;
END;
$$;
