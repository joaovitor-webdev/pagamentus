import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { roleMiddleware } from './services/maskingService';
import { initDatabase, ensureDatabaseInitialized } from './db/database';
import employeeRoutes from './routes/employeeRoutes';
import eventRoutes from './routes/eventRoutes';
import timeRecordRoutes from './routes/timeRecordRoutes';
import payrollRoutes from './routes/payrollRoutes';
import esocialRoutes from './routes/esocialRoutes';
import parameterRoutes from './routes/parameterRoutes';
import companyRoutes from './routes/companyRoutes';
import { criarApp } from './app';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de RBAC e Mascaramento (RF-056)
app.use('/api', roleMiddleware);

// Rotas da API RESTful de Folha de Pagamento & RH
app.use('/api/company', companyRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/time-records', timeRecordRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/esocial', esocialRoutes);
app.use('/api/parameters', parameterRoutes);

// Coexistência com Módulos Contábeis e Plataforma (SPEC-1 e SPEC-2)
try {
  const { app: accountingApp } = criarApp();
  app.use(accountingApp);
} catch (e) {
  console.warn('Aviso: módulo contábil não montado:', e);
}

// Healthcheck
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    module: 'Item 4 - Folha de Pagamento e Atendimento (SPEC-4.1)',
    stack: 'Node.js (TypeScript) + PostgreSQL + Docker Compose',
    version: '2.0.0',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Arquivos estáticos do Frontend (Resolução robusta para ts-node e dist compilado)
let publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  const srcPublic = path.join(__dirname, '../src/public');
  const cwdPublic = path.join(process.cwd(), 'src/public');
  if (fs.existsSync(srcPublic)) {
    publicDir = srcPublic;
  } else if (fs.existsSync(cwdPublic)) {
    publicDir = cwdPublic;
  }
}
app.use(express.static(publicDir));

// Fallback SPA
app.use((req: Request, res: Response) => {
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Página não encontrada.');
  }
});

let serverInstance: any = null;

export async function startServer(bindTarget: string | number = PORT) {
  await ensureDatabaseInitialized();
  return new Promise((resolve) => {
    serverInstance = app.listen(bindTarget, () => {
      console.log(`=======================================================`);
      console.log(` MÓDULO ITEM 4 (SPEC-4.1) - STACK OFICIAL MIGRADA `);
      console.log(` Backend: Node.js (TypeScript) + Express`);
      console.log(` Banco de Dados: PostgreSQL (Multi-inquilino)`);
      console.log(` Ambientes: pagamentus_prod / pagamentus_test`);
      console.log(` Servidor ativo em: ${typeof bindTarget === 'string' ? bindTarget : `http://localhost:${bindTarget}`}`);
      console.log(`=======================================================`);
      resolve(serverInstance);
    });
  });
}

// Inicia automaticamente se executado diretamente
if (require.main === module) {
  startServer().catch((err) => {
    console.error('Falha ao inicializar servidor:', err);
    process.exit(1);
  });
}

export { app, serverInstance };
