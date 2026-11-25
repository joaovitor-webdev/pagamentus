import * as crypto from 'crypto';
import {
  CanalNotificacaoAlerta,
  EntradaProcessamentoAlertas,
  RegistroAlertaPrazo,
} from '../models/AlertaVencimentoModel';

const CANAIS_VALIDOS: CanalNotificacaoAlerta[] = [
  'EMAIL',
  'SISTEMA',
  'WEBHOOK',
];
const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/;
const AVISO_RB009 =
  'Aviso auxiliar (RB-009): este alerta não substitui a confirmação do prazo oficial aplicável pelo responsável.';

/**
 * Serviço para geração e registro de entrega de alertas de vencimento e atraso
 * (SPEC-4.8 / RF-063, RB-009)
 */
export class AlertaVencimentoService {
  private registros: RegistroAlertaPrazo[] = [];

  private diferencaDias(dataRef: string, prazo: string): number {
    const tRef = Date.parse(`${dataRef}T00:00:00Z`);
    const tPrazo = Date.parse(`${prazo}T00:00:00Z`);
    return Math.round((tPrazo - tRef) / (1000 * 60 * 60 * 24));
  }

  public processarAlertas(
    empresaId: string,
    entrada: EntradaProcessamentoAlertas
  ): RegistroAlertaPrazo[] {
    if (!empresaId?.trim()) {
      throw new Error('empresaId é obrigatório.');
    }
    if (!REGEX_DATA.test(entrada.dataReferencia || '')) {
      throw new Error('dataReferencia deve estar no formato YYYY-MM-DD.');
    }
    if (
      typeof entrada.diasAntecedencia !== 'number' ||
      !Number.isFinite(entrada.diasAntecedencia) ||
      entrada.diasAntecedencia < 0
    ) {
      throw new Error('diasAntecedencia deve ser >= 0.');
    }
    if (!Array.isArray(entrada.canais) || entrada.canais.length === 0) {
      throw new Error('Informe ao menos um canal de notificação.');
    }
    for (const canal of entrada.canais) {
      if (!CANAIS_VALIDOS.includes(canal)) {
        throw new Error(`Canal inválido: ${canal}.`);
      }
    }

    const gerados: RegistroAlertaPrazo[] = [];
    for (const obr of entrada.obrigacoes ?? []) {
      if (obr.entregue) continue;
      if (!REGEX_DATA.test(obr.prazo || '')) {
        throw new Error('prazo da obrigação deve estar no formato YYYY-MM-DD.');
      }
      const dias = this.diferencaDias(entrada.dataReferencia, obr.prazo);
      let tipoAlerta: 'VENCIMENTO_PROXIMO' | 'ATRASO' | null = null;
      if (dias < 0) {
        tipoAlerta = 'ATRASO';
      } else if (dias <= entrada.diasAntecedencia) {
        tipoAlerta = 'VENCIMENTO_PROXIMO';
      }
      if (!tipoAlerta) continue;

      for (const canal of entrada.canais) {
        const reg: RegistroAlertaPrazo = {
          id: crypto.randomUUID(),
          empresaId: empresaId.trim(),
          tituloObrigacao: obr.titulo.trim(),
          responsavel: obr.responsavel.trim(),
          prazo: obr.prazo,
          tipoAlerta,
          canal,
          statusEntrega: 'ENTREGUE',
          avisoResponsabilidade: AVISO_RB009,
          enviadoEm: new Date(),
        };
        this.registros.push(reg);
        gerados.push(reg);
      }
    }

    return gerados;
  }

  public listarAlertas(empresaId: string): RegistroAlertaPrazo[] {
    return this.registros.filter((r) => r.empresaId === empresaId.trim());
  }

  public limpar(): void {
    this.registros = [];
  }
}
