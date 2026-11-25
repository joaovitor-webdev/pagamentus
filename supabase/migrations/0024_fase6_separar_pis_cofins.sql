-- Migration 0024: Separar apuração PIS (0,65%) e COFINS (3,00%)

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
  v_receita_mes NUMERIC(14,2);
  v_param RECORD;
  v_count INTEGER := 0;
  v_iss NUMERIC(14,2);
  v_pis NUMERIC(14,2);
  v_cofins NUMERIC(14,2);
BEGIN
  v_inicio := to_date(p_competencia || '-01', 'YYYY-MM-DD');
  v_fim := (v_inicio + INTERVAL '1 month - 1 day')::DATE;

  SELECT COALESCE(SUM(lc.valor), 0) INTO v_receita_mes
  FROM public.lancamentos_contabeis lc
  JOIN public.plano_contas pc ON pc.id = lc.conta_credito_id
  WHERE lc.empresa_id = p_empresa_id
    AND lc.estornado = FALSE
    AND lc.data_lancamento BETWEEN v_inicio AND v_fim
    AND pc.codigo LIKE '3.1.%';

  SELECT * INTO v_param
  FROM public.parametros_lucro_presumido
  WHERE atividade = 'SERVICOS_GERAIS'
  LIMIT 1;

  DELETE FROM public.apuracoes_fiscais
  WHERE empresa_id = p_empresa_id
    AND competencia = p_competencia
    AND status <> 'APROVADA';

  IF NOT EXISTS (
    SELECT 1 FROM public.apuracoes_fiscais
    WHERE empresa_id = p_empresa_id AND competencia = p_competencia AND tributo = 'ISS' AND status = 'APROVADA'
  ) THEN
    v_iss := ROUND(v_receita_mes * COALESCE(v_param.aliquota_iss_padrao, 0.05), 2);
    INSERT INTO public.apuracoes_fiscais (empresa_id, competencia, tributo, regime, base_calculo, aliquota, valor_apurado, status, codigo_receita, vencimento_guia)
    VALUES (p_empresa_id, p_competencia, 'ISS', 'PRESUMIDO', v_receita_mes, COALESCE(v_param.aliquota_iss_padrao, 0.05) * 100, v_iss, 'AGUARDANDO_CONFERENCIA', 'ISS-MUN', v_fim);
    v_count := v_count + 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.apuracoes_fiscais
    WHERE empresa_id = p_empresa_id AND competencia = p_competencia AND tributo = 'PIS' AND status = 'APROVADA'
  ) THEN
    v_pis := ROUND(v_receita_mes * COALESCE(v_param.aliquota_pis, 0.0065), 2);
    INSERT INTO public.apuracoes_fiscais (empresa_id, competencia, tributo, regime, base_calculo, aliquota, valor_apurado, status, codigo_receita, vencimento_guia)
    VALUES (p_empresa_id, p_competencia, 'PIS', 'PRESUMIDO', v_receita_mes, COALESCE(v_param.aliquota_pis, 0.0065) * 100, v_pis, 'AGUARDANDO_CONFERENCIA', '8109', v_fim);
    v_count := v_count + 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.apuracoes_fiscais
    WHERE empresa_id = p_empresa_id AND competencia = p_competencia AND tributo = 'COFINS' AND status = 'APROVADA'
  ) THEN
    v_cofins := ROUND(v_receita_mes * COALESCE(v_param.aliquota_cofins, 0.03), 2);
    INSERT INTO public.apuracoes_fiscais (empresa_id, competencia, tributo, regime, base_calculo, aliquota, valor_apurado, status, codigo_receita, vencimento_guia)
    VALUES (p_empresa_id, p_competencia, 'COFINS', 'PRESUMIDO', v_receita_mes, COALESCE(v_param.aliquota_cofins, 0.03) * 100, v_cofins, 'AGUARDANDO_CONFERENCIA', '2172', v_fim);
    v_count := v_count + 1;
  END IF;

  RETURN v_count;
END;
$$;

SELECT public.apurar_competencia_fiscal('33333333-3333-3333-3333-333333333331', '2026-11');
