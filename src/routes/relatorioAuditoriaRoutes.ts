import { Router } from 'express';
import { RelatorioAuditoriaController } from '../controllers/RelatorioAuditoriaController';

/**
 * Rotas HTTP para Relatórios de Auditoria (SPEC-5.5 / RF-074)
 */
export function criarRelatorioAuditoriaRouter(
  controller: RelatorioAuditoriaController
): Router {
  const router = Router();

  router.post(
    '/empresas/:empresaId/auditoria/eventos',
    controller.registrarEvento
  );
  router.get(
    '/empresas/:empresaId/auditoria/relatorio',
    controller.gerarRelatorio
  );

  return router;
}
