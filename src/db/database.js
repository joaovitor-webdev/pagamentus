const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
require('dotenv').config();

const dbPath = process.env.DATABASE_PATH || './data/payroll.sqlite';
const resolvedPath = path.resolve(process.cwd(), dbPath);

// Garante que o diretório de dados exista
const dir = path.dirname(resolvedPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(resolvedPath);

// Ativa chaves estrangeiras e modo WAL para melhor performance
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

function initDatabase() {
  db.exec(`
    -- Tabela de Parâmetros de Cálculo Fictícios (RF-052)
    CREATE TABLE IF NOT EXISTS system_parameters (
      chave TEXT PRIMARY KEY,
      valor REAL NOT NULL,
      descricao TEXT NOT NULL
    );

    -- Tabela de Empregados e Contratos (RF-051)
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cpf TEXT UNIQUE NOT NULL,
      cargo TEXT NOT NULL,
      salario_base REAL NOT NULL,
      jornada TEXT NOT NULL,
      data_admissao TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ativo', -- 'ativo', 'afastado', 'inativo'
      dependentes INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    -- Tabela de Alterações Contratuais (RF-053)
    CREATE TABLE IF NOT EXISTS contract_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      tipo_alteracao TEXT NOT NULL, -- 'Reajuste Salarial', 'Promoção de Cargo', 'Alteração de Jornada'
      descricao TEXT NOT NULL,
      salario_anterior REAL,
      novo_salario REAL,
      cargo_anterior TEXT,
      novo_cargo TEXT,
      data_alteracao TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    -- Tabela de Afastamentos e Licenças (RF-053)
    CREATE TABLE IF NOT EXISTS leaves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      tipo TEXT NOT NULL, -- 'Médico/Doença', 'Licença Maternidade', 'Sem Remuneração', 'Acidente de Trabalho'
      data_inicio TEXT NOT NULL,
      data_fim TEXT,
      motivo TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    -- Tabela de Eventos Variáveis de Folha (RF-053)
    CREATE TABLE IF NOT EXISTS variable_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      competencia TEXT NOT NULL, -- formato 'YYYY-MM', ex: '2026-11'
      tipo TEXT NOT NULL, -- 'hora_extra', 'falta', 'adicional', 'desconto'
      descricao TEXT NOT NULL,
      quantidade REAL DEFAULT 0, -- ex: 10 horas extras, 2 faltas
      percentual REAL DEFAULT 0, -- ex: 50%, 100%
      valor REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    -- Tabela de Fechamentos / Cálculos de Folha (RF-052 & RF-056)
    CREATE TABLE IF NOT EXISTS payroll_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competencia TEXT NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'mensal', -- 'mensal', 'ferias', '13_primeira', '13_segunda'
      status TEXT NOT NULL DEFAULT 'rascunho', -- 'rascunho', 'em_revisao', 'aprovada', 'fechada'
      total_proventos REAL NOT NULL DEFAULT 0,
      total_descontos REAL NOT NULL DEFAULT 0,
      total_liquido REAL NOT NULL DEFAULT 0,
      total_encargos REAL NOT NULL DEFAULT 0,
      total_provisoes REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      UNIQUE(competencia, tipo)
    );

    -- Itens Calculados por Empregado na Folha (RF-052 & RF-055)
    CREATE TABLE IF NOT EXISTS payroll_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payroll_run_id INTEGER NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      salario_base REAL NOT NULL,
      horas_extras_total REAL DEFAULT 0,
      adicionais_total REAL DEFAULT 0,
      faltas_total REAL DEFAULT 0,
      desconto_inss REAL DEFAULT 0,
      desconto_irrf REAL DEFAULT 0,
      outros_descontos REAL DEFAULT 0,
      total_proventos REAL NOT NULL,
      total_descontos REAL NOT NULL,
      salario_liquido REAL NOT NULL,
      base_inss REAL NOT NULL,
      base_fgts REAL NOT NULL,
      valor_fgts REAL NOT NULL,
      inss_patronal REAL NOT NULL,
      provisao_13 REAL NOT NULL DEFAULT 0,
      provisao_ferias REAL NOT NULL DEFAULT 0,
      detalhes_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      UNIQUE(payroll_run_id, employee_id)
    );

    -- Trilha de Auditoria e Aprovação de Folha (RF-056 & RNF-004)
    CREATE TABLE IF NOT EXISTS payroll_approval_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payroll_run_id INTEGER REFERENCES payroll_runs(id) ON DELETE SET NULL,
      competencia TEXT NOT NULL,
      usuario TEXT NOT NULL,
      perfil TEXT NOT NULL,
      acao TEXT NOT NULL, -- 'Cálculo Simulado', 'Aprovação de Folha', 'Fechamento de Folha', 'Reabertura'
      detalhes TEXT,
      data_hora TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);

  seedDefaultParameters();
  seedFictionalEmployees();
}

function seedDefaultParameters() {
  const count = db.prepare('SELECT count(*) as total FROM system_parameters').get().total;
  if (count === 0) {
    const insertParam = db.prepare(`
      INSERT INTO system_parameters (chave, valor, descricao)
      VALUES (?, ?, ?)
    `);

    const params = [
      ['aliquota_fgts', 0.08, 'Alíquota do FGTS (8% para regime geral)'],
      ['aliquota_inss_patronal', 0.20, 'Alíquota patronal do INSS (20%)'],
      ['aliquota_rat', 0.02, 'Risco Ambiental do Trabalho - RAT fictício (2%)'],
      ['aliquota_terceiros', 0.058, 'Outras Entidades e Terceiros fictício (5,8%)'],
      ['deducao_dependente_irrf', 189.59, 'Dedução mensal por dependente para cálculo do IRRF (R$ 189,59)'],
      ['teto_inss', 908.85, 'Teto máximo de desconto do INSS empregado fictício (R$ 908,85)'],
      ['salario_minimo', 1412.00, 'Salário mínimo nacional de referência fictício (R$ 1.412,00)']
    ];

    const insertMany = db.transaction((items) => {
      for (const item of items) {
        insertParam.run(item[0], item[1], item[2]);
      }
    });

    insertMany(params);
  }
}

function seedFictionalEmployees() {
  const count = db.prepare('SELECT count(*) as total FROM employees').get().total;
  if (count === 0) {
    console.log('Populando banco SQLite com 3 empregados 100% fictícios (LGPD/RNF-002)...');

    const insertEmp = db.prepare(`
      INSERT INTO employees (id, nome, cpf, cargo, salario_base, jornada, data_admissao, status, dependentes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 3 empregados fictícios obrigatórios
    const employees = [
      [1, 'Ana Silva Ferreira', '111.222.333-44', 'Assistente Administrativo', 2850.00, '44h semanais', '2024-02-15', 'ativo', 1],
      [2, 'Carlos Eduardo Santos', '222.333.444-55', 'Analista Contábil Pleno', 5200.00, '40h semanais', '2023-08-01', 'ativo', 2],
      [3, 'Mariana Beatriz Oliveira', '333.444.555-66', 'Coordenadora de Recursos Humanos', 7800.00, '40h semanais', '2022-05-10', 'ativo', 0]
    ];

    const insertAll = db.transaction(() => {
      for (const emp of employees) {
        insertEmp.run(...emp);
      }

      // Seed inicial de histórico contratual (RF-053)
      db.prepare(`
        INSERT INTO contract_changes (employee_id, tipo_alteracao, descricao, salario_anterior, novo_salario, cargo_anterior, novo_cargo, data_alteracao)
        VALUES (1, 'Reajuste Salarial', 'Reajuste anual de dissídio coletivo de 5.5%', 2700.00, 2850.00, 'Assistente Administrativo', 'Assistente Administrativo', '2024-05-01')
      `).run();

      db.prepare(`
        INSERT INTO contract_changes (employee_id, tipo_alteracao, descricao, salario_anterior, novo_salario, cargo_anterior, novo_cargo, data_alteracao)
        VALUES (2, 'Promoção de Cargo', 'Promoção de Analista Jr para Analista Pleno após mérito técnico', 4200.00, 5200.00, 'Analista Contábil Júnior', 'Analista Contábil Pleno', '2024-01-10')
      `).run();

      // Seed inicial de afastamentos (RF-053)
      db.prepare(`
        INSERT INTO leaves (employee_id, tipo, data_inicio, data_fim, motivo)
        VALUES (3, 'Médico/Doença', '2026-10-12', '2026-10-15', 'Tratamento pós-cirúrgico eletivo de recuperação rápida')
      `).run();

      // Seed inicial de eventos variáveis para competência corrente 2026-11 (RF-053)
      // Carlos Eduardo: 8 horas extras com adicional de 50%
      // Valor da hora normal = 5200 / 200 = R$ 26,00. Hora extra 50% = R$ 39,00. 8 horas = R$ 312,00
      db.prepare(`
        INSERT INTO variable_events (employee_id, competencia, tipo, descricao, quantidade, percentual, valor)
        VALUES (2, '2026-11', 'hora_extra', 'Horas Extras 50% Fechamento Fiscal', 8, 50, 312.00)
      `).run();

      // Ana Silva: Bonificação de desempenho R$ 200,00
      db.prepare(`
        INSERT INTO variable_events (employee_id, competencia, tipo, descricao, quantidade, percentual, valor)
        VALUES (1, '2026-11', 'adicional', 'Bonificação de Produtividade', 1, 0, 200.00)
      `).run();

      // Log inicial da semente no histórico de auditoria
      db.prepare(`
        INSERT INTO payroll_approval_logs (competencia, usuario, perfil, acao, detalhes)
        VALUES ('2026-11', 'Sistema', 'Sistema/Inicialização', 'Carga Inicial', 'Inicialização do banco com 3 empregados fictícios e parâmetros padrão')
      `).run();
    });

    insertAll();
    console.log('Banco de dados populado com sucesso.');
  }
}

// Inicializa o banco
initDatabase();

module.exports = db;
