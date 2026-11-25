-- Migration 0030: Algoritmo de Meeus/Butcher para feriados móveis (2026-2028), limpeza/deduplicação de obrigações e UNIQUE constraint

CREATE OR REPLACE FUNCTION public.calcular_pascoa(p_ano INTEGER)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  a INTEGER := p_ano % 19;
  b INTEGER := p_ano / 100;
  c INTEGER := p_ano % 100;
  d INTEGER := b / 4;
  e INTEGER := b % 4;
  f INTEGER := (b + 8) / 25;
  g INTEGER := (b - f + 1) / 3;
  h INTEGER := (19 * a + b - d - g + 15) % 30;
  i INTEGER := c / 4;
  k INTEGER := c % 4;
  l INTEGER := (32 + 2 * e + 2 * i - h - k) % 7;
  m INTEGER := (a + 11 * h + 22 * l) / 451;
  mes INTEGER := (h + l - 7 * m + 114) / 31;
  dia INTEGER := ((h + l - 7 * m + 114) % 31) + 1;
BEGIN
  RETURN make_date(p_ano, mes, dia);
END;
$$;

-- Recriar feriados móveis e fixos de 2026, 2027 e 2028 via Meeus/Butcher
DELETE FROM public.feriados_nacionais WHERE EXTRACT(YEAR FROM data) IN (2026, 2027, 2028);

DO $$
DECLARE
  v_ano INTEGER;
  v_pascoa DATE;
BEGIN
  FOREACH v_ano IN ARRAY ARRAY[2026, 2027, 2028] LOOP
    v_pascoa := public.calcular_pascoa(v_ano);

    INSERT INTO public.feriados_nacionais (data, descricao, sem_expediente_bancario, conferido_por_contador) VALUES
      (make_date(v_ano, 1, 1), 'Confraternização Universal', TRUE, TRUE),
      (v_pascoa - 48, 'Carnaval (Segunda-feira - ponto facultativo bancário)', TRUE, FALSE),
      (v_pascoa - 47, 'Carnaval (Terça-feira - ponto facultativo bancário)', TRUE, FALSE),
      (v_pascoa - 2, 'Sexta-feira Santa', TRUE, TRUE),
      (make_date(v_ano, 4, 21), 'Tiradentes', TRUE, TRUE),
      (make_date(v_ano, 5, 1), 'Dia do Trabalho', TRUE, TRUE),
      (v_pascoa + 60, 'Corpus Christi', TRUE, FALSE),
      (make_date(v_ano, 9, 7), 'Independência do Brasil', TRUE, TRUE),
      (make_date(v_ano, 10, 12), 'Nossa Senhora Aparecida', TRUE, TRUE),
      (make_date(v_ano, 11, 2), 'Finados', TRUE, TRUE),
      (make_date(v_ano, 11, 15), 'Proclamação da República', TRUE, TRUE),
      (make_date(v_ano, 11, 20), 'Dia Nacional de Zumbi e da Consciência Negra', TRUE, TRUE),
      (make_date(v_ano, 12, 25), 'Natal', TRUE, TRUE),
      (make_date(v_ano, 12, 31), 'Véspera de Ano-Novo (sem expediente bancário)', TRUE, FALSE)
    ON CONFLICT (data) DO UPDATE SET
      descricao = EXCLUDED.descricao,
      sem_expediente_bancario = EXCLUDED.sem_expediente_bancario;
  END LOOP;
END $$;

-- Limpar obrigações de teste (2026-10) e deduplicar obrigacoes_acessorias
DELETE FROM public.obrigacoes_acessorias WHERE competencia = '2026-10';

UPDATE public.obrigacoes_acessorias
SET competencia_referencia = COALESCE(competencia_referencia, competencia, '2026-11')
WHERE competencia_referencia IS NULL;

DELETE FROM public.obrigacoes_acessorias a
USING public.obrigacoes_acessorias b
WHERE a.id > b.id
  AND a.empresa_id = b.empresa_id
  AND a.titulo = b.titulo
  AND a.competencia_referencia = b.competencia_referencia;

ALTER TABLE public.obrigacoes_acessorias
  DROP CONSTRAINT IF EXISTS uq_obrigacao_empresa_titulo_comp_ref;
ALTER TABLE public.obrigacoes_acessorias
  ADD CONSTRAINT uq_obrigacao_empresa_titulo_comp_ref
  UNIQUE (empresa_id, titulo, competencia_referencia);

-- Atualizar gerar_calendario_obrigacoes para respeitar UNIQUE (empresa_id, titulo, competencia_referencia)
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

    INSERT INTO public.obrigacoes_acessorias (empresa_id, competencia, competencia_referencia, tipo, titulo, vencimento, valor_guia, status, responsavel_nome)
    VALUES (p_empresa_id, p_competencia, v_comp_ref, r.tipo, r.nome, v_venc, v_valor, 'PENDENTE', 'Equipe Fiscal')
    ON CONFLICT (empresa_id, titulo, competencia_referencia) DO NOTHING;

    IF FOUND THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;
