import { Request, Response } from 'express';
import { IrpjObrigacoesDigitaisService } from '../services/IrpjObrigacoesDigitaisService';

/**
 * Controller HTTP para Memória de Apuração IRPJ e Obrigações Digitais
 * (SPEC-3.22 / RF-044, RF-045)
 */
export class IrpjObrigacoesDigitaisController {
  constructor(private readonly service: IrpjObrigacoesDigitaisService) {}

  public registrarMemoria = (req: Request, res: Response): void => {
    try {
      const empresaId = String(req.params.empresaId || '');
      const dados = this.service.registrarMemoria({ empresaId, ...req.body });
      res.status(201).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };

  public listarMemorias = (req: Request, res: Response): void => {
    try {
      const empresaId = String(req.params.empresaId || '');
      const dados = this.service.listarMemorias(empresaId);
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };

  public prepararObrigacaoDigital = (req: Request, res: Response): void => {
    try {
      const empresaId = String(req.params.empresaId || '');
      const dados = this.service.prepararObrigacaoDigital({
        empresaId,
        ...req.body,
      });
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };
}
