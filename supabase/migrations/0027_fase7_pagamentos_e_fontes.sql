-- Migration 0027: Obrigações de pagamento, ISS por município, fonte DCTFWeb e EFD-Reinf parametrizável

ALTER TABLE public.regras_obrigacoes
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'ENTREGA' CHECK (tipo IN ('ENTREGA', 'PAGAMENTO'));

ALTER TABLE public.obrigacoes_acessorias
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'ENTREGA' CHECK (tipo IN ('ENTREGA', 'PAGAMENTO'));

CREATE TABLE IF NOT EXISTS public.parametros_iss_municipio (
  municipio TEXT PRIMARY KEY,
  uf TEXT NOT NULL,
  dia_vencimento INTEGER NOT NULL,
  ajuste_dia_util TEXT NOT NULL DEFAULT 'POSTERIOR' CHECK (ajuste_dia_util IN ('ANTERIOR', 'POSTERIOR')),
  fonte_legal TEXT NOT NULL
);

INSERT INTO public.parametros_iss_municipio (municipio, uf, dia_vencimento, ajuste_dia_util, fonte_legal) VALUES
  ('São Paulo', 'SP', 10, 'POSTERIOR', 'Decreto nº 53.151/2012 (ISS-SP)'),
  ('Curitiba', 'PR', 10, 'POSTERIOR', 'LC Municipal nº 40/2001'),
  ('PADRAO', 'BR', 10, 'POSTERIOR', 'LC nº 116/2003 / Legislação Municipal')
ON CONFLICT (municipio) DO NOTHING;

-- Atualizar fonte da DCTFWeb e dia 31 (último dia útil)
UPDATE public.regras_obrigacoes
SET
  dia_vencimento = 31,
  ajuste_dia_util = 'ANTERIOR',
  fonte_legal = 'IN RFB nº 2.237/2024, com redação da IN RFB nº 2.248/2025 (último dia útil do mês seguinte)'
WHERE nome = 'DCTFWeb';

-- EFD-Reinf: conferido_por_contador = false (divergência de fontes sobre antecipar/prorrogar)
UPDATE public.regras_obrigacoes
SET conferido_por_contador = FALSE
WHERE nome = 'EFD-Reinf';

-- Inserir obrigações de PAGAMENTO para PRESUMIDO
INSERT INTO public.regras_obrigacoes (regime, tipo, nome, periodicidade, dia_vencimento, mes_vencimento, ajuste_dia_util, fonte_legal)
SELECT v.regime, 'PAGAMENTO', v.nome, v.periodicidade, v.dia_vencimento, NULL, v.ajuste_dia_util, v.fonte_legal
FROM (VALUES
  ('PRESUMIDO', 'DARF INSS (DCTFWeb)', 'MENSAL', 20, 'ANTERIOR', 'Lei nº 8.212/1991, art. 30, I, b (dia 20, antecipa)'),
  ('PRESUMIDO', 'FGTS Digital', 'MENSAL', 20, 'ANTERIOR', 'Lei nº 8.036/1990, art. 15 (dia 20, antecipa)'),
  ('PRESUMIDO', 'DARF IRRF (Salários)', 'MENSAL', 20, 'ANTERIOR', 'Lei nº 11.196/2005, art. 70 (dia 20, antecipa)'),
  ('PRESUMIDO', 'DARF PIS', 'MENSAL', 25, 'ANTERIOR', 'Lei nº 11.933/2009 (dia 25, antecipa)'),
  ('PRESUMIDO', 'DARF COFINS', 'MENSAL', 25, 'ANTERIOR', 'Lei nº 11.933/2009 (dia 25, antecipa)')
) AS v(regime, nome, periodicidade, dia_vencimento, ajuste_dia_util, fonte_legal)
WHERE NOT EXISTS (
  SELECT 1 FROM public.regras_obrigacoes r WHERE r.regime = v.regime AND r.nome = v.nome
);

-- Atualizar gerar_calendario_obrigacoes para gerar ENTREGA + PAGAMENTO com valores das apurações/folha
CREATE OR REPLACE FUNCTION public.gerar_calendario_obrigacoes(p_empresa_id UUID, p_competencia TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_regime TEXT;
  v_ano INTEGER;
  v_mes INTEGER;
  v_comp_ant TEXT;
  v_ultimo_dia INTEGER;
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
  v_comp_ant := to_char((to_date(p_competencia || '-01', 'YYYY-MM-DD') - INTERVAL '1 month')::DATE, 'YYYY-MM');
  v_ultimo_dia := EXTRACT(DAY FROM (make_date(v_ano, v_mes, 1) + INTERVAL '1 month - 1 day'))::INTEGER;

  SELECT dia_vencimento, ajuste_dia_util INTO v_iss_dia, v_iss_ajuste
  FROM public.parametros_iss_municipio WHERE municipio = 'PADRAO' LIMIT 1;

  FOR r IN
    SELECT * FROM public.regras_obrigacoes
    WHERE regime = COALESCE(v_regime, 'PRESUMIDO')
      AND (
        periodicidade = 'MENSAL'
        OR (periodicidade = 'TRIMESTRAL' AND v_mes IN (3, 6, 9, 12))
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

    v_valor := NULL;
    IF r.nome = 'DARF PIS' THEN
      SELECT valor_apurado INTO v_valor FROM public.apuracoes_fiscais WHERE empresa_id = p_empresa_id AND competencia = v_comp_ant AND tributo = 'PIS' LIMIT 1;
    ELSIF r.nome = 'DARF COFINS' THEN
      SELECT valor_apurado INTO v_valor FROM public.apuracoes_fiscais WHERE empresa_id = p_empresa_id AND competencia = v_comp_ant AND tributo = 'COFINS' LIMIT 1;
    ELSIF r.nome = 'ISS Municipal' THEN
      SELECT valor_apurado INTO v_valor FROM public.apuracoes_fiscais WHERE empresa_id = p_empresa_id AND competencia = v_comp_ant AND tributo = 'ISS' LIMIT 1;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.obrigacoes_acessorias
      WHERE empresa_id = p_empresa_id AND competencia = p_competencia AND titulo = r.nome
    ) THEN
      INSERT INTO public.obrigacoes_acessorias (empresa_id, competencia, tipo, titulo, vencimento, valor_guia, status, responsavel_nome)
      VALUES (p_empresa_id, p_competencia, r.tipo, r.nome, v_venc, v_valor, 'PENDENTE', 'Equipe Fiscal');
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Regerar 2026-12 da Tecnologia Horizonte
DELETE FROM public.obrigacoes_acessorias
WHERE empresa_id = '33333333-3333-3333-3333-333333333331' AND competencia = '2026-12';
SELECT public.gerar_calendario_obrigacoes('33333333-3333-3333-3333-333333333331', '2026-12');
