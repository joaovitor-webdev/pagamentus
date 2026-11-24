import { Router } from 'express';
import { RevisaoAprovacaoFiscalController } from '../controllers/RevisaoAprovacaoFiscalController';

/**
 * Rotas HTTP para Revisão e Aprovação Profissional (SPEC-3.12 / RF-029, RB-003)
 */
export function criarRevisaoAprovacaoFiscalRouter(
  controller: RevisaoAprovacaoFiscalController
): Router {
  const router = Router();

  router.post(
    '/empresas/:empresaId/fiscal/aprovacoes',
    controller.criarProcesso
  );
  router.get('/empresas/:empresaId/fiscal/aprovacoes', controller.listar);
  router.post(
    '/empresas/:empresaId/fiscal/aprovacoes/:processoId/revisar',
    controller.revisar
  );
  router.post(
    '/empresas/:empresaId/fiscal/aprovacoes/:processoId/finalizar',
    controller.finalizar
  );

  return router;
}
