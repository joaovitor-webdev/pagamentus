import { Router } from 'express';
import { IrpjObrigacoesDigitaisController } from '../controllers/IrpjObrigacoesDigitaisController';

/**
 * Rotas HTTP para Memória de Apuração IRPJ e Obrigações Digitais
 * (SPEC-3.22 / RF-044, RF-045)
 */
export function criarIrpjObrigacoesDigitaisRouter(
  controller: IrpjObrigacoesDigitaisController
): Router {
  const router = Router();

  router.post(
    '/empresas/:empresaId/irpj-csll/memorias',
    controller.registrarMemoria
  );
  router.get(
    '/empresas/:empresaId/irpj-csll/memorias',
    controller.listarMemorias
  );
  router.post(
    '/empresas/:empresaId/irpj-csll/obrigacoes-digitais',
    controller.prepararObrigacaoDigital
  );

  return router;
}
