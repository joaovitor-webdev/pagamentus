import { Router } from 'express';
import { IrpjCsllBaseAjustesController } from '../controllers/IrpjCsllBaseAjustesController';

/**
 * Rotas HTTP para IRPJ/CSLL: Base e Ajustes (SPEC-3.21 / RF-042, RF-043)
 */
export function criarIrpjCsllBaseAjustesRouter(
  controller: IrpjCsllBaseAjustesController
): Router {
  const router = Router();

  router.post('/empresas/:empresaId/irpj-csll/base', controller.apurarBase);
  router.get('/empresas/:empresaId/irpj-csll/base', controller.listar);

  return router;
}
