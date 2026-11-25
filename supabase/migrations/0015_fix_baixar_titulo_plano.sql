CREATE OR REPLACE FUNCTION public.baixar_titulo_com_contabil(
  p_titulo_id UUID,
  p_data_baixa DATE,
  p_valor_pago NUMERIC,
  p_juros NUMERIC DEFAULT 0,
  p_multa NUMERIC DEFAULT 0,
  p_desconto NUMERIC DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_titulo RECORD;
  v_conta_banco UUID;
  v_conta_contrapartida UUID;
  v_conta_debito UUID;
  v_conta_credito UUID;
  v_competencia_id UUID;
  v_lancamento_id UUID;
  v_valor_liquido NUMERIC(14,2);
  v_novo_valor_pago NUMERIC(14,2);
  v_novo_status TEXT;
  v_historico TEXT;
BEGIN
  SELECT * INTO v_titulo
  FROM public.titulos_financeiros
  WHERE id = p_titulo_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Título financeiro não encontrado.';
  END IF;

  IF v_titulo.status = 'LIQUIDADO' THEN
    RAISE EXCEPTION 'Título já está liquidado.';
  END IF;

  v_valor_liquido := ROUND(COALESCE(p_valor_pago, 0) + COALESCE(p_juros, 0) + COALESCE(p_multa, 0) - COALESCE(p_desconto, 0), 2);
  IF v_valor_liquido <= 0 THEN
    RAISE EXCEPTION 'Valor líquido da baixa deve ser maior que zero.';
  END IF;

  v_novo_valor_pago := ROUND(COALESCE(v_titulo.valor_pago, 0) + COALESCE(p_valor_pago, 0), 2);
  IF v_novo_valor_pago >= v_titulo.valor THEN
    v_novo_status := 'LIQUIDADO';
  ELSE
    v_novo_status := 'PARCIAL';
  END IF;

  UPDATE public.titulos_financeiros
  SET
    valor_pago = v_novo_valor_pago,
    juros = ROUND(COALESCE(juros, 0) + COALESCE(p_juros, 0), 2),
    multa = ROUND(COALESCE(multa, 0) + COALESCE(p_multa, 0), 2),
    desconto = ROUND(COALESCE(desconto, 0) + COALESCE(p_desconto, 0), 2),
    status = v_novo_status
  WHERE id = p_titulo_id;

  SELECT id INTO v_competencia_id
  FROM public.competencias
  WHERE empresa_id = v_titulo.empresa_id
  LIMIT 1;

  SELECT id INTO v_conta_banco
  FROM public.plano_contas
  WHERE empresa_id = v_titulo.empresa_id AND codigo = '1.1.02.001'
  LIMIT 1;

  IF v_conta_banco IS NULL THEN
    SELECT id INTO v_conta_banco
    FROM public.plano_contas
    WHERE empresa_id = v_titulo.empresa_id AND tipo = 'ATIVO'
    ORDER BY codigo DESC
    LIMIT 1;
  END IF;

  IF v_titulo.tipo = 'RECEBER' THEN
    SELECT id INTO v_conta_contrapartida
    FROM public.plano_contas
    WHERE empresa_id = v_titulo.empresa_id AND codigo = '1.1.03.001'
    LIMIT 1;
    IF v_conta_contrapartida IS NULL THEN
      SELECT id INTO v_conta_contrapartida
      FROM public.plano_contas
      WHERE empresa_id = v_titulo.empresa_id AND tipo = 'RECEITA'
      ORDER BY codigo DESC
      LIMIT 1;
    END IF;
    v_conta_debito := v_conta_banco;
    v_conta_credito := v_conta_contrapartida;
    v_historico := format('Recebimento título %s - %s', COALESCE(v_titulo.parceiro_nome, 'Cliente'), to_char(p_data_baixa, 'DD/MM/YYYY'));
  ELSE
    SELECT id INTO v_conta_contrapartida
    FROM public.plano_contas
    WHERE empresa_id = v_titulo.empresa_id AND codigo = '2.1.01.001'
    LIMIT 1;
    IF v_conta_contrapartida IS NULL THEN
      SELECT id INTO v_conta_contrapartida
      FROM public.plano_contas
      WHERE empresa_id = v_titulo.empresa_id AND tipo = 'DESPESA'
      ORDER BY codigo DESC
      LIMIT 1;
    END IF;
    v_conta_debito := v_conta_contrapartida;
    v_conta_credito := v_conta_banco;
    v_historico := format('Pagamento título %s - %s', COALESCE(v_titulo.parceiro_nome, 'Fornecedor'), to_char(p_data_baixa, 'DD/MM/YYYY'));
  END IF;

  IF v_competencia_id IS NOT NULL AND v_conta_debito IS NOT NULL AND v_conta_credito IS NOT NULL THEN
    INSERT INTO public.lancamentos_contabeis (
      empresa_id, competencia_id, data_lancamento, historico, conta_debito_id, conta_credito_id, valor, origem, criado_por
    ) VALUES (
      v_titulo.empresa_id, v_competencia_id, p_data_baixa, v_historico, v_conta_debito, v_conta_credito, v_valor_liquido, 'FINANCEIRO', auth.uid()
    )
    RETURNING id INTO v_lancamento_id;

    INSERT INTO public.partidas_contabeis (lancamento_id, conta_id, tipo, valor) VALUES
      (v_lancamento_id, v_conta_debito, 'D', v_valor_liquido),
      (v_lancamento_id, v_conta_credito, 'C', v_valor_liquido);
  END IF;

  RETURN v_lancamento_id;
END;
$$;
