import { Router } from 'express';
import { AcessoRetencaoConsentimentoController } from '../controllers/AcessoRetencaoConsentimentoController';

/**
 * Rotas HTTP para Acesso, Retenção e Consentimentos (SPEC-4.11 / RF-069, RF-070)
 */
export function criarAcessoRetencaoConsentimentoRouter(
  controller: AcessoRetencaoConsentimentoController
): Router {
  const router = Router();

  router.post(
    '/portal/clientes/:clienteId/politicas-documentos',
    controller.definirPolitica
  );
  router.post(
    '/portal/clientes/:clienteId/politicas-documentos/:docId/acao',
    controller.executarAcao
  );
  router.post(
    '/portal/clientes/:clienteId/consentimentos',
    controller.registrarConsentimento
  );
  router.get(
    '/portal/clientes/:clienteId/consentimentos',
    controller.listarConsentimentos
  );

  return router;
}
