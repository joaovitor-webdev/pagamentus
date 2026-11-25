-- ============================================================================
-- PAGAMENTUS - Migration 0002: Fase 2 (Cadastros CRUD, Financeiro, Fiscal e Documentos)
-- ============================================================================

-- 1. Complemento da tabela empregados (RF-051)
ALTER TABLE public.empregados
  ADD COLUMN IF NOT EXISTS pis VARCHAR(20),
  ADD COLUMN IF NOT EXISTS cbo VARCHAR(15),
  ADD COLUMN IF NOT EXISTS tipo_contrato VARCHAR(30) DEFAULT 'CLT',
  ADD COLUMN IF NOT EXISTS vale_transporte BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS dados_bancarios VARCHAR(180);

-- 2. Clientes e Fornecedores (para o Financeiro)
CREATE TABLE IF NOT EXISTS public.clientes_fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo VARCHAR(15) NOT NULL CHECK (tipo IN ('CLIENTE', 'FORNECEDOR', 'AMBOS')),
  nome_razao VARCHAR(200) NOT NULL,
  cpf_cnpj VARCHAR(18) NOT NULL,
  email VARCHAR(180),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Títulos Financeiros (Contas a Pagar/Receber)
CREATE TABLE IF NOT EXISTS public.titulos_financeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  cliente_fornecedor_id UUID REFERENCES public.clientes_fornecedores(id),
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('RECEBER', 'PAGAR')),
  parceiro_nome VARCHAR(200) NOT NULL,
  vencimento DATE NOT NULL,
  valor NUMERIC(14, 2) NOT NULL CHECK (valor > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'ABERTO' CHECK (status IN ('ABERTO', 'LIQUIDADO', 'PARCIAL', 'CANCELADO')),
  data_baixa DATE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Apurações Fiscais (Fiscal & IR)
CREATE TABLE IF NOT EXISTS public.apuracoes_fiscais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  competencia CHAR(7) NOT NULL,
  tributo VARCHAR(80) NOT NULL,
  regime VARCHAR(40) NOT NULL,
  base_calculo NUMERIC(14, 2) NOT NULL CHECK (base_calculo >= 0),
  aliquota NUMERIC(6, 2) NOT NULL CHECK (aliquota >= 0),
  valor_apurado NUMERIC(14, 2) NOT NULL CHECK (valor_apurado >= 0),
  status VARCHAR(30) NOT NULL DEFAULT 'AGUARDANDO_CONFERENCIA' CHECK (status IN ('AGUARDANDO_CONFERENCIA', 'APROVADA')),
  aprovado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Documentos da Empresa (Supabase Storage privado + alerta de vencimento)
CREATE TABLE IF NOT EXISTS public.documentos_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo VARCHAR(60) NOT NULL,
  nome_arquivo VARCHAR(200) NOT NULL,
  storage_path TEXT NOT NULL,
  data_validade DATE,
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TRIGGERS DE AUDITORIA AUTOMÁTICA NAS NOVAS TABELAS
-- ============================================================================

DROP TRIGGER IF EXISTS trg_audit_titulos ON public.titulos_financeiros;
CREATE TRIGGER trg_audit_titulos AFTER INSERT OR UPDATE OR DELETE ON public.titulos_financeiros FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_automatica();

DROP TRIGGER IF EXISTS trg_audit_apuracoes ON public.apuracoes_fiscais;
CREATE TRIGGER trg_audit_apuracoes AFTER INSERT OR UPDATE OR DELETE ON public.apuracoes_fiscais FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_automatica();

DROP TRIGGER IF EXISTS trg_audit_documentos ON public.documentos_empresa;
CREATE TRIGGER trg_audit_documentos AFTER INSERT OR UPDATE OR DELETE ON public.documentos_empresa FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_automatica();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) NAS NOVAS TABELAS
-- ============================================================================

ALTER TABLE public.clientes_fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.titulos_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apuracoes_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_empresa ENABLE ROW LEVEL SECURITY;

-- clientes_fornecedores
CREATE POLICY "clientes_fornecedores_select" ON public.clientes_fornecedores
  FOR SELECT USING (public.pode_acessar_empresa(empresa_id) AND public.tem_papel(ARRAY['ADMIN', 'CONTADOR', 'FINANCEIRO']));
CREATE POLICY "clientes_fornecedores_write" ON public.clientes_fornecedores
  FOR ALL USING (public.pode_acessar_empresa(empresa_id) AND public.tem_papel(ARRAY['ADMIN', 'FINANCEIRO']));

-- titulos_financeiros
CREATE POLICY "titulos_select" ON public.titulos_financeiros
  FOR SELECT USING (public.pode_acessar_empresa(empresa_id) AND public.tem_papel(ARRAY['ADMIN', 'CONTADOR', 'FINANCEIRO']));
CREATE POLICY "titulos_write" ON public.titulos_financeiros
  FOR ALL USING (public.pode_acessar_empresa(empresa_id) AND public.tem_papel(ARRAY['ADMIN', 'FINANCEIRO']));

-- apuracoes_fiscais
CREATE POLICY "apuracoes_select" ON public.apuracoes_fiscais
  FOR SELECT USING (public.pode_acessar_empresa(empresa_id) AND public.tem_papel(ARRAY['ADMIN', 'CONTADOR']));
CREATE POLICY "apuracoes_write" ON public.apuracoes_fiscais
  FOR ALL USING (public.pode_acessar_empresa(empresa_id) AND public.tem_papel(ARRAY['ADMIN', 'CONTADOR']));

-- documentos_empresa (CLIENTE pode ver documentos da sua própria empresa)
CREATE POLICY "documentos_select" ON public.documentos_empresa
  FOR SELECT USING (public.pode_acessar_empresa(empresa_id));
CREATE POLICY "documentos_write" ON public.documentos_empresa
  FOR ALL USING (public.pode_acessar_empresa(empresa_id) AND public.tem_papel(ARRAY['ADMIN', 'CONTADOR', 'RH_DP']));
