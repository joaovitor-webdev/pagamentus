import { Router } from 'express';
import { FichaContribuinteIrController } from '../controllers/FichaContribuinteIrController';

/**
 * Rotas HTTP para Ficha do Contribuinte e Dependentes (SPEC-3.13 / RF-030, RF-034)
 */
export function criarFichaContribuinteIrRouter(
  controller: FichaContribuinteIrController
): Router {
  const router = Router();

  router.post('/ir/fichas', controller.criarFicha);
  router.get('/ir/fichas/:fichaId', controller.buscarFicha);
  router.post('/ir/fichas/:fichaId/dependentes', controller.adicionarDependente);

  return router;
}
