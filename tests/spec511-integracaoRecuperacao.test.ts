import request from 'supertest';
import { criarApp } from '../src/app';

describe('SPEC-5.11: Testes de integração e recuperação', () => {
  let app: any;

  beforeEach(() => {
    const instancia = criarApp();
    app = instancia.app;
  });

  /**
   * CA-1: Integração ponta a ponta entre módulos de IRPF
   */
  it('CA-1: deve integrar Ficha -> Rendimentos/Deduções -> Consistência -> Status', async () => {
    const resFicha = await request(app)
      .post('/api/ir/fichas')
      .send({
        exercicio: 2026,
        documento: 'DOC-INT-001',
        nomeCompleto: 'Contribuinte Integracao',
        dataNascimento: '1989-07-15',
        ocupacao: 'Engenheiro',
        endereco: { logradouro: 'Rua Integracao, 50', cidade: 'Recife', uf: 'PE' },
      });
    expect(resFicha.status).toBe(201);
    const fichaId = resFicha.body.dados.id;

    await request(app)
      .post(`/api/ir/fichas/${fichaId}/rendimentos`)
      .send({
        categoria: 'TRIBUTAVEL',
        fontePagadora: 'Empresa Integracao',
        descricao: 'Salário anual',
        valor: 90000,
        irRetido: 7000,
      });

    await request(app).post('/api/ir/regras-exercicio').send({
      exercicio: 2026,
      limiteDeducaoEducacaoPorPessoa: 3561.5,
      deducaoPorDependente: 2275.08,
      versaoOrientacao: 'INT-2026.1',
    });

    const resCons = await request(app)
      .post(`/api/ir/fichas/${fichaId}/consistencia`)
      .send({
        exercicio: 2026,
        totalRendimentosTributaveis: 90000,
        totalRendimentosIsentos: 0,
        totalIrRetido: 7000,
        despesaEducacaoDeclarada: 0,
        quantidadePessoasEducacao: 1,
        totalBensAnterior: 50000,
        totalBensAtual: 80000,
        totalDividasAnterior: 0,
        totalDividasAtual: 0,
      });
    expect(resCons.status).toBe(200);
    expect(resCons.body.dados.consistente).toBe(true);

    const resStatus = await request(app)
      .patch(`/api/ir/fichas/${fichaId}/status`)
      .send({ status: 'AUTORIZADA', alteradoPor: 'Contador' });
    expect(resStatus.status).toBe(200);
    expect(resStatus.body.dados.status).toBe('AUTORIZADA');
  });

  /**
   * CA-2: Integração entre Tarefas de Obrigações e Alertas de Prazo
   */
  it('CA-2: deve integrar tarefas cadastradas com processamento de alertas de prazo', async () => {
    const empresaId = 'emp-int-obr-01';
    const resTarefa = await request(app)
      .post(`/api/empresas/${empresaId}/obrigacoes/tarefas`)
      .send({
        titulo: 'DCTFWeb Integracao',
        responsavel: 'Equipe Fiscal',
        prazo: '2026-06-16',
        prioridade: 'ALTA',
      });
    expect(resTarefa.status).toBe(201);

    const resAlertas = await request(app)
      .post(`/api/empresas/${empresaId}/obrigacoes/alertas/processar`)
      .send({
        dataReferencia: '2026-06-15',
        diasAntecedencia: 3,
        canais: ['SISTEMA'],
        obrigacoes: [
          {
            titulo: resTarefa.body.dados.titulo,
            responsavel: resTarefa.body.dados.responsavel,
            prazo: resTarefa.body.dados.prazo,
          },
        ],
      });
    expect(resAlertas.status).toBe(200);
    expect(resAlertas.body.dados).toHaveLength(1);
    expect(resAlertas.body.dados[0].tipoAlerta).toBe('VENCIMENTO_PROXIMO');
  });

  /**
   * CA-3: Recuperação e continuidade após erro de entrada
   */
  it('CA-3: deve recuperar-se de requisições inválidas mantendo continuidade operacional da API', async () => {
    const resFalha = await request(app)
      .post('/api/empresas/emp-rec-01/fiscal/divergencias/conferir')
      .send({ competencia: 'INVALIDA', totalDocumentosFiscais: -5 });
    expect(resFalha.status).toBe(400);

    const resRecuperado = await request(app)
      .post('/api/empresas/emp-rec-01/fiscal/divergencias/conferir')
      .send({
        competencia: '2026-09',
        totalDocumentosFiscais: 1000,
        totalApuracaoTributaria: 1000,
        totalContabilidade: 1000,
      });
    expect(resRecuperado.status).toBe(200);
    expect(resRecuperado.body.dados.possuiDivergencias).toBe(false);
  });
});
