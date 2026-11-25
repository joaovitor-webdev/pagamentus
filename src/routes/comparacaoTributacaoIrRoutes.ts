import { Router } from 'express';
import { ComparacaoTributacaoIrController } from '../controllers/ComparacaoTributacaoIrController';

/**
 * Rotas HTTP para Comparação de Opções de Tributação IRPF (SPEC-3.18 / RF-037)
 */
export function criarComparacaoTributacaoIrRouter(
  controller: ComparacaoTributacaoIrController
): Router {
  const router = Router();

  router.post(
    '/ir/fichas/:fichaId/comparar-tributacao',
    controller.comparar
  );

  return router;
}
