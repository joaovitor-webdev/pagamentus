-- ============================================================================
-- PAGAMENTUS - Migration 0005: Parâmetros Legais Oficiais de 2026
-- Encerra vigência dos parâmetros anteriores em 2025-12-31 e insere 2026.
-- ============================================================================

UPDATE public.parametros_legais
SET vigencia_fim = '2025-12-31'
WHERE vigencia_inicio = '2026-01-01';

INSERT INTO public.parametros_legais (
  vigencia_inicio, vigencia_fim, tipo, faixa_ordem,
  limite_inferior, limite_superior, aliquota, parcela_deduzir, valor_fixo,
  fonte_legal, conferido_por_contador
)
VALUES
  ('2026-01-01', '2026-12-31', 'SALARIO_MINIMO', 1, 0, NULL, 0, 0, 1621.00, 'Decreto nº 12.797, de 23/12/2025', FALSE),
  ('2026-01-01', '2026-12-31', 'FGTS_ALIQUOTA', 1, 0, NULL, 8.0000, 0, 0, 'Lei nº 8.036, de 11/05/1990, art. 15', FALSE),
  ('2026-01-01', '2026-12-31', 'VALE_TRANSPORTE_TETO', 1, 0, NULL, 6.0000, 0, 0, 'Lei nº 7.418, de 16/12/1985, art. 4º, parágrafo único', FALSE),

  -- INSS Empregado 2026 (Portaria Interministerial MPS/MF nº 13, de 09/01/2026)
  ('2026-01-01', '2026-12-31', 'INSS_FAIXA', 1, 0.00, 1621.00, 7.5000, 0.00, 0, 'Portaria Interministerial MPS/MF nº 13, de 09/01/2026 - Faixa 1', FALSE),
  ('2026-01-01', '2026-12-31', 'INSS_FAIXA', 2, 1621.01, 2902.84, 9.0000, 24.32, 0, 'Portaria Interministerial MPS/MF nº 13, de 09/01/2026 - Faixa 2', FALSE),
  ('2026-01-01', '2026-12-31', 'INSS_FAIXA', 3, 2902.85, 4354.27, 12.0000, 111.40, 0, 'Portaria Interministerial MPS/MF nº 13, de 09/01/2026 - Faixa 3', FALSE),
  ('2026-01-01', '2026-12-31', 'INSS_FAIXA', 4, 4354.28, 8475.55, 14.0000, 198.49, 0, 'Portaria Interministerial MPS/MF nº 13, de 09/01/2026 - Faixa 4 (Teto R$ 8.475,55 / Máx R$ 988,09)', FALSE),

  -- IRRF Tabela Progressiva Mensal Vigente 2026
  ('2026-01-01', '2026-12-31', 'IRRF_FAIXA', 1, 0.00, 2428.80, 0.0000, 0.00, 0, 'Lei nº 15.270, de 26/11/2025 - Tabela Progressiva Faixa 1', FALSE),
  ('2026-01-01', '2026-12-31', 'IRRF_FAIXA', 2, 2428.81, 2826.65, 7.5000, 182.16, 0, 'Lei nº 15.270, de 26/11/2025 - Tabela Progressiva Faixa 2', FALSE),
  ('2026-01-01', '2026-12-31', 'IRRF_FAIXA', 3, 2826.66, 3751.05, 15.0000, 394.16, 0, 'Lei nº 15.270, de 26/11/2025 - Tabela Progressiva Faixa 3', FALSE),
  ('2026-01-01', '2026-12-31', 'IRRF_FAIXA', 4, 3751.06, 4664.68, 22.5000, 675.49, 0, 'Lei nº 15.270, de 26/11/2025 - Tabela Progressiva Faixa 4', FALSE),
  ('2026-01-01', '2026-12-31', 'IRRF_FAIXA', 5, 4664.69, NULL, 27.5000, 908.73, 0, 'Lei nº 15.270, de 26/11/2025 - Tabela Progressiva Faixa 5', FALSE),

  ('2026-01-01', '2026-12-31', 'IRRF_DEDUCAO_DEPENDENTE', 1, 0, NULL, 0, 0, 189.59, 'Lei nº 9.250, de 26/12/1995, art. 4º, III', FALSE),
  ('2026-01-01', '2026-12-31', 'IRRF_DESCONTO_SIMPLIFICADO', 1, 0, NULL, 0, 0, 607.20, 'Lei nº 14.663, de 28/08/2023 (atualizada para faixa isenta R$ 2.428,80)', FALSE),
  ('2026-01-01', '2026-12-31', 'IRRF_ISENCAO_2026', 1, 0, 5000.00, 0, 0, 5000.00, 'Lei nº 15.270, de 26/11/2025, art. 3º-A, I (isenção até R$ 5.000,00)', FALSE),
  ('2026-01-01', '2026-12-31', 'IRRF_REDUTOR_2026', 1, 5000.01, 7350.00, 0.1331, 0, 978.62, 'Lei nº 15.270, de 26/11/2025, art. 3º-A, II (978,62 - 0,133145 * rendimento bruto)', FALSE);
