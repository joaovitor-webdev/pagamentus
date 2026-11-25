-- ============================================================================
-- PAGAMENTUS - Schema Principal PostgreSQL (Supabase)
-- Baseado em docs/escopo.md (Sistema Integrado de Contabilidade, Fiscal e IR)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Organizações / Escritórios Contábeis (Multi-tenant)
CREATE TABLE IF NOT EXISTS organizacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(180) NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  plano VARCHAR(40) NOT NULL DEFAULT 'PROFISSIONAL',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Usuários e Perfis RBAC (Seção 3 do escopo.md)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(180) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  perfil VARCHAR(40) NOT NULL CHECK (perfil IN (
    'ADMINISTRADOR',
    'SOCIO_GESTOR',
    'CONTADOR',
    'ASSISTENTE_CONTABIL',
    'FISCAL_TRIBUTARIO',
    'RH_DP',
    'FINANCEIRO_CLIENTE',
    'CLIENTE_IR',
    'AUDITOR'
  )),
  mfa_habilitado BOOLEAN NOT NULL DEFAULT FALSE,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Empresas e Clientes (RF-001 a RF-005)
CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  tipo_pessoa CHAR(2) NOT NULL CHECK (tipo_pessoa IN ('PJ', 'PF')),
  razao_social VARCHAR(200) NOT NULL,
  nome_fantasia VARCHAR(200),
  cpf_cnpj VARCHAR(18) NOT NULL,
  regime_tributario VARCHAR(40) NOT NULL CHECK (regime_tributario IN (
    'SIMPLES_NACIONAL',
    'LUCRO_PRESUMIDO',
    'LUCRO_REAL',
    'ISENTO_PF'
  )),
  cnae_principal VARCHAR(20),
  municipio VARCHAR(100),
  uf CHAR(2),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organizacao_id, cpf_cnpj)
);

-- 4. Plano de Contas (RF-006)
CREATE TABLE IF NOT EXISTS plano_contas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  codigo VARCHAR(30) NOT NULL,
  nome VARCHAR(150) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('SINTETICA', 'ANALITICA')),
  natureza VARCHAR(20) NOT NULL CHECK (natureza IN ('DEVEDORA', 'CREDORA')),
  grupo VARCHAR(30) NOT NULL CHECK (grupo IN ('ATIVO', 'PASSIVO', 'PATRIMONIO_LIQUIDO', 'RECEITA', 'DESPESA')),
  ativa BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (empresa_id, codigo)
);

-- 5. Períodos Contábeis (RF-012, RB-002)
CREATE TABLE IF NOT EXISTS periodos_contabeis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  competencia CHAR(7) NOT NULL, -- YYYY-MM
  status VARCHAR(20) NOT NULL DEFAULT 'ABERTO' CHECK (status IN ('ABERTO', 'EM_FECHAMENTO', 'ENCERRADO')),
  encerrado_por UUID REFERENCES usuarios(id),
  encerrado_em TIMESTAMPTZ,
  UNIQUE (empresa_id, competencia)
);

-- 6. Lançamentos Contábeis - Partidas Dobradas (RF-007, RF-008, RB-001)
CREATE TABLE IF NOT EXISTS lancamentos_contabeis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  periodo_id UUID NOT NULL REFERENCES periodos_contabeis(id),
  data_lancamento DATE NOT NULL,
  historico TEXT NOT NULL,
  conta_debito_id UUID NOT NULL REFERENCES plano_contas(id),
  conta_credito_id UUID NOT NULL REFERENCES plano_contas(id),
  valor NUMERIC(15, 2) NOT NULL CHECK (valor > 0),
  criado_por UUID REFERENCES usuarios(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Empregados e Folha de Pagamento (RF-051 a RF-056)
CREATE TABLE IF NOT EXISTS empregados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(150) NOT NULL,
  cpf VARCHAR(14) NOT NULL,
  cargo VARCHAR(100) NOT NULL,
  salario_base NUMERIC(12, 2) NOT NULL CHECK (salario_base >= 0),
  data_admissao DATE NOT NULL,
  dependentes INT NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Obrigações Acessórias e Prazos (RF-061 a RF-065, RB-009)
CREATE TABLE IF NOT EXISTS obrigacoes_acessorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  titulo VARCHAR(150) NOT NULL,
  competencia CHAR(7) NOT NULL,
  vencimento DATE NOT NULL,
  status VARCHAR(25) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN (
    'PENDENTE',
    'EM_PREPARACAO',
    'EM_REVISAO',
    'ENTREGUE',
    'ATRASADA'
  )),
  responsavel_id UUID REFERENCES usuarios(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Trilha de Auditoria (RNF-004, RF-015)
CREATE TABLE IF NOT EXISTS auditoria_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id UUID REFERENCES organizacoes(id),
  usuario_id UUID REFERENCES usuarios(id),
  modulo VARCHAR(60) NOT NULL,
  acao VARCHAR(60) NOT NULL,
  objeto_id VARCHAR(100),
  detalhes JSONB,
  registrado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
