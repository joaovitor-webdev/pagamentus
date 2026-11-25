-- Fase 7: Obrigações Acessórias, Feriados Nacionais 2026, Regras Parametrizadas e Geração de Calendário

CREATE TABLE IF NOT EXISTS public.feriados_nacionais (
  data DATE PRIMARY KEY,
  descricao TEXT NOT NULL
);

INSERT INTO public.feriados_nacionais (data, descricao) VALUES
  ('2026-01-01', 'Confraternização Universal'),
  ('2026-04-03', 'Sexta-feira Santa'),
  ('2026-04-21', 'Tiradentes'),
  ('2026-05-01', 'Dia do Trabalho'),
  ('2026-09-07', 'Independência do Brasil'),
  ('2026-10-12', 'Nossa Senhora Aparecida'),
  ('2026-11-02', 'Finados'),
  ('2026-11-15', 'Proclamação da República'),
  ('2026-11-20', 'Dia da Consciência Negra'),
  ('2026-12-25', 'Natal')
ON CONFLICT (data) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.regras_obrigacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regime TEXT NOT NULL CHECK (regime IN ('PRESUMIDO', 'SIMPLES', 'PF')),
  nome TEXT NOT NULL,
  periodicidade TEXT NOT NULL CHECK (periodicidade IN ('MENSAL', 'TRIMESTRAL', 'ANUAL')),
  dia_vencimento INTEGER NOT NULL,
  mes_vencimento INTEGER,
  ajuste_dia_util TEXT NOT NULL DEFAULT 'POSTERIOR' CHECK (ajuste_dia_util IN ('ANTERIOR', 'POSTERIOR')),
  fonte_legal TEXT NOT NULL,
  conferido_por_contador BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO public.regras_obrigacoes (regime, nome, periodicidade, dia_vencimento, mes_vencimento, ajuste_dia_util, fonte_legal) VALUES
  ('PRESUMIDO', 'eSocial / Folha', 'MENSAL', 15, NULL, 'ANTERIOR', 'Manual de Orientação do eSocial (MOE)'),
  ('PRESUMIDO', 'EFD-Reinf', 'MENSAL', 15, NULL, 'POSTERIOR', 'IN RFB nº 2.043/2021'),
  ('PRESUMIDO', 'DCTFWeb', 'MENSAL', 28, NULL, 'ANTERIOR', 'IN RFB nº 2.005/2021 (último dia útil)'),
  ('PRESUMIDO', 'EFD-Contribuições', 'MENSAL', 14, NULL, 'POSTERIOR', 'IN RFB nº 1.252/2012 (10º dia útil 2º mês subseq.)'),
  ('PRESUMIDO', 'ISS Municipal', 'MENSAL', 10, NULL, 'POSTERIOR', 'LC nº 116/2003 / Legislação Municipal'),
  ('PRESUMIDO', 'DARF IRPJ/CSLL Trimestral', 'TRIMESTRAL', 30, NULL, 'POSTERIOR', 'Lei nº 9.430/1996 (último dia útil mês subseq. trimestre)'),
  ('PRESUMIDO', 'ECD', 'ANUAL', 30, 6, 'ANTERIOR', 'IN RFB nº 2.003/2021'),
  ('PRESUMIDO', 'ECF', 'ANUAL', 31, 7, 'ANTERIOR', 'IN RFB nº 2.004/2021'),
  ('SIMPLES', 'PGDAS-D / DAS', 'MENSAL', 20, NULL, 'POSTERIOR', 'Resolução CGSN nº 140/2018'),
  ('SIMPLES', 'eSocial / Folha', 'MENSAL', 15, NULL, 'ANTERIOR', 'Manual de Orientação do eSocial (MOE)'),
  ('SIMPLES', 'DEFIS', 'ANUAL', 31, 3, 'POSTERIOR', 'Resolução CGSN nº 140/2018'),
  ('PF', 'DIRPF', 'ANUAL', 29, 5, 'POSTERIOR', 'IN RFB anual DIRPF');

ALTER TABLE public.obrigacoes_acessorias
  ADD COLUMN IF NOT EXISTS competencia TEXT,
  ADD COLUMN IF NOT EXISTS responsavel_nome TEXT DEFAULT 'Equipe Fiscal',
  ADD COLUMN IF NOT EXISTS comprovante_url TEXT,
  ADD COLUMN IF NOT EXISTS valor_guia NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS apuracao_id UUID REFERENCES public.apuracoes_fiscais(id);

CREATE OR REPLACE FUNCTION public.ajustar_dia_util(p_data DATE, p_direcao TEXT)
RETURNS DATE
LANGUAGE plpgsql
AS $$
DECLARE
  v_d DATE := p_data;
  v_step INTEGER := CASE WHEN p_direcao = 'ANTERIOR' THEN -1 ELSE 1 END;
BEGIN
  WHILE EXTRACT(DOW FROM v_d) IN (0, 6) OR EXISTS (SELECT 1 FROM public.feriados_nacionais WHERE data = v_d) LOOP
    v_d := v_d + v_step;
  END LOOP;
  RETURN v_d;
END;
$$;

CREATE OR REPLACE FUNCTION public.gerar_calendario_obrigacoes(p_empresa_id UUID, p_competencia TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_regime TEXT;
  v_ano INTEGER;
  v_mes INTEGER;
  v_count INTEGER := 0;
  r RECORD;
  v_venc DATE;
BEGIN
  SELECT regime_tributario INTO v_regime FROM public.empresas WHERE id = p_empresa_id;
  v_ano := split_part(p_competencia, '-', 1)::INTEGER;
  v_mes := split_part(p_competencia, '-', 2)::INTEGER;

  FOR r IN
    SELECT * FROM public.regras_obrigacoes
    WHERE regime = COALESCE(v_regime, 'PRESUMIDO')
      AND (
        periodicidade = 'MENSAL'
        OR (periodicidade = 'TRIMESTRAL' AND v_mes IN (3, 6, 9, 12))
        OR (periodicidade = 'ANUAL' AND mes_vencimento = v_mes)
      )
  LOOP
    v_venc := make_date(v_ano, v_mes, LEAST(r.dia_vencimento, 28));
    v_venc := public.ajustar_dia_util(v_venc, r.ajuste_dia_util);

    IF NOT EXISTS (
      SELECT 1 FROM public.obrigacoes_acessorias
      WHERE empresa_id = p_empresa_id AND competencia = p_competencia AND nome = r.nome
    ) THEN
      INSERT INTO public.obrigacoes_acessorias (empresa_id, competencia, nome, vencimento, status, responsavel_nome)
      VALUES (p_empresa_id, p_competencia, r.nome, v_venc, 'PENDENTE', 'Equipe Fiscal');
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;
