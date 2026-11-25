import { Request, Response } from 'express';
import { OrigemDadoIr } from '../models/InformeOrigemIrModel';
import { InformeOrigemIrService } from '../services/InformeOrigemIrService';

/**
 * Controller HTTP para Importação de Informes e Origem dos Dados (SPEC-3.16 / RF-035, RB-005)
 */
export class InformeOrigemIrController {
  constructor(private readonly service: InformeOrigemIrService) {}

  public importarArquivo = (req: Request, res: Response): void => {
    try {
      const fichaId = String(req.params.fichaId || '');
      const dados = this.service.importarArquivo({ fichaId, ...req.body });
      res.status(201).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };

  public registrarAssistido = (req: Request, res: Response): void => {
    try {
      const fichaId = String(req.params.fichaId || '');
      const dados = this.service.registrarAssistido({ fichaId, ...req.body });
      res.status(201).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };

  public marcarRevisado = (req: Request, res: Response): void => {
    try {
      const fichaId = String(req.params.fichaId || '');
      const informeId = String(req.params.informeId || '');
      const dados = this.service.marcarRevisado(
        fichaId,
        informeId,
        String(req.body?.revisadoPor || '')
      );
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res
        .status(erro.statusCode || 400)
        .json({ sucesso: false, erro: erro.message });
    }
  };

  public listar = (req: Request, res: Response): void => {
    try {
      const fichaId = String(req.params.fichaId || '');
      const origemAtual = req.query.origem
        ? (String(req.query.origem) as OrigemDadoIr)
        : undefined;
      const exercicio = req.query.exercicio
        ? Number(req.query.exercicio)
        : undefined;
      const dados = this.service.listar(fichaId, origemAtual, exercicio);
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };
}
