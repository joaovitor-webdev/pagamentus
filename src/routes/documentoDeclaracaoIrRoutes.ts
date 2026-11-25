import { Router } from 'express';
import { DocumentoDeclaracaoIrController } from '../controllers/DocumentoDeclaracaoIrController';

/**
 * Rotas HTTP para Declaração, Recibo e Comprovantes IRPF (SPEC-3.20 / RF-039)
 */
export function criarDocumentoDeclaracaoIrRouter(
  controller: DocumentoDeclaracaoIrController
): Router {
  const router = Router();

  router.post('/ir/fichas/:fichaId/documentos', controller.armazenar);
  router.get('/ir/fichas/:fichaId/documentos', controller.listar);

  return router;
}
