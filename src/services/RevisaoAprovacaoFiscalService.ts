import * as crypto from 'crypto';
import {
  DecisaoRevisaoFiscal,
  ProcessoAprovacaoFiscal,
  TipoProcessoFiscal,
} from '../models/RevisaoAprovacaoFiscalModel';

const PERFIS_AUTORIZADOS = new Set([
  'CONTADOR',
  'RESPONSAVEL_FISCAL',
  'AUDITOR_APROVADOR',
]);
const TIPOS_VALIDOS: TipoProcessoFiscal[] = [
  'APURACAO',
  'OBRIGACAO',
  'DECLARACAO',
];
const REGEX_COMPETENCIA = /^\d{4}-\d{2}$/;

/**
 * Serviço para revisão e aprovação profissional obrigatória antes de finalizar
 * apurações, obrigações ou declarações (SPEC-3.12 / RF-029, RB-003)
 */
export class RevisaoAprovacaoFiscalService {
  private processos: ProcessoAprovacaoFiscal[] = [];

  private criarErro(mensagem: string, statusCode: number): Error {
    const erro = new Error(mensagem) as Error & { statusCode?: number };
    erro.statusCode = statusCode;
    return erro;
  }

  public criarProcesso(dados: {
    empresaId: string;
    tipo: TipoProcessoFiscal;
    competencia: string;
    referencia: string;
  }): ProcessoAprovacaoFiscal {
    if (!dados.empresaId?.trim() || !dados.referencia?.trim()) {
      throw this.criarErro('empresaId e referencia são obrigatórios.', 400);
    }
    if (!TIPOS_VALIDOS.includes(dados.tipo)) {
      throw this.criarErro(
        "tipo deve ser 'APURACAO', 'OBRIGACAO' ou 'DECLARACAO'.",
        400
      );
    }
    if (!REGEX_COMPETENCIA.test(dados.competencia || '')) {
      throw this.criarErro('competencia deve estar no formato YYYY-MM.', 400);
    }

    const processo: ProcessoAprovacaoFiscal = {
      id: crypto.randomUUID(),
      empresaId: dados.empresaId.trim(),
      tipo: dados.tipo,
      competencia: dados.competencia,
      referencia: dados.referencia.trim(),
      status: 'EM_REVISAO',
      revisoes: [],
      criadoEm: new Date(),
    };

    this.processos.push(processo);
    return processo;
  }

  /**
   * Registra revisão e aprovação/rejeição exclusivamente por profissional autorizado (CA-1 e CA-3)
   */
  public revisar(
    empresaId: string,
    processoId: string,
    dados: {
      profissionalId: string;
      perfil: string;
      registroProfissional: string;
      decisao: DecisaoRevisaoFiscal;
      parecer: string;
    }
  ): ProcessoAprovacaoFiscal {
    const processo = this.processos.find(
      (p) => p.empresaId === empresaId.trim() && p.id === processoId.trim()
    );
    if (!processo) {
      throw this.criarErro('Processo fiscal não encontrado.', 404);
    }
    if (processo.status === 'FINALIZADA') {
      throw this.criarErro(
        'Processo já finalizado não pode ser revisado novamente.',
        400
      );
    }

    const perfilNorm = (dados.perfil || '').trim().toUpperCase();
    if (!PERFIS_AUTORIZADOS.has(perfilNorm)) {
      throw this.criarErro(
        'Usuário sem perfil profissional autorizado para aprovar/revisar apuração ou obrigação (RB-003).',
        403
      );
    }
    if (
      !dados.profissionalId?.trim() ||
      !dados.registroProfissional?.trim() ||
      !dados.parecer?.trim()
    ) {
      throw this.criarErro(
        'profissionalId, registroProfissional e parecer são obrigatórios.',
        400
      );
    }
    if (dados.decisao !== 'APROVAR' && dados.decisao !== 'REJEITAR') {
      throw this.criarErro("decisao deve ser 'APROVAR' ou 'REJEITAR'.", 400);
    }

    processo.revisoes.push({
      profissionalId: dados.profissionalId.trim(),
      perfil: perfilNorm,
      registroProfissional: dados.registroProfissional.trim(),
      decisao: dados.decisao,
      parecer: dados.parecer.trim(),
      revisadoEm: new Date(),
    });
    processo.status = dados.decisao === 'APROVAR' ? 'APROVADA' : 'REJEITADA';

    return processo;
  }

  /**
   * Finaliza o processo somente após revisão e aprovação prévia (CA-1 e CA-2)
   */
  public finalizar(
    empresaId: string,
    processoId: string
  ): ProcessoAprovacaoFiscal {
    const processo = this.processos.find(
      (p) => p.empresaId === empresaId.trim() && p.id === processoId.trim()
    );
    if (!processo) {
      throw this.criarErro('Processo fiscal não encontrado.', 404);
    }
    if (processo.status !== 'APROVADA') {
      throw this.criarErro(
        'Não é permitido finalizar apuração ou obrigação sem revisão e aprovação prévia de profissional autorizado (RF-029 / RB-003).',
        400
      );
    }

    processo.status = 'FINALIZADA';
    processo.finalizadoEm = new Date();
    return processo;
  }

  public listar(empresaId: string): ProcessoAprovacaoFiscal[] {
    if (!empresaId?.trim()) {
      throw this.criarErro('O identificador da empresa é obrigatório.', 400);
    }
    return this.processos.filter((p) => p.empresaId === empresaId.trim());
  }

  public limpar(): void {
    this.processos = [];
  }
}
