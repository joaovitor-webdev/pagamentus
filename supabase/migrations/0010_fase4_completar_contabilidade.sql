-- ============================================================================
-- PAGAMENTUS - Migration 0010: Estorno de lançamento incorreto do seed,
-- Múltiplas Partidas, Travas de Edição/Exclusão e Período Contábil Fechado
-- ============================================================================

-- 1. Estornar o lançamento antigo de demonstração sem apagar registro
DO $$
DECLARE
  v_rec RECORD;
BEGIN
  SELECT * INTO v_rec
  FROM public.lancamentos_contabeis
  WHERE id = '66666666-6666-6666-6666-666666666662' AND estornado = FALSE;

  IF FOUND THEN
    INSERT INTO public.lancamentos_contabeis (
      empresa_id, competencia_id, data_lancamento, historico,
      conta_debito_id, conta_credito_id, valor, origem, estorno_de_id
    ) VALUES (
      v_rec.empresa_id, v_rec.competencia_id, v_rec.data_lancamento,
      'Estorno de lançamento de demonstração incorreto',
      v_rec.conta_credito_id, v_rec.conta_debito_id, v_rec.valor, 'ESTORNO', v_rec.id
    );

    UPDATE public.lancamentos_contabeis SET estornado = TRUE WHERE id = v_rec.id;
  END IF;
END $$;

-- 2. Tabela de múltiplas partidas por lançamento
CREATE TABLE IF NOT EXISTS public.lancamentos_partidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lancamento_id UUID NOT NULL REFERENCES public.lancamentos_contabeis(id) ON DELETE CASCADE,
  conta_id UUID NOT NULL REFERENCES public.plano_contas(id),
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('DEBITO', 'CREDITO')),
  valor NUMERIC(14, 2) NOT NULL CHECK (valor > 0)
);

ALTER TABLE public.lancamentos_partidas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lancamentos_partidas_select" ON public.lancamentos_partidas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lancamentos_contabeis l
      WHERE l.id = lancamento_id AND public.pode_acessar_empresa(l.empresa_id)
        AND public.tem_papel(ARRAY['ADMIN', 'CONTADOR', 'FINANCEIRO'])
    )
  );

CREATE POLICY "lancamentos_partidas_insert" ON public.lancamentos_partidas
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lancamentos_contabeis l
      WHERE l.id = lancamento_id AND public.pode_acessar_empresa(l.empresa_id)
        AND public.tem_papel(ARRAY['ADMIN', 'CONTADOR'])
    )
  );

-- 3. Bloqueio de UPDATE (exceto marcar estornado=TRUE) e DELETE em lancamentos_contabeis
CREATE OR REPLACE FUNCTION public.fn_proteger_lancamentos_contabeis()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Lançamentos contábeis não podem ser excluídos; utilize estorno.';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD.valor <> NEW.valor OR OLD.historico <> NEW.historico OR OLD.conta_debito_id <> NEW.conta_debito_id OR OLD.conta_credito_id <> NEW.conta_credito_id THEN
      RAISE EXCEPTION 'Lançamentos contábeis são imutáveis; utilize estorno.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proteger_lancamentos_contabeis ON public.lancamentos_contabeis;
CREATE TRIGGER trg_proteger_lancamentos_contabeis
  BEFORE UPDATE OR DELETE ON public.lancamentos_contabeis
  FOR EACH ROW EXECUTE FUNCTION public.fn_proteger_lancamentos_contabeis();

-- 4. Bloqueio de lançamentos em período contábil fechado
CREATE OR REPLACE FUNCTION public.fn_bloquear_periodo_contabil_fechado()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_status VARCHAR(20);
BEGIN
  SELECT status_contabil INTO v_status
  FROM public.competencias
  WHERE id = NEW.competencia_id;

  IF v_status = 'FECHADA' THEN
    RAISE EXCEPTION 'Período contábil encerrado. Nenhum lançamento é permitido.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bloquear_periodo_contabil_fechado ON public.lancamentos_contabeis;
CREATE TRIGGER trg_bloquear_periodo_contabil_fechado
  BEFORE INSERT ON public.lancamentos_contabeis
  FOR EACH ROW EXECUTE FUNCTION public.fn_bloquear_periodo_contabil_fechado();
