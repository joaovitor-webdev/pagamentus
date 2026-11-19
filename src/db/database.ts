import { Pool, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isTest = process.env.NODE_ENV === 'test';
const targetDb = isTest ? 'pagamentus_test' : 'pagamentus_prod';

// Configura pool suportando tanto URL quanto conexão local por socket /tmp ou TCP
const poolConfig = process.env.DATABASE_URL
  ? { connectionString: isTest ? (process.env.DATABASE_URL_TEST || process.env.DATABASE_URL) : process.env.DATABASE_URL }
  : {
      host: process.env.PGHOST || '/tmp',
      port: parseInt(process.env.PGPORT || '5432', 10),
      database: targetDb,
      user: process.env.PGUSER || 'doug12',
    };

export const pool = new Pool(poolConfig);

export async function query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function initDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Suporte a isolamento por esquemas / multi-inquilino (SPEC-1.2)
    await client.query(`
      CREATE SCHEMA IF NOT EXISTS pagamentus;
      SET search_path TO pagamentus, public;
    `);

    // Tabela de Parâmetros de Cálculo Fictícios (RF-052)
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_parameters (
        chave VARCHAR(100) PRIMARY KEY,
        valor NUMERIC(12, 4) NOT NULL,
        descricao TEXT NOT NULL
      );
    `);

    // Tabela de Empregados e Contratos com Multi-Inquilino (organization_id) (RF-051)
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL DEFAULT 1,
        nome VARCHAR(255) NOT NULL,
        cpf VARCHAR(20) NOT NULL,
        cargo VARCHAR(150) NOT NULL,
        salario_base NUMERIC(12, 2) NOT NULL,
        jornada VARCHAR(50) NOT NULL,
        data_admissao DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'ativo',
        dependentes INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_emp_org_cpf UNIQUE (organization_id, cpf)
      );
    `);

    // Tabela de Alterações Contratuais (RF-053)
    await client.query(`
      CREATE TABLE IF NOT EXISTS contract_changes (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL DEFAULT 1,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        tipo_alteracao VARCHAR(100) NOT NULL,
        descricao TEXT NOT NULL,
        salario_anterior NUMERIC(12, 2),
        novo_salario NUMERIC(12, 2),
        cargo_anterior VARCHAR(150),
        novo_cargo VARCHAR(150),
        data_alteracao DATE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de Afastamentos e Licenças (RF-053)
    await client.query(`
      CREATE TABLE IF NOT EXISTS leaves (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL DEFAULT 1,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        tipo VARCHAR(100) NOT NULL,
        data_inicio DATE NOT NULL,
        data_fim DATE,
        motivo TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de Eventos Variáveis de Folha (RF-053)
    await client.query(`
      CREATE TABLE IF NOT EXISTS variable_events (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL DEFAULT 1,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        competencia VARCHAR(7) NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        descricao TEXT NOT NULL,
        quantidade NUMERIC(6, 2) DEFAULT 0,
        percentual NUMERIC(6, 2) DEFAULT 0,
        valor NUMERIC(12, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de Fechamentos / Cálculos de Folha (RF-052 & RF-056)
    await client.query(`
      CREATE TABLE IF NOT EXISTS payroll_runs (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL DEFAULT 1,
        competencia VARCHAR(7) NOT NULL,
        tipo VARCHAR(30) NOT NULL DEFAULT 'mensal',
        status VARCHAR(30) NOT NULL DEFAULT 'rascunho',
        total_proventos NUMERIC(14, 2) NOT NULL DEFAULT 0,
        total_descontos NUMERIC(14, 2) NOT NULL DEFAULT 0,
        total_liquido NUMERIC(14, 2) NOT NULL DEFAULT 0,
        total_encargos NUMERIC(14, 2) NOT NULL DEFAULT 0,
        total_provisoes NUMERIC(14, 2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_run_org_comp_tipo UNIQUE (organization_id, competencia, tipo)
      );
    `);

    // Itens Calculados por Empregado na Folha (RF-052 & RF-055)
    await client.query(`
      CREATE TABLE IF NOT EXISTS payroll_items (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL DEFAULT 1,
        payroll_run_id INTEGER NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        salario_base NUMERIC(12, 2) NOT NULL,
        horas_extras_total NUMERIC(12, 2) DEFAULT 0,
        adicionais_total NUMERIC(12, 2) DEFAULT 0,
        faltas_total NUMERIC(12, 2) DEFAULT 0,
        desconto_inss NUMERIC(12, 2) DEFAULT 0,
        desconto_irrf NUMERIC(12, 2) DEFAULT 0,
        outros_descontos NUMERIC(12, 2) DEFAULT 0,
        total_proventos NUMERIC(12, 2) NOT NULL,
        total_descontos NUMERIC(12, 2) NOT NULL,
        salario_liquido NUMERIC(12, 2) NOT NULL,
        base_inss NUMERIC(12, 2) NOT NULL,
        base_fgts NUMERIC(12, 2) NOT NULL,
        valor_fgts NUMERIC(12, 2) NOT NULL,
        inss_patronal NUMERIC(12, 2) NOT NULL,
        provisao_13 NUMERIC(12, 2) NOT NULL DEFAULT 0,
        provisao_ferias NUMERIC(12, 2) NOT NULL DEFAULT 0,
        detalhes_json JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_item_org_run_emp UNIQUE (organization_id, payroll_run_id, employee_id)
      );
    `);

    // Guarda a integração dos totais contábeis com a folha calculada.
    await client.query(`
      CREATE TABLE IF NOT EXISTS payroll_accounting_entries (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL,
        payroll_run_id INTEGER NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
        competencia VARCHAR(7) NOT NULL,
        dados_lancamento JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_payroll_accounting_entry_org_run UNIQUE (organization_id, payroll_run_id)
      );
    `);

    // Trilha de Auditoria e Aprovação de Folha (RF-056 & RNF-004)
    await client.query(`
      CREATE TABLE IF NOT EXISTS payroll_approval_logs (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL DEFAULT 1,
        payroll_run_id INTEGER REFERENCES payroll_runs(id) ON DELETE SET NULL,
        competencia VARCHAR(7) NOT NULL,
        usuario VARCHAR(150) NOT NULL,
        perfil VARCHAR(100) NOT NULL,
        acao VARCHAR(100) NOT NULL,
        detalhes TEXT,
        data_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Portal de documentos do cliente (SPEC-4.3)
    await client.query(`
      CREATE TABLE IF NOT EXISTS client_documents (
        id BIGSERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL,
        client_id INTEGER NOT NULL,
        exercise VARCHAR(4),
        competence VARCHAR(7),
        type VARCHAR(100) NOT NULL,
        process VARCHAR(255),
        file_name VARCHAR(255) NOT NULL,
        content_type VARCHAR(255),
        file_size INTEGER NOT NULL,
        file_content BYTEA NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'recebido',
        uploaded_by VARCHAR(150),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS client_document_requests (
        id BIGSERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL,
        client_id INTEGER NOT NULL,
        exercise VARCHAR(4),
        competence VARCHAR(7),
        type VARCHAR(100) NOT NULL,
        process VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        comments TEXT,
        status VARCHAR(30) NOT NULL DEFAULT 'pendente',
        document_id BIGINT REFERENCES client_documents(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS client_document_audit (
        id BIGSERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL,
        client_id INTEGER,
        document_id BIGINT,
        user_name VARCHAR(150) NOT NULL,
        operation VARCHAR(100) NOT NULL,
        result VARCHAR(30) NOT NULL,
        details TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS ix_client_documents_org_client
        ON client_documents (organization_id, client_id);
      CREATE INDEX IF NOT EXISTS ix_client_documents_filters
        ON client_documents (organization_id, client_id, exercise, competence, type, process);
      CREATE INDEX IF NOT EXISTS ix_client_document_requests_org_client
        ON client_document_requests (organization_id, client_id, status);
    `);

    await client.query('COMMIT');

    await seedDefaultParameters();
    await seedFictionalEmployees();
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function seedDefaultParameters(): Promise<void> {
  const res = await query('SELECT count(*) as total FROM system_parameters');
  if (parseInt(res.rows[0].total, 10) === 0) {
    const params = [
      ['aliquota_fgts', 0.08, 'Alíquota do FGTS (8% para regime geral)'],
      ['aliquota_inss_patronal', 0.20, 'Alíquota patronal do INSS (20%)'],
      ['aliquota_rat', 0.02, 'Risco Ambiental do Trabalho - RAT fictício (2%)'],
      ['aliquota_terceiros', 0.058, 'Outras Entidades e Terceiros fictício (5,8%)'],
      ['deducao_dependente_irrf', 189.59, 'Dedução mensal por dependente para cálculo do IRRF (R$ 189,59)'],
      ['teto_inss', 908.85, 'Teto máximo de desconto do INSS empregado fictício (R$ 908,85)'],
      ['salario_minimo', 1412.00, 'Salário mínimo nacional de referência fictício (R$ 1.412,00)']
    ];

    for (const [chave, valor, descricao] of params) {
      await query(
        'INSERT INTO system_parameters (chave, valor, descricao) VALUES ($1, $2, $3) ON CONFLICT (chave) DO NOTHING',
        [chave, valor, descricao]
      );
    }
  }
}

async function seedFictionalEmployees(): Promise<void> {
  const res = await query('SELECT count(*) as total FROM employees WHERE organization_id = 1');
  if (parseInt(res.rows[0].total, 10) === 0) {
    console.log('Populando banco PostgreSQL com 3 empregados 100% fictícios (LGPD/RNF-002)...');

    const employees = [
      [1, 1, 'Ana Silva Ferreira', '111.222.333-44', 'Assistente Administrativo', 2850.00, '44h semanais', '2024-02-15', 'ativo', 1],
      [2, 1, 'Carlos Eduardo Santos', '222.333.444-55', 'Analista Contábil Pleno', 5200.00, '40h semanais', '2023-08-01', 'ativo', 2],
      [3, 1, 'Mariana Beatriz Oliveira', '333.444.555-66', 'Coordenadora de Recursos Humanos', 7800.00, '40h semanais', '2022-05-10', 'ativo', 0]
    ];

    for (const emp of employees) {
      await query(`
        INSERT INTO employees (id, organization_id, nome, cpf, cargo, salario_base, jornada, data_admissao, status, dependentes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (organization_id, cpf) DO NOTHING
      `, emp);
    }

    // Ajusta sequence do ID dos empregados
    await query(`SELECT setval('employees_id_seq', (SELECT MAX(id) FROM employees))`);

    // Histórico contratual inicial (RF-053)
    await query(`
      INSERT INTO contract_changes (organization_id, employee_id, tipo_alteracao, descricao, salario_anterior, novo_salario, cargo_anterior, novo_cargo, data_alteracao)
      VALUES (1, 1, 'Reajuste Salarial', 'Reajuste anual de dissídio coletivo de 5.5%', 2700.00, 2850.00, 'Assistente Administrativo', 'Assistente Administrativo', '2024-05-01')
    `);

    await query(`
      INSERT INTO contract_changes (organization_id, employee_id, tipo_alteracao, descricao, salario_anterior, novo_salario, cargo_anterior, novo_cargo, data_alteracao)
      VALUES (1, 2, 'Promoção de Cargo', 'Promoção de Analista Jr para Analista Pleno após mérito técnico', 4200.00, 5200.00, 'Analista Contábil Júnior', 'Analista Contábil Pleno', '2024-01-10')
    `);

    // Afastamento inicial (RF-053)
    await query(`
      INSERT INTO leaves (organization_id, employee_id, tipo, data_inicio, data_fim, motivo)
      VALUES (1, 3, 'Médico/Doença', '2026-10-12', '2026-10-15', 'Tratamento pós-cirúrgico eletivo de recuperação rápida')
    `);

    // Eventos variáveis iniciais (2026-11)
    await query(`
      INSERT INTO variable_events (organization_id, employee_id, competencia, tipo, descricao, quantidade, percentual, valor)
      VALUES (1, 2, '2026-11', 'hora_extra', 'Horas Extras 50% Fechamento Fiscal', 8, 50, 312.00)
    `);

    await query(`
      INSERT INTO variable_events (organization_id, employee_id, competencia, tipo, descricao, quantidade, percentual, valor)
      VALUES (1, 1, '2026-11', 'adicional', 'Bonificação de Produtividade', 1, 0, 200.00)
    `);

    // Log inicial de carga
    await query(`
      INSERT INTO payroll_approval_logs (organization_id, competencia, usuario, perfil, acao, detalhes)
      VALUES (1, '2026-11', 'Sistema', 'Sistema/Inicialização', 'Carga Inicial', 'Inicialização do PostgreSQL com suporte a multi-inquilino e 3 empregados fictícios')
    `);

    console.log('PostgreSQL inicializado e populado com sucesso.');
  }
}
