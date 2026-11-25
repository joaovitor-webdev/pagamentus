-- ============================================================================
-- PAGAMENTUS - Seed de Desenvolvimento / Demonstração (LGPD)
-- Cria 1 escritório, 5 usuários (1 por papel RBAC), 3 empresas e dados base.
-- Senha padrão de desenvolvimento para os 5 usuários: Pagamentus@2026
-- ============================================================================

INSERT INTO public.escritorios (id, nome, cnpj, plano)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Pagamentus Contabilidade & Assessoria Ltda (Fictícia)',
  '12.345.678/0001-99',
  'ENTERPRISE'
)
ON CONFLICT (cnpj) DO NOTHING;

-- 5 Usuários no Supabase Auth (somente ambiente de desenvolvimento)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  ('22222222-2222-2222-2222-222222222221', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@pagamentus.test', crypt('Pagamentus@2026', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"nome":"Ana Paula (Admin)"}', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'contador@pagamentus.test', crypt('Pagamentus@2026', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"nome":"Carlos Eduardo (Contador)"}', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222223', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rh@pagamentus.test', crypt('Pagamentus@2026', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"nome":"Mariana Silva (RH/DP)"}', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222224', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'financeiro@pagamentus.test', crypt('Pagamentus@2026', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"nome":"Roberto Lima (Financeiro)"}', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222225', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cliente@pagamentus.test', crypt('Pagamentus@2026', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"nome":"João da Silva (Cliente)"}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Perfis RBAC correspondentes
INSERT INTO public.usuarios_perfis (usuario_id, escritorio_id, nome, email, papel)
VALUES
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Ana Paula (Admin)', 'admin@pagamentus.test', 'ADMIN'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Carlos Eduardo (Contador)', 'contador@pagamentus.test', 'CONTADOR'),
  ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'Mariana Silva (RH/DP)', 'rh@pagamentus.test', 'RH_DP'),
  ('22222222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111111', 'Roberto Lima (Financeiro)', 'financeiro@pagamentus.test', 'FINANCEIRO'),
  ('22222222-2222-2222-2222-222222222225', '11111111-1111-1111-1111-111111111111', 'João da Silva (Cliente)', 'cliente@pagamentus.test', 'CLIENTE')
ON CONFLICT (usuario_id) DO NOTHING;

-- 3 Empresas Fictícias
INSERT INTO public.empresas (id, escritorio_id, tipo_pessoa, razao_social, nome_fantasia, cpf_cnpj, regime_tributario, cnae_principal, municipio, uf)
VALUES
  ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', 'PJ', 'Tecnologia Horizonte S/A (Fictícia)', 'Horizonte Tech', '98.765.432/0001-10', 'PRESUMIDO', '6201-5/01', 'Recife', 'PE'),
  ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', 'PJ', 'Comércio Estrela do Sul Ltda (Fictícia)', 'Estrela do Sul', '45.123.789/0001-55', 'SIMPLES', '4711-3/02', 'São Paulo', 'SP'),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'PF', 'João da Silva (Contribuinte Fictício)', NULL, '111.222.333-44', 'PF_IRPF', NULL, 'Olinda', 'PE')
ON CONFLICT (escritorio_id, cpf_cnpj) DO NOTHING;

-- Vínculo do usuário CLIENTE apenas com a sua empresa/PF
INSERT INTO public.usuarios_empresas (usuario_id, empresa_id)
VALUES
  ('22222222-2222-2222-2222-222222222225', '33333333-3333-3333-3333-333333333333')
ON CONFLICT (usuario_id, empresa_id) DO NOTHING;

-- Competência inicial
INSERT INTO public.competencias (id, empresa_id, ano_mes, status_folha, status_contabil, status_fiscal)
VALUES
  ('55555555-5555-5555-5555-555555555551', '33333333-3333-3333-3333-333333333331', '2026-11', 'ABERTA', 'ABERTA', 'ABERTA')
ON CONFLICT (empresa_id, ano_mes) DO NOTHING;

