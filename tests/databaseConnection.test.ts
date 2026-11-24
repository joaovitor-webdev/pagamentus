import { Pool, PoolClient } from 'pg';
import { DatabaseConnection } from '../src/database/connection';

describe('DatabaseConnection.transaction', () => {
  let client: PoolClient;

  beforeEach(() => {
    client = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    } as unknown as PoolClient;

    const pool = {
      connect: jest.fn().mockResolvedValue(client),
    } as unknown as Pool;

    jest.spyOn(DatabaseConnection, 'getPool').mockReturnValue(pool);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('confirma uma transação concluída', async () => {
    const resultado = await DatabaseConnection.transaction(async (transactionClient) => {
      await transactionClient.query('INSERT INTO registros (id) VALUES ($1)', ['registro-valido']);
      return 'concluido';
    });

    expect(resultado).toBe('concluido');
    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(
      2,
      'INSERT INTO registros (id) VALUES ($1)',
      ['registro-valido'],
    );
    expect(client.query).toHaveBeenNthCalledWith(3, 'COMMIT');
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it('reverte e propaga a exceção de uma etapa com falha', async () => {
    const falha = new Error('Falha simulada');

    await expect(
      DatabaseConnection.transaction(async (transactionClient) => {
        await transactionClient.query('INSERT INTO registros (id) VALUES ($1)', ['registro-temporario']);
        throw falha;
      }),
    ).rejects.toBe(falha);

    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(
      2,
      'INSERT INTO registros (id) VALUES ($1)',
      ['registro-temporario'],
    );
    expect(client.query).toHaveBeenNthCalledWith(3, 'ROLLBACK');
    expect(client.release).toHaveBeenCalledTimes(1);
  });
});
