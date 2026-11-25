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
      WHERE empresa_id = p_empresa_id AND competencia = p_competencia AND titulo = r.nome
    ) THEN
      INSERT INTO public.obrigacoes_acessorias (empresa_id, competencia, titulo, vencimento, status, responsavel_nome)
      VALUES (p_empresa_id, p_competencia, r.nome, v_venc, 'PENDENTE', 'Equipe Fiscal');
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;
