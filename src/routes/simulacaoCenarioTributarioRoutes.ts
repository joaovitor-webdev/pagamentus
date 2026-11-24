import { Router } from 'express';
import { SimulacaoCenarioTributarioController } from '../controllers/SimulacaoCenarioTributarioController';

/**
 * Rotas HTTP para Simulação de Cenários Tributários (SPEC-3.11 / RF-028)
 */
export function criarSimulacaoCenarioTributarioRouter(
  controller: SimulacaoCenarioTributarioController
): Router {
  const router = Router();

  router.post(
    '/empresas/:empresaId/fiscal/simulacoes',
    controller.simular
  );
  router.get(
    '/empresas/:empresaId/fiscal/simulacoes',
    controller.listarHistorico
  );

  return router;
}
