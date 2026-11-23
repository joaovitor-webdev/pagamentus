import { DatabaseConnection } from '../database/connection';
import { runMigrations } from '../database/migrate';
import { StructuralRepository } from '../repositories/structural.repository';

/**
 * Suite de Testes de Integridade e Transações - SPEC-1.3 (RNF-013)
 *
 * Valida:
 * - CA-1: Esquema com chaves primárias, estrangeiras e restrições.
 * - CA-2: Atomicidade transacional e rollback quando há falha no meio do processo.
 * - CA-3: Bloqueio de duplicidade via restrição de chave única (UNIQUE).
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

    // --------------------------------------------------------------------------
    // Teste CA-1: Verificação da integridade referencial (FK) e existência de PK
    // --------------------------------------------------------------------------
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
        id: `org-${Date.now()}-dup`,
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

    // --------------------------------------------------------------------------
    // Teste CA-2: Atomicidade transacional com Rollback em caso de erro no meio
    // --------------------------------------------------------------------------
    console.log('\n[Teste CA-2] Verificando rollback em transação com falha intermediária...');
    const transOrgId = `org-trans-${Date.now()}`;
    const transOrgDoc = `doc-trans-${Date.now()}`;

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
        throw new Error('Simulação de falha no meio do processo transacional!');
      });
    } catch (error: any) {
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
