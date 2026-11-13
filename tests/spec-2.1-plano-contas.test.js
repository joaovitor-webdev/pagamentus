const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../src/database/db');
const planoContasService = require('../src/modules/contabilidade/planoContasService');

const ORG_TEST = 'org-test-spec-21';

test.before(async () => {
  // Garante que o banco está pronto
  await db.getDatabase();
});

test('SPEC-2.1: CA-1 - Cadastro de conta sintética com código, nome e natureza', async () => {
  const conta = await planoContasService.criarConta(ORG_TEST, {
    codigo: '1',
    nome: 'ATIVO TOTAL',
    natureza: 'ATIVO',
    tipo: 'SINTETICA'
  });

  assert.equal(conta.codigo, '1');
  assert.equal(conta.nome, 'ATIVO TOTAL');
  assert.equal(conta.natureza, 'ATIVO');
  assert.equal(conta.tipo, 'SINTETICA');
  assert.equal(conta.nivel, 1);
  assert.equal(conta.status, 'ATIVA');
});

test('SPEC-2.1: CA-2 - Cadastro de conta analítica vinculada a uma sintética', async () => {
  const contaPai = await planoContasService.criarConta(ORG_TEST, {
    codigo: '1.1',
    nome: 'ATIVO CIRCULANTE',
    natureza: 'ATIVO',
    tipo: 'SINTETICA'
  });

  const contaAnalitica = await planoContasService.criarConta(ORG_TEST, {
    codigo: '1.1.01.001',
    nome: 'Caixa Pequeno',
    natureza: 'ATIVO',
    tipo: 'ANALITICA',
    conta_pai_id: contaPai.id
  });

  assert.equal(contaAnalitica.codigo, '1.1.01.001');
  assert.equal(contaAnalitica.tipo, 'ANALITICA');
  assert.equal(contaAnalitica.conta_pai_id, contaPai.id);
});

test('SPEC-2.1: CA-3 - Organização hierárquica e ordenação por código', async () => {
  const contas = await planoContasService.listarContas(ORG_TEST);
  assert.ok(contas.length >= 3);

  // Verifica que estão ordenadas por código
  for (let i = 0; i < contas.length - 1; i++) {
    assert.ok(contas[i].codigo <= contas[i + 1].codigo, 'Contas devem vir ordenadas por código contábil');
  }

  // Verifica montagem da árvore
  const arvore = await planoContasService.obterArvoreContas(ORG_TEST);
  assert.ok(Array.isArray(arvore));
  const raiz1 = arvore.find(c => c.codigo === '1');
  assert.ok(raiz1, 'Deve existir a raiz 1');
});

test('SPEC-2.1: CA-4 - Bloqueio de lançamentos contábeis em contas sintéticas', async () => {
  const contaSintetica = await planoContasService.obterContaPorCodigo('1', ORG_TEST);
  assert.equal(contaSintetica.tipo, 'SINTETICA');

  // Tentativa de validar aptidão para lançamento deve falhar estritamente
  await assert.rejects(
    async () => {
      await planoContasService.validarAptidaoLancamento(contaSintetica.id, ORG_TEST);
    },
    (err) => {
      assert.match(err.message, /Lançamentos contábeis são permitidos exclusivamente em contas analíticas/);
      return true;
    }
  );

  // Conta analítica deve passar com sucesso
  const contaAnalitica = await planoContasService.obterContaPorCodigo('1.1.01.001', ORG_TEST);
  const validada = await planoContasService.validarAptidaoLancamento(contaAnalitica.id, ORG_TEST);
  assert.equal(validada.id, contaAnalitica.id);
});

test('SPEC-2.1: CA-5 - Bloqueio de desativação de conta com filhas ativas', async () => {
  const contaPai = await planoContasService.obterContaPorCodigo('1.1', ORG_TEST);

  await assert.rejects(
    async () => {
      await planoContasService.desativarConta(contaPai.id, ORG_TEST);
    },
    (err) => {
      assert.match(err.message, /possui .* conta\(s\) filha\(s\) ativa\(s\)/);
      return true;
    }
  );
});

test('SPEC-2.1: CA-6 - Rejeição de código duplicado na mesma organização', async () => {
  await assert.rejects(
    async () => {
      await planoContasService.criarConta(ORG_TEST, {
        codigo: '1',
        nome: 'ATIVO DUPLICADO',
        natureza: 'ATIVO',
        tipo: 'SINTETICA'
      });
    },
    (err) => {
      assert.match(err.message, /já cadastrado para esta organização/);
      return true;
    }
  );
});
