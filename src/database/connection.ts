import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import * as dotenv from 'dotenv';
import { resolveDatabaseEnvironment } from './databaseEnvironment';

// Carrega as variáveis de ambiente
dotenv.config();

/**
 * Cliente de banco de dados ou transação
 */
export interface IDatabaseClient {
  query<R extends QueryResultRow = any, I extends any[] = any[]>(
    queryText: string,
    values?: I
  ): Promise<QueryResult<R>>;
}

/**
 * Gerenciador de conexão e transações com PostgreSQL
 * Atende ao RNF-013 (Integridade e Atomicidade transacional)
 */
export class DatabaseConnection {
  private static pool: Pool | null = null;

  /**
   * Obtém a instância do Pool de conexões do PostgreSQL
   */
  public static getPool(): Pool {
    if (!this.pool) {
      this.pool = new Pool({
        connectionString: resolveDatabaseEnvironment().connectionString,
      });
    }

    return this.pool;
  }

  /**
   * Executa uma função dentro de um bloco transacional atômico (BEGIN / COMMIT / ROLLBACK).
   * Se a operação disparar qualquer erro, o ROLLBACK é executado automaticamente,
   * impedindo que dados fiquem salvos pela metade (atende ao CA-2 da SPEC-1.3).
   *
   * @param callback Função contendo as operações que devem ser executadas dentro da transação
   */
  public static async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const pool = this.getPool();
    const client = await pool.connect();

    try {
      // Inicia a transação atômica
      await client.query('BEGIN');

      // Executa as operações do usuário
      const result = await callback(client);

      // Confirma todas as operações se nenhuma falha ocorreu
      await client.query('COMMIT');
      return result;
    } catch (error) {
      // Reverte todas as operações em caso de erro, garantindo atomicidade
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Erro ao realizar ROLLBACK:', rollbackError);
      }
      throw error;
    } finally {
      // Libera o cliente de volta para o pool
      client.release();
    }
  }

  /**
   * Fecha o pool de conexões (útil para encerramento de testes e processos)
   */
  public static async closePool(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}
