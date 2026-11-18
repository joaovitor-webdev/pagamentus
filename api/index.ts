import { app } from '../src/server';
import { ensureDatabaseInitialized } from '../src/db/database';

export default async function handler(req: any, res: any) {
  try {
    await ensureDatabaseInitialized();
  } catch (err: any) {
    console.error('Falha ao inicializar o banco de dados no Vercel Serverless:', err);
  }
  return app(req, res);
}
