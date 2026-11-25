import request from 'supertest';
import { criarApp } from '../src/app';

describe('SPEC-5.7 - Importação e exportação validadas (RF-078, RB-006)', () => {
  it('deve realizar pré-visualização, detectar erros e duplicidades e preservar arquivo original com SHA-256 (RB-006)', async () => {
    const { app } = criarApp();

    const payload = {
      nomeArquivo: 'extrato-contabil-2026.json',
      formato: 'JSON',
      conteudo: '{"mock":"dados-originais-sem-modificacao"}',
      registros: [
        { identificador: 'DOC-001', dados: { valor: 100, descricao: 'Serviço A' } },
        { identificador: 'DOC-002', dados: { valor: 250, descricao: 'Serviço B' } },
        { identificador: 'DOC-001', dados: { valor: 100, descricao: 'Duplicado no mesmo lote' } },
        { identificador: '', dados: { valor: 300 } }, // erro de identificador vazio
      ],
    };

    const resPre = await request(app)
      .post('/api/dados-validados/pre-visualizar')
      .set('x-perfil-usuario', 'CONTADOR')
      .send(payload);

    expect(resPre.status).toBe(200);
    expect(resPre.body.totalRegistros).toBe(4);
    expect(resPre.body.totalValidos).toBe(2);
    expect(resPre.body.totalDuplicados).toBe(1);
    expect(resPre.body.totalInvalidos).toBe(2);
    expect(resPre.body.hashArquivoOriginal).toHaveLength(64);

    const loteId = resPre.body.loteId;

    // Verificar arquivo original intacto com hash
    const resOrig = await request(app)
      .get(`/api/dados-validados/lotes/${loteId}/original`)
      .set('x-perfil-usuario', 'CONTADOR');

    expect(resOrig.status).toBe(200);
    expect(resOrig.body.conteudoOriginal).toBe('{"mock":"dados-originais-sem-modificacao"}');
    expect(resOrig.body.hashSha256).toBe(resPre.body.hashArquivoOriginal);

    // Confirmar importação e verificar processamento seguro
    const resConf = await request(app)
      .post('/api/dados-validados/confirmar')
      .set('x-perfil-usuario', 'CONTADOR')
      .send({ loteId, descartarInvalidos: true });

    expect(resConf.status).toBe(200);
    expect(resConf.body.status).toBe('PROCESSADO_PARCIALMENTE');
    expect(resConf.body.totalProcessados).toBe(2);
    expect(resConf.body.totalIgnorados).toBe(2);

    // Exportar os dados validados processados
    const resExp = await request(app)
      .get('/api/dados-validados/exportar')
      .set('x-perfil-usuario', 'CONTADOR');

    expect(resExp.status).toBe(200);
    expect(resExp.body.total).toBe(2);
  });

  it('deve bloquear acesso para perfil não autorizado (HTTP 403)', async () => {
    const { app } = criarApp();

    const res = await request(app)
      .get('/api/dados-validados/exportar')
      .set('x-perfil-usuario', 'CLIENTE');

    expect(res.status).toBe(403);
    expect(res.body.codigo).toBe('ACESSO_NEGADO');
  });
});
