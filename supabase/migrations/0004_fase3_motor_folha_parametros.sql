-- ============================================================================
-- PAGAMENTUS - Migration 0004: Fase 3 (Parâmetros Legais 2026 e Cálculos Folha)
-- ============================================================================

-- 1. Tabela de Parâmetros Legais com Vigência e Conferência pelo Contador
CREATE TABLE IF NOT EXISTS public.parametros_legais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vigencia_inicio DATE NOT NULL,
  vigencia_fim DATE,
  tipo VARCHAR(40) NOT NULL CHECK (tipo IN (
    'SALARIO_MINIMO',
    'FGTS_ALIQUOTA',
    'VALE_TRANSPORTE_TETO',
    'INSS_FAIXA',
    'IRRF_FAIXA',
    'IRRF_DEDUCAO_DEPENDENTE',
    'IRRF_DESCONTO_SIMPLIFICADO',
    'IRRF_ISENCAO_2026',
    'IRRF_REDUTOR_2026'
  )),
  faixa_ordem INT NOT NULL DEFAULT 1,
  limite_inferior NUMERIC(14, 2) NOT NULL DEFAULT 0,
  limite_superior NUMERIC(14, 2),
  aliquota NUMERIC(6, 4) NOT NULL DEFAULT 0,
  parcela_deduzir NUMERIC(14, 2) NOT NULL DEFAULT 0,
  valor_fixo NUMERIC(14, 2) NOT NULL DEFAULT 0,
  fonte_legal VARCHAR(200) NOT NULL,
  conferido_por_contador BOOLEAN NOT NULL DEFAULT FALSE,
  conferido_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.parametros_legais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parametros_legais_select" ON public.parametros_legais
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "parametros_legais_write_admin_contador" ON public.parametros_legais
  FOR ALL USING (public.tem_papel(ARRAY['ADMIN', 'CONTADOR']));

-- 2. Tabela de Cálculos de Folha por Competência e Empregado
CREATE TABLE IF NOT EXISTS public.folha_calculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  empregado_id UUID NOT NULL REFERENCES public.empregados(id) ON DELETE CASCADE,
  competencia CHAR(7) NOT NULL,
  salario_base NUMERIC(14, 2) NOT NULL,
  total_proventos NUMERIC(14, 2) NOT NULL,
  total_descontos NUMERIC(14, 2) NOT NULL,
  valor_liquido NUMERIC(14, 2) NOT NULL,
  fgts_valor NUMERIC(14, 2) NOT NULL,
  inss_valor NUMERIC(14, 2) NOT NULL,
  irrf_valor NUMERIC(14, 2) NOT NULL,
  memoria_calculo JSONB NOT NULL,
  conferido BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (empresa_id, empregado_id, competencia)
);

ALTER TABLE public.folha_calculos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "folha_calculos_select" ON public.folha_calculos
  FOR SELECT USING (public.pode_acessar_empresa(empresa_id) AND public.tem_papel(ARRAY['ADMIN', 'CONTADOR', 'RH_DP', 'CLIENTE']));

CREATE POLICY "folha_calculos_write" ON public.folha_calculos
  FOR ALL USING (public.pode_acessar_empresa(empresa_id) AND public.tem_papel(ARRAY['ADMIN', 'RH_DP']));

DROP TRIGGER IF EXISTS trg_audit_folha_calculos ON public.folha_calculos;
CREATE TRIGGER trg_audit_folha_calculos AFTER INSERT OR UPDATE OR DELETE ON public.folha_calculos FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_automatica();

-- ============================================================================
-- SEED DE PARÂMETROS LEGAIS VIGENTES 2026 (conferido_por_contador = FALSE)
-- ============================================================================

