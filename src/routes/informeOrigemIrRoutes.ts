import { Router } from 'express';
import { InformeOrigemIrController } from '../controllers/InformeOrigemIrController';

/**
 * Rotas HTTP para Importação de Informes e Origem dos Dados (SPEC-3.16 / RF-035, RB-005)
 */
export function criarInformeOrigemIrRouter(
  controller: InformeOrigemIrController
): Router {
  const router = Router();

  router.post(
    '/ir/fichas/:fichaId/informes/importar',
    controller.importarArquivo
  );
  router.post('/ir/fichas/:fichaId/informes', controller.registrarAssistido);
  router.patch(
    '/ir/fichas/:fichaId/informes/:informeId/revisar',
    controller.marcarRevisado
  );
  router.get('/ir/fichas/:fichaId/informes', controller.listar);

  return router;
}
