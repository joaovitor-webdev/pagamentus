import { Router } from 'express';
import { AlertaVencimentoController } from '../controllers/AlertaVencimentoController';

/**
 * Rotas HTTP para Alertas de Vencimento e Atraso (SPEC-4.8 / RF-063, RB-009)
 */
export function criarAlertaVencimentoRouter(
  controller: AlertaVencimentoController
): Router {
  const router = Router();

  router.post(
    '/empresas/:empresaId/obrigacoes/alertas/processar',
    controller.processarAlertas
  );
  router.get(
    '/empresas/:empresaId/obrigacoes/alertas',
    controller.listarAlertas
  );

  return router;
}
