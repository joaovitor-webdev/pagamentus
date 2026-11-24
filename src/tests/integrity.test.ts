import { DatabaseConnection } from '../database/connection';
import { runMigrations } from '../database/migrate';
import { StructuralRepository } from '../repositories/structural.repository';

const initialSchemaTables = [
  'organizacoes',
  'perfis',
  'permissoes',
  'perfis_permissoes',
  'usuarios',
  'empresas',
];

const expectedForeignKeys = [
  'perfis_permissoes.perfil_id->perfis.id',
  'perfis_permissoes.permissao_id->permissoes.id',
  'usuarios.organizacao_id->organizacoes.id',
  'usuarios.perfil_id->perfis.id',
  'empresas.organizacao_id->organizacoes.id',
];

const expectedUniqueConstraints = [
  'organizacoes.documento',
  'perfis.nome',
  'permissoes.chave',
  'usuarios.email',
  'empresas.organizacao_id,cnpj',
];

const expectedNotNullColumns = [
  'organizacoes.id',
  'organizacoes.nome',
  'organizacoes.documento',
  'organizacoes.criado_em',
  'perfis.id',
  'perfis.nome',
  'perfis.criado_em',
  'permissoes.id',
  'permissoes.chave',
  'permissoes.criado_em',
  'perfis_permissoes.perfil_id',
  'perfis_permissoes.permissao_id',
  'perfis_permissoes.atribuido_em',
  'usuarios.id',
  'usuarios.organizacao_id',
  'usuarios.perfil_id',
  'usuarios.nome',
  'usuarios.email',
  'usuarios.senha_hash',
  'usuarios.ativo',
  'usuarios.criado_em',
  'empresas.id',
  'empresas.organizacao_id',
  'empresas.razao_social',
  'empresas.cnpj',
  'empresas.criado_em',
];

/**
 * Suite de Testes de Integridade e Transações - SPEC-1.3 (RNF-013)
 *
 * Valida:
 * - CA-1: Estrutura do esquema inicial e constraints de integridade.
 * - CA-2: Rollback completo quando há falha no meio de uma transação.
 * - CA-3: Rejeição de duplicidade sem alterar o registro original.
 */
