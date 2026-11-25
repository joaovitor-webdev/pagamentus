import { Request, Response } from 'express';
import { FichaContribuinteIrService } from '../services/FichaContribuinteIrService';

/**
 * Controller HTTP para Ficha do Contribuinte e Dependentes (SPEC-3.13 / RF-030, RF-034)
 */
export class FichaContribuinteIrController {
  constructor(private readonly service: FichaContribuinteIrService) {}

  public criarFicha = (req: Request, res: Response): void => {
    try {
      const dados = this.service.criarFicha(req.body);
      res.status(201).json({ sucesso: true, dados });
    } catch (erro: any) {
      res
        .status(erro.statusCode || 400)
        .json({ sucesso: false, erro: erro.message });
    }
  };

  public buscarFicha = (req: Request, res: Response): void => {
    try {
      const fichaId = String(req.params.fichaId || '');
      const dados = this.service.buscarPorId(fichaId);
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res
        .status(erro.statusCode || 400)
        .json({ sucesso: false, erro: erro.message });
    }
  };

  public adicionarDependente = (req: Request, res: Response): void => {
    try {
      const fichaId = String(req.params.fichaId || '');
      const dados = this.service.adicionarDependente(fichaId, req.body);
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res
        .status(erro.statusCode || 400)
        .json({ sucesso: false, erro: erro.message });
    }
  };
}
