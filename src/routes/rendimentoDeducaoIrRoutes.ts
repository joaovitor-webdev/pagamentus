import { Router } from 'express';
import { RendimentoDeducaoIrController } from '../controllers/RendimentoDeducaoIrController';

/**
 * Rotas HTTP para Rendimentos e Deduções IRPF (SPEC-3.14 / RF-031, RF-033)
 */
export function criarRendimentoDeducaoIrRouter(
  controller: RendimentoDeducaoIrController
): Router {
  const router = Router();

  router.post('/ir/fichas/:fichaId/rendimentos', controller.registrarRendimento);
  router.post('/ir/fichas/:fichaId/deducoes', controller.registrarDeducao);
  router.get('/ir/fichas/:fichaId/rendimentos-deducoes', controller.obterResumo);

  return router;
}
