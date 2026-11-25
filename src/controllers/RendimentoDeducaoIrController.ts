import { Request, Response } from 'express';
import { RendimentoDeducaoIrService } from '../services/RendimentoDeducaoIrService';

/**
 * Controller HTTP para Rendimentos e Deduções IRPF (SPEC-3.14 / RF-031, RF-033)
 */
export class RendimentoDeducaoIrController {
  constructor(private readonly service: RendimentoDeducaoIrService) {}

  public registrarRendimento = (req: Request, res: Response): void => {
    try {
      const fichaId = String(req.params.fichaId || '');
      const dados = this.service.registrarRendimento({ fichaId, ...req.body });
      res.status(201).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };

  public registrarDeducao = (req: Request, res: Response): void => {
    try {
      const fichaId = String(req.params.fichaId || '');
      const dados = this.service.registrarDeducao({ fichaId, ...req.body });
      res.status(201).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };

  public obterResumo = (req: Request, res: Response): void => {
    try {
      const fichaId = String(req.params.fichaId || '');
      const dados = this.service.obterResumo(fichaId);
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };
}
