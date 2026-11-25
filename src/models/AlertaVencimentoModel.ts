/**
 * Modelos de Domínio para Alertas de Vencimento e Atraso (SPEC-4.8 / RF-063, RB-009)
 */

export type CanalNotificacaoAlerta = 'EMAIL' | 'SISTEMA' | 'WEBHOOK';

export type TipoAlertaPrazo = 'VENCIMENTO_PROXIMO' | 'ATRASO';

export interface ItemObrigacaoAlerta {
  titulo: string;
  responsavel: string;
  prazo: string; // YYYY-MM-DD
  entregue?: boolean;
}

export interface EntradaProcessamentoAlertas {
  dataReferencia: string; // YYYY-MM-DD
  diasAntecedencia: number;
  canais: CanalNotificacaoAlerta[];
  obrigacoes: ItemObrigacaoAlerta[];
}

export interface RegistroAlertaPrazo {
  id: string;
  empresaId: string;
  tituloObrigacao: string;
  responsavel: string;
  prazo: string;
  tipoAlerta: TipoAlertaPrazo;
  canal: CanalNotificacaoAlerta;
  statusEntrega: 'ENTREGUE';
  avisoResponsabilidade: string;
  enviadoEm: Date;
}
