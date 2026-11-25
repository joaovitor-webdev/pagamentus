-- Migration 0031: Remover obrigações manuais antigas do seed e regerar calendários das competências 09/2026, 10/2026 e 11/2026 (vencimentos em 10/2026, 11/2026, 12/2026 e 01/2027) para as 3 empresas

DELETE FROM public.obrigacoes_acessorias;

DO $$
DECLARE
  v_emp RECORD;
  v_mes TEXT;
BEGIN
  FOR v_emp IN SELECT id FROM public.empresas LOOP
    FOREACH v_mes IN ARRAY ARRAY['2026-10', '2026-11', '2026-12', '2027-01'] LOOP
      PERFORM public.gerar_calendario_obrigacoes(v_emp.id, v_mes);
    END LOOP;
  END LOOP;
END $$;
