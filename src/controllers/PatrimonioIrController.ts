import { Request, Response } from 'express';
import { PatrimonioIrService } from '../services/PatrimonioIrService';

/**
 * Controller HTTP para Bens, Direitos e Dívidas IRPF (SPEC-3.15 / RF-032)
 */
export class PatrimonioIrController {
  constructor(private readonly service: PatrimonioIrService) {}

  public registrarBem = (req: Request, res: Response): void => {
    try {
      const fichaId = String(req.params.fichaId || '');
      const dados = this.service.registrarBem({ fichaId, ...req.body });
      res.status(201).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };

  public registrarDivida = (req: Request, res: Response): void => {
    try {
      const fichaId = String(req.params.fichaId || '');
      const dados = this.service.registrarDivida({ fichaId, ...req.body });
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
