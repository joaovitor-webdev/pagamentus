-- Migration 0020: IRPF Anual (2025 x 2026 com redução Lei 15.270), LC 224/2025 e Simples Anexos II e IV

ALTER TABLE public.parametros_irpf_anual
  ADD COLUMN IF NOT EXISTS ano_calendario INTEGER NOT NULL DEFAULT 2026,
  ADD COLUMN IF NOT EXISTS reducao_limite_isencao NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS reducao_limite_faixa NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS reducao_maxima NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS reducao_constante NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS reducao_fator NUMERIC(10,6);

UPDATE public.parametros_irpf_anual
SET
  ano_calendario = 2026,
  reducao_limite_isencao = 60000.00,
  reducao_limite_faixa = 88200.00,
  reducao_maxima = 2694.15,
  reducao_constante = 8429.73,
  reducao_fator = 0.095575,
  fonte_legal = 'Lei nº 15.270/2025 (art. 11-A da Lei nº 9.250/1995) - Ano-calendário 2026 / Exercício 2027'
WHERE ano_calendario = 2026;

-- Ano-calendário 2025 (Exercício 2026): desconto simplificado R$ 16.754,34 e SEM redução
INSERT INTO public.parametros_irpf_anual (
  ano_calendario, faixa, base_min, base_max, aliquota, parcela_deduzir,
  deducao_dependente_anual, limite_educacao_anual, limite_previdencia_pct,
  desconto_simplificado_pct, limite_desconto_simplificado_anual,
  vigencia_inicio, vigencia_fim, fonte_legal
) VALUES
(2025, 1, 0, 27110.40, 0.00, 0, 2275.08, 3561.50, 0.12, 0.20, 16754.34, '2025-01-01', '2025-12-31', 'Lei nº 14.848/2024 - Ano-calendário 2025 / Exercício 2026'),
(2025, 2, 27110.41, 33919.80, 0.075, 2033.28, 2275.08, 3561.50, 0.12, 0.20, 16754.34, '2025-01-01', '2025-12-31', 'Lei nº 14.848/2024 - Ano-calendário 2025 / Exercício 2026'),
(2025, 3, 33919.81, 45012.60, 0.15, 4577.27, 2275.08, 3561.50, 0.12, 0.20, 16754.34, '2025-01-01', '2025-12-31', 'Lei nº 14.848/2024 - Ano-calendário 2025 / Exercício 2026'),
(2025, 4, 45012.61, 55976.16, 0.225, 7953.21, 2275.08, 3561.50, 0.12, 0.20, 16754.34, '2025-01-01', '2025-12-31', 'Lei nº 14.848/2024 - Ano-calendário 2025 / Exercício 2026'),
(2025, 5, 55976.17, NULL, 0.275, 10752.02, 2275.08, 3561.50, 0.12, 0.20, 16754.34, '2025-01-01', '2025-12-31', 'Lei nº 14.848/2024 - Ano-calendário 2025 / Exercício 2026');

-- LC 224/2025 no Lucro Presumido
ALTER TABLE public.parametros_lucro_presumido
  ADD COLUMN IF NOT EXISTS limite_receita_anual_lc224 NUMERIC(14,2) NOT NULL DEFAULT 5000000.00,
  ADD COLUMN IF NOT EXISTS acrescimo_presuncao_lc224 NUMERIC(6,4) NOT NULL DEFAULT 0.10;

-- Simples Nacional: Anexos II (Indústria) e IV (Serviços sem CPP no DAS)
INSERT INTO public.parametros_simples_nacional (anexo, faixa, rbt12_min, rbt12_max, aliquota_nominal, parcela_deduzir, reparticao, fonte_legal) VALUES
('II', 1, 0, 180000, 0.045, 0, '{"IRPJ":0.055,"CSLL":0.035,"COFINS":0.1151,"PIS":0.0249,"CPP":0.375,"IPI":0.075,"ICMS":0.32}', 'LC nº 123/2006, Anexo II (redação LC nº 155/2016)'),
('II', 2, 180000.01, 360000, 0.078, 5940, '{"IRPJ":0.055,"CSLL":0.035,"COFINS":0.1151,"PIS":0.0249,"CPP":0.375,"IPI":0.075,"ICMS":0.32}', 'LC nº 123/2006, Anexo II (redação LC nº 155/2016)'),
('IV', 1, 0, 180000, 0.045, 0, '{"IRPJ":0.188,"CSLL":0.152,"COFINS":0.1767,"PIS":0.0383,"ISS":0.445}', 'LC nº 123/2006, Anexo IV (CPP recolhida fora do DAS)'),
('IV', 2, 180000.01, 360000, 0.09, 8100, '{"IRPJ":0.198,"CSLL":0.152,"COFINS":0.2055,"PIS":0.0445,"ISS":0.40}', 'LC nº 123/2006, Anexo IV (CPP recolhida fora do DAS)');
