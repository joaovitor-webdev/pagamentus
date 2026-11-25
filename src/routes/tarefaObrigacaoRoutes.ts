import { Router } from 'express';
import { TarefaObrigacaoController } from '../controllers/TarefaObrigacaoController';

/**
 * Rotas HTTP para Tarefas e Painel de Obrigações (SPEC-4.7 / RF-062, RF-065)
 */
export function criarTarefaObrigacaoRouter(
  controller: TarefaObrigacaoController
): Router {
  const router = Router();

  router.post(
    '/empresas/:empresaId/obrigacoes/tarefas',
    controller.criarTarefa
  );
  router.patch(
    '/empresas/:empresaId/obrigacoes/tarefas/:tarefaId/status',
    controller.atualizarStatus
  );
  router.get('/empresas/:empresaId/obrigacoes/painel', controller.obterPainel);

  return router;
}
