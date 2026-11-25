import * as crypto from 'crypto';
import {
  FormatoInformeIr,
  OrigemDadoIr,
  RegistroInformeIr,
} from '../models/InformeOrigemIrModel';

const ORIGENS_VALIDAS: OrigemDadoIr[] = [
  'INFORMADO_CLIENTE',
  'IMPORTADO',
  'CALCULADO_SISTEMA',
  'REVISADO_PROFISSIONAL',
];

/**
 * Serviço para importação de informes e controle de origem dos dados IRPF
 * (SPEC-3.16 / RF-035, RB-005)
 */
export class InformeOrigemIrService {
  private registros: RegistroInformeIr[] = [];

  private arredondar(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  private validarExercicio(exercicio: number): void {
    if (!Number.isInteger(exercicio) || exercicio < 2000 || exercicio > 2100) {
      throw new Error('exercicio deve ser um ano fiscal válido.');
    }
  }

  /**
   * Importa informes a partir de conteúdo CSV ou JSON preservando o original (CA-1 e CA-3)
   */
  public importarArquivo(dados: {
    fichaId: string;
    exercicio: number;
    formato: FormatoInformeIr;
    conteudo: string;
  }): RegistroInformeIr[] {
    if (!dados.fichaId?.trim() || !dados.conteudo?.trim()) {
      throw new Error('fichaId e conteudo são obrigatórios.');
    }
    this.validarExercicio(dados.exercicio);
    if (dados.formato !== 'JSON' && dados.formato !== 'CSV') {
      throw new Error("formato incompatível: utilize 'JSON' ou 'CSV'.");
    }

    const itensBrutos: Array<{
      fontePagadora: string;
      rendimentoTributavel: number;
      irRetido: number;
    }> = [];

    if (dados.formato === 'JSON') {
      let parsed: any;
      try {
        parsed = JSON.parse(dados.conteudo);
      } catch {
        throw new Error('Conteúdo JSON inválido.');
      }
      const lista = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of lista) {
        if (
          !item.fontePagadora ||
          typeof item.rendimentoTributavel !== 'number'
        ) {
          throw new Error(
            'Cada item JSON deve possuir fontePagadora e rendimentoTributavel numérico.'
          );
        }
        itensBrutos.push({
          fontePagadora: String(item.fontePagadora),
          rendimentoTributavel: item.rendimentoTributavel,
          irRetido: Number(item.irRetido ?? 0),
        });
      }
    } else {
      const linhas = dados.conteudo
        .trim()
        .split(/\r?\n/)
        .filter((l) => l.trim().length > 0);
      if (linhas.length < 2) {
        throw new Error(
          'CSV deve conter cabeçalho e ao menos uma linha de dados.'
        );
      }
      for (let i = 1; i < linhas.length; i++) {
        const [fonte, rendStr, irStr] = linhas[i].split(';');
        const rend = Number(rendStr);
        const ir = Number(irStr ?? 0);
        if (!fonte?.trim() || !Number.isFinite(rend) || !Number.isFinite(ir)) {
          throw new Error(`Linha ${i + 1} do CSV inválida.`);
        }
        itensBrutos.push({
          fontePagadora: fonte.trim(),
          rendimentoTributavel: rend,
          irRetido: ir,
        });
      }
    }

    const salvos: RegistroInformeIr[] = [];
    for (const item of itensBrutos) {
      const reg: RegistroInformeIr = {
        id: crypto.randomUUID(),
        fichaId: dados.fichaId.trim(),
        exercicio: dados.exercicio,
        fontePagadora: item.fontePagadora.trim(),
        rendimentoTributavel: this.arredondar(item.rendimentoTributavel),
        irRetido: this.arredondar(item.irRetido),
        origemInicial: 'IMPORTADO',
        origemAtual: 'IMPORTADO',
        formatoArquivo: dados.formato,
        conteudoOriginal: dados.conteudo,
        criadoEm: new Date(),
      };
      this.registros.push(reg);
      salvos.push(reg);
    }

    return salvos;
  }

  /**
   * Registra informe via digitação assistida com origem explícita (CA-2 e CA-3)
   */
  public registrarAssistido(dados: {
    fichaId: string;
    exercicio: number;
    fontePagadora: string;
    rendimentoTributavel: number;
    irRetido?: number;
    origemDado: OrigemDadoIr;
  }): RegistroInformeIr {
    if (!dados.fichaId?.trim() || !dados.fontePagadora?.trim()) {
      throw new Error('fichaId e fontePagadora são obrigatórios.');
    }
    this.validarExercicio(dados.exercicio);
    if (!ORIGENS_VALIDAS.includes(dados.origemDado)) {
      throw new Error('origemDado inválida (RB-005).');
    }
    if (
      typeof dados.rendimentoTributavel !== 'number' ||
      !Number.isFinite(dados.rendimentoTributavel) ||
      dados.rendimentoTributavel < 0
    ) {
      throw new Error('rendimentoTributavel inválido.');
    }

    const reg: RegistroInformeIr = {
      id: crypto.randomUUID(),
      fichaId: dados.fichaId.trim(),
      exercicio: dados.exercicio,
      fontePagadora: dados.fontePagadora.trim(),
      rendimentoTributavel: this.arredondar(dados.rendimentoTributavel),
      irRetido: this.arredondar(dados.irRetido ?? 0),
      origemInicial: dados.origemDado,
      origemAtual: dados.origemDado,
      criadoEm: new Date(),
    };
    this.registros.push(reg);
    return reg;
  }

  /**
   * Marca registro como revisado pelo profissional preservando origem inicial (CA-2)
   */
  public marcarRevisado(
    fichaId: string,
    informeId: string,
    revisadoPor: string
  ): RegistroInformeIr {
    const reg = this.registros.find(
      (r) => r.fichaId === fichaId.trim() && r.id === informeId.trim()
    );
    if (!reg) {
      const erro = new Error('Registro de informe não encontrado.') as Error & {
        statusCode?: number;
      };
      erro.statusCode = 404;
      throw erro;
    }
    if (!revisadoPor?.trim()) {
      throw new Error('revisadoPor é obrigatório.');
    }
    reg.origemAtual = 'REVISADO_PROFISSIONAL';
    reg.revisadoPor = revisadoPor.trim();
    return reg;
  }

  public listar(
    fichaId: string,
    origemAtual?: OrigemDadoIr,
    exercicio?: number
  ): RegistroInformeIr[] {
    return this.registros.filter(
      (r) =>
        r.fichaId === fichaId.trim() &&
        (!origemAtual || r.origemAtual === origemAtual) &&
        (!exercicio || r.exercicio === exercicio)
    );
  }

  public limpar(): void {
    this.registros = [];
  }
}
