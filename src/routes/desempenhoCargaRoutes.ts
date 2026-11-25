import { Router } from 'express';
import { DesempenhoCargaController } from '../controllers/DesempenhoCargaController';

export function criarDesempenhoCargaRouter(
  controller: DesempenhoCargaController
): Router {
  const router = Router();

  router.post('/desempenho/operacoes-longas', controller.iniciarOperacaoLonga);
  router.put('/desempenho/operacoes-longas/:id/progresso', controller.atualizarProgresso);
  router.get('/desempenho/operacoes-longas/:id', controller.consultarProgresso);
  router.post('/desempenho/avaliar-carga', controller.avaliarCarga);

  return router;
}
