import { Request, Response } from 'express';
import { ConsistenciaIrService } from '../services/ConsistenciaIrService';

/**
 * Controller HTTP para Consistência e Regras do Exercício IRPF (SPEC-3.17 / RF-036, RF-041)
 */
export class ConsistenciaIrController {
  constructor(private readonly service: ConsistenciaIrService) {}

  public cadastrarParametros = (req: Request, res: Response): void => {
    try {
      const dados = this.service.cadastrarParametrosExercicio(req.body);
      res.status(201).json({ sucesso: true, dados });
    } catch (erro: any) {
      res
        .status(erro.statusCode || 400)
        .json({ sucesso: false, erro: erro.message });
    }
  };

  public conferirConsistencia = (req: Request, res: Response): void => {
    try {
      const fichaId = String(req.params.fichaId || '');
      const dados = this.service.conferirConsistencia(fichaId, req.body);
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res
        .status(erro.statusCode || 400)
        .json({ sucesso: false, erro: erro.message });
    }
  };
}