INSERT INTO public.parametros_legais (vigencia_inicio, vigencia_fim, tipo, faixa_ordem, limite_inferior, limite_superior, aliquota, parcela_deduzir, valor_fixo, fonte_legal, conferido_por_contador)
VALUES
  ('2026-01-01', '2026-12-31', 'SALARIO_MINIMO', 1, 0, NULL, 0, 0, 1518.00, 'Decreto / Portaria Salário Mínimo 2026 (conferir com contador)', FALSE),
  ('2026-01-01', '2026-12-31', 'FGTS_ALIQUOTA', 1, 0, NULL, 8.0000, 0, 0, 'Lei nº 8.036/1990, art. 15', FALSE),
  ('2026-01-01', '2026-12-31', 'VALE_TRANSPORTE_TETO', 1, 0, NULL, 6.0000, 0, 0, 'Lei nº 7.418/1985, art. 4º, parágrafo único', FALSE),

  -- INSS Progressivo 2026 (4 faixas até o teto)
  ('2026-01-01', '2026-12-31', 'INSS_FAIXA', 1, 0.00, 1518.00, 7.5000, 0.00, 0, 'Portaria Interministerial MPS/MF 2026 - Faixa 1', FALSE),
  ('2026-01-01', '2026-12-31', 'INSS_FAIXA', 2, 1518.01, 2793.88, 9.0000, 22.77, 0, 'Portaria Interministerial MPS/MF 2026 - Faixa 2', FALSE),
  ('2026-01-01', '2026-12-31', 'INSS_FAIXA', 3, 2793.89, 4190.83, 12.0000, 106.59, 0, 'Portaria Interministerial MPS/MF 2026 - Faixa 3', FALSE),
  ('2026-01-01', '2026-12-31', 'INSS_FAIXA', 4, 4190.84, 8157.41, 14.0000, 190.40, 0, 'Portaria Interministerial MPS/MF 2026 - Faixa 4 (Teto)', FALSE),

  -- IRRF Tabela Progressiva Base + Deduções + Reforma IR 2026 (Lei 15.270/2025)
  ('2026-01-01', '2026-12-31', 'IRRF_FAIXA', 1, 0.00, 2259.20, 0.0000, 0.00, 0, 'Tabela Progressiva IRRF - Faixa Isenta Base', FALSE),
  ('2026-01-01', '2026-12-31', 'IRRF_FAIXA', 2, 2259.21, 2826.65, 7.5000, 169.44, 0, 'Tabela Progressiva IRRF - Faixa 2', FALSE),
  ('2026-01-01', '2026-12-31', 'IRRF_FAIXA', 3, 2826.66, 3751.05, 15.0000, 381.44, 0, 'Tabela Progressiva IRRF - Faixa 3', FALSE),
  ('2026-01-01', '2026-12-31', 'IRRF_FAIXA', 4, 3751.06, 4664.68, 22.5000, 662.77, 0, 'Tabela Progressiva IRRF - Faixa 4', FALSE),
  ('2026-01-01', '2026-12-31', 'IRRF_FAIXA', 5, 4664.69, NULL, 27.5000, 896.00, 0, 'Tabela Progressiva IRRF - Faixa 5', FALSE),

  ('2026-01-01', '2026-12-31', 'IRRF_DEDUCAO_DEPENDENTE', 1, 0, NULL, 0, 0, 189.59, 'Lei nº 9.250/1995 - Dedução mensal por dependente', FALSE),
  ('2026-01-01', '2026-12-31', 'IRRF_DESCONTO_SIMPLIFICADO', 1, 0, NULL, 0, 0, 564.80, 'Lei nº 14.663/2023 - Desconto simplificado mensal', FALSE),
  ('2026-01-01', '2026-12-31', 'IRRF_ISENCAO_2026', 1, 0, 5000.00, 0, 0, 5000.00, 'Lei nº 15.270/2025 (vigência jan/2026) - Isenção até R$ 5.000,00', FALSE),
  ('2026-01-01', '2026-12-31', 'IRRF_REDUTOR_2026', 1, 5000.01, 7350.00, 0, 0, 312.89, 'Lei nº 15.270/2025 (vigência jan/2026) - Redução gradual até R$ 7.350,00', FALSE);
