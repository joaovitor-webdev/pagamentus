-- Migration 0029: Motor de N-ésimo dia útil e cadastro completo de feriados 2026 e 2027 (incluindo móveis)

INSERT INTO public.feriados_nacionais (data, descricao, sem_expediente_bancario, conferido_por_contador) VALUES
  -- 2026
  ('2026-01-01', 'Confraternização Universal', TRUE, TRUE),
  ('2026-02-16', 'Carnaval (Segunda-feira - sem expediente bancário)', TRUE, FALSE),
  ('2026-02-17', 'Carnaval (Terça-feira - sem expediente bancário)', TRUE, FALSE),
  ('2026-04-03', 'Sexta-feira Santa', TRUE, TRUE),
  ('2026-04-21', 'Tiradentes', TRUE, TRUE),
  ('2026-05-01', 'Dia do Trabalho', TRUE, TRUE),
  ('2026-06-04', 'Corpus Christi', TRUE, FALSE),
  ('2026-09-07', 'Independência do Brasil', TRUE, TRUE),
  ('2026-10-12', 'Nossa Senhora Aparecida', TRUE, TRUE),
  ('2026-11-02', 'Finados', TRUE, TRUE),
  ('2026-11-15', 'Proclamação da República', TRUE, TRUE),
  ('2026-11-20', 'Dia Nacional de Zumbi e da Consciência Negra', TRUE, TRUE),
  ('2026-12-25', 'Natal', TRUE, TRUE),
  ('2026-12-31', 'Véspera de Ano-Novo (sem expediente bancário)', TRUE, FALSE),
  -- 2027
  ('2027-01-01', 'Confraternização Universal', TRUE, TRUE),
  ('2027-02-08', 'Carnaval (Segunda-feira - sem expediente bancário)', TRUE, FALSE),
  ('2027-02-09', 'Carnaval (Terça-feira - sem expediente bancário)', TRUE, FALSE),
  ('2027-03-26', 'Sexta-feira Santa', TRUE, TRUE),
  ('2027-04-21', 'Tiradentes', TRUE, TRUE),
  ('2027-05-01', 'Dia do Trabalho', TRUE, TRUE),
  ('2027-05-27', 'Corpus Christi', TRUE, FALSE),
  ('2027-09-07', 'Independência do Brasil', TRUE, TRUE),
  ('2027-10-12', 'Nossa Senhora Aparecida', TRUE, TRUE),
  ('2027-11-02', 'Finados', TRUE, TRUE),
  ('2027-11-15', 'Proclamação da República', TRUE, TRUE),
  ('2027-11-20', 'Dia Nacional de Zumbi e da Consciência Negra', TRUE, TRUE),
  ('2027-12-25', 'Natal', TRUE, TRUE)
ON CONFLICT (data) DO UPDATE SET
  descricao = EXCLUDED.descricao,
  sem_expediente_bancario = EXCLUDED.sem_expediente_bancario;

CREATE OR REPLACE FUNCTION public.nesimo_dia_util(p_ano INTEGER, p_mes INTEGER, p_n INTEGER)
RETURNS DATE
LANGUAGE plpgsql
AS $$
DECLARE
  v_d DATE := make_date(p_ano, p_mes, 1);
  v_count INTEGER := 0;
BEGIN
  WHILE v_count < p_n LOOP
    IF EXTRACT(DOW FROM v_d) NOT IN (0, 6)
       AND NOT EXISTS (
         SELECT 1 FROM public.feriados_nacionais
         WHERE data = v_d AND sem_expediente_bancario = TRUE
       )
    THEN
      v_count := v_count + 1;
      IF v_count = p_n THEN
        RETURN v_d;
      END IF;
    END IF;
    v_d := v_d + 1;
  END LOOP;
  RETURN v_d;
END;
$$;

ALTER TABLE public.regras_obrigacoes
  ADD COLUMN IF NOT EXISTS regra_vencimento TEXT NOT NULL DEFAULT 'DIA_FIXO'
  CHECK (regra_vencimento IN ('DIA_FIXO', 'NESIMO_DIA_UTIL', 'ULTIMO_DIA_UTIL'));

UPDATE public.regras_obrigacoes
SET regra_vencimento = 'NESIMO_DIA_UTIL', dia_vencimento = 10
WHERE nome = 'EFD-Contribuições';

UPDATE public.regras_obrigacoes
SET regra_vencimento = 'ULTIMO_DIA_UTIL', dia_vencimento = 31
WHERE nome IN ('DCTFWeb', 'DARF IRPJ/CSLL Trimestral');

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
    IF r.regra_vencimento = 'NESIMO_DIA_UTIL' THEN
      v_venc := public.nesimo_dia_util(v_ano, v_mes, r.dia_vencimento);
    ELSIF r.nome = 'ISS Municipal' THEN
      v_venc := make_date(v_ano, v_mes, LEAST(COALESCE(v_iss_dia, 10), v_ultimo_dia));
      v_venc := public.ajustar_dia_util(v_venc, COALESCE(v_iss_ajuste, 'POSTERIOR'));
    ELSE
      v_venc := make_date(v_ano, v_mes, LEAST(r.dia_vencimento, v_ultimo_dia));
      v_venc := public.ajustar_dia_util(v_venc, r.ajuste_dia_util);
    END IF;

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

-- Regerar 2026-12 e 2027-01 da Tecnologia Horizonte
DELETE FROM public.obrigacoes_acessorias
WHERE empresa_id = '33333333-3333-3333-3333-333333333331' AND competencia IN ('2026-12', '2027-01');
SELECT public.gerar_calendario_obrigacoes('33333333-3333-3333-3333-333333333331', '2026-12');
SELECT public.gerar_calendario_obrigacoes('33333333-3333-3333-3333-333333333331', '2027-01');
