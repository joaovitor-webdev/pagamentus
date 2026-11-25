import * as crypto from 'crypto';
import {
  ItemPendenciaIr,
  ResumoRevisaoContribuinteIr,
  StatusDeclaracaoIr,
  TipoItemPendenciaIr,
  TransicaoStatusIr,
} from '../models/PendenciaStatusIrModel';

const STATUS_VALIDOS: StatusDeclaracaoIr[] = [
  'EM_PREPARACAO',
  'EM_REVISAO',
  'AUTORIZADA',
  'TRANSMITIDA_EXTERNA',
  'TRANSMITIDA_INTEGRACAO',
  'RETIFICACAO',
  'COM_PENDENCIAS',
];

const TIPOS_ITEM_VALIDOS: TipoItemPendenciaIr[] = [
  'DOCUMENTO_FALTANTE',
  'PENDENCIA',
  'ALERTA',
];

/**
 * Serviço para controle de pendências, alertas e status da declaração IRPF
 * (SPEC-3.19 / RF-038, RF-040)
 */
export class PendenciaStatusIrService {
  private itens: ItemPendenciaIr[] = [];
  private historicoPorFicha = new Map<string, TransicaoStatusIr[]>();

  public registrarItem(dados: {
    fichaId: string;
    tipo: TipoItemPendenciaIr;
    descricao: string;
  }): ItemPendenciaIr {
    if (!dados.fichaId?.trim() || !dados.descricao?.trim()) {
      throw new Error('fichaId e descricao são obrigatórios.');
    }
    if (!TIPOS_ITEM_VALIDOS.includes(dados.tipo)) {
      throw new Error(
        "tipo deve ser 'DOCUMENTO_FALTANTE', 'PENDENCIA' ou 'ALERTA'."
      );
    }

    const item: ItemPendenciaIr = {
      id: crypto.randomUUID(),
      fichaId: dados.fichaId.trim(),
      tipo: dados.tipo,
      descricao: dados.descricao.trim(),
      resolvida: false,
      criadoEm: new Date(),
    };
    this.itens.push(item);
    return item;
  }

  public resolverItem(fichaId: string, pendenciaId: string): ItemPendenciaIr {
    const item = this.itens.find(
      (i) => i.fichaId === fichaId.trim() && i.id === pendenciaId.trim()
    );
    if (!item) {
      const erro = new Error('Pendência não encontrada.') as Error & {
        statusCode?: number;
      };
      erro.statusCode = 404;
      throw erro;
    }
    item.resolvida = true;
    item.resolvidaEm = new Date();
    return item;
  }

  public atualizarStatus(dados: {
    fichaId: string;
    status: StatusDeclaracaoIr;
    alteradoPor: string;
    observacao?: string;
  }): TransicaoStatusIr {
    if (!dados.fichaId?.trim() || !dados.alteradoPor?.trim()) {
      throw new Error('fichaId e alteradoPor são obrigatórios.');
    }
    if (!STATUS_VALIDOS.includes(dados.status)) {
      throw new Error('Status da declaração inválido.');
    }

    const transicao: TransicaoStatusIr = {
      status: dados.status,
      observacao: dados.observacao?.trim(),
      alteradoPor: dados.alteradoPor.trim(),
      alteradoEm: new Date(),
    };

    const id = dados.fichaId.trim();
    const lista = this.historicoPorFicha.get(id) ?? [];
    lista.push(transicao);
    this.historicoPorFicha.set(id, lista);
    return transicao;
  }

  public obterResumoRevisao(fichaId: string): ResumoRevisaoContribuinteIr {
    if (!fichaId?.trim()) {
      throw new Error('fichaId é obrigatório.');
    }
    const id = fichaId.trim();
    const historicoStatus = this.historicoPorFicha.get(id) ?? [];
    const statusAtual: StatusDeclaracaoIr =
      historicoStatus.length > 0
        ? historicoStatus[historicoStatus.length - 1].status
        : 'EM_PREPARACAO';

    const abertos = this.itens.filter((i) => i.fichaId === id && !i.resolvida);

    return {
      fichaId: id,
      statusAtual,
      documentosFaltantes: abertos.filter(
        (i) => i.tipo === 'DOCUMENTO_FALTANTE'
      ),
      pendenciasAbertas: abertos.filter((i) => i.tipo === 'PENDENCIA'),
      alertas: abertos.filter((i) => i.tipo === 'ALERTA'),
      historicoStatus,
    };
  }

  public limpar(): void {
    this.itens = [];
    this.historicoPorFicha.clear();
  }
}
