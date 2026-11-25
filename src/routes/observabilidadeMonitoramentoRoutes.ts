import { Router } from 'express';
import { ObservabilidadeMonitoramentoController } from '../controllers/ObservabilidadeMonitoramentoController';

export function criarObservabilidadeMonitoramentoRouter(
  controller: ObservabilidadeMonitoramentoController
): Router {
  const router = Router();

  router.get('/health', controller.healthcheck);
  router.get('/observabilidade/metricas', controller.obterMetricas);
  router.get('/observabilidade/alertas', controller.listarAlertas);
  router.post('/observabilidade/alertas', controller.simularAlerta);
  router.get('/observabilidade/traces-erros', controller.listarTracesErros);

  return router;
}
