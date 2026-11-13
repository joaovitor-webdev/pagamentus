const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../src/database/db');
const planoContasService = require('../src/modules/contabilidade/planoContasService');
const lancamentosService = require('../src/modules/contabilidade/lancamentosService');

const ORG_TEST = 'org-test-spec-22-' + Date.now();
let contaCaixaAnalitica;
let contaBancoAnalitica;
let contaFornecedorAnalitica;
let contaAtivoSintetica;

test.before(async () => {
  await db.getDatabase();

  // Configura contas para teste
  contaAtivoSintetica = await planoContasService.criarConta(ORG_TEST, {
    codigo: '1',
    nome: 'ATIVO',
    natureza: 'ATIVO',
    tipo: 'SINTETICA'
  });

  const contaDispSintetica = await planoContasService.criarConta(ORG_TEST, {
    codigo: '1.1.01',
    nome: 'Disponibilidades',
    natureza: 'ATIVO',
    tipo: 'SINTETICA',
    conta_pai_id: contaAtivoSintetica.id
  });

  contaCaixaAnalitica = await planoContasService.criarConta(ORG_TEST, {
    codigo: '1.1.01.001',
    nome: 'Caixa Geral',
    natureza: 'ATIVO',
    tipo: 'ANALITICA',
    conta_pai_id: contaDispSintetica.id
  });

  contaBancoAnalitica = await planoContasService.criarConta(ORG_TEST, {
    codigo: '1.1.01.002',
    nome: 'Banco Conta Movimento',
    natureza: 'ATIVO',
    tipo: 'ANALITICA',
    conta_pai_id: contaDispSintetica.id
  });

  const contaPassivoSintetica = await planoContasService.criarConta(ORG_TEST, {
    codigo: '2',
    nome: 'PASSIVO',
    natureza: 'PASSIVO',
    tipo: 'SINTETICA'
  });

  contaFornecedorAnalitica = await planoContasService.criarConta(ORG_TEST, {
    codigo: '2.1.01.001',
    nome: 'Fornecedores Nacionais',
    natureza: 'PASSIVO',
    tipo: 'ANALITICA',
    conta_pai_id: contaPassivoSintetica.id
  });
});

test('SPEC-2.2: CA-1 - Lançamento contábil equilibrado é aceito com sucesso', async () => {
  const lancamento = await lancamentosService.criarLancamento(ORG_TEST, {
    data_lancamento: '2026-11-13',
    historico: 'Transferência entre contas correntes',
    partidas: [
      { conta_id: contaBancoAnalitica.id, tipo: 'DEBITO', valor: 1500.00 },
      { conta_id: contaCaixaAnalitica.id, tipo: 'CREDITO', valor: 1500.00 }
    ]
  });

  assert.ok(lancamento.id);
  assert.equal(lancamento.numero, 1);
  assert.equal(lancamento.valor_total, 1500.00);
  assert.equal(lancamento.status, 'EFETIVADO');
  assert.equal(lancamento.partidas.length, 2);
});

test('SPEC-2.2: CA-2 - REGRA FUNDAMENTAL RB-001: Bloqueio estrito de lançamento desbalanceado', async () => {
  // Débito = 1500, Crédito = 1200 (Diferença: 300)
  await assert.rejects(
    async () => {
      await lancamentosService.criarLancamento(ORG_TEST, {
        data_lancamento: '2026-11-13',
        historico: 'Tentativa de lançamento desbalanceado',
        partidas: [
          { conta_id: contaBancoAnalitica.id, tipo: 'DEBITO', valor: 1500.00 },
          { conta_id: contaCaixaAnalitica.id, tipo: 'CREDITO', valor: 1200.00 }
        ]
      });
    },
    (err) => {
      assert.match(err.message, /Lançamento contábil desbalanceado rejeitado/);
      assert.match(err.message, /soma dos débitos \(R\$ 1500\.00\) difere da soma dos créditos \(R\$ 1200\.00\)/);
      assert.match(err.message, /Diferença apurada: R\$ 300\.00/);
      return true;
    }
  );
});

test('SPEC-2.2: CA-3 - Bloqueio de lançamento contábil em conta sintética', async () => {
  // Tentativa de utilizar a conta sintética '1 - ATIVO'
  await assert.rejects(
    async () => {
      await lancamentosService.criarLancamento(ORG_TEST, {
        data_lancamento: '2026-11-13',
        historico: 'Tentativa em conta sintética',
        partidas: [
          { conta_id: contaAtivoSintetica.id, tipo: 'DEBITO', valor: 500.00 },
          { conta_id: contaCaixaAnalitica.id, tipo: 'CREDITO', valor: 500.00 }
        ]
      });
    },
    (err) => {
      assert.match(err.message, /exclusivamente em contas analíticas/);
      assert.match(err.message, /é SINTÉTICA e não aceita lançamentos/);
      return true;
    }
  );
});

test('SPEC-2.2: CA-4 - Histórico e consulta de lançamentos com detalhamento das partidas', async () => {
  const lista = await lancamentosService.listarLancamentos(ORG_TEST);
  assert.ok(lista.length >= 1);

  const primeiro = lista[0];
  assert.ok(primeiro.partidas);
  assert.equal(primeiro.partidas.length, 2);
  assert.ok(primeiro.partidas[0].conta_codigo);
  assert.ok(primeiro.partidas[0].conta_nome);
});

test('SPEC-2.2: CA-5 - Rejeição de valores menores ou iguais a zero', async () => {
  await assert.rejects(
    async () => {
      await lancamentosService.criarLancamento(ORG_TEST, {
        data_lancamento: '2026-11-13',
        historico: 'Lançamento com valor zero',
        partidas: [
          { conta_id: contaBancoAnalitica.id, tipo: 'DEBITO', valor: 0.00 },
          { conta_id: contaCaixaAnalitica.id, tipo: 'CREDITO', valor: 0.00 }
        ]
      });
    },
    (err) => {
      assert.match(err.message, /o valor deve ser estritamente maior que zero/);
      return true;
    }
  );
});
