-- Migration 0021: Apuração fiscal dinâmica a partir das receitas do Diário e reversão/reapuração de 11/2026

CREATE OR REPLACE FUNCTION public.apurar_competencia_fiscal(
  p_empresa_id UUID,
  p_competencia TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inicio DATE;
  v_fim DATE;
  v_comp_id UUID;
  v_receita_mes NUMERIC(14,2);
  v_param RECORD;
  v_count INTEGER := 0;
  v_iss NUMERIC(14,2);
  v_pis_cofins NUMERIC(14,2);
BEGIN
  v_inicio := to_date(p_competencia || '-01', 'YYYY-MM-DD');
  v_fim := (v_inicio + INTERVAL '1 month - 1 day')::DATE;

  SELECT id INTO v_comp_id
  FROM public.competencias
  WHERE empresa_id = p_empresa_id AND ano_mes = p_competencia
  LIMIT 1;

  IF v_comp_id IS NULL THEN
    INSERT INTO public.competencias (empresa_id, ano_mes)
    VALUES (p_empresa_id, p_competencia)
    RETURNING id INTO v_comp_id;
  END IF;

  SELECT COALESCE(SUM(
    CASE WHEN lp.tipo = 'CREDITO' THEN lp.valor ELSE -lp.valor END
  ), 0) INTO v_receita_mes
  FROM public.lancamentos_partidas lp
  JOIN public.lancamentos_contabeis lc ON lc.id = lp.lancamento_id
  JOIN public.plano_contas pc ON pc.id = lp.conta_id
  WHERE lc.empresa_id = p_empresa_id
    AND lc.estornado = FALSE
    AND lc.data_lancamento BETWEEN v_inicio AND v_fim
    AND pc.codigo LIKE '3.%';

  SELECT * INTO v_param
  FROM public.parametros_lucro_presumido
  WHERE atividade = 'SERVICOS_GERAIS'
  LIMIT 1;

  -- Remove apurações ainda não aprovadas desta empresa/competência
  DELETE FROM public.apuracoes_fiscais
  WHERE empresa_id = p_empresa_id
    AND competencia = p_competencia
    AND status <> 'APROVADA';

  -- ISS (5,00%)
  IF NOT EXISTS (
    SELECT 1 FROM public.apuracoes_fiscais
    WHERE empresa_id = p_empresa_id AND competencia = p_competencia AND tributo = 'ISS' AND status = 'APROVADA'
  ) THEN
    v_iss := ROUND(v_receita_mes * COALESCE(v_param.aliquota_iss_padrao, 0.05), 2);
    INSERT INTO public.apuracoes_fiscais (empresa_id, competencia, tributo, regime, base_calculo, aliquota, valor_apurado, status, codigo_receita, vencimento_guia)
    VALUES (p_empresa_id, p_competencia, 'ISS', 'PRESUMIDO', v_receita_mes, COALESCE(v_param.aliquota_iss_padrao, 0.05) * 100, v_iss, 'AGUARDANDO_CONFERENCIA', 'ISS-MUN', v_fim);
    v_count := v_count + 1;
  END IF;

  -- PIS/COFINS (3,65%)
  IF NOT EXISTS (
    SELECT 1 FROM public.apuracoes_fiscais
    WHERE empresa_id = p_empresa_id AND competencia = p_competencia AND tributo = 'PIS/COFINS' AND status = 'APROVADA'
  ) THEN
    v_pis_cofins := ROUND(v_receita_mes * (COALESCE(v_param.aliquota_pis, 0.0065) + COALESCE(v_param.aliquota_cofins, 0.03)), 2);
    INSERT INTO public.apuracoes_fiscais (empresa_id, competencia, tributo, regime, base_calculo, aliquota, valor_apurado, status, codigo_receita, vencimento_guia)
    VALUES (p_empresa_id, p_competencia, 'PIS/COFINS', 'PRESUMIDO', v_receita_mes, (COALESCE(v_param.aliquota_pis, 0.0065) + COALESCE(v_param.aliquota_cofins, 0.03)) * 100, v_pis_cofins, 'AGUARDANDO_CONFERENCIA', '8109/2172', v_fim);
    v_count := v_count + 1;
  END IF;

  RETURN v_count;
END;
$$;

-- Reverter ISS antigo (R$ 750,00) de 11/2026 da Tecnologia Horizonte, reapurar com receita real (R$ 27.500,00) e aprovar o novo ISS (R$ 1.375,00)
DO $$
DECLARE
  v_iss_id UUID;
  v_lanc_id_old UUID;
  v_old RECORD;
  v_est_id UUID;
BEGIN
  SELECT id, lancamento_id INTO v_iss_id, v_lanc_id_old
  FROM public.apuracoes_fiscais
  WHERE empresa_id = '33333333-3333-3333-3333-333333333331'
    AND tributo = 'ISS'
    AND base_calculo = 15000.00
    AND status = 'APROVADA'
  LIMIT 1;

  IF v_iss_id IS NOT NULL THEN
    IF v_lanc_id_old IS NOT NULL THEN
      SELECT * INTO v_old FROM public.lancamentos_contabeis WHERE id = v_lanc_id_old;
      IF FOUND AND NOT v_old.estornado THEN
        UPDATE public.lancamentos_contabeis SET estornado = TRUE WHERE id = v_old.id;
        INSERT INTO public.lancamentos_contabeis (
          empresa_id, competencia_id, data_lancamento, historico, conta_debito_id, conta_credito_id, valor, origem
        ) VALUES (
          v_old.empresa_id, v_old.competencia_id, v_old.data_lancamento,
          'Estorno: ' || v_old.historico || ' (reapuração base R$ 27.500,00)',
          v_old.conta_credito_id, v_old.conta_debito_id, v_old.valor, 'ESTORNO'
        ) RETURNING id INTO v_est_id;

        INSERT INTO public.lancamentos_partidas (lancamento_id, conta_id, tipo, valor) VALUES
          (v_est_id, v_old.conta_credito_id, 'DEBITO', v_old.valor),
          (v_est_id, v_old.conta_debito_id, 'CREDITO', v_old.valor);
      END IF;
    END IF;

    UPDATE public.apuracoes_fiscais
    SET status = 'AGUARDANDO_CONFERENCIA', aprovado_por = NULL, aprovado_em = NULL, lancamento_id = NULL
    WHERE id = v_iss_id;
  END IF;

  PERFORM public.apurar_competencia_fiscal('33333333-3333-3333-3333-333333333331', '2026-11');
END $$;
