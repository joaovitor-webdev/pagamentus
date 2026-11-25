import { Router } from 'express';
import { RelatorioExportacaoController } from '../controllers/RelatorioExportacaoController';

/**
 * Rotas HTTP para Relatórios em PDF, XLSX e CSV (SPEC-5.3 / RF-071)
 */
export function criarRelatorioExportacaoRouter(
  controller: RelatorioExportacaoController
): Router {
  const router = Router();

  router.post('/relatorios/exportar', controller.gerar);

  return router;
}
