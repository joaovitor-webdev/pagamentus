import { Request, Response } from 'express';
import { SimulacaoCenarioTributarioService } from '../services/SimulacaoCenarioTributarioService';

/**
 * Controller HTTP para Simulação de Cenários Tributários (SPEC-3.11 / RF-028)
 */
export class SimulacaoCenarioTributarioController {
  constructor(private readonly service: SimulacaoCenarioTributarioService) {}

  public simular = (req: Request, res: Response): void => {
    try {
      const empresaId = String(req.params.empresaId || '');
      const dados = this.service.simular(empresaId, req.body);
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
