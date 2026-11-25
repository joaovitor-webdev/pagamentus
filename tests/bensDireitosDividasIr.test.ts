import request from 'supertest';
import { criarApp } from '../src/app';

describe('SPEC-3.15: Bens, direitos e dívidas IRPF (RF-032)', () => {
  let app: any;
  const fichaId = 'ficha-ficticia-pat-001';

  beforeEach(() => {
    const instancia = criarApp();
    app = instancia.app;
    instancia.patrimonioIrService.limpar();
  });

  /**
   * CA-1: Registro de bens e direitos por categoria
   */
  it('CA-1: deve registrar bens em categorias distintas e consolidar totais', async () => {
    await request(app)
      .post(`/api/ir/fichas/${fichaId}/bens`)
      .send({
        categoria: 'IMOVEL',
        descricao: 'Apartamento residencial demo',
        situacaoAnterior: 250000,
        situacaoAtual: 250000,
      });

    await request(app)
      .post(`/api/ir/fichas/${fichaId}/bens`)
      .send({
        categoria: 'CRIPTOATIVO',
        descricao: 'Carteira criptoativos demo',
        situacaoAnterior: 5000,
        situacaoAtual: 12000,
      });

    const res = await request(app).get(`/api/ir/fichas/${fichaId}/patrimonio`);
    expect(res.status).toBe(200);
    expect(res.body.dados.bens).toHaveLength(2);
    expect(res.body.dados.totalBensAnterior).toBe(255000);
    expect(res.body.dados.totalBensAtual).toBe(262000);
    expect(res.body.dados.variacaoPatrimonial).toBe(7000);
  });

  /**
   * CA-2: Registro de dívidas e ônus e cálculo do patrimônio líquido
   */
  it('CA-2: deve registrar dívidas e calcular patrimônio líquido no resumo', async () => {
    await request(app)
      .post(`/api/ir/fichas/${fichaId}/bens`)
      .send({
        categoria: 'VEICULO',
        descricao: 'Automóvel demo',
        situacaoAnterior: 80000,
        situacaoAtual: 80000,
      });

    await request(app)
      .post(`/api/ir/fichas/${fichaId}/dividas`)
      .send({
        credor: 'Banco Demo',
        descricao: 'Financiamento pessoal',
        saldoAnterior: 30000,
        saldoAtual: 20000,
        valorPagoNoExercicio: 10000,
      });

    const res = await request(app).get(`/api/ir/fichas/${fichaId}/patrimonio`);
    expect(res.status).toBe(200);
    expect(res.body.dados.totalDividasAtual).toBe(20000);
    expect(res.body.dados.patrimonioLiquidoAtual).toBe(60000);
  });

  /**
   * CA-3: Validações de entrada
   */
  it('CA-3: deve recusar categoria inválida ou valor negativo (400)', async () => {
    const resBem = await request(app)
      .post(`/api/ir/fichas/${fichaId}/bens`)
      .send({
        categoria: 'INVALIDA',
        descricao: 'Item',
        situacaoAtual: 100,
      });
    expect(resBem.status).toBe(400);

    const resDiv = await request(app)
      .post(`/api/ir/fichas/${fichaId}/dividas`)
      .send({
        credor: 'Banco',
        descricao: 'Dívida',
        saldoAtual: -50,
      });
    expect(resDiv.status).toBe(400);
  });
});
