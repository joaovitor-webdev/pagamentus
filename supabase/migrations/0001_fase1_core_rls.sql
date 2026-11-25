-- ============================================================================
-- PAGAMENTUS - Migration 0001: Core Multi-tenant, Auth/RBAC, RLS e Auditoria
-- Substitui supabase/legacy/schema.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Escritórios (Tenants)
CREATE TABLE IF NOT EXISTS public.escritorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(180) NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  plano VARCHAR(40) NOT NULL DEFAULT 'PROFISSIONAL',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Perfis de Usuários vinculados ao Supabase Auth (auth.users)
CREATE TABLE IF NOT EXISTS public.usuarios_perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  escritorio_id UUID NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(180) UNIQUE NOT NULL,
  papel VARCHAR(20) NOT NULL CHECK (papel IN ('ADMIN', 'CONTADOR', 'RH_DP', 'FINANCEIRO', 'CLIENTE')),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Empresas e Clientes (RF-001 a RF-005)
CREATE TABLE IF NOT EXISTS public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id UUID NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
  tipo_pessoa CHAR(2) NOT NULL CHECK (tipo_pessoa IN ('PJ', 'PF')),
  razao_social VARCHAR(200) NOT NULL,
  nome_fantasia VARCHAR(200),
  cpf_cnpj VARCHAR(18) NOT NULL,
  regime_tributario VARCHAR(20) NOT NULL CHECK (regime_tributario IN ('SIMPLES', 'PRESUMIDO', 'REAL', 'PF_IRPF')),
  cnae_principal VARCHAR(20),
  municipio VARCHAR(100),
  uf CHAR(2),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (escritorio_id, cpf_cnpj)
);

-- 4. Vínculo Usuário x Empresa (para acesso restrito do papel CLIENTE)
CREATE TABLE IF NOT EXISTS public.usuarios_empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, empresa_id)
);

-- 5. Competências (controle de status por módulo)
CREATE TABLE IF NOT EXISTS public.competencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  ano_mes CHAR(7) NOT NULL, -- YYYY-MM
  status_folha VARCHAR(20) NOT NULL DEFAULT 'ABERTA' CHECK (status_folha IN ('ABERTA', 'CALCULADA', 'CONFERIDA', 'FECHADA')),
  status_contabil VARCHAR(20) NOT NULL DEFAULT 'ABERTA' CHECK (status_contabil IN ('ABERTA', 'EM_FECHAMENTO', 'FECHADA')),
  status_fiscal VARCHAR(20) NOT NULL DEFAULT 'ABERTA' CHECK (status_fiscal IN ('ABERTA', 'AGUARDANDO_CONFERENCIA', 'APROVADA')),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (empresa_id, ano_mes)
);

-- 6. Plano de Contas (RF-006)
CREATE TABLE IF NOT EXISTS public.plano_contas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  codigo VARCHAR(30) NOT NULL,
  nome VARCHAR(150) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('SINTETICA', 'ANALITICA')),
  natureza VARCHAR(20) NOT NULL CHECK (natureza IN ('DEVEDORA', 'CREDORA')),
  grupo VARCHAR(30) NOT NULL CHECK (grupo IN ('ATIVO', 'PASSIVO', 'PATRIMONIO_LIQUIDO', 'RECEITA', 'DESPESA')),
  ativa BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (empresa_id, codigo)
);

-- 7. Lançamentos Contábeis (RF-007, RF-008, RB-001)
CREATE TABLE IF NOT EXISTS public.lancamentos_contabeis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  competencia_id UUID NOT NULL REFERENCES public.competencias(id),
  data_lancamento DATE NOT NULL,
  historico TEXT NOT NULL,
  conta_debito_id UUID NOT NULL REFERENCES public.plano_contas(id),
  conta_credito_id UUID NOT NULL REFERENCES public.plano_contas(id),
  valor NUMERIC(14, 2) NOT NULL CHECK (valor > 0),
  origem VARCHAR(30) NOT NULL DEFAULT 'MANUAL',
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Empregados (RF-051 a RF-056)
CREATE TABLE IF NOT EXISTS public.empregados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome VARCHAR(150) NOT NULL,
  cpf VARCHAR(14) NOT NULL,
  cargo VARCHAR(100) NOT NULL,
  salario_base NUMERIC(14, 2) NOT NULL CHECK (salario_base >= 0),
  data_admissao DATE NOT NULL,
  dependentes INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'AFASTADO', 'DESLIGADO')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Obrigações Acessórias (RF-061 a RF-065)
