import { Router } from 'express';
import { PortalClienteController } from '../controllers/PortalClienteController';

/**
 * Rotas HTTP para Portal do Cliente (SPEC-4.9 / RF-066)
 */
export function criarPortalClienteRouter(
  controller: PortalClienteController
): Router {
  const router = Router();

  router.post(
    '/portal/clientes/:clienteId/documentos',
    controller.enviarDocumento
  );
  router.get(
    '/portal/clientes/:clienteId/documentos',
    controller.listarDocumentos
  );
  router.post(
    '/portal/clientes/:clienteId/solicitacoes',
    controller.abrirSolicitacao
  );
  router.get(
    '/portal/clientes/:clienteId/solicitacoes',
    controller.listarSolicitacoes
  );
  router.patch(
    '/portal/clientes/:clienteId/solicitacoes/:solicitacaoId/status',
    controller.atualizarStatusSolicitacao
  );

  return router;
}
