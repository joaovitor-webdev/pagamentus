import { Router } from 'express';
import { DivergenciaFiscalContabilController } from '../controllers/DivergenciaFiscalContabilController';

/**
 * Rotas HTTP para Divergências Fiscais e Contábeis (SPEC-3.10 / RF-024)
 */
export function criarDivergenciaFiscalContabilRouter(
  controller: DivergenciaFiscalContabilController
): Router {
  const router = Router();

  router.post(
    '/empresas/:empresaId/fiscal/divergencias/conferir',
    controller.conferir
  );
  router.get(
    '/empresas/:empresaId/fiscal/divergencias',
    controller.listarHistorico
  );

  return router;
}
