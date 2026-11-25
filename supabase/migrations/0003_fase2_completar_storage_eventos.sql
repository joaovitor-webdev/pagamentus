-- ============================================================================
-- PAGAMENTUS - Migration 0003: Eventos de Folha, Campos Empresa e Storage Privado
-- ============================================================================

-- 1. Campos de endereço/contato em empresas
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS cep VARCHAR(10),
  ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);

-- 2. Eventos de Folha (RF-053)
CREATE TABLE IF NOT EXISTS public.eventos_folha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  empregado_id UUID NOT NULL REFERENCES public.empregados(id) ON DELETE CASCADE,
  competencia CHAR(7) NOT NULL,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('HORA_EXTRA', 'BONUS', 'FALTA', 'AFASTAMENTO')),
  descricao VARCHAR(200) NOT NULL,
  valor NUMERIC(14, 2) NOT NULL CHECK (valor >= 0),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.eventos_folha ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eventos_folha_select" ON public.eventos_folha
  FOR SELECT USING (public.pode_acessar_empresa(empresa_id) AND public.tem_papel(ARRAY['ADMIN', 'CONTADOR', 'RH_DP']));

CREATE POLICY "eventos_folha_write" ON public.eventos_folha
  FOR ALL USING (public.pode_acessar_empresa(empresa_id) AND public.tem_papel(ARRAY['ADMIN', 'RH_DP']));

DROP TRIGGER IF EXISTS trg_audit_eventos_folha ON public.eventos_folha;
CREATE TRIGGER trg_audit_eventos_folha AFTER INSERT OR UPDATE OR DELETE ON public.eventos_folha FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_automatica();

-- 3. Bucket privado no Supabase Storage para Documentos (RF-003 / RF-066)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage por empresa (caminho: <empresa_id>/<arquivo>) e papel
DROP POLICY IF EXISTS "storage_documentos_select" ON storage.objects;
CREATE POLICY "storage_documentos_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documentos'
    AND public.pode_acessar_empresa((storage.foldername(name))[1]::uuid)
  );

DROP POLICY IF EXISTS "storage_documentos_insert" ON storage.objects;
CREATE POLICY "storage_documentos_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documentos'
    AND public.pode_acessar_empresa((storage.foldername(name))[1]::uuid)
    AND public.tem_papel(ARRAY['ADMIN', 'CONTADOR', 'RH_DP'])
  );

DROP POLICY IF EXISTS "storage_documentos_delete" ON storage.objects;
CREATE POLICY "storage_documentos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documentos'
    AND public.pode_acessar_empresa((storage.foldername(name))[1]::uuid)
    AND public.tem_papel(ARRAY['ADMIN', 'CONTADOR'])
  );
