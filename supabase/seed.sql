-- ============================================================================
-- PAGAMENTUS - Dados Fictícios Iniciais para Testes e Homologação (LGPD)
-- ============================================================================

INSERT INTO organizacoes (id, nome, cnpj, plano)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Pagamentus Contabilidade & Assessoria Ltda (Fictícia)',
  '12.345.678/0001-99',
  'ENTERPRISE'
)
ON CONFLICT (cnpj) DO NOTHING;

INSERT INTO usuarios (id, organizacao_id, nome, email, senha_hash, perfil, mfa_habilitado)
VALUES
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Ana Paula (Admin)', 'admin@pagamentus.local', 'hash_ficticio_admin', 'ADMINISTRADOR', TRUE),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Carlos Eduardo (Contador)', 'contador@pagamentus.local', 'hash_ficticio_contador', 'CONTADOR', TRUE),
  ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'Mariana Silva (RH/DP)', 'rh@pagamentus.local', 'hash_ficticio_rh', 'RH_DP', FALSE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO empresas (id, organizacao_id, tipo_pessoa, razao_social, nome_fantasia, cpf_cnpj, regime_tributario, cnae_principal, municipio, uf)
VALUES
  ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', 'PJ', 'Tecnologia Horizonte S/A (Fictícia)', 'Horizonte Tech', '98.765.432/0001-10', 'LUCRO_PRESUMIDO', '6201-5/01', 'Recife', 'PE'),
  ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', 'PJ', 'Comércio Estrela do Sul Ltda (Fictícia)', 'Estrela do Sul', '45.123.789/0001-55', 'SIMPLES_NACIONAL', '4711-3/02', 'São Paulo', 'SP'),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'PF', 'João da Silva (Contribuinte Fictício)', NULL, '111.222.333-44', 'ISENTO_PF', NULL, 'Olinda', 'PE')
ON CONFLICT (organizacao_id, cpf_cnpj) DO NOTHING;

INSERT INTO plano_contas (id, empresa_id, codigo, nome, tipo, natureza, grupo)
VALUES
  ('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333331', '1.1.01.001', 'Caixa e Equivalentes', 'ANALITICA', 'DEVEDORA', 'ATIVO'),
  ('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333331', '3.1.01.001', 'Receita de Prestação de Serviços', 'ANALITICA', 'CREDORA', 'RECEITA'),
  ('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333331', '4.1.01.001', 'Despesas com Folha de Pagamento', 'ANALITICA', 'DEVEDORA', 'DESPESA')
ON CONFLICT (empresa_id, codigo) DO NOTHING;

INSERT INTO periodos_contabeis (id, empresa_id, competencia, status)
VALUES
  ('55555555-5555-5555-5555-555555555551', '33333333-3333-3333-3333-333333333331', '2026-11', 'ABERTO')
ON CONFLICT (empresa_id, competencia) DO NOTHING;

INSERT INTO empregados (empresa_id, nome, cpf, cargo, salario_base, data_admissao, dependentes)
VALUES
  ('33333333-3333-3333-3333-333333333331', 'Lucas Ferreira (Fictício)', '222.333.444-55', 'Analista Contábil Pleno', 5200.00, '2024-03-01', 1),
  ('33333333-3333-3333-3333-333333333331', 'Beatriz Costa (Fictícia)', '333.444.555-66', 'Assistente Fiscal', 3400.00, '2025-01-15', 0);

INSERT INTO obrigacoes_acessorias (empresa_id, titulo, competencia, vencimento, status, responsavel_id)
VALUES
  ('33333333-3333-3333-3333-333333333331', 'DCTFWeb - Competência 11/2026', '2026-11', '2026-12-15', 'EM_PREPARACAO', '22222222-2222-2222-2222-222222222222'),
  ('33333333-3333-3333-3333-333333333332', 'PGDAS-D - Simples Nacional 11/2026', '2026-11', '2026-12-20', 'PENDENTE', '22222222-2222-2222-2222-222222222222');
