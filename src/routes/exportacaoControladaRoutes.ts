import { Router } from 'express';
import { ExportacaoControladaController } from '../controllers/ExportacaoControladaController';

/**
 * Rotas HTTP para Exportação Controlada e Saída de Dados (SPEC-5.4 / RF-073, RNF-015)
 */
export function criarExportacaoControladaRouter(
  controller: ExportacaoControladaController
): Router {
  const router = Router();

  router.post(
    '/portal/clientes/:clienteId/exportacao-controlada',
    controller.exportar
  );
  router.get(
    '/portal/clientes/:clienteId/exportacao-controlada/auditoria',
    controller.listarAuditoria
  );

  return router;
}
