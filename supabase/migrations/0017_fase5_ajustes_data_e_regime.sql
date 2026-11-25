-- Migration 0017: Regime contábil da baixa por empresa (CAIXA x COMPETENCIA), contas 1.1.03.001 / 2.1.03.001 e estorno/reclassificação da data de baixa da Alpha

ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS regime_contabil_baixa TEXT NOT NULL DEFAULT 'CAIXA'
  CHECK (regime_contabil_baixa IN ('CAIXA', 'COMPETENCIA'));

-- Criar contas 1.1.03.001 Clientes a Receber e 2.1.03.001 Fornecedores a Pagar para todas as empresas
INSERT INTO public.plano_contas (empresa_id, codigo, nome, tipo, natureza, grupo)
SELECT e.id, '1.1.03.001', 'Clientes a Receber', 'ANALITICA', 'DEVEDORA', 'ATIVO'
FROM public.empresas e
WHERE NOT EXISTS (
  SELECT 1 FROM public.plano_contas p WHERE p.empresa_id = e.id AND p.codigo = '1.1.03.001'
);

INSERT INTO public.plano_contas (empresa_id, codigo, nome, tipo, natureza, grupo)
SELECT e.id, '2.1.03.001', 'Fornecedores a Pagar', 'ANALITICA', 'CREDORA', 'PASSIVO'
FROM public.empresas e
WHERE NOT EXISTS (
  SELECT 1 FROM public.plano_contas p WHERE p.empresa_id = e.id AND p.codigo = '2.1.03.001'
);

-- Atualizar baixar_titulo_com_contabil respeitando regime_contabil_baixa da empresa
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
  v_regime TEXT;
  v_conta_banco UUID;
  v_conta_contrapartida UUID;
  v_conta_debito UUID;
  v_conta_credito UUID;
  v_competencia_id UUID;
  v_ano_mes TEXT;
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

  SELECT COALESCE(regime_contabil_baixa, 'CAIXA') INTO v_regime
  FROM public.empresas
  WHERE id = v_titulo.empresa_id;

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

  v_ano_mes := to_char(p_data_baixa, 'YYYY-MM');

  SELECT id INTO v_competencia_id
  FROM public.competencias
  WHERE empresa_id = v_titulo.empresa_id AND ano_mes = v_ano_mes
  LIMIT 1;

  IF v_competencia_id IS NULL THEN
    INSERT INTO public.competencias (empresa_id, ano_mes)
    VALUES (v_titulo.empresa_id, v_ano_mes)
    RETURNING id INTO v_competencia_id;
  END IF;

  SELECT id INTO v_conta_banco
  FROM public.plano_contas
  WHERE empresa_id = v_titulo.empresa_id AND codigo = '1.1.02.001'
  LIMIT 1;

  IF v_conta_banco IS NULL THEN
    SELECT id INTO v_conta_banco
    FROM public.plano_contas
    WHERE empresa_id = v_titulo.empresa_id AND codigo LIKE '1.1.%' AND tipo = 'ANALITICA'
    ORDER BY codigo
    LIMIT 1;
  END IF;

  IF v_conta_banco IS NULL THEN
    RAISE EXCEPTION 'Conta contábil de Caixa/Bancos não encontrada para a empresa %.', v_titulo.empresa_id;
  END IF;

  IF v_titulo.tipo = 'RECEBER' THEN
    IF v_regime = 'COMPETENCIA' THEN
      SELECT id INTO v_conta_contrapartida
      FROM public.plano_contas
      WHERE empresa_id = v_titulo.empresa_id AND codigo = '1.1.03.001'
      LIMIT 1;
    ELSE
      SELECT id INTO v_conta_contrapartida
      FROM public.plano_contas
      WHERE empresa_id = v_titulo.empresa_id AND codigo LIKE '3.%' AND tipo = 'ANALITICA'
      ORDER BY codigo
      LIMIT 1;
    END IF;
    v_conta_debito := v_conta_banco;
    v_conta_credito := v_conta_contrapartida;
    v_historico := format('Recebimento título %s - %s', COALESCE(v_titulo.parceiro_nome, 'Cliente'), to_char(p_data_baixa, 'DD/MM/YYYY'));
  ELSE
    IF v_regime = 'COMPETENCIA' THEN
      SELECT id INTO v_conta_contrapartida
      FROM public.plano_contas
      WHERE empresa_id = v_titulo.empresa_id AND codigo = '2.1.03.001'
      LIMIT 1;
    ELSE
      SELECT id INTO v_conta_contrapartida
      FROM public.plano_contas
      WHERE empresa_id = v_titulo.empresa_id AND codigo LIKE '4.%' AND tipo = 'ANALITICA'
      ORDER BY codigo
      LIMIT 1;
    END IF;
    v_conta_debito := v_conta_contrapartida;
    v_conta_credito := v_conta_banco;
    v_historico := format('Pagamento título %s - %s', COALESCE(v_titulo.parceiro_nome, 'Fornecedor'), to_char(p_data_baixa, 'DD/MM/YYYY'));
  END IF;

  IF v_conta_debito IS NULL OR v_conta_credito IS NULL THEN
    RAISE EXCEPTION 'Conta contábil de contrapartida não encontrada para a empresa %.', v_titulo.empresa_id;
  END IF;

  UPDATE public.titulos_financeiros
  SET
    valor_pago = v_novo_valor_pago,
    juros = ROUND(COALESCE(juros, 0) + COALESCE(p_juros, 0), 2),
    multa = ROUND(COALESCE(multa, 0) + COALESCE(p_multa, 0), 2),
    desconto = ROUND(COALESCE(desconto, 0) + COALESCE(p_desconto, 0), 2),
    data_baixa = p_data_baixa,
    status = v_novo_status
  WHERE id = p_titulo_id;

  INSERT INTO public.lancamentos_contabeis (
    empresa_id, competencia_id, data_lancamento, historico, conta_debito_id, conta_credito_id, valor, origem, criado_por
  ) VALUES (
    v_titulo.empresa_id, v_competencia_id, p_data_baixa, v_historico, v_conta_debito, v_conta_credito, v_valor_liquido, 'FINANCEIRO', auth.uid()
  )
  RETURNING id INTO v_lancamento_id;

  INSERT INTO public.lancamentos_partidas (lancamento_id, conta_id, tipo, valor) VALUES
    (v_lancamento_id, v_conta_debito, 'DEBITO', v_valor_liquido),
    (v_lancamento_id, v_conta_credito, 'CREDITO', v_valor_liquido);

  RETURN v_lancamento_id;
