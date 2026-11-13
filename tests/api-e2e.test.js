const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/server');
const db = require('../src/database/db');

// Utiliza cliente fetch embutido do Node 20
let server;
let baseUrl;

test.before(async () => {
  await db.getDatabase();
  await db.seedDefaultData();

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });
});

test.after(() => {
  if (server) server.close();
});

test('API E2E: Healthcheck responde status ONLINE', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ONLINE');
  assert.equal(data.responsavel, 'Ítalo');
});

test('API E2E: SPEC-2.1 - Listar e criar contas contábeis', async () => {
  const resList = await fetch(`${baseUrl}/contabilidade/contas`);
  assert.equal(resList.status, 200);
  const contas = await resList.json();
  assert.ok(contas.length > 0);

  const codigoUnico = '9.9.' + Math.floor(Math.random() * 8999 + 1000);
  const resCreate = await fetch(`${baseUrl}/contabilidade/contas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      codigo: codigoUnico,
      nome: 'Conta Teste E2E',
      natureza: 'DESPESA',
      tipo: 'SINTETICA'
    })
  });
  assert.equal(resCreate.status, 201);
  const conta = await resCreate.json();
  assert.equal(conta.codigo, codigoUnico);
});

test('API E2E: SPEC-2.2 - Rejeição HTTP 400 para lançamento contábil desbalanceado (RB-001)', async () => {
  const res = await fetch(`${baseUrl}/contabilidade/lancamentos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data_lancamento: '2026-11-13',
      historico: 'Lançamento desbalanceado E2E',
      partidas: [
        { conta_id: 'c-1.1.01.001', tipo: 'DEBITO', valor: 100.00 },
        { conta_id: 'c-2.1.01.001', tipo: 'CREDITO', valor: 90.00 }
      ]
    })
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /Lançamento contábil desbalanceado rejeitado/);
});

test('API E2E: SPEC-2.3 - Gestão de títulos e parcelas via HTTP', async () => {
  const resTitulo = await fetch(`${baseUrl}/financeiro/titulos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tipo: 'PAGAR',
      pessoa_nome: 'Fornecedor E2E',
      descricao: 'Serviço de Nuvem',
      valor_total: 600.00,
      quantidade_parcelas: 2
    })
  });

  assert.equal(resTitulo.status, 201);
  const titulo = await resTitulo.json();
  assert.equal(titulo.parcelas.length, 2);

  // Baixa parcial na parcela 1
  const parc1 = titulo.parcelas[0];
  const resBaixa = await fetch(`${baseUrl}/financeiro/parcelas/${parc1.id}/baixa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      valor_pago: 100.00,
      forma_pagamento: 'PIX'
    })
  });

  assert.equal(resBaixa.status, 200);
  const tituloPosBaixa = await resBaixa.json();
  const p1 = tituloPosBaixa.parcelas.find(p => p.id === parc1.id);
  assert.equal(p1.status, 'PARCIAL');
  assert.equal(p1.saldo_pendente, 200.00);
});
