const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../src/database/db');
const financeiroService = require('../src/modules/financeiro/financeiroService');

const ORG_TEST = 'org-test-spec-23-' + Date.now();

test.before(async () => {
  await db.getDatabase();
});

test('SPEC-2.3: CA-1 - Cadastro de conta a pagar com parcelamento automático', async () => {
  const titulo = await financeiroService.criarTitulo(ORG_TEST, {
    tipo: 'PAGAR',
    pessoa_nome: 'Fornecedor de Software ABC',
    descricao: 'Licença Anual de Sistemas',
    valor_total: 3000.00,
    quantidade_parcelas: 3,
    data_emissao: '2026-11-13'
  });

  assert.ok(titulo.id);
  assert.equal(titulo.tipo, 'PAGAR');
  assert.equal(titulo.valor_total, 3000.00);
  assert.equal(titulo.status, 'PENDENTE');
  assert.equal(titulo.parcelas.length, 3);

  // Cada parcela de R$ 1.000,00
  titulo.parcelas.forEach((p, idx) => {
    assert.equal(p.numero_parcela, idx + 1);
    assert.equal(p.valor_original, 1000.00);
    assert.equal(p.saldo_pendente, 1000.00);
    assert.equal(p.valor_pago, 0);
    assert.equal(p.status, 'PENDENTE');
  });
});

test('SPEC-2.3: CA-2 - Baixa parcial atualiza saldo pendente e marca parcela como PARCIAL', async () => {
  const titulos = await financeiroService.listarTitulos(ORG_TEST);
  const titulo = titulos[0];
  const parcela1 = titulo.parcelas[0];

  // Baixa parcial de R$ 400 em uma parcela de R$ 1.000
  const tituloAtualizado = await financeiroService.baixarParcela(ORG_TEST, parcela1.id, {
    valor_pago: 400.00,
    data_baixa: '2026-11-13',
    forma_pagamento: 'PIX',
    observacao: 'Pagamento parcial adiantado'
  });

  const p1 = tituloAtualizado.parcelas.find(p => p.id === parcela1.id);
  assert.equal(p1.valor_pago, 400.00);
  assert.equal(p1.saldo_pendente, 600.00);
  assert.equal(p1.status, 'PARCIAL');
  assert.equal(tituloAtualizado.status, 'PARCIAL');
});

test('SPEC-2.3: CA-5 - Rejeição de baixa com valor superior ao saldo pendente', async () => {
  const titulos = await financeiroService.listarTitulos(ORG_TEST);
  const parcela1 = titulos[0].parcelas[0]; // saldo pendente agora é 600.00

  // Tentativa de baixar R$ 700.00 em saldo de R$ 600.00
  await assert.rejects(
    async () => {
      await financeiroService.baixarParcela(ORG_TEST, parcela1.id, {
        valor_pago: 700.00,
        data_baixa: '2026-11-13'
      });
    },
    (err) => {
      assert.match(err.message, /excede o saldo pendente da parcela/);
      return true;
    }
  );
});

test('SPEC-2.3: CA-3 - Baixa total liquida a parcela e zera saldo pendente', async () => {
  const titulos = await financeiroService.listarTitulos(ORG_TEST);
  const parcela1 = titulos[0].parcelas[0]; // saldo pendente: 600.00

  // Baixa os 600.00 restantes
  const tituloAtualizado = await financeiroService.baixarParcela(ORG_TEST, parcela1.id, {
    valor_pago: 600.00,
    data_baixa: '2026-11-13',
    forma_pagamento: 'BOLETO'
  });

  const p1 = tituloAtualizado.parcelas.find(p => p.id === parcela1.id);
  assert.equal(p1.saldo_pendente, 0);
  assert.equal(p1.valor_pago, 1000.00);
  assert.equal(p1.status, 'PAGO');
});

test('SPEC-2.3: CA-4 - Quitação de todas as parcelas atualiza o status do título para PAGO', async () => {
  let titulos = await financeiroService.listarTitulos(ORG_TEST);
  const titulo = titulos[0];

  // Parcela 1 já está PAGA. Agora quita as parcelas 2 e 3
  const parcela2 = titulo.parcelas[1];
  const parcela3 = titulo.parcelas[2];

  await financeiroService.baixarParcela(ORG_TEST, parcela2.id, { valor_pago: 1000.00 });
  const tituloFinal = await financeiroService.baixarParcela(ORG_TEST, parcela3.id, { valor_pago: 1000.00 });

  assert.equal(tituloFinal.status, 'PAGO');
  tituloFinal.parcelas.forEach(p => {
    assert.equal(p.status, 'PAGO');
    assert.equal(p.saldo_pendente, 0);
  });
});

test('SPEC-2.3: CA-6 - Painel e consulta de títulos financeiros com saldos consolidados', async () => {
  // Cadastra um título a receber
  await financeiroService.criarTitulo(ORG_TEST, {
    tipo: 'RECEBER',
    pessoa_nome: 'Cliente Alpha Comércio',
    descricao: 'Consultoria Contábil',
    valor_total: 5000.00,
    quantidade_parcelas: 1
  });

  const titulos = await financeiroService.listarTitulos(ORG_TEST);
  assert.equal(titulos.length, 2);

  const resumo = await financeiroService.obterResumoFinanceiro(ORG_TEST);
  assert.equal(resumo.pagar.total, 3000.00);
  assert.equal(resumo.pagar.quitado, 3000.00);
  assert.equal(resumo.pagar.pendente, 0);

  assert.equal(resumo.receber.total, 5000.00);
  assert.equal(resumo.receber.pendente, 5000.00);
  assert.equal(resumo.saldoLiquidoPendente, 5000.00);
});
