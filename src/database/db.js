const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_PATH = path.resolve(__dirname, '../../database.sqlite');

let dbInstance = null;
let SQL = null;

async function getDatabase() {
  if (dbInstance) return dbInstance;

  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  // Criação das tabelas
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS contas_contabeis (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      codigo TEXT NOT NULL,
      nome TEXT NOT NULL,
      natureza TEXT NOT NULL,
      tipo TEXT NOT NULL, -- 'SINTETICA' ou 'ANALITICA'
      nivel INTEGER NOT NULL,
      conta_pai_id TEXT,
      status TEXT NOT NULL DEFAULT 'ATIVA', -- 'ATIVA' ou 'INATIVA'
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(organization_id, codigo)
    );

    CREATE TABLE IF NOT EXISTS lancamentos_contabeis (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      numero INTEGER NOT NULL,
      data_lancamento TEXT NOT NULL,
      competencia TEXT NOT NULL,
      historico TEXT NOT NULL,
      valor_total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'EFETIVADO',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS partidas_lancamento (
      id TEXT PRIMARY KEY,
      lancamento_id TEXT NOT NULL,
      conta_id TEXT NOT NULL,
      tipo TEXT NOT NULL, -- 'DEBITO' ou 'CREDITO'
      valor REAL NOT NULL,
      historico_complementar TEXT,
      FOREIGN KEY(lancamento_id) REFERENCES lancamentos_contabeis(id),
      FOREIGN KEY(conta_id) REFERENCES contas_contabeis(id)
    );

    CREATE TABLE IF NOT EXISTS titulos_financeiros (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      tipo TEXT NOT NULL, -- 'PAGAR' ou 'RECEBER'
      pessoa_nome TEXT NOT NULL,
      descricao TEXT NOT NULL,
      valor_total REAL NOT NULL,
      quantidade_parcelas INTEGER NOT NULL,
      data_emissao TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDENTE', -- 'PENDENTE', 'PARCIAL', 'PAGO', 'CANCELADO'
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS parcelas_financeiras (
      id TEXT PRIMARY KEY,
      titulo_id TEXT NOT NULL,
      numero_parcela INTEGER NOT NULL,
      data_vencimento TEXT NOT NULL,
      valor_original REAL NOT NULL,
      valor_pago REAL NOT NULL DEFAULT 0,
      saldo_pendente REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDENTE', -- 'PENDENTE', 'PARCIAL', 'PAGO'
      FOREIGN KEY(titulo_id) REFERENCES titulos_financeiros(id)
    );

    CREATE TABLE IF NOT EXISTS baixas_financeiras (
      id TEXT PRIMARY KEY,
      parcela_id TEXT NOT NULL,
      data_baixa TEXT NOT NULL,
      valor_pago REAL NOT NULL,
      forma_pagamento TEXT,
      observacao TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(parcela_id) REFERENCES parcelas_financeiras(id)
    );
  `);

  saveDatabase();
  return dbInstance;
}

function saveDatabase() {
  if (!dbInstance) return;
  const data = dbInstance.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Helpers para consultas
async function all(sql, params = []) {
  const db = await getDatabase();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

async function get(sql, params = []) {
  const results = await all(sql, params);
  return results.length > 0 ? results[0] : null;
}

async function run(sql, params = []) {
  const db = await getDatabase();
  db.run(sql, params);
  saveDatabase();
  return { changes: db.getRowsModified() };
}

async function transaction(workFn) {
  const db = await getDatabase();
  db.run("BEGIN TRANSACTION;");
  try {
    const result = await workFn({ run, get, all });
    db.run("COMMIT;");
    saveDatabase();
    return result;
  } catch (error) {
    db.run("ROLLBACK;");
    throw error;
  }
}

// Popula dados iniciais fictícios se o banco estiver vazio
async function seedDefaultData(organizationId = 'org-padrao-001') {
  const db = await getDatabase();
  const count = await get("SELECT COUNT(*) as count FROM contas_contabeis WHERE organization_id = ?", [organizationId]);
  
  if (count && count.count === 0) {
    const contasIniciais = [
      // 1. ATIVO
      { id: 'c-1', codigo: '1', nome: 'ATIVO', natureza: 'ATIVO', tipo: 'SINTETICA', nivel: 1, conta_pai_id: null },
      { id: 'c-1.1', codigo: '1.1', nome: 'ATIVO CIRCULANTE', natureza: 'ATIVO', tipo: 'SINTETICA', nivel: 2, conta_pai_id: 'c-1' },
      { id: 'c-1.1.01', codigo: '1.1.01', nome: 'Disponibilidades', natureza: 'ATIVO', tipo: 'SINTETICA', nivel: 3, conta_pai_id: 'c-1.1' },
      { id: 'c-1.1.01.001', codigo: '1.1.01.001', nome: 'Caixa Geral', natureza: 'ATIVO', tipo: 'ANALITICA', nivel: 4, conta_pai_id: 'c-1.1.01' },
      { id: 'c-1.1.01.002', codigo: '1.1.01.002', nome: 'Banco Conta Movimento', natureza: 'ATIVO', tipo: 'ANALITICA', nivel: 4, conta_pai_id: 'c-1.1.01' },
      { id: 'c-1.1.02', codigo: '1.1.02', nome: 'Créditos e Contas a Receber', natureza: 'ATIVO', tipo: 'SINTETICA', nivel: 3, conta_pai_id: 'c-1.1' },
      { id: 'c-1.1.02.001', codigo: '1.1.02.001', nome: 'Clientes a Receber', natureza: 'ATIVO', tipo: 'ANALITICA', nivel: 4, conta_pai_id: 'c-1.1.02' },

      // 2. PASSIVO
      { id: 'c-2', codigo: '2', nome: 'PASSIVO', natureza: 'PASSIVO', tipo: 'SINTETICA', nivel: 1, conta_pai_id: null },
      { id: 'c-2.1', codigo: '2.1', nome: 'PASSIVO CIRCULANTE', natureza: 'PASSIVO', tipo: 'SINTETICA', nivel: 2, conta_pai_id: 'c-2' },
      { id: 'c-2.1.01', codigo: '2.1.01', nome: 'Obrigações a Curto Prazo', natureza: 'PASSIVO', tipo: 'SINTETICA', nivel: 3, conta_pai_id: 'c-2.1' },
      { id: 'c-2.1.01.001', codigo: '2.1.01.001', nome: 'Fornecedores Nacionais', natureza: 'PASSIVO', tipo: 'ANALITICA', nivel: 4, conta_pai_id: 'c-2.1.01' },
      { id: 'c-2.1.01.002', codigo: '2.1.01.002', nome: 'Salários e Encargos a Pagar', natureza: 'PASSIVO', tipo: 'ANALITICA', nivel: 4, conta_pai_id: 'c-2.1.01' },

      // 3. PATRIMÔNIO LÍQUIDO
      { id: 'c-3', codigo: '3', nome: 'PATRIMÔNIO LÍQUIDO', natureza: 'PATRIMONIO_LIQUIDO', tipo: 'SINTETICA', nivel: 1, conta_pai_id: null },
      { id: 'c-3.1', codigo: '3.1', nome: 'Capital Social', natureza: 'PATRIMONIO_LIQUIDO', tipo: 'ANALITICA', nivel: 2, conta_pai_id: 'c-3' },

      // 4. RECEITAS
      { id: 'c-4', codigo: '4', nome: 'RECEITAS', natureza: 'RECEITA', tipo: 'SINTETICA', nivel: 1, conta_pai_id: null },
      { id: 'c-4.1', codigo: '4.1', nome: 'Receita Operacional Bruta', natureza: 'RECEITA', tipo: 'SINTETICA', nivel: 2, conta_pai_id: 'c-4' },
      { id: 'c-4.1.01.001', codigo: '4.1.01.001', nome: 'Receita de Prestação de Serviços', natureza: 'RECEITA', tipo: 'ANALITICA', nivel: 3, conta_pai_id: 'c-4.1' },

      // 5. DESPESAS
      { id: 'c-5', codigo: '5', nome: 'DESPESAS', natureza: 'DESPESA', tipo: 'SINTETICA', nivel: 1, conta_pai_id: null },
      { id: 'c-5.1', codigo: '5.1', nome: 'Despesas Administrativas', natureza: 'DESPESA', tipo: 'SINTETICA', nivel: 2, conta_pai_id: 'c-5' },
      { id: 'c-5.1.01.001', codigo: '5.1.01.001', nome: 'Material de Escritório', natureza: 'DESPESA', tipo: 'ANALITICA', nivel: 3, conta_pai_id: 'c-5.1' },
      { id: 'c-5.1.01.002', codigo: '5.1.01.002', nome: 'Energia Elétrica e Internet', natureza: 'DESPESA', tipo: 'ANALITICA', nivel: 3, conta_pai_id: 'c-5.1' }
    ];

    const now = new Date().toISOString();
    for (const c of contasIniciais) {
      await run(`
        INSERT INTO contas_contabeis 
        (id, organization_id, codigo, nome, natureza, tipo, nivel, conta_pai_id, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ATIVA', ?, ?)
      `, [c.id, organizationId, c.codigo, c.nome, c.natureza, c.tipo, c.nivel, c.conta_pai_id, now, now]);
    }
  }
}

module.exports = {
  getDatabase,
  saveDatabase,
  all,
  get,
  run,
  transaction,
  seedDefaultData
};
