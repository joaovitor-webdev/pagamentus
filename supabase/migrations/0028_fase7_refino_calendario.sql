-- Migration 0028: Refino do calendário fiscal (IRPJ/CSLL mês subseq. trimestre, INSS/IRRF/FGTS da folha fechada, competência de referência EFD-Contribuições, ISS=PAGAMENTO, 31/12 configurável)

-- 1. Feriados / dias sem expediente bancário configuráveis
ALTER TABLE public.feriados_nacionais
  ADD COLUMN IF NOT EXISTS sem_expediente_bancario BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS conferido_por_contador BOOLEAN NOT NULL DEFAULT FALSE;

INSERT INTO public.feriados_nacionais (data, descricao, sem_expediente_bancario, conferido_por_contador) VALUES
  ('2026-12-31', 'Véspera de Ano-Novo (ponto facultativo / sem expediente bancário ao público)', TRUE, FALSE),
  ('2027-01-01', 'Confraternização Universal', TRUE, TRUE)
ON CONFLICT (data) DO UPDATE SET
  sem_expediente_bancario = EXCLUDED.sem_expediente_bancario,
  conferido_por_contador = EXCLUDED.conferido_por_contador;

CREATE OR REPLACE FUNCTION public.ajustar_dia_util(p_data DATE, p_direcao TEXT)
RETURNS DATE
LANGUAGE plpgsql
AS $$
DECLARE
  v_d DATE := p_data;
  v_step INTEGER := CASE WHEN p_direcao = 'ANTERIOR' THEN -1 ELSE 1 END;
BEGIN
  WHILE EXTRACT(DOW FROM v_d) IN (0, 6)
     OR EXISTS (SELECT 1 FROM public.feriados_nacionais WHERE data = v_d AND sem_expediente_bancario = TRUE)
  LOOP
    v_d := v_d + v_step;
  END LOOP;
  RETURN v_d;
END;
$$;

-- 2. ISS = PAGAMENTO e DARF IRPJ/CSLL Trimestral = PAGAMENTO (dia 31, ANTERIOR, nos meses 1, 4, 7, 10)
UPDATE public.regras_obrigacoes
SET tipo = 'PAGAMENTO'
WHERE nome = 'ISS Municipal';

UPDATE public.regras_obrigacoes
SET
  tipo = 'PAGAMENTO',
  dia_vencimento = 31,
  ajuste_dia_util = 'ANTERIOR',
  fonte_legal = 'Lei nº 9.430/1996, art. 5º (último dia útil do mês subsequente ao encerramento do trimestre: abr/jul/out/jan)'
WHERE nome = 'DARF IRPJ/CSLL Trimestral';

-- 3. Coluna competencia_referencia em obrigacoes_acessorias
ALTER TABLE public.obrigacoes_acessorias
  ADD COLUMN IF NOT EXISTS competencia_referencia TEXT;