CREATE TABLE IF NOT EXISTS public.obrigacoes_acessorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  titulo VARCHAR(150) NOT NULL,
  competencia CHAR(7) NOT NULL,
  vencimento DATE NOT NULL,
  status VARCHAR(25) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'EM_PREPARACAO', 'EM_REVISAO', 'ENTREGUE', 'ATRASADA')),
  responsavel_id UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Trilha de Auditoria Imutável (RNF-004, Somente INSERT)
CREATE TABLE IF NOT EXISTS public.auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  usuario_id UUID REFERENCES auth.users(id),
  escritorio_id UUID REFERENCES public.escritorios(id),
  empresa_id UUID REFERENCES public.empresas(id),
  modulo VARCHAR(60) NOT NULL,
  acao VARCHAR(60) NOT NULL,
  entidade VARCHAR(80) NOT NULL,
  entidade_id VARCHAR(100),
  antes JSONB,
  depois JSONB,
  ip INET
);

-- ============================================================================
-- FUNÇÕES AUXILIARES SECURITY DEFINER (evitam recursão infinita em RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.meu_escritorio_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT escritorio_id
  FROM public.usuarios_perfis
  WHERE usuario_id = auth.uid() AND ativo = TRUE
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.tem_papel(papeis_permitidos TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios_perfis
    WHERE usuario_id = auth.uid()
      AND ativo = TRUE
      AND papel = ANY(papeis_permitidos)
  );
$$;

CREATE OR REPLACE FUNCTION public.pode_acessar_empresa(emp_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.empresas e
    JOIN public.usuarios_perfis up ON up.escritorio_id = e.escritorio_id
    WHERE e.id = emp_id
      AND up.usuario_id = auth.uid()
      AND up.ativo = TRUE
      AND (
        up.papel <> 'CLIENTE'
        OR EXISTS (
          SELECT 1
          FROM public.usuarios_empresas ue
          WHERE ue.usuario_id = auth.uid()
            AND ue.empresa_id = emp_id
        )
      )
  );
$$;

-- ============================================================================
-- TRIGGERS DE AUDITORIA AUTOMÁTICA E IMUTABILIDADE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_bloquear_alteracao_auditoria()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'A tabela auditoria é imutável: UPDATE e DELETE são proibidos.';
END;
$$;

DROP TRIGGER IF EXISTS trg_bloquear_update_delete_auditoria ON public.auditoria;
CREATE TRIGGER trg_bloquear_update_delete_auditoria
  BEFORE UPDATE OR DELETE ON public.auditoria
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_bloquear_alteracao_auditoria();

CREATE OR REPLACE FUNCTION public.fn_auditoria_automatica()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_escritorio_id UUID;
  v_empresa_id UUID;
BEGIN
  v_escritorio_id := public.meu_escritorio_id();

  IF TG_TABLE_NAME = 'empresas' THEN
    v_empresa_id := COALESCE(NEW.id, OLD.id);
  ELSIF TG_TABLE_NAME IN ('competencias', 'lancamentos_contabeis', 'empregados', 'obrigacoes_acessorias') THEN
    v_empresa_id := COALESCE(NEW.empresa_id, OLD.empresa_id);
  ELSE
    v_empresa_id := NULL;
  END IF;

  INSERT INTO public.auditoria (
    usuario_id,
    escritorio_id,
    empresa_id,
    modulo,
    acao,
    entidade,
    entidade_id,
    antes,
    depois
  ) VALUES (
    auth.uid(),
    v_escritorio_id,
    v_empresa_id,
    UPPER(TG_TABLE_NAME),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_empresas ON public.empresas;
CREATE TRIGGER trg_audit_empresas AFTER INSERT OR UPDATE OR DELETE ON public.empresas FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_automatica();

DROP TRIGGER IF EXISTS trg_audit_competencias ON public.competencias;
CREATE TRIGGER trg_audit_competencias AFTER INSERT OR UPDATE OR DELETE ON public.competencias FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_automatica();

DROP TRIGGER IF EXISTS trg_audit_lancamentos ON public.lancamentos_contabeis;
CREATE TRIGGER trg_audit_lancamentos AFTER INSERT OR UPDATE OR DELETE ON public.lancamentos_contabeis FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_automatica();

DROP TRIGGER IF EXISTS trg_audit_empregados ON public.empregados;
CREATE TRIGGER trg_audit_empregados AFTER INSERT OR UPDATE OR DELETE ON public.empregados FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_automatica();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
-- ============================================================================

ALTER TABLE public.escritorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plano_contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos_contabeis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empregados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obrigacoes_acessorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

-- escritorios
CREATE POLICY "escritorios_select_proprio" ON public.escritorios
  FOR SELECT USING (id = public.meu_escritorio_id());

-- usuarios_perfis
CREATE POLICY "usuarios_perfis_select_escritorio" ON public.usuarios_perfis
  FOR SELECT USING (escritorio_id = public.meu_escritorio_id());
CREATE POLICY "usuarios_perfis_admin_write" ON public.usuarios_perfis
  FOR ALL USING (escritorio_id = public.meu_escritorio_id() AND public.tem_papel(ARRAY['ADMIN']));

-- empresas
CREATE POLICY "empresas_select_acesso" ON public.empresas
  FOR SELECT USING (public.pode_acessar_empresa(id));
CREATE POLICY "empresas_write_admin_contador" ON public.empresas
  FOR ALL USING (escritorio_id = public.meu_escritorio_id() AND public.tem_papel(ARRAY['ADMIN', 'CONTADOR']));

-- usuarios_empresas
CREATE POLICY "usuarios_empresas_select" ON public.usuarios_empresas
  FOR SELECT USING (usuario_id = auth.uid() OR public.tem_papel(ARRAY['ADMIN']));
CREATE POLICY "usuarios_empresas_admin_write" ON public.usuarios_empresas
  FOR ALL USING (public.tem_papel(ARRAY['ADMIN']));

-- competencias
CREATE POLICY "competencias_select" ON public.competencias
  FOR SELECT USING (public.pode_acessar_empresa(empresa_id));
CREATE POLICY "competencias_write" ON public.competencias
  FOR ALL USING (public.pode_acessar_empresa(empresa_id) AND public.tem_papel(ARRAY['ADMIN', 'CONTADOR', 'RH_DP']));

-- plano_contas
CREATE POLICY "plano_contas_select" ON public.plano_contas
  FOR SELECT USING (public.pode_acessar_empresa(empresa_id) AND public.tem_papel(ARRAY['ADMIN', 'CONTADOR', 'FINANCEIRO']));
CREATE POLICY "plano_contas_write" ON public.plano_contas
  FOR ALL USING (public.pode_acessar_empresa(empresa_id) AND public.tem_papel(ARRAY['ADMIN', 'CONTADOR']));

-- lancamentos_contabeis (RH_DP e CLIENTE não acessam)
CREATE POLICY "lancamentos_select" ON public.lancamentos_contabeis
  FOR SELECT USING (public.pode_acessar_empresa(empresa_id) AND public.tem_papel(ARRAY['ADMIN', 'CONTADOR', 'FINANCEIRO']));
CREATE POLICY "lancamentos_write" ON public.lancamentos_contabeis
  FOR ALL USING (public.pode_acessar_empresa(empresa_id) AND public.tem_papel(ARRAY['ADMIN', 'CONTADOR']));

-- empregados (RH_DP, ADMIN, CONTADOR e CLIENTE somente leitura se vinculado)
CREATE POLICY "empregados_select" ON public.empregados
  FOR SELECT USING (public.pode_acessar_empresa(empresa_id) AND public.tem_papel(ARRAY['ADMIN', 'CONTADOR', 'RH_DP', 'CLIENTE']));
CREATE POLICY "empregados_write" ON public.empregados
  FOR ALL USING (public.pode_acessar_empresa(empresa_id) AND public.tem_papel(ARRAY['ADMIN', 'RH_DP']));

-- obrigacoes_acessorias
CREATE POLICY "obrigacoes_select" ON public.obrigacoes_acessorias
  FOR SELECT USING (public.pode_acessar_empresa(empresa_id));
CREATE POLICY "obrigacoes_write" ON public.obrigacoes_acessorias
  FOR ALL USING (public.pode_acessar_empresa(empresa_id) AND public.tem_papel(ARRAY['ADMIN', 'CONTADOR']));

-- auditoria (somente SELECT para ADMIN/CONTADOR; INSERT apenas via triggers ou registrar_auditoria(); UPDATE/DELETE bloqueados)
CREATE POLICY "auditoria_select" ON public.auditoria
  FOR SELECT USING (escritorio_id = public.meu_escritorio_id() AND public.tem_papel(ARRAY['ADMIN', 'CONTADOR']));

CREATE OR REPLACE FUNCTION public.registrar_auditoria(
  p_empresa_id UUID,
  p_modulo TEXT,
  p_acao TEXT,
  p_entidade TEXT,
  p_entidade_id TEXT DEFAULT NULL,
  p_antes JSONB DEFAULT NULL,
  p_depois JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  INSERT INTO public.auditoria (
    usuario_id,
    escritorio_id,
    empresa_id,
    modulo,
    acao,
    entidade,
    entidade_id,
    antes,
    depois
  ) VALUES (
    auth.uid(),
    public.meu_escritorio_id(),
    p_empresa_id,
    p_modulo,
    p_acao,
    p_entidade,
    p_entidade_id,
    p_antes,
    p_depois
  );
END;
$$;
