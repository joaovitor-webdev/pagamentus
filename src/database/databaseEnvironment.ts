export type DatabaseEnvironment = 'development' | 'test' | 'production';

export interface DatabaseEnvironmentConfig {
  environment: DatabaseEnvironment;
  databaseName: string;
  connectionString: string;
}

const expectedDatabaseByEnvironment: Record<DatabaseEnvironment, string> = {
  development: 'pagamentus_dev',
  test: 'pagamentus_test',
  production: 'pagamentus_prod',
};

function isDatabaseEnvironment(value: string): value is DatabaseEnvironment {
  return value === 'development' || value === 'test' || value === 'production';
}

function parseDatabaseUrl(connectionString: string, variableName: string): URL {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(connectionString);
  } catch {
    throw new Error(`${variableName} deve conter uma URL PostgreSQL válida.`);
  }

  if (parsedUrl.protocol !== 'postgres:' && parsedUrl.protocol !== 'postgresql:') {
    throw new Error(`${variableName} deve usar o protocolo postgres ou postgresql.`);
  }

  return parsedUrl;
}

function getDatabaseName(parsedUrl: URL, variableName: string): string {
  let databaseName: string;
  try {
    databaseName = decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, ''));
  } catch {
    throw new Error(`${variableName} deve conter um nome de banco válido.`);
  }

  return databaseName;
}

export function resolveDatabaseEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): DatabaseEnvironmentConfig {
  const environment = env.NODE_ENV ?? 'development';
  if (!isDatabaseEnvironment(environment)) {
    throw new Error(`NODE_ENV inválido: ${environment}. Use development, test ou production.`);
  }

  const variableName = environment === 'test' ? 'DATABASE_URL_TEST' : 'DATABASE_URL';
  const connectionString = env[variableName];
  if (!connectionString) {
    throw new Error(`${variableName} deve estar configurada para NODE_ENV=${environment}.`);
  }

  const parsedUrl = parseDatabaseUrl(connectionString, variableName);
  const databaseName = getDatabaseName(parsedUrl, variableName);
  const expectedDatabase = expectedDatabaseByEnvironment[environment];

  // Em produção com provedores gerenciados (ex: Supabase, Neon), o banco padrão costuma ser 'postgres'.
  // Permitimos 'postgres' em produção ou o esperado 'pagamentus_prod'.
  const ehBancoValido =
    databaseName === expectedDatabase ||
    (environment === 'production' && (databaseName === 'postgres' || databaseName === 'pagamentus_prod'));

  if (!ehBancoValido) {
    throw new Error(
      `${variableName} deve apontar para o banco ${expectedDatabase}${environment === 'production' ? ' ou postgres' : ''} em NODE_ENV=${environment}.`,
    );
  }

  if (environment === 'test' && env.DATABASE_URL) {
    const applicationUrl = parseDatabaseUrl(env.DATABASE_URL, 'DATABASE_URL');
    if (getDatabaseName(applicationUrl, 'DATABASE_URL') === expectedDatabase) {
      throw new Error('DATABASE_URL e DATABASE_URL_TEST não podem apontar para o mesmo banco de teste.');
    }
  }

  return {
    environment,
    databaseName,
    connectionString,
  };
}
