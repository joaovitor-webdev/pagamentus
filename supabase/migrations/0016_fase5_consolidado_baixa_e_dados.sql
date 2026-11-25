-- Migration 0016: Correção consolidada da baixa financeira atômica, dados inconsistentes e constraint de valor_pago

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
    SELECT id INTO v_conta_contrapartida
    FROM public.plano_contas
    WHERE empresa_id = v_titulo.empresa_id AND codigo = '1.1.03.001'
    LIMIT 1;
    IF v_conta_contrapartida IS NULL THEN
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
    SELECT id INTO v_conta_contrapartida
    FROM public.plano_contas
    WHERE empresa_id = v_titulo.empresa_id AND codigo = '2.1.01.001'
    LIMIT 1;
    IF v_conta_contrapartida IS NULL THEN
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

-- 1. Corrigir títulos LIQUIDADO com valor_pago = 0 (ex.: Comércio Estrela do Sul Ltda)
UPDATE public.titulos_financeiros
SET
  valor_pago = valor,
  data_baixa = COALESCE(data_baixa, vencimento)
WHERE status = 'LIQUIDADO' AND (valor_pago IS NULL OR valor_pago <= 0);

-- Garantir no banco que status LIQUIDADO exige valor_pago > 0
ALTER TABLE public.titulos_financeiros
  DROP CONSTRAINT IF EXISTS chk_titulo_pago_valor_positivo;
ALTER TABLE public.titulos_financeiros
  ADD CONSTRAINT chk_titulo_pago_valor_positivo
  CHECK (status <> 'LIQUIDADO' OR valor_pago > 0);

-- 2. Gerar lançamentos contábeis faltantes para títulos LIQUIDADO sem lançamento FINANCEIRO correspondente
DO $$
DECLARE
  r RECORD;
  v_comp_id UUID;
  v_banco UUID;
  v_contra UUID;
  v_deb UUID;
  v_cred UUID;
  v_lanc_id UUID;
  v_data DATE;
  v_hist TEXT;
BEGIN
  FOR r IN
    SELECT t.*
    FROM public.titulos_financeiros t
    WHERE t.status = 'LIQUIDADO'
      AND NOT EXISTS (
        SELECT 1 FROM public.lancamentos_contabeis l
        WHERE l.empresa_id = t.empresa_id
          AND l.origem = 'FINANCEIRO'
          AND l.historico ILIKE '%' || COALESCE(t.parceiro_nome, '') || '%'
      )
  LOOP
    v_data := COALESCE(r.data_baixa, r.vencimento, CURRENT_DATE);

    SELECT id INTO v_comp_id
    FROM public.competencias
    WHERE empresa_id = r.empresa_id AND ano_mes = to_char(v_data, 'YYYY-MM')
    LIMIT 1;

    IF v_comp_id IS NULL THEN
      INSERT INTO public.competencias (empresa_id, ano_mes)
      VALUES (r.empresa_id, to_char(v_data, 'YYYY-MM'))
      RETURNING id INTO v_comp_id;
    END IF;

    SELECT id INTO v_banco
    FROM public.plano_contas
    WHERE empresa_id = r.empresa_id AND codigo = '1.1.02.001'
    LIMIT 1;
    IF v_banco IS NULL THEN
      SELECT id INTO v_banco
      FROM public.plano_contas
      WHERE empresa_id = r.empresa_id AND codigo LIKE '1.1.%' AND tipo = 'ANALITICA'
      ORDER BY codigo
      LIMIT 1;
    END IF;

    IF r.tipo = 'RECEBER' THEN
      SELECT id INTO v_contra
      FROM public.plano_contas
      WHERE empresa_id = r.empresa_id AND codigo = '1.1.03.001'
      LIMIT 1;
      IF v_contra IS NULL THEN
        SELECT id INTO v_contra
        FROM public.plano_contas
        WHERE empresa_id = r.empresa_id AND codigo LIKE '3.%' AND tipo = 'ANALITICA'
        ORDER BY codigo
        LIMIT 1;
      END IF;
      v_deb := v_banco;
      v_cred := v_contra;
      v_hist := format('Recebimento título %s - %s', COALESCE(r.parceiro_nome, 'Cliente'), to_char(v_data, 'DD/MM/YYYY'));
    ELSE
      SELECT id INTO v_contra
      FROM public.plano_contas
      WHERE empresa_id = r.empresa_id AND codigo = '2.1.01.001'
      LIMIT 1;
      IF v_contra IS NULL THEN
        SELECT id INTO v_contra
        FROM public.plano_contas
        WHERE empresa_id = r.empresa_id AND codigo LIKE '4.%' AND tipo = 'ANALITICA'
        ORDER BY codigo
        LIMIT 1;
      END IF;
      v_deb := v_contra;
      v_cred := v_banco;
      v_hist := format('Pagamento título %s - %s', COALESCE(r.parceiro_nome, 'Fornecedor'), to_char(v_data, 'DD/MM/YYYY'));
    END IF;

    IF v_comp_id IS NOT NULL AND v_deb IS NOT NULL AND v_cred IS NOT NULL THEN
      INSERT INTO public.lancamentos_contabeis (
        empresa_id, competencia_id, data_lancamento, historico, conta_debito_id, conta_credito_id, valor, origem
      ) VALUES (
        r.empresa_id, v_comp_id, v_data, v_hist, v_deb, v_cred, r.valor_pago, 'FINANCEIRO'
      )
      RETURNING id INTO v_lanc_id;

      INSERT INTO public.lancamentos_partidas (lancamento_id, conta_id, tipo, valor) VALUES
        (v_lanc_id, v_deb, 'DEBITO', r.valor_pago),
        (v_lanc_id, v_cred, 'CREDITO', r.valor_pago);
    END IF;
  END LOOP;
END $$;
