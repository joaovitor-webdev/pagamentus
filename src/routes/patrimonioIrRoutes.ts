import { Router } from 'express';
import { PatrimonioIrController } from '../controllers/PatrimonioIrController';

/**
 * Rotas HTTP para Bens, Direitos e Dívidas IRPF (SPEC-3.15 / RF-032)
 */
export function criarPatrimonioIrRouter(
  controller: PatrimonioIrController
): Router {
  const router = Router();

  router.post('/ir/fichas/:fichaId/bens', controller.registrarBem);
  router.post('/ir/fichas/:fichaId/dividas', controller.registrarDivida);
  router.get('/ir/fichas/:fichaId/patrimonio', controller.obterResumo);

  return router;
}
