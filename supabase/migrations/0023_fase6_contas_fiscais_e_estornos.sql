-- Migration 0023: Contas fiscais próprias, mapeamento tributo->contas, estorno de provisões antigas e constraint única

-- 1. Criar contas fiscais no plano_contas para todas as empresas
INSERT INTO public.plano_contas (empresa_id, codigo, nome, tipo, natureza, grupo)
SELECT e.id, c.codigo, c.nome, 'ANALITICA', c.natureza, c.grupo
FROM public.empresas e
CROSS JOIN (VALUES
  ('3.2.01.001', '(-) ISS sobre Serviços', 'DEVEDORA', 'RECEITA'),
  ('3.2.01.002', '(-) PIS sobre Faturamento', 'DEVEDORA', 'RECEITA'),
  ('3.2.01.003', '(-) COFINS sobre Faturamento', 'DEVEDORA', 'RECEITA'),
  ('4.2.01.001', 'IRPJ', 'DEVEDORA', 'DESPESA'),
  ('4.2.01.002', 'CSLL', 'DEVEDORA', 'DESPESA'),
  ('2.1.04.001', 'ISS a Recolher', 'CREDORA', 'PASSIVO'),
  ('2.1.04.002', 'PIS a Recolher', 'CREDORA', 'PASSIVO'),
  ('2.1.04.003', 'COFINS a Recolher', 'CREDORA', 'PASSIVO'),
  ('2.1.04.004', 'IRPJ a Recolher', 'CREDORA', 'PASSIVO'),
  ('2.1.04.005', 'CSLL a Recolher', 'CREDORA', 'PASSIVO')
) AS c(codigo, nome, natureza, grupo)
WHERE NOT EXISTS (
  SELECT 1 FROM public.plano_contas p WHERE p.empresa_id = e.id AND p.codigo = c.codigo
);

-- 2. Tabela de mapeamento tributo -> contas contábeis
CREATE TABLE IF NOT EXISTS public.mapeamento_contabil_tributos (
  tributo TEXT PRIMARY KEY,
  codigo_debito TEXT NOT NULL,
  codigo_credito TEXT NOT NULL
);

INSERT INTO public.mapeamento_contabil_tributos (tributo, codigo_debito, codigo_credito) VALUES
  ('ISS', '3.2.01.001', '2.1.04.001'),
  ('PIS', '3.2.01.002', '2.1.04.002'),
  ('COFINS', '3.2.01.003', '2.1.04.003'),
  ('IRPJ', '4.2.01.001', '2.1.04.004'),
  ('CSLL', '4.2.01.002', '2.1.04.005')
ON CONFLICT (tributo) DO UPDATE SET
  codigo_debito = EXCLUDED.codigo_debito,
  codigo_credito = EXCLUDED.codigo_credito;

