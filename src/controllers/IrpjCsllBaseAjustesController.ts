import { Request, Response } from 'express';
import { IrpjCsllBaseAjustesService } from '../services/IrpjCsllBaseAjustesService';

/**
 * Controller HTTP para IRPJ/CSLL: Base e Ajustes (SPEC-3.21 / RF-042, RF-043)
 */
export class IrpjCsllBaseAjustesController {
  constructor(private readonly service: IrpjCsllBaseAjustesService) {}

  public apurarBase = (req: Request, res: Response): void => {
    try {
      const empresaId = String(req.params.empresaId || '');
      const dados = this.service.apurarBase(empresaId, req.body);
      res.status(201).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };

  public listar = (req: Request, res: Response): void => {
    try {
      const empresaId = String(req.params.empresaId || '');
      const dados = this.service.listar(empresaId);
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };
}