-- 4. Atualizar gerar_calendario_obrigacoes
CREATE OR REPLACE FUNCTION public.gerar_calendario_obrigacoes(p_empresa_id UUID, p_competencia TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_regime TEXT;
  v_ano INTEGER;
  v_mes INTEGER;
  v_base_date DATE;
  v_comp_ant TEXT;
  v_comp_2ant TEXT;
  v_comp_ref TEXT;
  v_ultimo_dia INTEGER;
  v_folha_fechada BOOLEAN := FALSE;
  v_count INTEGER := 0;
  r RECORD;
  v_venc DATE;
  v_valor NUMERIC(14,2);
  v_iss_dia INTEGER;
  v_iss_ajuste TEXT;
BEGIN
  SELECT regime_tributario INTO v_regime FROM public.empresas WHERE id = p_empresa_id;
  v_ano := split_part(p_competencia, '-', 1)::INTEGER;
  v_mes := split_part(p_competencia, '-', 2)::INTEGER;
  v_base_date := to_date(p_competencia || '-01', 'YYYY-MM-DD');
  v_comp_ant := to_char((v_base_date - INTERVAL '1 month')::DATE, 'YYYY-MM');
  v_comp_2ant := to_char((v_base_date - INTERVAL '2 months')::DATE, 'YYYY-MM');
  v_ultimo_dia := EXTRACT(DAY FROM (make_date(v_ano, v_mes, 1) + INTERVAL '1 month - 1 day'))::INTEGER;

  SELECT (status_folha = 'FECHADA') INTO v_folha_fechada
  FROM public.competencias
  WHERE empresa_id = p_empresa_id AND ano_mes = v_comp_ant
  LIMIT 1;
  v_folha_fechada := COALESCE(v_folha_fechada, FALSE);

  SELECT dia_vencimento, ajuste_dia_util INTO v_iss_dia, v_iss_ajuste
  FROM public.parametros_iss_municipio WHERE municipio = 'PADRAO' LIMIT 1;

  FOR r IN
    SELECT * FROM public.regras_obrigacoes
    WHERE regime = COALESCE(v_regime, 'PRESUMIDO')
      AND (
        periodicidade = 'MENSAL'
        OR (periodicidade = 'TRIMESTRAL' AND v_mes IN (1, 4, 7, 10))
        OR (periodicidade = 'ANUAL' AND mes_vencimento = v_mes)
      )
  LOOP
    IF r.nome = 'ISS Municipal' THEN
      v_venc := make_date(v_ano, v_mes, LEAST(COALESCE(v_iss_dia, 10), v_ultimo_dia));
      v_venc := public.ajustar_dia_util(v_venc, COALESCE(v_iss_ajuste, 'POSTERIOR'));
    ELSE
      v_venc := make_date(v_ano, v_mes, LEAST(r.dia_vencimento, v_ultimo_dia));
      v_venc := public.ajustar_dia_util(v_venc, r.ajuste_dia_util);
    END IF;

    -- Competência de referência
    IF r.nome = 'EFD-Contribuições' THEN
      v_comp_ref := v_comp_2ant;
    ELSIF r.periodicidade = 'ANUAL' THEN
      v_comp_ref := (v_ano - 1)::TEXT;
    ELSE
      v_comp_ref := v_comp_ant;
    END IF;

    v_valor := NULL;
    IF r.nome = 'DARF PIS' THEN
      SELECT valor_apurado INTO v_valor FROM public.apuracoes_fiscais WHERE empresa_id = p_empresa_id AND competencia = v_comp_ref AND tributo = 'PIS' LIMIT 1;
    ELSIF r.nome = 'DARF COFINS' THEN
      SELECT valor_apurado INTO v_valor FROM public.apuracoes_fiscais WHERE empresa_id = p_empresa_id AND competencia = v_comp_ref AND tributo = 'COFINS' LIMIT 1;
    ELSIF r.nome = 'ISS Municipal' THEN
      SELECT valor_apurado INTO v_valor FROM public.apuracoes_fiscais WHERE empresa_id = p_empresa_id AND competencia = v_comp_ref AND tributo = 'ISS' LIMIT 1;
    ELSIF r.nome = 'DARF INSS (DCTFWeb)' AND v_folha_fechada THEN
      SELECT ROUND(COALESCE(SUM(inss_valor), 0), 2) INTO v_valor FROM public.folha_calculos WHERE empresa_id = p_empresa_id AND competencia = v_comp_ref;
    ELSIF r.nome = 'DARF IRRF (Salários)' AND v_folha_fechada THEN
      SELECT ROUND(COALESCE(SUM(irrf_valor), 0), 2) INTO v_valor FROM public.folha_calculos WHERE empresa_id = p_empresa_id AND competencia = v_comp_ref;
    ELSIF r.nome = 'FGTS Digital' AND v_folha_fechada THEN
      SELECT ROUND(COALESCE(SUM(fgts_valor), 0), 2) INTO v_valor FROM public.folha_calculos WHERE empresa_id = p_empresa_id AND competencia = v_comp_ref;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.obrigacoes_acessorias
      WHERE empresa_id = p_empresa_id AND competencia = p_competencia AND titulo = r.nome
    ) THEN
      INSERT INTO public.obrigacoes_acessorias (empresa_id, competencia, competencia_referencia, tipo, titulo, vencimento, valor_guia, status, responsavel_nome)
      VALUES (p_empresa_id, p_competencia, v_comp_ref, r.tipo, r.nome, v_venc, v_valor, 'PENDENTE', 'Equipe Fiscal');
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Regerar 2026-10, 2026-12 e 2027-01 da Tecnologia Horizonte
DELETE FROM public.obrigacoes_acessorias
WHERE empresa_id = '33333333-3333-3333-3333-333333333331' AND competencia IN ('2026-10', '2026-12', '2027-01');
SELECT public.gerar_calendario_obrigacoes('33333333-3333-3333-3333-333333333331', '2026-10');
SELECT public.gerar_calendario_obrigacoes('33333333-3333-3333-3333-333333333331', '2026-12');
SELECT public.gerar_calendario_obrigacoes('33333333-3333-3333-3333-333333333331', '2027-01');
