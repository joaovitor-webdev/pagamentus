import { Request, Response } from 'express';
import { DivergenciaFiscalContabilService } from '../services/DivergenciaFiscalContabilService';

/**
 * Controller HTTP para Divergências Fiscais e Contábeis (SPEC-3.10 / RF-024)
 */
export class DivergenciaFiscalContabilController {
  constructor(private readonly service: DivergenciaFiscalContabilService) {}

  public conferir = (req: Request, res: Response): void => {
    try {
      const empresaId = String(req.params.empresaId || '');
      const dados = this.service.conferir(empresaId, req.body);
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };

  public listarHistorico = (req: Request, res: Response): void => {
    try {
      const empresaId = String(req.params.empresaId || '');
      const dados = this.service.listarHistorico(empresaId);
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };
}
