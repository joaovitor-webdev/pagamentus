const express = require('express');
const path = require('path');
require('dotenv').config();

const { roleMiddleware } = require('./src/services/maskingService');
const employeeRoutes = require('./src/routes/employeeRoutes');
const eventRoutes = require('./src/routes/eventRoutes');
const payrollRoutes = require('./src/routes/payrollRoutes');
const esocialRoutes = require('./src/routes/esocialRoutes');
const parameterRoutes = require('./src/routes/parameterRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares essenciais
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Aplica o middleware de papel/perfil nas rotas de API (RF-056)
app.use('/api', roleMiddleware);

// Rotas da API RESTful
app.use('/api/employees', employeeRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/esocial', esocialRoutes);
app.use('/api/parameters', parameterRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    module: 'Item 4 - Folha de Pagamento e Atendimento (SPEC-4.1)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Arquivos estáticos do Frontend (HTML5, Vanilla JS, Tailwind via CDN)
app.use(express.static(path.join(__dirname, 'src', 'public')));

// Fallback para SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'public', 'index.html'));
});

// Inicialização do servidor
const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` MÓDULO ITEM 4 (SPEC-4.1: FOLHA DE PAGAMENTO E RH) `);
  console.log(` Servidor ativo em: http://localhost:${PORT}`);
  console.log(` Banco de dados: ${process.env.DATABASE_PATH || './data/payroll.sqlite'}`);
  console.log(`=======================================================`);
});

module.exports = { app, server };
