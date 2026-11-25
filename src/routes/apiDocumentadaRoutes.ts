import { Router } from 'express';
import { ApiDocumentadaController } from '../controllers/ApiDocumentadaController';

export function criarApiDocumentadaRouter(
  controller: ApiDocumentadaController
): Router {
  const router = Router();

  router.get('/docs/openapi.json', controller.obterOpenApi);
  router.get('/docs', controller.obterPaginaDocs);
  router.get('/docs/logs', controller.listarLogs);

  return router;
}
