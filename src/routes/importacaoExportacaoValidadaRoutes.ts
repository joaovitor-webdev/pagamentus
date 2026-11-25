import { Router } from 'express';
import { ImportacaoExportacaoValidadaController } from '../controllers/ImportacaoExportacaoValidadaController';

export function criarImportacaoExportacaoValidadaRouter(
  controller: ImportacaoExportacaoValidadaController
): Router {
  const router = Router();

  router.post('/dados-validados/pre-visualizar', controller.preVisualizar);
  router.post('/dados-validados/confirmar', controller.confirmar);
  router.get('/dados-validados/lotes/:loteId/original', controller.obterOriginal);
  router.get('/dados-validados/exportar', controller.exportar);

  return router;
}
