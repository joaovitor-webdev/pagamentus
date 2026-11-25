import { Request, Response } from 'express';
import { PendenciaStatusIrService } from '../services/PendenciaStatusIrService';

/**
 * Controller HTTP para Pendências e Status IRPF (SPEC-3.19 / RF-038, RF-040)
 */
export class PendenciaStatusIrController {
  constructor(private readonly service: PendenciaStatusIrService) {}

  public registrarItem = (req: Request, res: Response): void => {
    try {
      const fichaId = String(req.params.fichaId || '');
      const dados = this.service.registrarItem({ fichaId, ...req.body });
      res.status(201).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };

  public resolverItem = (req: Request, res: Response): void => {
    try {
      const fichaId = String(req.params.fichaId || '');
      const pendenciaId = String(req.params.pendenciaId || '');
      const dados = this.service.resolverItem(fichaId, pendenciaId);
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res
        .status(erro.statusCode || 400)
        .json({ sucesso: false, erro: erro.message });
    }
  };

  public atualizarStatus = (req: Request, res: Response): void => {
    try {
      const fichaId = String(req.params.fichaId || '');
      const dados = this.service.atualizarStatus({ fichaId, ...req.body });
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };

  public obterResumoRevisao = (req: Request, res: Response): void => {
    try {
      const fichaId = String(req.params.fichaId || '');
      const dados = this.service.obterResumoRevisao(fichaId);
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };
}
