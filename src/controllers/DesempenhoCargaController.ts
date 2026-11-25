import { Request, Response } from 'express';
import { DesempenhoCargaService } from '../services/DesempenhoCargaService';

export class DesempenhoCargaController {
  constructor(private readonly service: DesempenhoCargaService) {}

  public iniciarOperacaoLonga = (req: Request, res: Response): void => {
    const { tipo, totalEtapas } = req.body;
    if (!tipo) {
      res.status(400).json({
        erro: 'Campo "tipo" é obrigatório para iniciar operação de longa duração.',
        codigo: 'TIPO_OBRIGATORIO',
      });
      return;
    }

    const op = this.service.iniciarOperacaoLonga(tipo, totalEtapas || 4);
    res.status(202).json(op);
  };

  public atualizarProgresso = (req: Request, res: Response): void => {
    const id = String(req.params.id || '');
    const { etapaIndex, etapaDescricao } = req.body;

    if (etapaIndex === undefined || !etapaDescricao) {
      res.status(400).json({
        erro: 'Campos "etapaIndex" e "etapaDescricao" são obrigatórios.',
        codigo: 'PARAMETROS_INVALIDOS',
      });
      return;
    }

    try {
      const op = this.service.atualizarProgresso(id, Number(etapaIndex), String(etapaDescricao));
      res.status(200).json(op);
    } catch (err: unknown) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao atualizar progresso.';
      res.status(404).json({ erro: mensagem });
    }
  };

  public consultarProgresso = (req: Request, res: Response): void => {
    const id = String(req.params.id || '');
    const op = this.service.consultarProgresso(id);

    if (!op) {
      res.status(404).json({ erro: 'Operação não encontrada.' });
      return;
    }

    res.status(200).json(op);
  };

  public avaliarCarga = (req: Request, res: Response): void => {
    const { temposMs, cenario } = req.body;

    if (!Array.isArray(temposMs)) {
      res.status(400).json({
        erro: 'Array de temposMs é obrigatório para avaliação de carga.',
        codigo: 'TEMPOS_INVALIDOS',
      });
      return;
    }

    const metricas = this.service.calcularMetricasCarga(temposMs, cenario);
    res.status(200).json(metricas);
  };
}
