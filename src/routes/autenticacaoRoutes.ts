import { Router } from 'express';
import { AutenticacaoController } from '../controllers/AutenticacaoController';

/**
 * Rotas de Autenticação, Senhas, MFA, Perfis, Permissões e Sessões (SPEC-1.4)
 */
export function criarAutenticacaoRouter(controller: AutenticacaoController): Router {
  const router = Router();

  // Rotas públicas de autenticação e verificação de MFA (CA-2 e CA-3)
  router.post('/auth/login', controller.login);
  router.post('/auth/mfa/verificar', controller.verificarMfa);

  // Rotas protegidas por sessão ativa e MFA verificado (CA-1, CA-2, CA-4 e CA-5)
  router.get('/auth/me', controller.middlewareSessaoAtiva, controller.obterSessaoAtual);
  router.put('/auth/senha', controller.middlewareSessaoAtiva, controller.alterarSenha);
  router.post('/auth/logout', controller.middlewareSessaoAtiva, controller.logout);
  router.get('/auth/sessoes', controller.middlewareSessaoAtiva, controller.listarSessoes);
  router.delete('/auth/sessoes', controller.middlewareSessaoAtiva, controller.encerrarTodasSessoes);
  router.delete(
    '/auth/sessoes/:sessaoId',
    controller.middlewareSessaoAtiva,
    controller.encerrarSessaoPorId
  );

  // Rotas administrativas protegidas por sessão ativa e permissão do perfil (RF-075 / CA-5)
  router.post(
    '/admin/usuarios',
    controller.middlewareSessaoAtiva,
    controller.cadastrarUsuario
  );
  router.get('/admin/usuarios', controller.middlewareSessaoAtiva, controller.listarUsuarios);
  router.post('/admin/perfis', controller.middlewareSessaoAtiva, controller.criarPerfil);
  router.get('/admin/perfis', controller.middlewareSessaoAtiva, controller.listarPerfis);
  router.put(
    '/admin/perfis/:perfilId/permissoes',
    controller.middlewareSessaoAtiva,
    controller.substituirPermissoesDoPerfil
  );
  router.post(
    '/admin/permissoes',
    controller.middlewareSessaoAtiva,
    controller.criarPermissao
  );
  router.get('/admin/permissoes', controller.middlewareSessaoAtiva, controller.listarPermissoes);

  return router;
}