async function runTests() {
  process.env.NODE_ENV = 'test';
  console.log('--- Iniciando Testes de Integridade (SPEC-1.3 / RNF-013) ---\n');

  try {
    // 1. Aplicação das migrações
    console.log('[Setup] Executando migrações do esquema inicial...');
    await runMigrations();
    console.log('[Setup] Esquema pronto.\n');

    const pool = DatabaseConnection.getPool();

    console.log('[Teste CA-1] Inspecionando tabelas e constraints do esquema inicial...');
    const schemaInspection = await pool.query(
      `
        SELECT
          t.table_name,
          COUNT(DISTINCT tc.constraint_name) FILTER (WHERE tc.constraint_type = 'PRIMARY KEY') AS primary_key_count,
          COUNT(DISTINCT tc.constraint_name) FILTER (WHERE tc.constraint_type = 'FOREIGN KEY') AS foreign_key_count,
          COUNT(DISTINCT tc.constraint_name) FILTER (WHERE tc.constraint_type = 'UNIQUE') AS unique_constraint_count,
          COUNT(DISTINCT c.column_name) FILTER (WHERE c.is_nullable = 'NO') AS not_null_column_count
        FROM information_schema.tables t
        LEFT JOIN information_schema.table_constraints tc
          ON tc.table_schema = t.table_schema
          AND tc.table_name = t.table_name
        LEFT JOIN information_schema.columns c
          ON c.table_schema = t.table_schema
          AND c.table_name = t.table_name
        WHERE t.table_schema = current_schema()
          AND t.table_type = 'BASE TABLE'
          AND t.table_name = ANY($1::text[])
        GROUP BY t.table_name
        ORDER BY t.table_name;
      `,
      [initialSchemaTables],
    );

    if (schemaInspection.rows.length !== initialSchemaTables.length) {
      throw new Error('FALHA: Uma ou mais tabelas do esquema inicial não foram encontradas.');
    }

    const tablesWithoutPrimaryKey = schemaInspection.rows
      .filter((table) => Number(table.primary_key_count) === 0)
      .map((table) => table.table_name);
    if (tablesWithoutPrimaryKey.length > 0) {
      throw new Error(
        `FALHA: Tabelas sem chave primária: ${tablesWithoutPrimaryKey.join(', ')}.`,
      );
    }

    const foreignKeyInspection = await pool.query(
      `
        SELECT
          source_table.relname AS table_name,
          source_column.attname AS column_name,
          referenced_table.relname AS referenced_table_name,
          referenced_column.attname AS referenced_column_name
        FROM pg_constraint fk
        JOIN pg_class source_table ON source_table.oid = fk.conrelid
        JOIN pg_namespace source_schema ON source_schema.oid = source_table.relnamespace
        JOIN pg_class referenced_table ON referenced_table.oid = fk.confrelid
        JOIN LATERAL UNNEST(fk.conkey, fk.confkey) AS fk_columns(source_attnum, referenced_attnum)
          ON TRUE
        JOIN pg_attribute source_column
          ON source_column.attrelid = source_table.oid
          AND source_column.attnum = fk_columns.source_attnum
        JOIN pg_attribute referenced_column
          ON referenced_column.attrelid = referenced_table.oid
          AND referenced_column.attnum = fk_columns.referenced_attnum
        WHERE fk.contype = 'f'
          AND source_schema.nspname = current_schema()
          AND source_table.relname = ANY($1::text[]);
      `,
      [initialSchemaTables],
    );
    const actualForeignKeys = new Set(
      foreignKeyInspection.rows.map(
        (key) =>
          `${key.table_name}.${key.column_name}->${key.referenced_table_name}.${key.referenced_column_name}`,
      ),
    );
    const missingForeignKeys = expectedForeignKeys.filter((key) => !actualForeignKeys.has(key));

    const uniqueInspection = await pool.query(
      `
        SELECT
          tc.table_name,
          STRING_AGG(kcu.column_name, ',' ORDER BY kcu.ordinal_position) AS column_names
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON kcu.constraint_schema = tc.constraint_schema
          AND kcu.constraint_name = tc.constraint_name
          AND kcu.table_name = tc.table_name
        WHERE tc.table_schema = current_schema()
          AND tc.constraint_type = 'UNIQUE'
          AND tc.table_name = ANY($1::text[])
        GROUP BY tc.table_name, tc.constraint_name;
      `,
      [initialSchemaTables],
    );
    const actualUniqueConstraints = new Set(
      uniqueInspection.rows.map((constraint) => `${constraint.table_name}.${constraint.column_names}`),
    );
    const missingUniqueConstraints = expectedUniqueConstraints.filter(
      (constraint) => !actualUniqueConstraints.has(constraint),
    );

    const notNullInspection = await pool.query(
      `
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = ANY($1::text[])
          AND is_nullable = 'NO';
      `,
      [initialSchemaTables],
    );
    const actualNotNullColumns = new Set(
      notNullInspection.rows.map((column) => `${column.table_name}.${column.column_name}`),
    );
    const missingNotNullColumns = expectedNotNullColumns.filter(
      (column) => !actualNotNullColumns.has(column),
    );

    if (
      missingForeignKeys.length > 0 ||
      missingUniqueConstraints.length > 0 ||
      missingNotNullColumns.length > 0
    ) {
      throw new Error(
        `FALHA: Constraints ausentes — FK: ${missingForeignKeys.join(', ') || 'nenhuma'}; UNIQUE: ${missingUniqueConstraints.join(', ') || 'nenhuma'}; NOT NULL: ${missingNotNullColumns.join(', ') || 'nenhuma'}.`,
      );
    }
    console.log(
      `✓ Sucesso: ${schemaInspection.rows.length} tabelas com chave primária, ${actualForeignKeys.size} chaves estrangeiras, ${actualUniqueConstraints.size} restrições UNIQUE e ${actualNotNullColumns.size} campos NOT NULL.`,
    );

    console.log('[Teste CA-1] Verificando integridade referencial (FK)...');
    try {
      // Tenta criar usuário apontando para organização inexistente
      await StructuralRepository.criarUsuario(pool, {
        id: 'user-fk-test',
        organizacao_id: 'org-inexistente',
        perfil_id: 'perfil-inexistente',
        nome: 'Usuario Invalido',
        email: 'invalido@teste.com',
        senha_hash: 'hash123',
      });
      throw new Error('FALHA: O banco permitiu inserir registro com Foreign Key inválida!');
    } catch (error: any) {
      if (error.code === '23503') {
        console.log('✓ Sucesso: Chave estrangeira violada corretamente (Postgres code 23503).');
      } else {
        throw error;
      }
    }

    // --------------------------------------------------------------------------
    // Teste CA-3: Verificação de restrição de unicidade (UNIQUE)
    // --------------------------------------------------------------------------
    console.log('\n[Teste CA-3] Verificando restrição de chave única (UNIQUE)...');
    const orgId1 = `org-${Date.now()}`;
    const docUnico = `doc-${Date.now()}`;
    const duplicateOrgId = `${orgId1}-dup`;

    // Cria a primeira organização
    await StructuralRepository.criarOrganizacao(pool, {
      id: orgId1,
      nome: 'Organizacao Teste 1',
      documento: docUnico,
    });
    console.log(`Organização inicial criada com documento: ${docUnico}`);

    try {
      // Tenta criar uma segunda organização com o mesmo documento (deve ser rejeitado)
      await StructuralRepository.criarOrganizacao(pool, {
        id: duplicateOrgId,
        nome: 'Organizacao Duplicada',
        documento: docUnico,
      });
      throw new Error('FALHA: O banco permitiu duplicidade de chave única!');
    } catch (error: any) {
      if (error.code === '23505') {
        console.log('✓ Sucesso: Duplicidade bloqueada pela constraint UNIQUE (Postgres code 23505).');
      } else {
        throw error;
      }
    }

    const organizacaoOriginal = await StructuralRepository.buscarOrganizacaoPorId(pool, orgId1);
    const organizacaoDuplicada = await StructuralRepository.buscarOrganizacaoPorId(pool, duplicateOrgId);
    if (organizacaoOriginal?.documento !== docUnico || organizacaoDuplicada !== null) {
      throw new Error('FALHA: A tentativa duplicada alterou ou persistiu dados da organização original.');
    }
    console.log('✓ Sucesso: O registro original permaneceu inalterado e a duplicidade não foi persistida.');

    // --------------------------------------------------------------------------
    // Teste CA-2: Atomicidade transacional com Rollback em caso de erro no meio
    // --------------------------------------------------------------------------
    console.log('\n[Teste CA-2] Verificando rollback em transação com falha intermediária...');
    const transOrgId = `org-trans-${Date.now()}`;
    const transOrgDoc = `d${Date.now()}`;
    const failureMessage = 'Simulação de falha no meio do processo transacional!';

    let capturouErro = false;
    try {
      await DatabaseConnection.transaction(async (client) => {
        // Operação 1: Insere organização válida
        await StructuralRepository.criarOrganizacao(client, {
          id: transOrgId,
          nome: 'Org Transacional Que Deve Sofrer Rollback',
          documento: transOrgDoc,
        });
        console.log('  -> Operação 1 realizada com sucesso na transação.');

        // Operação 2: Simula uma falha no meio do processo (erro de negócio ou de sistema)
        console.log('  -> Simulando falha na segunda etapa da operação...');
        throw new Error(failureMessage);
      });
    } catch (error: any) {
      if (error.message !== failureMessage) {
        throw error;
      }
      capturouErro = true;
      console.log(`  -> Exceção capturada como esperado: "${error.message}"`);
    }

    if (!capturouErro) {
      throw new Error('FALHA: A transação não disparou o erro esperado.');
    }

    // Verifica se a primeira operação foi revertida pelo ROLLBACK
    const orgPersistida = await StructuralRepository.buscarOrganizacaoPorId(pool, transOrgId);
    if (orgPersistida === null) {
      console.log('✓ Sucesso: Rollback realizado com sucesso! Nenhum dado ficou salvo pela metade.');
    } else {
      throw new Error('FALHA: A primeira operação persistiu no banco mesmo após erro na transação!');
    }

    console.log('\n============================================================');
    console.log(' TODOS OS TESTES PASSARAM COM SUCESSO (CA-1, CA-2, CA-3)');
    console.log('============================================================\n');
  } catch (error) {
    console.error('\n❌ Erro durante a execução dos testes:', error);
    process.exitCode = 1;
  } finally {
    await DatabaseConnection.closePool();
  }
}

// Execução
runTests();
