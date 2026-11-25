import { Router } from 'express';
import { PainelIndicadoresController } from '../controllers/PainelIndicadoresController';

/**
 * Rotas HTTP para Painéis de Indicadores (SPEC-5.2 / RF-072)
 */
export function criarPainelIndicadoresRouter(
  controller: PainelIndicadoresController
): Router {
  const router = Router();

  router.post(
    '/empresas/:empresaId/indicadores/base',
    controller.registrarBase
  );
  router.get('/empresas/:empresaId/indicadores/painel', controller.obterPainel);

  return router;
}
