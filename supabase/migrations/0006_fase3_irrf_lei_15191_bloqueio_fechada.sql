-- ============================================================================
-- PAGAMENTUS - Migration 0006: Fonte Legal IRRF (Lei 15.191/2025) e
-- Bloqueio no Banco de Edição em Competência Fechada
-- ============================================================================

UPDATE public.parametros_legais
SET fonte_legal = 'Lei nº 15.191/2025 e Lei nº 15.270/2025 - Tabela Progressiva Mensal'
WHERE vigencia_inicio = '2026-01-01' AND tipo = 'IRRF_FAIXA';

CREATE OR REPLACE FUNCTION public.fn_bloquear_folha_fechada()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status VARCHAR(20);
  v_emp_id UUID;
  v_comp CHAR(7);
BEGIN
  v_emp_id := COALESCE(NEW.empresa_id, OLD.empresa_id);
  v_comp := COALESCE(NEW.competencia, OLD.competencia);

  SELECT status_folha INTO v_status
  FROM public.competencias
  WHERE empresa_id = v_emp_id AND ano_mes = v_comp
  LIMIT 1;

  IF v_status = 'FECHADA' THEN
    RAISE EXCEPTION 'Competência % está FECHADA. Edição bloqueada; apenas ADMIN pode reabrir.', v_comp;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_bloquear_eventos_folha_fechada ON public.eventos_folha;
CREATE TRIGGER trg_bloquear_eventos_folha_fechada
  BEFORE INSERT OR UPDATE OR DELETE ON public.eventos_folha
  FOR EACH ROW EXECUTE FUNCTION public.fn_bloquear_folha_fechada();

DROP TRIGGER IF EXISTS trg_bloquear_calculos_folha_fechada ON public.folha_calculos;
CREATE TRIGGER trg_bloquear_calculos_folha_fechada
  BEFORE INSERT OR UPDATE OR DELETE ON public.folha_calculos
  FOR EACH ROW EXECUTE FUNCTION public.fn_bloquear_folha_fechada();
