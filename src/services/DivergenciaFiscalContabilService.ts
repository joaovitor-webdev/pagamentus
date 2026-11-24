import * as crypto from 'crypto';
import {
  AlertaDivergenciaFiscal,
  EntradaConferenciaDivergencia,
  ResultadoConferenciaDivergencia,
  TipoDivergenciaFiscal,
} from '../models/DivergenciaFiscalContabilModel';

const REGEX_COMPETENCIA = /^\d{4}-\d{2}$/;

/**
 * Serviço para conferência e alerta de divergências entre documentos fiscais,
 * apuração tributária e contabilidade (SPEC-3.10 / RF-024)
 */
export class DivergenciaFiscalContabilService {
  private historico: ResultadoConferenciaDivergencia[] = [];

  private arredondar(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  private validarNumeroNaoNegativo(valor: number, campo: string): void {
    if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0) {
      throw new Error(`${campo} deve ser um número maior ou igual a zero.`);
    }
  }

  private compararPar(
    tipo: TipoDivergenciaFiscal,
    labelOrigem: string,
    valorOrigem: number,
    labelComparado: string,
    valorComparado: number,
    tolerancia: number
  ): AlertaDivergenciaFiscal | null {
    const diferenca = this.arredondar(Math.abs(valorOrigem - valorComparado));
    if (diferenca <= tolerancia) {
      return null;
    }

    return {
      tipo,
      severidade: diferenca >= 100 ? 'ALTA' : 'MEDIA',
      valorOrigem: this.arredondar(valorOrigem),
      valorComparado: this.arredondar(valorComparado),
      diferenca,
      mensagem: `Divergência entre ${labelOrigem} (${valorOrigem.toFixed(2)}) e ${labelComparado} (${valorComparado.toFixed(2)}): diferença de ${diferenca.toFixed(2)}.`,
    };
  }

  /**
   * Executa a conferência entre documentos fiscais, apuração e contabilidade (CA-1, CA-2, CA-3)
   */
  public conferir(
    empresaId: string,
    entrada: EntradaConferenciaDivergencia
  ): ResultadoConferenciaDivergencia {
    if (!empresaId?.trim()) {
      throw new Error('O identificador da empresa é obrigatório.');
    }
    if (!REGEX_COMPETENCIA.test(entrada.competencia || '')) {
      throw new Error('competencia deve estar no formato YYYY-MM.');
    }

    this.validarNumeroNaoNegativo(
      entrada.totalDocumentosFiscais,
      'totalDocumentosFiscais'
    );
    this.validarNumeroNaoNegativo(
      entrada.totalApuracaoTributaria,
      'totalApuracaoTributaria'
    );
    this.validarNumeroNaoNegativo(
      entrada.totalContabilidade,
      'totalContabilidade'
    );

    const tolerancia = entrada.tolerancia ?? 0;
    this.validarNumeroNaoNegativo(tolerancia, 'tolerancia');

    const alertas: AlertaDivergenciaFiscal[] = [];
    const pares = [
      this.compararPar(
        'DOCUMENTO_X_APURACAO',
        'documentos fiscais',
        entrada.totalDocumentosFiscais,
        'apuração tributária',
        entrada.totalApuracaoTributaria,
        tolerancia
      ),
      this.compararPar(
        'APURACAO_X_CONTABILIDADE',
        'apuração tributária',
        entrada.totalApuracaoTributaria,
        'contabilidade',
        entrada.totalContabilidade,
        tolerancia
      ),
      this.compararPar(
        'DOCUMENTO_X_CONTABILIDADE',
        'documentos fiscais',
        entrada.totalDocumentosFiscais,
        'contabilidade',
        entrada.totalContabilidade,
        tolerancia
      ),
    ];

    for (const alerta of pares) {
      if (alerta) {
        alertas.push(alerta);
      }
    }

    const resultado: ResultadoConferenciaDivergencia = {
      id: crypto.randomUUID(),
      empresaId: empresaId.trim(),
      competencia: entrada.competencia,
      totalDocumentosFiscais: this.arredondar(entrada.totalDocumentosFiscais),
      totalApuracaoTributaria: this.arredondar(entrada.totalApuracaoTributaria),
      totalContabilidade: this.arredondar(entrada.totalContabilidade),
      toleranciaAplicada: this.arredondar(tolerancia),
      possuiDivergencias: alertas.length > 0,
      alertas,
      verificadoEm: new Date(),
    };

    this.historico.push(resultado);
    return resultado;
  }

  public listarHistorico(empresaId: string): ResultadoConferenciaDivergencia[] {
    if (!empresaId?.trim()) {
      throw new Error('O identificador da empresa é obrigatório.');
    }
    return this.historico.filter((h) => h.empresaId === empresaId.trim());
  }

  public limpar(): void {
    this.historico = [];
  }
}
