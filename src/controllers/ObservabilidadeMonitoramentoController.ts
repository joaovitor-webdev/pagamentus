import { Request, Response } from 'express';
import { ObservabilidadeMonitoramentoService } from '../services/ObservabilidadeMonitoramentoService';

const PERFIS_OPERACIONAIS = ['ADMINISTRADOR', 'AUDITOR', 'OPERADOR'];

export class ObservabilidadeMonitoramentoController {
  constructor(private readonly service: ObservabilidadeMonitoramentoService) {}

  public healthcheck = (_req: Request, res: Response): void => {
    const health = this.service.obterHealthcheck();
    res.status(200).json(health);
  };

  public obterMetricas = (req: Request, res: Response): void => {
    const perfil = String(req.headers['x-perfil-usuario'] || '').toUpperCase();
    if (!PERFIS_OPERACIONAIS.includes(perfil)) {
      res.status(403).json({
        erro: 'Acesso negado: perfil sem permissão para acessar métricas operacionais.',
        codigo: 'ACESSO_NEGADO',
      });
      return;
    }
    const metricas = this.service.obterMetricas();
    res.status(200).json(metricas);
  };

  public listarAlertas = (req: Request, res: Response): void => {
    const perfil = String(req.headers['x-perfil-usuario'] || '').toUpperCase();
    if (!PERFIS_OPERACIONAIS.includes(perfil)) {
      res.status(403).json({
        erro: 'Acesso negado: perfil sem permissão para consultar alertas.',
        codigo: 'ACESSO_NEGADO',
      });
      return;
    }
    const apenasPendentes = req.query.pendentes === 'true';
    const alertas = this.service.listarAlertas(apenasPendentes);
    res.status(200).json({ total: alertas.length, alertas });
  };

  public simularAlerta = (req: Request, res: Response): void => {
    const perfil = String(req.headers['x-perfil-usuario'] || '').toUpperCase();
    if (!PERFIS_OPERACIONAIS.includes(perfil)) {
      res.status(403).json({
        erro: 'Acesso negado: perfil sem permissão para simular alertas.',
        codigo: 'ACESSO_NEGADO',
      });
      return;
    }

    const { componente, criticidade, mensagem, detalhes } = req.body;
    if (!componente || !criticidade || !mensagem) {
      res.status(400).json({
        erro: 'Campos obrigatórios: componente, criticidade, mensagem.',
        codigo: 'PARAMETROS_INVALIDOS',
      });
      return;
    }

    const alerta = this.service.gerarAlerta({
      componente,
      criticidade,
      mensagem,
      detalhes,
    });

    res.status(201).json(alerta);
  };

  public listarTracesErros = (req: Request, res: Response): void => {
    const perfil = String(req.headers['x-perfil-usuario'] || '').toUpperCase();
    if (!PERFIS_OPERACIONAIS.includes(perfil)) {
      res.status(403).json({
        erro: 'Acesso negado: perfil sem permissão para consultar traces de erros.',
        codigo: 'ACESSO_NEGADO',
      });
      return;
    }

    const traces = this.service.listarTracesErros();
    res.status(200).json({ total: traces.length, traces });
  };
}
