import { Router } from 'express';
import { PendenciaStatusIrController } from '../controllers/PendenciaStatusIrController';

/**
 * Rotas HTTP para Pendências e Status IRPF (SPEC-3.19 / RF-038, RF-040)
 */
export function criarPendenciaStatusIrRouter(
  controller: PendenciaStatusIrController
): Router {
  const router = Router();

  router.post('/ir/fichas/:fichaId/pendencias', controller.registrarItem);
  router.patch(
    '/ir/fichas/:fichaId/pendencias/:pendenciaId/resolver',
    controller.resolverItem
  );
  router.patch('/ir/fichas/:fichaId/status', controller.atualizarStatus);
  router.get(
    '/ir/fichas/:fichaId/resumo-revisao',
    controller.obterResumoRevisao
  );

  return router;
}
