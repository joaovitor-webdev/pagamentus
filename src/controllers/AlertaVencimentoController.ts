import { Request, Response } from 'express';
import { AlertaVencimentoService } from '../services/AlertaVencimentoService';

/**
 * Controller HTTP para Alertas de Vencimento e Atraso (SPEC-4.8 / RF-063, RB-009)
 */
export class AlertaVencimentoController {
  constructor(private readonly service: AlertaVencimentoService) {}

  public processarAlertas = (req: Request, res: Response): void => {
    try {
      const empresaId = String(req.params.empresaId || '');
      const dados = this.service.processarAlertas(empresaId, req.body);
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };

  public listarAlertas = (req: Request, res: Response): void => {
    try {
      const empresaId = String(req.params.empresaId || '');
      const dados = this.service.listarAlertas(empresaId);
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };
}
