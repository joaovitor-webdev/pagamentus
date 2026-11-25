-- Fase 6: Fiscal (Simples Nacional, Lucro Presumido, CBS/IBS 2026) e IRPF Anual Parametrizado

CREATE TABLE IF NOT EXISTS public.parametros_simples_nacional (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anexo TEXT NOT NULL CHECK (anexo IN ('I', 'II', 'III', 'IV', 'V')),
  faixa INTEGER NOT NULL CHECK (faixa BETWEEN 1 AND 6),
  rbt12_min NUMERIC(14,2) NOT NULL,
  rbt12_max NUMERIC(14,2) NOT NULL,
  aliquota_nominal NUMERIC(6,4) NOT NULL,
  parcela_deduzir NUMERIC(14,2) NOT NULL,
  reparticao JSONB NOT NULL DEFAULT '{}'::jsonb,
  vigencia_inicio DATE NOT NULL DEFAULT '2026-01-01',
  vigencia_fim DATE,
  fonte_legal TEXT NOT NULL,
  conferido_por_contador BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.cnae_simples_anexo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnae TEXT NOT NULL,
  descricao TEXT NOT NULL,
  anexo TEXT NOT NULL CHECK (anexo IN ('I', 'II', 'III', 'IV', 'V')),
  sujeito_fator_r BOOLEAN NOT NULL DEFAULT FALSE,
  vigencia_inicio DATE NOT NULL DEFAULT '2026-01-01',
  vigencia_fim DATE,
  fonte_legal TEXT NOT NULL,
  conferido_por_contador BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.parametros_lucro_presumido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade TEXT NOT NULL,
  presuncao_irpj NUMERIC(6,4) NOT NULL,
  presuncao_csll NUMERIC(6,4) NOT NULL,
  aliquota_irpj NUMERIC(6,4) NOT NULL DEFAULT 0.15,
  adicional_irpj NUMERIC(6,4) NOT NULL DEFAULT 0.10,
  limite_adicional_trimestral NUMERIC(14,2) NOT NULL DEFAULT 60000.00,
  aliquota_csll NUMERIC(6,4) NOT NULL DEFAULT 0.09,
  aliquota_pis NUMERIC(6,4) NOT NULL DEFAULT 0.0065,
  aliquota_cofins NUMERIC(6,4) NOT NULL DEFAULT 0.03,
  aliquota_iss_padrao NUMERIC(6,4) NOT NULL DEFAULT 0.05,
  cbs_teste_2026 NUMERIC(6,4) NOT NULL DEFAULT 0.009,
  ibs_teste_2026 NUMERIC(6,4) NOT NULL DEFAULT 0.001,
  vigencia_inicio DATE NOT NULL DEFAULT '2026-01-01',
  vigencia_fim DATE,
  fonte_legal TEXT NOT NULL,
  conferido_por_contador BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.parametros_irpf_anual (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faixa INTEGER NOT NULL,
  base_min NUMERIC(14,2) NOT NULL,
  base_max NUMERIC(14,2),
  aliquota NUMERIC(6,4) NOT NULL,
  parcela_deduzir NUMERIC(14,2) NOT NULL,
  deducao_dependente_anual NUMERIC(14,2) NOT NULL DEFAULT 2275.08,
  limite_educacao_anual NUMERIC(14,2) NOT NULL DEFAULT 3561.50,
  limite_previdencia_pct NUMERIC(6,4) NOT NULL DEFAULT 0.12,
  desconto_simplificado_pct NUMERIC(6,4) NOT NULL DEFAULT 0.20,
  limite_desconto_simplificado_anual NUMERIC(14,2) NOT NULL DEFAULT 17640.00,
  vigencia_inicio DATE NOT NULL DEFAULT '2026-01-01',
  vigencia_fim DATE,
  fonte_legal TEXT NOT NULL,
  conferido_por_contador BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE public.parametros_simples_nacional ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cnae_simples_anexo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametros_lucro_presumido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametros_irpf_anual ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "param_simples_select" ON public.parametros_simples_nacional;
CREATE POLICY "param_simples_select" ON public.parametros_simples_nacional FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "cnae_simples_select" ON public.cnae_simples_anexo;
CREATE POLICY "cnae_simples_select" ON public.cnae_simples_anexo FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "param_presumido_select" ON public.parametros_lucro_presumido;
CREATE POLICY "param_presumido_select" ON public.parametros_lucro_presumido FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "param_irpf_select" ON public.parametros_irpf_anual;
CREATE POLICY "param_irpf_select" ON public.parametros_irpf_anual FOR SELECT USING (auth.uid() IS NOT NULL);

-- Seed Simples Nacional 2026 (LC 123/2006 c/ alt. LC 155/2016)
INSERT INTO public.parametros_simples_nacional (anexo, faixa, rbt12_min, rbt12_max, aliquota_nominal, parcela_deduzir, reparticao, fonte_legal) VALUES
('I', 1, 0, 180000, 0.04, 0, '{"IRPJ":0.055,"CSLL":0.035,"COFINS":0.1274,"PIS":0.0276,"CPP":0.415,"ICMS":0.34}', 'LC nº 123/2006, Anexo I (redação LC nº 155/2016)'),
('I', 2, 180000.01, 360000, 0.073, 5940, '{"IRPJ":0.055,"CSLL":0.035,"COFINS":0.1274,"PIS":0.0276,"CPP":0.415,"ICMS":0.34}', 'LC nº 123/2006, Anexo I (redação LC nº 155/2016)'),
('III', 1, 0, 180000, 0.06, 0, '{"IRPJ":0.04,"CSLL":0.035,"COFINS":0.1282,"PIS":0.0278,"CPP":0.434,"ISS":0.335}', 'LC nº 123/2006, Anexo III (redação LC nº 155/2016)'),
('III', 2, 180000.01, 360000, 0.112, 9360, '{"IRPJ":0.04,"CSLL":0.035,"COFINS":0.1282,"PIS":0.0278,"CPP":0.434,"ISS":0.335}', 'LC nº 123/2006, Anexo III (redação LC nº 155/2016)'),
('III', 3, 360000.01, 720000, 0.135, 17640, '{"IRPJ":0.04,"CSLL":0.035,"COFINS":0.1405,"PIS":0.0305,"CPP":0.434,"ISS":0.32}', 'LC nº 123/2006, Anexo III (redação LC nº 155/2016)'),
('V', 1, 0, 180000, 0.155, 0, '{"IRPJ":0.25,"CSLL":0.15,"COFINS":0.141,"PIS":0.0305,"CPP":0.2885,"ISS":0.14}', 'LC nº 123/2006, Anexo V (redação LC nº 155/2016)'),
('V', 2, 180000.01, 360000, 0.18, 4500, '{"IRPJ":0.23,"CSLL":0.15,"COFINS":0.141,"PIS":0.0305,"CPP":0.2785,"ISS":0.17}', 'LC nº 123/2006, Anexo V (redação LC nº 155/2016)');

INSERT INTO public.cnae_simples_anexo (cnae, descricao, anexo, sujeito_fator_r, fonte_legal) VALUES
('6201-5/01', 'Desenvolvimento de programas de computador sob encomenda', 'V', TRUE, 'LC nº 123/2006, art. 18, § 5º-J (Fator R >= 28% -> Anexo III)'),
('4712-1/00', 'Comércio varejista de mercadorias em geral', 'I', FALSE, 'LC nº 123/2006, Anexo I');

-- Seed Lucro Presumido 2026
INSERT INTO public.parametros_lucro_presumido (atividade, presuncao_irpj, presuncao_csll, aliquota_irpj, adicional_irpj, limite_adicional_trimestral, aliquota_csll, aliquota_pis, aliquota_cofins, aliquota_iss_padrao, cbs_teste_2026, ibs_teste_2026, fonte_legal) VALUES
('SERVICOS_GERAIS', 0.32, 0.32, 0.15, 0.10, 60000.00, 0.09, 0.0065, 0.03, 0.05, 0.009, 0.001, 'Lei nº 9.249/1995; Leis nº 10.637/2002 e 10.833/2003; LC nº 116/2003; LC nº 214/2025 (CBS/IBS teste 2026); LC nº 224/2025 (majoração > R$ 5M/ano)'),
('COMERCIO_INDUSTRIA', 0.08, 0.12, 0.15, 0.10, 60000.00, 0.09, 0.0065, 0.03, 0.00, 0.009, 0.001, 'Lei nº 9.249/1995; Leis nº 10.637/2002 e 10.833/2003; LC nº 214/2025 (CBS/IBS teste 2026); LC nº 224/2025');

-- Seed IRPF Anual 2026 (Lei nº 15.270/2025)
INSERT INTO public.parametros_irpf_anual (faixa, base_min, base_max, aliquota, parcela_deduzir, deducao_dependente_anual, limite_educacao_anual, limite_previdencia_pct, desconto_simplificado_pct, limite_desconto_simplificado_anual, fonte_legal) VALUES
(1, 0, 29145.60, 0.00, 0, 2275.08, 3561.50, 0.12, 0.20, 17640.00, 'Lei nº 15.270/2025 e Tabela Progressiva Anual RFB 2026'),
(2, 29145.61, 33919.80, 0.075, 2185.92, 2275.08, 3561.50, 0.12, 0.20, 17640.00, 'Lei nº 15.270/2025 e Tabela Progressiva Anual RFB 2026'),
(3, 33919.81, 45012.60, 0.15, 4729.91, 2275.08, 3561.50, 0.12, 0.20, 17640.00, 'Lei nº 15.270/2025 e Tabela Progressiva Anual RFB 2026'),
(4, 45012.61, 55976.16, 0.225, 8105.85, 2275.08, 3561.50, 0.12, 0.20, 17640.00, 'Lei nº 15.270/2025 e Tabela Progressiva Anual RFB 2026'),
(5, 55976.17, NULL, 0.275, 10904.66, 2275.08, 3561.50, 0.12, 0.20, 17640.00, 'Lei nº 15.270/2025 e Tabela Progressiva Anual RFB 2026');

-- Expandir apuracoes_fiscais
ALTER TABLE public.apuracoes_fiscais
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'AGUARDANDO_CONFERENCIA' CHECK (status IN ('AGUARDANDO_CONFERENCIA', 'APROVADA')),
  ADD COLUMN IF NOT EXISTS aprovado_por UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lancamento_id UUID REFERENCES public.lancamentos_contabeis(id),
  ADD COLUMN IF NOT EXISTS codigo_receita TEXT,
  ADD COLUMN IF NOT EXISTS vencimento_guia DATE,
  ADD COLUMN IF NOT EXISTS anexo_guia_url TEXT,
  ADD COLUMN IF NOT EXISTS memoria_calculo JSONB DEFAULT '{}'::jsonb;

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

  SELECT id INTO v_comp_id FROM public.competencias WHERE id = v_ap.competencia_id;
  v_data := COALESCE(v_ap.vencimento_guia, CURRENT_DATE);

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

CREATE OR REPLACE FUNCTION public.reverter_apuracao_fiscal(p_apuracao_id UUID, p_justificativa TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ap RECORD;
  v_old RECORD;
  v_est_id UUID;
BEGIN
  IF NOT public.tem_papel(ARRAY['ADMIN', 'CONTADOR']) THEN
    RAISE EXCEPTION 'Apenas ADMIN ou CONTADOR pode reverter apuração fiscal.';
  END IF;

  SELECT * INTO v_ap FROM public.apuracoes_fiscais WHERE id = p_apuracao_id FOR UPDATE;
  IF NOT FOUND OR v_ap.status <> 'APROVADA' THEN
    RAISE EXCEPTION 'Apuração não está aprovada.';
  END IF;

  IF v_ap.lancamento_id IS NOT NULL THEN
    SELECT * INTO v_old FROM public.lancamentos_contabeis WHERE id = v_ap.lancamento_id;
    IF FOUND AND NOT v_old.estornado THEN
      UPDATE public.lancamentos_contabeis SET estornado = TRUE WHERE id = v_old.id;
      INSERT INTO public.lancamentos_contabeis (
        empresa_id, competencia_id, data_lancamento, historico, conta_debito_id, conta_credito_id, valor, origem, criado_por
      ) VALUES (
        v_old.empresa_id, v_old.competencia_id, v_old.data_lancamento,
        'Estorno: ' || v_old.historico || ' (' || COALESCE(p_justificativa, 'reversão') || ')',
        v_old.conta_credito_id, v_old.conta_debito_id, v_old.valor, 'ESTORNO', auth.uid()
      ) RETURNING id INTO v_est_id;

      INSERT INTO public.lancamentos_partidas (lancamento_id, conta_id, tipo, valor) VALUES
        (v_est_id, v_old.conta_credito_id, 'DEBITO', v_old.valor),
        (v_est_id, v_old.conta_debito_id, 'CREDITO', v_old.valor);
    END IF;
  END IF;

  UPDATE public.apuracoes_fiscais
  SET status = 'AGUARDANDO_CONFERENCIA', aprovado_por = NULL, aprovado_em = NULL, lancamento_id = NULL
  WHERE id = p_apuracao_id;
END;
$$;