-- 3. Atualizar aprovar_apuracao_fiscal para usar mapeamento_contabil_tributos
CREATE OR REPLACE FUNCTION public.aprovar_apuracao_fiscal(p_apuracao_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ap RECORD;
  v_map RECORD;
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

  SELECT * INTO v_map FROM public.mapeamento_contabil_tributos WHERE tributo = v_ap.tributo;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mapeamento contábil não encontrado para o tributo %.', v_ap.tributo;
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

  SELECT id INTO v_conta_deb FROM public.plano_contas WHERE empresa_id = v_ap.empresa_id AND codigo = v_map.codigo_debito LIMIT 1;
  SELECT id INTO v_conta_cred FROM public.plano_contas WHERE empresa_id = v_ap.empresa_id AND codigo = v_map.codigo_credito LIMIT 1;

  IF v_conta_deb IS NULL OR v_conta_cred IS NULL THEN
    RAISE EXCEPTION 'Contas contábeis (% / %) não encontradas.', v_map.codigo_debito, v_map.codigo_credito;
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

-- 4. Estornar provisões fiscais antigas nas contas erradas (4.1.01.001 / 2.1.01.001) e remover apuração antiga do seed
DO $$
DECLARE
  r RECORD;
  v_est_id UUID;
  v_new_id UUID;
  v_deb UUID;
  v_cred UUID;
BEGIN
  -- Estornar todos os lançamentos FISCAL de 11/2026 da Tecnologia Horizonte que usaram contas erradas
  FOR r IN
    SELECT lc.*
    FROM public.lancamentos_contabeis lc
    JOIN public.plano_contas pd ON pd.id = lc.conta_debito_id
    WHERE lc.empresa_id = '33333333-3333-3333-3333-333333333331'
      AND lc.origem = 'FISCAL'
      AND lc.estornado = FALSE
      AND pd.codigo = '4.1.01.001'
  LOOP
    UPDATE public.lancamentos_contabeis SET estornado = TRUE WHERE id = r.id;

    INSERT INTO public.lancamentos_contabeis (
      empresa_id, competencia_id, data_lancamento, historico, conta_debito_id, conta_credito_id, valor, origem
    ) VALUES (
      r.empresa_id, r.competencia_id, r.data_lancamento,
      'Estorno: ' || r.historico || ' (correção de conta fiscal)',
      r.conta_credito_id, r.conta_debito_id, r.valor, 'ESTORNO'
    ) RETURNING id INTO v_est_id;

    INSERT INTO public.lancamentos_partidas (lancamento_id, conta_id, tipo, valor) VALUES
      (v_est_id, r.conta_credito_id, 'DEBITO', r.valor),
      (v_est_id, r.conta_debito_id, 'CREDITO', r.valor);
  END LOOP;

  -- Remover apuração antiga do seed ("ISSQN (Serviços)" com base 15.000)
  DELETE FROM public.apuracoes_fiscais
  WHERE empresa_id = '33333333-3333-3333-3333-333333333331'
    AND tributo = 'ISSQN (Serviços)';

  -- Reclassificar o ISS de R$ 1.375,00 para as contas certas (3.2.01.001 / 2.1.04.001)
  SELECT id INTO v_deb FROM public.plano_contas WHERE empresa_id = '33333333-3333-3333-3333-333333333331' AND codigo = '3.2.01.001' LIMIT 1;
  SELECT id INTO v_cred FROM public.plano_contas WHERE empresa_id = '33333333-3333-3333-3333-333333333331' AND codigo = '2.1.04.001' LIMIT 1;

  FOR r IN
    SELECT * FROM public.apuracoes_fiscais
    WHERE empresa_id = '33333333-3333-3333-3333-333333333331'
      AND competencia = '2026-11'
      AND tributo = 'ISS'
      AND status = 'APROVADA'
  LOOP
    INSERT INTO public.lancamentos_contabeis (
      empresa_id, competencia_id, data_lancamento, historico, conta_debito_id, conta_credito_id, valor, origem
    ) VALUES (
      r.empresa_id,
      (SELECT id FROM public.competencias WHERE empresa_id = r.empresa_id AND ano_mes = '2026-11' LIMIT 1),
      COALESCE(r.vencimento_guia, '2026-11-30'),
      'Provisão ISS - apuração fiscal',
      v_deb, v_cred, r.valor_apurado, 'FISCAL'
    ) RETURNING id INTO v_new_id;

    INSERT INTO public.lancamentos_partidas (lancamento_id, conta_id, tipo, valor) VALUES
      (v_new_id, v_deb, 'DEBITO', r.valor_apurado),
      (v_new_id, v_cred, 'CREDITO', r.valor_apurado);

    UPDATE public.apuracoes_fiscais SET lancamento_id = v_new_id WHERE id = r.id;
  END LOOP;
END $$;

-- 5. Garantir apenas UMA apuração por empresa + competência + tributo
ALTER TABLE public.apuracoes_fiscais
  DROP CONSTRAINT IF EXISTS uq_apuracao_empresa_comp_tributo;
ALTER TABLE public.apuracoes_fiscais
  ADD CONSTRAINT uq_apuracao_empresa_comp_tributo UNIQUE (empresa_id, competencia, tributo);
