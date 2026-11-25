CREATE OR REPLACE FUNCTION public.aprovar_apuracao_fiscal(p_apuracao_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ap RECORD;
  v_comp_id UUID;
  v_conta_deb UUID;
  v_conta_cred UUID;
  v_lanc_id UUID;
  v_data DATE;
  v_hist TEXT;
BEGIN
  IF NOT public.tem_papel(ARRAY['ADMIN', 'CONTADOR']) THEN
    RAISE EXCEPTION 'Apenas ADMIN ou CONTADOR pode aprovar apuração fiscal.';
  END IF;

  SELECT * INTO v_ap FROM public.apuracoes_fiscais WHERE id = p_apuracao_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Apuração fiscal não encontrada.';
  END IF;
  IF v_ap.status = 'APROVADA' THEN
    RAISE EXCEPTION 'Apuração já está aprovada.';
  END IF;

  v_data := COALESCE(v_ap.vencimento_guia, CURRENT_DATE);

  SELECT id INTO v_comp_id
  FROM public.competencias
  WHERE empresa_id = v_ap.empresa_id AND ano_mes = to_char(v_data, 'YYYY-MM')
  LIMIT 1;

  IF v_comp_id IS NULL THEN
    INSERT INTO public.competencias (empresa_id, ano_mes)
    VALUES (v_ap.empresa_id, to_char(v_data, 'YYYY-MM'))
    RETURNING id INTO v_comp_id;
  END IF;

  SELECT id INTO v_conta_deb FROM public.plano_contas WHERE empresa_id = v_ap.empresa_id AND codigo LIKE '4.%' AND tipo = 'ANALITICA' ORDER BY codigo LIMIT 1;
  SELECT id INTO v_conta_cred FROM public.plano_contas WHERE empresa_id = v_ap.empresa_id AND codigo LIKE '2.1.%' AND tipo = 'ANALITICA' ORDER BY codigo LIMIT 1;

  IF v_conta_deb IS NULL OR v_conta_cred IS NULL THEN
    RAISE EXCEPTION 'Contas contábeis de despesa/tributo a recolher não encontradas.';
  END IF;

  v_hist := format('Provisão %s - apuração fiscal', v_ap.tributo);

  INSERT INTO public.lancamentos_contabeis (
    empresa_id, competencia_id, data_lancamento, historico, conta_debito_id, conta_credito_id, valor, origem, criado_por
  ) VALUES (
    v_ap.empresa_id, v_comp_id, v_data, v_hist, v_conta_deb, v_conta_cred, v_ap.valor_apurado, 'FISCAL', auth.uid()
  ) RETURNING id INTO v_lanc_id;

  INSERT INTO public.lancamentos_partidas (lancamento_id, conta_id, tipo, valor) VALUES
    (v_lanc_id, v_conta_deb, 'DEBITO', v_ap.valor_apurado),
    (v_lanc_id, v_conta_cred, 'CREDITO', v_ap.valor_apurado);

  UPDATE public.apuracoes_fiscais
  SET status = 'APROVADA', aprovado_por = auth.uid(), aprovado_em = NOW(), lancamento_id = v_lanc_id
  WHERE id = p_apuracao_id;

  RETURN v_lanc_id;
END;
$$;
