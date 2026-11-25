import { Router } from 'express';
import { OrganizacaoDocumentoController } from '../controllers/OrganizacaoDocumentoController';

/**
 * Rotas HTTP para Organização Documental, Checklist e Correções
 * (SPEC-4.10 / RF-067, RF-068)
 */
export function criarOrganizacaoDocumentoRouter(
  controller: OrganizacaoDocumentoController
): Router {
  const router = Router();

  router.post(
    '/portal/clientes/:clienteId/documentos-organizados',
    controller.cadastrar
  );
  router.get(
    '/portal/clientes/:clienteId/documentos-organizados',
    controller.buscar
  );
  router.post(
    '/portal/clientes/:clienteId/documentos-organizados/:docId/comentarios',
    controller.adicionarComentario
  );
  router.patch(
    '/portal/clientes/:clienteId/documentos-organizados/:docId/solicitar-correcao',
    controller.solicitarCorrecao
  );
  router.patch(
    '/portal/clientes/:clienteId/documentos-organizados/:docId/confirmar-recebimento',
    controller.confirmarRecebimento
  );

  return router;
}
