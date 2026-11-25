import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const USERS = {
  ADMIN: '22222222-2222-2222-2222-222222222221',
  CONTADOR: '22222222-2222-2222-2222-222222222222',
  RH_DP: '22222222-2222-2222-2222-222222222223',
  FINANCEIRO: '22222222-2222-2222-2222-222222222224',
  CLIENTE: '22222222-2222-2222-2222-222222222225',
};

describe('Testes Reais de RLS no PostgreSQL Supabase (Migration 0001)', () => {
  let client: Client;

  beforeAll(async () => {
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  async function executarComo(userId: string, fn: (c: Client) => Promise<void>) {
    await client.query('BEGIN');
    try {
      await client.query(`SET LOCAL ROLE authenticated`);
      await client.query(
        `SELECT set_config('request.jwt.claims', $1, true)`,
        [JSON.stringify({ sub: userId, role: 'authenticated' })]
      );
      await fn(client);
    } finally {
      await client.query('ROLLBACK');
    }
  }

  it('[RH_DP] não lê lancamentos_contabeis, mas lê empregados', async () => {
    await executarComo(USERS.RH_DP, async (c) => {
      const lanc = await c.query('SELECT * FROM public.lancamentos_contabeis');
      expect(lanc.rows.length).toBe(0);

      const emps = await c.query('SELECT * FROM public.empregados');
      expect(emps.rows.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('[CLIENTE] só vê empresas vinculadas a ele (não vê outras empresas do escritório)', async () => {
    await executarComo(USERS.CLIENTE, async (c) => {
      const empresas = await c.query('SELECT id, razao_social FROM public.empresas');
      expect(empresas.rows.length).toBe(1);
      expect(empresas.rows[0].id).toBe('33333333-3333-3333-3333-333333333333');
    });
  });

  it('[CONTADOR] não acessa empresa de um SEGUNDO escritório', async () => {
    // Cria um segundo escritório e uma empresa pertencente a ele, depois consulta como CONTADOR do escritório 1
    await client.query('BEGIN');
    try {
      await client.query(
        `INSERT INTO public.escritorios (id, nome, cnpj) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Outro Escritório', '99.999.999/0001-99')`
      );
      await client.query(
        `INSERT INTO public.empresas (id, escritorio_id, tipo_pessoa, razao_social, cpf_cnpj, regime_tributario)
         VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'PJ', 'Empresa Secreta Outro Escritório', '88.888.888/0001-88', 'SIMPLES')`
      );

      await client.query(`SET LOCAL ROLE authenticated`);
      await client.query(
        `SELECT set_config('request.jwt.claims', $1, true)`,
        [JSON.stringify({ sub: USERS.CONTADOR, role: 'authenticated' })]
      );

      const empresas = await client.query(
        `SELECT * FROM public.empresas WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'`
      );
      expect(empresas.rows.length).toBe(0);
    } finally {
      await client.query('ROLLBACK');
    }
  });

  it('[FINANCEIRO] não consegue escrever em empregados (bloqueio RLS)', async () => {
    await executarComo(USERS.FINANCEIRO, async (c) => {
      await expect(
        c.query(
          `INSERT INTO public.empregados (empresa_id, nome, cpf, cargo, salario_base, data_admissao)
           VALUES ('33333333-3333-3333-3333-333333333331', 'Teste', '000.000.000-00', 'Cargo', 2000, '2026-01-01')`
        )
      ).rejects.toThrow(/row-level security/i);
    });
  });

  it('[ADMIN / Todos] ninguém consegue INSERT direto, UPDATE ou DELETE em auditoria', async () => {
    await executarComo(USERS.ADMIN, async (c) => {
      await expect(
        c.query(
          `INSERT INTO public.auditoria (modulo, acao, entidade) VALUES ('TESTE', 'INSERT', 'teste')`
        )
      ).rejects.toThrow(/row-level security/i);
    });

    await executarComo(USERS.ADMIN, async (c) => {
      const res = await c.query(`UPDATE public.auditoria SET acao = 'HACK'`);
      expect(res.rowCount).toBe(0);
    });

    await executarComo(USERS.ADMIN, async (c) => {
      const res = await c.query(`DELETE FROM public.auditoria`);
      expect(res.rowCount).toBe(0);
    });
  });

  it('[FINANCEIRO] lê e escreve em titulos_financeiros e clientes_fornecedores; [RH_DP] não lê', async () => {
    await executarComo(USERS.FINANCEIRO, async (c) => {
      const titulos = await c.query('SELECT * FROM public.titulos_financeiros');
      expect(titulos.rows.length).toBeGreaterThanOrEqual(1);

      const ins = await c.query(
        `INSERT INTO public.clientes_fornecedores (empresa_id, tipo, nome_razao, cpf_cnpj)
         VALUES ('33333333-3333-3333-3333-333333333331', 'FORNECEDOR', 'Fornecedor Teste RLS', '11.111.111/0001-11') RETURNING id`
      );
      expect(ins.rows.length).toBe(1);
    });

    await executarComo(USERS.RH_DP, async (c) => {
      const titulos = await c.query('SELECT * FROM public.titulos_financeiros');
      expect(titulos.rows.length).toBe(0);
    });
  });

  it('[RH_DP] não lê apuracoes_fiscais; [CONTADOR] lê apuração', async () => {
    await executarComo(USERS.RH_DP, async (c) => {
      const ap = await c.query('SELECT * FROM public.apuracoes_fiscais');
      expect(ap.rows.length).toBe(0);
    });

    await executarComo(USERS.CONTADOR, async (c) => {
      const ap = await c.query('SELECT * FROM public.apuracoes_fiscais');
      expect(ap.rows.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('[CLIENTE] lê documentos só da empresa vinculada e não escreve em documentos_empresa', async () => {
    await executarComo(USERS.CLIENTE, async (c) => {
      const docs = await c.query(
        `SELECT * FROM public.documentos_empresa WHERE empresa_id = '33333333-3333-3333-3333-333333333331'`
      );
      expect(docs.rows.length).toBe(0);

      await expect(
        c.query(
          `INSERT INTO public.documentos_empresa (empresa_id, tipo, nome_arquivo, storage_path)
           VALUES ('33333333-3333-3333-3333-333333333333', 'CONTRATO', 'teste.pdf', '33333333-3333-3333-3333-333333333333/teste.pdf')`
        )
      ).rejects.toThrow(/row-level security/i);
    });
  });

  it('[AUDITORIA] escrita em titulos_financeiros gera linha automática na tabela auditoria', async () => {
    await executarComo(USERS.ADMIN, async (c) => {
      const antes = await c.query(`SELECT count(*) AS total FROM public.auditoria WHERE entidade = 'titulos_financeiros'`);
      await c.query(
        `INSERT INTO public.titulos_financeiros (empresa_id, tipo, parceiro_nome, vencimento, valor)
         VALUES ('33333333-3333-3333-3333-333333333331', 'PAGAR', 'Teste Audit', '2026-12-01', 100.00)`
      );
      const depois = await c.query(`SELECT count(*) AS total FROM public.auditoria WHERE entidade = 'titulos_financeiros'`);
      expect(Number(depois.rows[0].total)).toBe(Number(antes.rows[0].total) + 1);
    });
  });

  it('[STORAGE] usuário de outro escritório não lista/baixa arquivo do bucket documentos; CLIENTE não faz upload', async () => {
    // 1. CLIENTE não pode fazer INSERT em storage.objects no bucket documentos
    await executarComo(USERS.CLIENTE, async (c) => {
      await expect(
        c.query(
          `INSERT INTO storage.objects (bucket_id, name, owner)
           VALUES ('documentos', '33333333-3333-3333-3333-333333333333/contrato.pdf', $1)`,
          [USERS.CLIENTE]
        )
      ).rejects.toThrow(/row-level security/i);
    });

    // 2. Usuário de outro escritório não vê objetos da empresa 33333333-...31
    await client.query('BEGIN');
    try {
      await client.query(`SET LOCAL ROLE authenticated`);
      await client.query(
        `SELECT set_config('request.jwt.claims', $1, true)`,
        [JSON.stringify({ sub: '99999999-9999-9999-9999-999999999999', role: 'authenticated' })]
      );
      const objs = await client.query(
        `SELECT * FROM storage.objects WHERE bucket_id = 'documentos' AND name LIKE '33333333-3333-3333-3333-333333333331/%'`
      );
      expect(objs.rows.length).toBe(0);
    } finally {
      await client.query('ROLLBACK');
    }
  });
});
