import { Request, Response } from 'express';
import { TarefaObrigacaoService } from '../services/TarefaObrigacaoService';

/**
 * Controller HTTP para Tarefas e Painel de Obrigações (SPEC-4.7 / RF-062, RF-065)
 */
export class TarefaObrigacaoController {
  constructor(private readonly service: TarefaObrigacaoService) {}

  public criarTarefa = (req: Request, res: Response): void => {
    try {
      const empresaId = String(req.params.empresaId || '');
      const dados = this.service.criarTarefa({ empresaId, ...req.body });
      res.status(201).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };

  public atualizarStatus = (req: Request, res: Response): void => {
    try {
      const empresaId = String(req.params.empresaId || '');
      const tarefaId = String(req.params.tarefaId || '');
      const dados = this.service.atualizarStatus(
        empresaId,
        tarefaId,
        req.body?.status
      );
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res
        .status(erro.statusCode || 400)
        .json({ sucesso: false, erro: erro.message });
    }
  };

  public obterPainel = (req: Request, res: Response): void => {
    try {
      const empresaId = String(req.params.empresaId || '');
      const referencia = String(
        req.query.referencia || new Date().toISOString().slice(0, 10)
      );
      const dados = this.service.obterPainel(empresaId, referencia);
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };
}
