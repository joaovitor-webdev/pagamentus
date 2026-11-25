-- Fase 5: Financeiro (parcelamento, recorrência, baixa com juros/multa/desconto, conciliação OFX e integração contábil)

ALTER TABLE public.titulos_financeiros
  ADD COLUMN IF NOT EXISTS valor_pago NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS juros NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS multa NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS desconto NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parcela_numero INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total_parcelas INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS recorrente BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS conta_bancaria_id UUID REFERENCES public.plano_contas(id),
  ADD COLUMN IF NOT EXISTS observacao TEXT;

CREATE TABLE IF NOT EXISTS public.extratos_bancarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id UUID NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  data_movimento DATE NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(14,2) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('CREDITO', 'DEBITO')),
  fitid TEXT,
  conciliado BOOLEAN NOT NULL DEFAULT FALSE,
  titulo_id UUID REFERENCES public.titulos_financeiros(id) ON DELETE SET NULL,
  lancamento_id UUID REFERENCES public.lancamentos_contabeis(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_extratos_bancarios_empresa_data
  ON public.extratos_bancarios (empresa_id, data_movimento DESC);

ALTER TABLE public.extratos_bancarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "extratos_bancarios_select" ON public.extratos_bancarios;
CREATE POLICY "extratos_bancarios_select" ON public.extratos_bancarios
  FOR SELECT USING (
    public.pode_acessar_empresa(empresa_id) AND public.tem_papel(ARRAY['ADMIN', 'CONTADOR', 'FINANCEIRO'])
  );

DROP POLICY IF EXISTS "extratos_bancarios_insert" ON public.extratos_bancarios;
CREATE POLICY "extratos_bancarios_insert" ON public.extratos_bancarios
  FOR INSERT WITH CHECK (
    public.pode_acessar_empresa(empresa_id) AND public.tem_papel(ARRAY['ADMIN', 'FINANCEIRO'])
  );

DROP POLICY IF EXISTS "extratos_bancarios_update" ON public.extratos_bancarios;
CREATE POLICY "extratos_bancarios_update" ON public.extratos_bancarios
  FOR UPDATE USING (
    public.pode_acessar_empresa(empresa_id) AND public.tem_papel(ARRAY['ADMIN', 'FINANCEIRO'])
  );

DROP POLICY IF EXISTS "extratos_bancarios_delete" ON public.extratos_bancarios;
CREATE POLICY "extratos_bancarios_delete" ON public.extratos_bancarios
  FOR DELETE USING (
    public.pode_acessar_empresa(empresa_id) AND public.tem_papel(ARRAY['ADMIN', 'FINANCEIRO'])
  );

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

  -- Buscar conta Banco (1.1.02.001) ou primeira conta analítica de Ativo Circulante
  SELECT id INTO v_conta_banco
  FROM public.plano_contas
  WHERE empresa_id = v_titulo.empresa_id AND codigo = '1.1.02.001'
  LIMIT 1;

  IF v_conta_banco IS NULL THEN
    SELECT id INTO v_conta_banco
    FROM public.plano_contas
    WHERE empresa_id = v_titulo.empresa_id AND tipo = 'ATIVO' AND aceita_lancamento = TRUE
    ORDER BY codigo
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
      WHERE empresa_id = v_titulo.empresa_id AND tipo = 'RECEITA' AND aceita_lancamento = TRUE
      ORDER BY codigo
      LIMIT 1;
    END IF;
    v_historico := format('Recebimento título %s - %s', COALESCE(v_titulo.parceiro_nome, 'Cliente'), to_char(p_data_baixa, 'DD/MM/YYYY'));
  ELSE
    SELECT id INTO v_conta_contrapartida
    FROM public.plano_contas
    WHERE empresa_id = v_titulo.empresa_id AND codigo = '2.1.01.001'
    LIMIT 1;
    IF v_conta_contrapartida IS NULL THEN
      SELECT id INTO v_conta_contrapartida
      FROM public.plano_contas
      WHERE empresa_id = v_titulo.empresa_id AND tipo = 'DESPESA' AND aceita_lancamento = TRUE
      ORDER BY codigo
      LIMIT 1;
    END IF;
    v_historico := format('Pagamento título %s - %s', COALESCE(v_titulo.parceiro_nome, 'Fornecedor'), to_char(p_data_baixa, 'DD/MM/YYYY'));
  END IF;

  IF v_conta_banco IS NOT NULL AND v_conta_contrapartida IS NOT NULL THEN
    INSERT INTO public.lancamentos_contabeis (
      escritorio_id, empresa_id, data_lancamento, historico, origem, criado_por
    ) VALUES (
      v_titulo.escritorio_id, v_titulo.empresa_id, p_data_baixa, v_historico, 'FINANCEIRO', auth.uid()
    )
    RETURNING id INTO v_lancamento_id;

    IF v_titulo.tipo = 'RECEBER' THEN
      INSERT INTO public.partidas_contabeis (lancamento_id, conta_id, tipo, valor) VALUES
        (v_lancamento_id, v_conta_banco, 'D', v_valor_liquido),
        (v_lancamento_id, v_conta_contrapartida, 'C', v_valor_liquido);
    ELSE
      INSERT INTO public.partidas_contabeis (lancamento_id, conta_id, tipo, valor) VALUES
        (v_lancamento_id, v_conta_contrapartida, 'D', v_valor_liquido),
        (v_lancamento_id, v_conta_banco, 'C', v_valor_liquido);
    END IF;
  END IF;

  RETURN v_lancamento_id;
END;
$$;
