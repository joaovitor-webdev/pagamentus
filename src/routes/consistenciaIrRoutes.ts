import { Router } from 'express';
import { ConsistenciaIrController } from '../controllers/ConsistenciaIrController';

/**
 * Rotas HTTP para Consistência e Regras do Exercício IRPF (SPEC-3.17 / RF-036, RF-041)
 */
export function criarConsistenciaIrRouter(
  controller: ConsistenciaIrController
): Router {
  const router = Router();

  router.post('/ir/regras-exercicio', controller.cadastrarParametros);
  router.post(
    '/ir/fichas/:fichaId/consistencia',
    controller.conferirConsistencia
  );

  return router;
}
