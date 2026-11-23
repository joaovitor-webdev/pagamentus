import { resolveDatabaseEnvironment } from '../src/database/databaseEnvironment';

const developmentUrl = 'postgresql://fake:fake@localhost:5432/pagamentus_dev';
const testUrl = 'postgresql://fake:fake@localhost:5432/pagamentus_test';
const productionUrl = 'postgresql://fake:fake@localhost:5432/pagamentus_prod';

describe('resolveDatabaseEnvironment', () => {
  it('seleciona a URL de desenvolvimento e o banco esperado', () => {
    expect(resolveDatabaseEnvironment({
      NODE_ENV: 'development',
      DATABASE_URL: developmentUrl,
    })).toMatchObject({
      environment: 'development',
      databaseName: 'pagamentus_dev',
      connectionString: developmentUrl,
    });
  });

  it('usa somente DATABASE_URL_TEST no modo de teste', () => {
    expect(resolveDatabaseEnvironment({
      NODE_ENV: 'test',
      DATABASE_URL: productionUrl,
      DATABASE_URL_TEST: testUrl,
    }).connectionString).toBe(testUrl);
  });

  it('falha no modo de teste sem DATABASE_URL_TEST, mesmo com DATABASE_URL', () => {
    expect(() => resolveDatabaseEnvironment({
      NODE_ENV: 'test',
      DATABASE_URL: productionUrl,
    })).toThrow('DATABASE_URL_TEST deve estar configurada');
  });

  it('rejeita uma URL de teste que aponta para o banco de produção', () => {
    expect(() => resolveDatabaseEnvironment({
      NODE_ENV: 'test',
      DATABASE_URL: productionUrl,
      DATABASE_URL_TEST: productionUrl,
    })).toThrow('deve apontar para o banco pagamentus_test');
  });

  it('rejeita DATABASE_URL apontando para o banco de teste, mesmo com URL diferente', () => {
    expect(() => resolveDatabaseEnvironment({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://other-user:other-password@localhost:5432/pagamentus_test',
      DATABASE_URL_TEST: testUrl,
    })).toThrow('não podem apontar para o mesmo banco de teste');
  });

  it('seleciona o banco de produção somente no ambiente de produção', () => {
    expect(resolveDatabaseEnvironment({
      NODE_ENV: 'production',
      DATABASE_URL: productionUrl,
    }).databaseName).toBe('pagamentus_prod');
  });

  it('exige DATABASE_URL em desenvolvimento e produção', () => {
    expect(() => resolveDatabaseEnvironment({
      NODE_ENV: 'development',
    })).toThrow('DATABASE_URL deve estar configurada');
    expect(() => resolveDatabaseEnvironment({
      NODE_ENV: 'production',
    })).toThrow('DATABASE_URL deve estar configurada');
  });

  it('rejeita bancos incompatíveis em desenvolvimento e produção', () => {
    expect(() => resolveDatabaseEnvironment({
      NODE_ENV: 'development',
      DATABASE_URL: testUrl,
    })).toThrow('deve apontar para o banco pagamentus_dev');
    expect(() => resolveDatabaseEnvironment({
      NODE_ENV: 'production',
      DATABASE_URL: testUrl,
    })).toThrow('deve apontar para o banco pagamentus_prod');
  });

  it('rejeita ambiente desconhecido e URLs que não sejam PostgreSQL', () => {
    expect(() => resolveDatabaseEnvironment({
      NODE_ENV: 'staging',
      DATABASE_URL: developmentUrl,
    })).toThrow('NODE_ENV inválido');
    expect(() => resolveDatabaseEnvironment({
      NODE_ENV: 'development',
      DATABASE_URL: 'not-a-url',
    })).toThrow('deve conter uma URL PostgreSQL válida');
    expect(() => resolveDatabaseEnvironment({
      NODE_ENV: 'development',
      DATABASE_URL: 'https://localhost/pagamentus_dev',
    })).toThrow('deve usar o protocolo postgres ou postgresql');
  });
});
