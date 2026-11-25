import { Request, Response } from 'express';
import { RelatorioAuditoriaService } from '../services/RelatorioAuditoriaService';

/**
 * Controller HTTP para Relatórios de Auditoria (SPEC-5.5 / RF-074)
 */
export class RelatorioAuditoriaController {
  constructor(private readonly service: RelatorioAuditoriaService) {}

  public registrarEvento = (req: Request, res: Response): void => {
    try {
      const empresaId = String(req.params.empresaId || '');
      const dados = this.service.registrarEvento({ empresaId, ...req.body });
      res.status(201).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };

  public gerarRelatorio = (req: Request, res: Response): void => {
    try {
      const empresaId = String(req.params.empresaId || '');
      const perfilAcesso = String(req.headers['x-perfil-acesso'] || '');
      const dados = this.service.gerarRelatorio({
        empresaId,
        perfilAcesso,
        usuario: req.query.usuario ? String(req.query.usuario) : undefined,
        modulo: req.query.modulo ? String(req.query.modulo) : undefined,
        acao: req.query.acao ? String(req.query.acao) : undefined,
        dataInicio: req.query.dataInicio
          ? String(req.query.dataInicio)
          : undefined,
        dataFim: req.query.dataFim ? String(req.query.dataFim) : undefined,
      });
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res
        .status(erro.statusCode || 400)
        .json({ sucesso: false, erro: erro.message });
    }
  };
}
