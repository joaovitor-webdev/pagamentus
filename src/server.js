const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database/db');

const contabilidadeRoutes = require('./routes/contabilidadeRoutes');
const financeiroRoutes = require('./routes/financeiroRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da API
app.use('/api/contabilidade', contabilidadeRoutes);
app.use('/api/financeiro', financeiroRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    modulo: 'ITEM 2 - Contabilidade e Financeiro',
    responsavel: 'Ítalo',
    specs: ['SPEC-2.1', 'SPEC-2.2', 'SPEC-2.3'],
    timestamp: new Date().toISOString()
  });
});

// Fallback SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicialização
async function startServer() {
  try {
    await db.getDatabase();
    await db.seedDefaultData();
    console.log('[PAGAMENTUS] Banco de dados e seeds inicializados com sucesso.');

    app.listen(PORT, () => {
      console.log(`[PAGAMENTUS] Servidor ativo em: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('[PAGAMENTUS] Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
