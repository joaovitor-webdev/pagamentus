import request from 'supertest';
import { criarApp } from '../src/app';
import { AutenticacaoService } from '../src/services/AutenticacaoService';
import { InMemoryAutenticacaoRepository } from '../src/repositories/AutenticacaoRepository';

describe('SPEC-1.4: Autenticação, senhas e MFA (RF-075, RNF-003)', () => {
  let app: any;
  let authRepo: InMemoryAutenticacaoRepository;
  let authService: AutenticacaoService;

  const organizacaoFicticiaId = 'org-ficticia-001';
  let perfilPrivilegiadoId: string;
  let perfilComumId: string;

  beforeEach(async () => {
    const instancia = criarApp();
    app = instancia.app;
    authRepo = instancia.authRepo;
    authService = instancia.authService;
    await authRepo.limpar();

    // Cria permissões base
    await authService.criarPermissao({
      chave: 'usuarios:administrar',
      descricao: 'Permite cadastrar e administrar usuários',
    });
    await authService.criarPermissao({
      chave: 'perfis:administrar',
      descricao: 'Permite criar perfis e atribuir permissões',
    });
    await authService.criarPermissao({
      chave: 'sessoes:administrar',
      descricao: 'Permite encerrar sessões de outros usuários',
    });

    // Cria perfil privilegiado (Administrador - exige MFA obrigatório)
    const perfilAdmin = await authService.criarPerfil({
      nome: 'Administrador',
      descricao: 'Perfil privilegiado com acesso administrativo completo',
      privilegiado: true,
      permissoes: ['usuarios:administrar', 'perfis:administrar', 'sessoes:administrar'],
    });
    perfilPrivilegiadoId = perfilAdmin.id;

    // Cria perfil comum (Operador - sem privilégios administrativos e sem MFA obrigatório por padrão)
    const perfilOperador = await authService.criarPerfil({
      nome: 'Operador',
      descricao: 'Perfil operacional padrão',
      privilegiado: false,
      permissoes: [],
    });
    perfilComumId = perfilOperador.id;
  });

  /**
   * CA-1: Dado o cadastro ou alteração de senha de um usuário,
   * quando for informada uma senha fraca que não atenda à política de senhas fortes,
   * então o sistema deve recusar a operação e impedir o salvamento da senha.
   */
  describe('CA-1: Política de senhas fortes (recusa de senha fraca)', () => {
    it('deve recusar o cadastro de usuário quando a senha for fraca', async () => {
      await expect(
        authService.cadastrarUsuario({
          organizacaoId: organizacaoFicticiaId,
          perfilId: perfilComumId,
          nome: 'Usuario Teste Fraco',
          email: 'fraco@exemplo.ficticio.local',
          senha: '123456', // Senha curta, sem maiúscula, minúscula ou especial
        })
      ).rejects.toThrow(/Senha fraca recusada/);

      const usuarioSalvo = await authRepo.buscarUsuarioPorEmail('fraco@exemplo.ficticio.local');
      expect(usuarioSalvo).toBeNull();
    });

    it('deve recusar a alteração de senha para uma senha fraca via endpoint HTTP', async () => {
      await authService.cadastrarUsuario({
        organizacaoId: organizacaoFicticiaId,
        perfilId: perfilComumId,
        nome: 'Usuario Alteracao Senha',
        email: 'operador@exemplo.ficticio.local',
        senha: 'SenhaForte@2026',
      });

      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'operador@exemplo.ficticio.local',
        senha: 'SenhaForte@2026',
      });

      const token = loginRes.body.dados.token;

      // Tenta alterar para senha sem caractere especial e sem número
      const alteracaoRes = await request(app)
        .put('/api/auth/senha')
        .set('Authorization', `Bearer ${token}`)
        .send({
          senhaAtual: 'SenhaForte@2026',
          novaSenha: 'apenasletras',
        });

      expect(alteracaoRes.status).toBe(400);
      expect(alteracaoRes.body.sucesso).toBe(false);
      expect(alteracaoRes.body.erro).toMatch(/Senha fraca recusada/);
    });

    it('deve aceitar o cadastro e alteração quando a senha atender à política de senha forte', async () => {
      const usuario = await authService.cadastrarUsuario({
        organizacaoId: organizacaoFicticiaId,
        perfilId: perfilComumId,
        nome: 'Usuario Forte',
        email: 'forte@exemplo.ficticio.local',
        senha: 'SenhaValida#2026',
      });

      expect(usuario.id).toBeDefined();
      expect((usuario as any).senhaHash).toBeUndefined();
    });
  });

  /**
   * CA-2: Dado um usuário vinculado a um perfil privilegiado,
   * quando realizar o login com credenciais válidas,
   * então o sistema deve exigir a verificação de autenticação multifator (MFA)
   * antes de conceder acesso à sessão ativa.
   */
  describe('CA-2: MFA obrigatório para perfis privilegiados', () => {
    it('gera códigos TOTP compatíveis com o vetor de referência RFC 6238', () => {
      expect(authService.gerarCodigoMfa('12345678901234567890', 59000)).toBe('287082');
    });

    it('deve exigir MFA para usuário com perfil privilegiado e bloquear acesso antes da verificação', async () => {
      const segredoMfaFicticio = 'segredo_mfa_ficticio_teste_123';
      await authService.cadastrarUsuario({
        organizacaoId: organizacaoFicticiaId,
        perfilId: perfilPrivilegiadoId,
        nome: 'Admin Privilegiado',
        email: 'admin@exemplo.ficticio.local',
        senha: 'AdminForte!2026',
        mfaSegredo: segredoMfaFicticio,
      });

      // 1. Realiza login primário com e-mail e senha válidos
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'admin@exemplo.ficticio.local',
        senha: 'AdminForte!2026',
      });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.dados.requerMfa).toBe(true);
      expect(loginRes.body.dados.mfaVerificado).toBe(false);

      const tokenPendente = loginRes.body.dados.token;

      // 2. Tenta acessar rota protegida ANTES de verificar o MFA -> deve ser negado (401)
      const meAntesMfa = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenPendente}`);

      expect(meAntesMfa.status).toBe(401);
      expect(meAntesMfa.body.erro).toMatch(/MFA/i);

      // 3. Tenta enviar código MFA incorreto -> deve ser recusado (401)
      const mfaInvalidoRes = await request(app)
        .post('/api/auth/mfa/verificar')
        .set('Authorization', `Bearer ${tokenPendente}`)
        .send({ codigoMfa: '000000' });

      expect(mfaInvalidoRes.status).toBe(401);

      // 4. Envia código MFA correto -> libera a sessão ativa
      const codigoCorreto = authService.gerarCodigoMfa(segredoMfaFicticio);
      const mfaValidoRes = await request(app)
        .post('/api/auth/mfa/verificar')
        .set('Authorization', `Bearer ${tokenPendente}`)
        .send({ codigoMfa: codigoCorreto });

      expect(mfaValidoRes.status).toBe(200);
      expect(mfaValidoRes.body.dados.mfaVerificado).toBe(true);

      // 5. Acessa rota protegida APÓS verificar MFA -> sucesso (200)
      const meAposMfa = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenPendente}`);

      expect(meAposMfa.status).toBe(200);
      expect(meAposMfa.body.dados.usuario.email).toBe('admin@exemplo.ficticio.local');
      expect(meAposMfa.body.dados.usuario.mfaSegredo).toBeUndefined();
      expect(meAposMfa.body.dados.usuario.senhaHash).toBeUndefined();
      expect(meAposMfa.body.dados.sessao.token).toBeUndefined();
    });
  });

  /**
   * CA-3: Dado o processo de autenticação,
   * quando o número de tentativas consecutivas com falha atingir o limite máximo permitido,
   * então o sistema deve bloquear novas tentativas de login para aquela conta/origem.
   */
  describe('CA-3: Limitação e bloqueio de tentativas consecutivas de autenticação', () => {
    it('deve bloquear a conta ao atingir 5 tentativas consecutivas de login com falha', async () => {
      await authService.cadastrarUsuario({
        organizacaoId: organizacaoFicticiaId,
        perfilId: perfilComumId,
        nome: 'Usuario Bloqueio',
        email: 'bloqueio@exemplo.ficticio.local',
        senha: 'SenhaCorreta@2026',
      });

      // Tentativas 1 a 4 com senha errada -> retornam 401 Credenciais inválidas
      for (let i = 1; i <= 4; i++) {
        const res = await request(app).post('/api/auth/login').send({
          email: 'bloqueio@exemplo.ficticio.local',
          senha: `SenhaErrada@${i}`,
        });
        expect(res.status).toBe(401);
      }

      // 5ª tentativa com falha -> atinge o limite e bloqueia (429)
      const quintaTentativa = await request(app).post('/api/auth/login').send({
        email: 'bloqueio@exemplo.ficticio.local',
        senha: 'SenhaErrada@5',
      });
      expect(quintaTentativa.status).toBe(429);
      expect(quintaTentativa.body.erro).toMatch(/bloquead/i);

      // Tentativa subsequente MESMO COM A SENHA CORRETA deve ser recusada enquanto bloqueado
      const tentativaComSenhaCorreta = await request(app).post('/api/auth/login').send({
        email: 'bloqueio@exemplo.ficticio.local',
        senha: 'SenhaCorreta@2026',
      });
      expect(tentativaComSenhaCorreta.status).toBe(429);
      expect(tentativaComSenhaCorreta.body.erro).toMatch(/bloquead/i);
    });
  });

  /**
   * CA-4: Dada uma sessão ativa de usuário,
   * quando for acionado o encerramento da sessão pelo próprio usuário ou pela administração,
   * então a sessão deve ser invalidada imediatamente, recusando requisições subsequentes.
   */
  describe('CA-4: Encerramento imediato de sessões ativas', () => {
    it('deve invalidar a sessão imediatamente ao realizar logout e recusar requisições subsequentes', async () => {
      await authService.cadastrarUsuario({
        organizacaoId: organizacaoFicticiaId,
        perfilId: perfilComumId,
        nome: 'Usuario Sessao',
        email: 'sessao@exemplo.ficticio.local',
        senha: 'SenhaSessao@2026',
      });

      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'sessao@exemplo.ficticio.local',
        senha: 'SenhaSessao@2026',
      });

      const token = loginRes.body.dados.token;

      // Confirma que a sessão está funcionando
      const meAtivo = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(meAtivo.status).toBe(200);

      // Encerra a sessão (logout)
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);
      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.dados.ativa).toBe(false);

      // Tenta usar o mesmo token após o encerramento -> recusado (401)
      const meAposLogout = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(meAposLogout.status).toBe(401);
      expect(meAposLogout.body.erro).toMatch(/inativa ou encerrada/i);
    });

    it('lista sessões sem expor tokens e permite encerrar todas as sessões próprias', async () => {
      await authService.cadastrarUsuario({
        organizacaoId: organizacaoFicticiaId,
        perfilId: perfilComumId,
        nome: 'Usuario Multiplas Sessoes',
        email: 'multiplas-sessoes@exemplo.ficticio.local',
        senha: 'SenhaSessoes@2026',
      });

      const loginInicial = await request(app).post('/api/auth/login').send({
        email: 'multiplas-sessoes@exemplo.ficticio.local',
        senha: 'SenhaSessoes@2026',
      });
      const loginAdicional = await request(app).post('/api/auth/login').send({
        email: 'multiplas-sessoes@exemplo.ficticio.local',
        senha: 'SenhaSessoes@2026',
      });
      const tokenInicial = loginInicial.body.dados.token;

      const listagem = await request(app)
        .get('/api/auth/sessoes')
        .set('Authorization', `Bearer ${tokenInicial}`);
      expect(listagem.status).toBe(200);
      expect(listagem.body.dados).toHaveLength(2);
      expect(listagem.body.dados[0].token).toBeUndefined();

      const encerramento = await request(app)
        .delete('/api/auth/sessoes')
        .set('Authorization', `Bearer ${tokenInicial}`);
      expect(encerramento.status).toBe(200);
      expect(encerramento.body.dados).toHaveLength(2);
      expect(encerramento.body.dados.every((sessao: { ativa: boolean }) => !sessao.ativa)).toBe(true);

      const requisicaoEncerrada = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginAdicional.body.dados.token}`);
      expect(requisicaoEncerrada.status).toBe(401);
    });
  });

  /**
   * CA-5: Dado um usuário autenticado,
   * quando tentar administrar usuários, perfis, permissões ou sessões,
   * então o sistema deve validar suas permissões de acesso de acordo com o perfil atribuído (RF-075).
   */
  describe('CA-5: Administração de usuários, perfis, permissões e sessões com controle de acesso', () => {
    it('deve negar ações administrativas para usuário sem permissão e permitir para administrador autenticado com MFA', async () => {
      // 1. Cria e autentica usuário Operador (sem permissões administrativas)
      await authService.cadastrarUsuario({
        organizacaoId: organizacaoFicticiaId,
        perfilId: perfilComumId,
        nome: 'Operador Comum',
        email: 'operador.comum@exemplo.ficticio.local',
        senha: 'Operador@2026',
      });

      const loginOperador = await request(app).post('/api/auth/login').send({
        email: 'operador.comum@exemplo.ficticio.local',
        senha: 'Operador@2026',
      });
      const tokenOperador = loginOperador.body.dados.token;
      const sessaoOperadorId = loginOperador.body.dados.sessaoId;

      // Operador tenta criar um novo perfil -> deve receber 403 Forbidden
      const criarPerfilNegado = await request(app)
        .post('/api/admin/perfis')
        .set('Authorization', `Bearer ${tokenOperador}`)
        .send({
          nome: 'Auditor Fiscal',
          descricao: 'Perfil criado indevidamente',
          privilegiado: false,
        });
      expect(criarPerfilNegado.status).toBe(403);
      expect(criarPerfilNegado.body.erro).toMatch(/Acesso negado/);

      const listarUsuariosNegado = await request(app)
        .get('/api/admin/usuarios')
        .set('Authorization', `Bearer ${tokenOperador}`);
      expect(listarUsuariosNegado.status).toBe(403);

      // 2. Cria e autentica Administrador (perfil privilegiado com MFA)
      const segredoAdmin = 'segredo_admin_master_999';
      await authService.cadastrarUsuario({
        organizacaoId: organizacaoFicticiaId,
        perfilId: perfilPrivilegiadoId,
        nome: 'Administrador Geral',
        email: 'admin.geral@exemplo.ficticio.local',
        senha: 'AdminMaster@2026',
        mfaSegredo: segredoAdmin,
      });

      const loginAdmin = await request(app).post('/api/auth/login').send({
        email: 'admin.geral@exemplo.ficticio.local',
        senha: 'AdminMaster@2026',
      });
      const tokenAdmin = loginAdmin.body.dados.token;

      await request(app)
        .post('/api/auth/mfa/verificar')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ codigoMfa: authService.gerarCodigoMfa(segredoAdmin) });

      // Administrador cria um novo perfil -> sucesso (201)
      const criarPerfilPermitido = await request(app)
        .post('/api/admin/perfis')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nome: 'Contador Senior',
          descricao: 'Perfil com acesso contábil',
          privilegiado: true,
        });
      expect(criarPerfilPermitido.status).toBe(201);
      expect(criarPerfilPermitido.body.dados.nome).toBe('Contador Senior');

      const usuariosAdmin = await request(app)
        .get('/api/admin/usuarios')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(usuariosAdmin.status).toBe(200);
      expect(usuariosAdmin.body.dados[0].senhaHash).toBeUndefined();
      expect(usuariosAdmin.body.dados[0].mfaSegredo).toBeUndefined();

      const perfisAdmin = await request(app)
        .get('/api/admin/perfis')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(perfisAdmin.status).toBe(200);

      const permissoesAdmin = await request(app)
        .get('/api/admin/permissoes')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(permissoesAdmin.status).toBe(200);

      const criarPermissao = await request(app)
        .post('/api/admin/permissoes')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ chave: 'relatorios:consultar', descricao: 'Consulta relatórios' });
      expect(criarPermissao.status).toBe(201);

      const atribuirPermissao = await request(app)
        .put(`/api/admin/perfis/${perfilComumId}/permissoes`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ permissoes: ['relatorios:consultar'] });
      expect(atribuirPermissao.status).toBe(200);
      expect(atribuirPermissao.body.dados.permissoes).toEqual(['relatorios:consultar']);

      const sessoesOperador = await request(app)
        .get(`/api/auth/sessoes?usuarioId=${loginOperador.body.dados.usuarioId}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(sessoesOperador.status).toBe(200);
      expect(sessoesOperador.body.dados[0].token).toBeUndefined();

      await authService.cadastrarUsuario({
        organizacaoId: 'outra-organizacao-ficticia',
        perfilId: perfilComumId,
        nome: 'Operador de Outra Organizacao',
        email: 'operador.outra-organizacao@exemplo.ficticio.local',
        senha: 'Operador@2026',
      });
      const loginOutraOrganizacao = await request(app).post('/api/auth/login').send({
        email: 'operador.outra-organizacao@exemplo.ficticio.local',
        senha: 'Operador@2026',
      });

      const sessoesOutraOrganizacao = await request(app)
        .get(`/api/auth/sessoes?usuarioId=${loginOutraOrganizacao.body.dados.usuarioId}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(sessoesOutraOrganizacao.status).toBe(403);

      const encerrarTodasOutraOrganizacao = await request(app)
        .delete('/api/auth/sessoes')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ usuarioId: loginOutraOrganizacao.body.dados.usuarioId });
      expect(encerrarTodasOutraOrganizacao.status).toBe(403);

      const encerrarSessaoOutraOrganizacao = await request(app)
        .delete(`/api/auth/sessoes/${loginOutraOrganizacao.body.dados.sessaoId}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(encerrarSessaoOutraOrganizacao.status).toBe(403);

      // Administrador encerra remotamente a sessão ativa do Operador -> sucesso (200)
      const encerrarSessaoOperador = await request(app)
        .delete(`/api/auth/sessoes/${sessaoOperadorId}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(encerrarSessaoOperador.status).toBe(200);
      expect(encerrarSessaoOperador.body.dados.ativa).toBe(false);

      // Operador tenta usar sua sessão encerrada pelo Administrador -> negado (401)
      const operadorAposEncerramento = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenOperador}`);
      expect(operadorAposEncerramento.status).toBe(401);
    });
  });
});
