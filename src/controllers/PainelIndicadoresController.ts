import { Request, Response } from 'express';
import { PainelIndicadoresService } from '../services/PainelIndicadoresService';

/**
 * Controller HTTP para Painéis de Indicadores (SPEC-5.2 / RF-072)
 */
export class PainelIndicadoresController {
  constructor(private readonly service: PainelIndicadoresService) {}

  public registrarBase = (req: Request, res: Response): void => {
    try {
      const empresaId = String(req.params.empresaId || '');
      const dados = this.service.registrarBaseIndicadores({
        empresaId,
        ...req.body,
      });
      res.status(201).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };

  public obterPainel = (req: Request, res: Response): void => {
    try {
      const empresaId = String(req.params.empresaId || '');
      const perfil = String(req.headers['x-perfil-acesso'] || '');
      const periodo = req.query.periodo ? String(req.query.periodo) : undefined;
      const dados = this.service.obterPainel(empresaId, perfil, periodo);
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res
        .status(erro.statusCode || 400)
        .json({ sucesso: false, erro: erro.message });
    }
  };
}
