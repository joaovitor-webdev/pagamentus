import request from 'supertest';
import { criarApp } from '../src/app';

describe('SPEC-5.4: Exportação controlada e saída de dados (RF-073, RNF-015)', () => {
  let app: any;
  const clienteId = 'cli-exp-001';

  beforeEach(() => {
    const instancia = criarApp();
    app = instancia.app;
    instancia.exportacaoControladaService.limpar();
  });

  it('deve exportar dados em formato aberto (JSON/CSV) gerando trilha de auditoria com hash SHA-256', async () => {
    const res = await request(app)
      .post(`/api/portal/clientes/${clienteId}/exportacao-controlada`)
      .set('x-perfil-acesso', 'CONTADOR')
      .send({
        usuario: 'contador.demo',
        formato: 'CSV',
        motivo: 'Portabilidade solicitada pelo cliente',
        registros: [{ conta: '1.1.01', saldo: 5000 }],
      });

    expect(res.status).toBe(200);
    expect(res.body.dados.conteudo).toContain('conta;saldo');
    expect(res.body.dados.auditoria.hashSha256).toHaveLength(64);

    const resAud = await request(app).get(
      `/api/portal/clientes/${clienteId}/exportacao-controlada/auditoria`
    );
    expect(resAud.status).toBe(200);
    expect(resAud.body.dados).toHaveLength(1);
  });

  it('deve bloquear perfil sem permissão (403) e formato fechado/inválido (400)', async () => {
    const res403 = await request(app)
      .post(`/api/portal/clientes/${clienteId}/exportacao-controlada`)
      .set('x-perfil-acesso', 'ESTAGIARIO')
      .send({
        usuario: 'estag',
        formato: 'JSON',
        motivo: 'Teste',
        registros: [],
      });
    expect(res403.status).toBe(403);

    const res400 = await request(app)
      .post(`/api/portal/clientes/${clienteId}/exportacao-controlada`)
      .set('x-perfil-acesso', 'ADMIN')
      .send({
        usuario: 'admin',
        formato: 'PROPRIETARIO',
        motivo: 'Teste',
        registros: [],
      });
    expect(res400.status).toBe(400);
  });
});