END;
$$;

-- Corrigir data de baixa da Alpha (25/11/2026) via estorno + novo lançamento, sem apagar
DO $$
DECLARE
  v_old RECORD;
  v_est_id UUID;
  v_new_id UUID;
BEGIN
  UPDATE public.titulos_financeiros
  SET data_baixa = '2026-11-25'
  WHERE id = '77777777-7777-7777-7777-777777777771';

  SELECT * INTO v_old
  FROM public.lancamentos_contabeis
  WHERE empresa_id = '33333333-3333-3333-3333-333333333331'
    AND origem = 'FINANCEIRO'
    AND historico ILIKE '%Cliente Alpha Consultoria%'
    AND data_lancamento = '2026-11-28'
    AND estornado = FALSE
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.lancamentos_contabeis SET estornado = TRUE WHERE id = v_old.id;

    INSERT INTO public.lancamentos_contabeis (
      empresa_id, competencia_id, data_lancamento, historico, conta_debito_id, conta_credito_id, valor, origem
    ) VALUES (
      v_old.empresa_id, v_old.competencia_id, v_old.data_lancamento,
      'Estorno: ' || v_old.historico || ' (ajuste data de baixa)',
      v_old.conta_credito_id, v_old.conta_debito_id, v_old.valor, 'ESTORNO'
    )
    RETURNING id INTO v_est_id;

    INSERT INTO public.lancamentos_partidas (lancamento_id, conta_id, tipo, valor) VALUES
      (v_est_id, v_old.conta_credito_id, 'DEBITO', v_old.valor),
      (v_est_id, v_old.conta_debito_id, 'CREDITO', v_old.valor);

    INSERT INTO public.lancamentos_contabeis (
      empresa_id, competencia_id, data_lancamento, historico, conta_debito_id, conta_credito_id, valor, origem
    ) VALUES (
      v_old.empresa_id, v_old.competencia_id, '2026-11-25',
      'Recebimento título Cliente Alpha Consultoria (Fictício) - 25/11/2026',
      v_old.conta_debito_id, v_old.conta_credito_id, v_old.valor, 'FINANCEIRO'
    )
    RETURNING id INTO v_new_id;

    INSERT INTO public.lancamentos_partidas (lancamento_id, conta_id, tipo, valor) VALUES
      (v_new_id, v_old.conta_debito_id, 'DEBITO', v_old.valor),
      (v_new_id, v_old.conta_credito_id, 'CREDITO', v_old.valor);
  END IF;
END $$;