-- Empregados fictícios
INSERT INTO public.empregados (empresa_id, nome, cpf, cargo, salario_base, data_admissao, dependentes)
VALUES
  ('33333333-3333-3333-3333-333333333331', 'Lucas Ferreira (Fictício)', '222.333.444-55', 'Analista Contábil Pleno', 5200.00, '2024-03-01', 1),
  ('33333333-3333-3333-3333-333333333331', 'Beatriz Costa (Fictícia)', '333.444.555-66', 'Assistente Fiscal', 3400.00, '2025-01-15', 0)
ON CONFLICT (empresa_id, cpf) DO NOTHING;

-- Plano de Contas inicial (RF-006)
INSERT INTO public.plano_contas (id, empresa_id, codigo, nome, tipo, natureza, grupo)
VALUES
  ('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333331', '1.1.01.001', 'Caixa e Equivalentes', 'ANALITICA', 'DEVEDORA', 'ATIVO'),
  ('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333331', '1.1.02.001', 'Bancos Conta Movimento', 'ANALITICA', 'DEVEDORA', 'ATIVO'),
  ('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333331', '3.1.01.001', 'Receita de Prestação de Serviços', 'ANALITICA', 'CREDORA', 'RECEITA'),
  ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333331', '4.1.01.001', 'Despesas com Folha de Pagamento', 'ANALITICA', 'DEVEDORA', 'DESPESA')
ON CONFLICT (empresa_id, codigo) DO NOTHING;

-- Lançamentos Contábeis iniciais (RF-007)
INSERT INTO public.lancamentos_contabeis (id, empresa_id, competencia_id, data_lancamento, historico, conta_debito_id, conta_credito_id, valor)
VALUES
  ('66666666-6666-6666-6666-666666666661', '33333333-3333-3333-3333-333333333331', '55555555-5555-5555-5555-555555555551', '2026-11-10', 'Recebimento de serviços de consultoria NF-001', '44444444-4444-4444-4444-444444444441', '44444444-4444-4444-4444-444444444443', 15000.00)
ON CONFLICT (id) DO NOTHING;

-- Títulos Financeiros iniciais (RF-046)
INSERT INTO public.titulos_financeiros (id, empresa_id, tipo, parceiro_nome, vencimento, valor, status)
VALUES
  ('77777777-7777-7777-7777-777777777771', '33333333-3333-3333-3333-333333333331', 'RECEBER', 'Cliente Alpha Consultoria (Fictício)', '2026-11-28', 12500.00, 'ABERTO'),
  ('77777777-7777-7777-7777-777777777772', '33333333-3333-3333-3333-333333333331', 'PAGAR', 'Fornecedor Cloud & Software Ltda', '2026-11-30', 1850.00, 'ABERTO'),
  ('77777777-7777-7777-7777-777777777773', '33333333-3333-3333-3333-333333333332', 'RECEBER', 'Comércio Estrela do Sul Ltda', '2026-11-15', 4200.00, 'LIQUIDADO')
ON CONFLICT (id) DO NOTHING;

-- Apurações Fiscais iniciais (RF-020)
INSERT INTO public.apuracoes_fiscais (id, empresa_id, competencia, tributo, regime, base_calculo, aliquota, valor_apurado, status)
VALUES
  ('88888888-8888-8888-8888-888888888881', '33333333-3333-3333-3333-333333333331', '2026-11', 'ISSQN (Serviços)', 'Lucro Presumido', 15000.00, 5.00, 750.00, 'AGUARDANDO_CONFERENCIA'),
  ('88888888-8888-8888-8888-888888888882', '33333333-3333-3333-3333-333333333331', '2026-11', 'PIS / COFINS Cumulativo', 'Lucro Presumido', 15000.00, 3.65, 547.50, 'AGUARDANDO_CONFERENCIA')
ON CONFLICT (id) DO NOTHING;

-- Obrigações Acessórias iniciais (RF-065)
-- Obrigações acessórias são geradas automaticamente via public.gerar_calendario_obrigacoes(empresa_id, competencia)
