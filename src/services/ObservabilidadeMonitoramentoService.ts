import { randomUUID } from 'crypto';

export interface AlertaOperacional {
  id: string;
  componente: 'SERVICO_API' | 'FILA_PROCESSAMENTO' | 'INTEGRACAO_EXTERNA' | 'BANCO_DADOS';
  criticidade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  mensagem: string;
  detalhesSanitizados: Record<string, unknown>;
  criadoEm: string;
  resolvido: boolean;
}

export interface MetricasOperacionais {
  uptimeSegundos: number;
  totalRequisicoes: number;
  totalErros: number;
  taxaDisponibilidadePercentual: number;
  metaDisponibilidadePercentual: number;
  statusGeral: 'SAUDAVEL' | 'DEGRADADO' | 'INDISPONIVEL';
  filas: {
    tamanhoFilaLotes: number;
    tamanhoFilaAlertas: number;
  };
  integracoes: {
    receitaWs: 'OPERACIONAL' | 'DEGRADADO' | 'FORA_DO_AR';
    bancoDados: 'OPERACIONAL' | 'DEGRADADO' | 'FORA_DO_AR';
  };
  memoria: {
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
  };
}

export interface RegistroTraceErro {
  traceId: string;
  componente: string;
  erroMensagem: string;
  codigoErro?: string;
  registradoEm: string;
  contextoSanitizado: Record<string, unknown>;
}

const CHAVES_SENSIVEIS = [
  'senha',
  'password',
  'token',
  'authorization',
  'secret',
  'cpf',
  'cnpj',
  'email',
];

export class ObservabilidadeMonitoramentoService {
  private readonly inicioOperacao = Date.now();
  private totalRequisicoes = 0;
  private totalErros = 0;
  private readonly metaDisponibilidade = 99.5; // SLA acordado contratualmente (RNF-005)
  private readonly alertas: AlertaOperacional[] = [];
  private readonly tracesErros: RegistroTraceErro[] = [];

  public registrarRequisicao(status: number): void {
    this.totalRequisicoes += 1;
    if (status >= 500) {
      this.totalErros += 1;
    }
  }

  public sanitizarContexto(dados: Record<string, unknown>): Record<string, unknown> {
    const limpo: Record<string, unknown> = {};
    for (const [chave, valor] of Object.entries(dados)) {
      const normalizada = chave.toLowerCase();
      const ehSensivel = CHAVES_SENSIVEIS.some((s) => normalizada.includes(s));
      if (ehSensivel) {
        limpo[chave] = '[REDACTED]';
      } else if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
        limpo[chave] = this.sanitizarContexto(valor as Record<string, unknown>);
      } else {
        limpo[chave] = valor;
      }
    }
    return limpo;
  }

  public registrarErroComTrace(entrada: {
    componente: string;
    erroMensagem: string;
    codigoErro?: string;
    contexto?: Record<string, unknown>;
  }): RegistroTraceErro {
    const traceId = randomUUID();
    const registro: RegistroTraceErro = {
      traceId,
      componente: entrada.componente,
      erroMensagem: entrada.erroMensagem,
      codigoErro: entrada.codigoErro,
      registradoEm: new Date().toISOString(),
      contextoSanitizado: this.sanitizarContexto(entrada.contexto ?? {}),
    };
    this.tracesErros.push(registro);
    this.totalErros += 1;

    // Se for erro crítico, gera alerta automaticamente
    this.gerarAlerta({
      componente: 'SERVICO_API',
      criticidade: 'ALTA',
      mensagem: `Falha capturada no componente ${entrada.componente}: ${entrada.erroMensagem}`,
      detalhes: { traceId, codigoErro: entrada.codigoErro },
    });

    return registro;
  }

  public gerarAlerta(entrada: {
    componente: AlertaOperacional['componente'];
    criticidade: AlertaOperacional['criticidade'];
    mensagem: string;
    detalhes?: Record<string, unknown>;
  }): AlertaOperacional {
    const alerta: AlertaOperacional = {
      id: randomUUID(),
      componente: entrada.componente,
      criticidade: entrada.criticidade,
      mensagem: entrada.mensagem,
      detalhesSanitizados: this.sanitizarContexto(entrada.detalhes ?? {}),
      criadoEm: new Date().toISOString(),
      resolvido: false,
    };
    this.alertas.push(alerta);
    return alerta;
  }

  public listarAlertas(apenasNaoResolvidos = false): AlertaOperacional[] {
    if (apenasNaoResolvidos) {
      return this.alertas.filter((a) => !a.resolvido);
    }
    return [...this.alertas];
  }

  public resolverAlerta(alertaId: string): boolean {
    const alerta = this.alertas.find((a) => a.id === alertaId);
    if (!alerta) return false;
    alerta.resolvido = true;
    return true;
  }

  public obterMetricas(): MetricasOperacionais {
    const uptimeSegundos = Math.floor((Date.now() - this.inicioOperacao) / 1000);
    const taxaDisponibilidade =
      this.totalRequisicoes === 0
        ? 100
        : Number(
            (
              ((this.totalRequisicoes - this.totalErros) / this.totalRequisicoes) *
              100
            ).toFixed(2)
          );

    const alertasCriticosAtivos = this.alertas.filter(
      (a) => !a.resolvido && (a.criticidade === 'CRITICA' || a.criticidade === 'ALTA')
    ).length;

    let statusGeral: MetricasOperacionais['statusGeral'] = 'SAUDAVEL';
    if (alertasCriticosAtivos > 2 || taxaDisponibilidade < 90) {
      statusGeral = 'INDISPONIVEL';
    } else if (alertasCriticosAtivos > 0 || taxaDisponibilidade < this.metaDisponibilidade) {
      statusGeral = 'DEGRADADO';
    }

    const mem = process.memoryUsage();

    return {
      uptimeSegundos,
      totalRequisicoes: this.totalRequisicoes,
      totalErros: this.totalErros,
      taxaDisponibilidadePercentual: taxaDisponibilidade,
      metaDisponibilidadePercentual: this.metaDisponibilidade,
      statusGeral,
      filas: {
        tamanhoFilaLotes: 0,
        tamanhoFilaAlertas: 0,
      },
      integracoes: {
        receitaWs: 'OPERACIONAL',
        bancoDados: 'OPERACIONAL',
      },
      memoria: {
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
        rssMb: Math.round(mem.rss / 1024 / 1024),
      },
    };
  }

  public obterHealthcheck(): {
    status: 'UP' | 'DOWN';
    timestamp: string;
    uptime: number;
    versao: string;
  } {
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.inicioOperacao) / 1000),
      versao: '1.0.0',
    };
  }

  public listarTracesErros(): RegistroTraceErro[] {
    return [...this.tracesErros];
  }
}
