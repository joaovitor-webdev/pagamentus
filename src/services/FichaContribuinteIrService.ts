import * as crypto from 'crypto';
import {
  AlimentandoIr,
  DadosBancariosContribuinte,
  DependenteIr,
  EnderecoContribuinte,
  FichaContribuinteIr,
} from '../models/FichaContribuinteIrModel';

const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Serviço para Ficha do Contribuinte e Controle de Dependentes (SPEC-3.13 / RF-030, RF-034)
 */
export class FichaContribuinteIrService {
  private fichas: FichaContribuinteIr[] = [];

  private criarErro(mensagem: string, statusCode: number): Error {
    const erro = new Error(mensagem) as Error & { statusCode?: number };
    erro.statusCode = statusCode;
    return erro;
  }

  private normalizarDoc(doc: string): string {
    return (doc || '').replace(/\s+/g, '').toUpperCase();
  }

  private verificarDuplicidadeDependente(
    exercicio: number,
    documentoDependente: string
  ): void {
    const docNorm = this.normalizarDoc(documentoDependente);
    for (const ficha of this.fichas) {
      if (ficha.exercicio !== exercicio) continue;
      const existente = ficha.dependentes.find(
        (d) => this.normalizarDoc(d.documento) === docNorm
      );
      if (existente) {
        throw this.criarErro(
          `Duplicidade identificada: dependente '${docNorm}' já incluído na declaração '${ficha.id}' no exercício ${exercicio} (RF-034).`,
          409
        );
      }
    }
  }

  /**
   * Cria a ficha do contribuinte para o exercício (CA-1, CA-2, CA-3)
   */
  public criarFicha(dados: {
    exercicio: number;
    documento: string;
    nomeCompleto: string;
    dataNascimento: string;
    ocupacao: string;
    endereco: EnderecoContribuinte;
    dadosBancarios?: DadosBancariosContribuinte;
    dependentes?: Omit<DependenteIr, 'id'>[];
    alimentandos?: AlimentandoIr[];
  }): FichaContribuinteIr {
    if (
      !Number.isInteger(dados.exercicio) ||
      dados.exercicio < 2000 ||
      dados.exercicio > 2100
    ) {
      throw this.criarErro('exercicio deve ser um ano fiscal válido.', 400);
    }
    if (
      !dados.documento?.trim() ||
      !dados.nomeCompleto?.trim() ||
      !dados.ocupacao?.trim()
    ) {
      throw this.criarErro(
        'documento, nomeCompleto e ocupacao são obrigatórios.',
        400
      );
    }
    if (!REGEX_DATA.test(dados.dataNascimento || '')) {
      throw this.criarErro(
        'dataNascimento deve estar no formato YYYY-MM-DD.',
        400
      );
    }
    if (
      !dados.endereco?.logradouro?.trim() ||
      !dados.endereco?.cidade?.trim() ||
      !dados.endereco?.uf?.trim()
    ) {
      throw this.criarErro(
        'endereco completo (logradouro, cidade, uf) é obrigatório.',
        400
      );
    }

    const dependentesIniciais: DependenteIr[] = [];
    const docsNoLote = new Set<string>();
    for (const dep of dados.dependentes ?? []) {
      const docNorm = this.normalizarDoc(dep.documento);
      if (!docNorm || !dep.nome?.trim() || !dep.parentesco?.trim()) {
        throw this.criarErro(
          'Dependente deve possuir documento, nome e parentesco.',
          400
        );
      }
      if (docsNoLote.has(docNorm)) {
        throw this.criarErro(
          `Duplicidade identificada: dependente '${docNorm}' repetido na mesma declaração (RF-034).`,
          409
        );
      }
      this.verificarDuplicidadeDependente(dados.exercicio, docNorm);
      docsNoLote.add(docNorm);
      dependentesIniciais.push({
        id: crypto.randomUUID(),
        documento: docNorm,
        nome: dep.nome.trim(),
        parentesco: dep.parentesco.trim(),
        dataNascimento: dep.dataNascimento,
      });
    }

    const ficha: FichaContribuinteIr = {
      id: crypto.randomUUID(),
      exercicio: dados.exercicio,
      documento: this.normalizarDoc(dados.documento),
      nomeCompleto: dados.nomeCompleto.trim(),
      dataNascimento: dados.dataNascimento,
      ocupacao: dados.ocupacao.trim(),
      endereco: {
        logradouro: dados.endereco.logradouro.trim(),
        cidade: dados.endereco.cidade.trim(),
        uf: dados.endereco.uf.trim().toUpperCase(),
        cep: dados.endereco.cep?.trim(),
      },
      dadosBancarios: dados.dadosBancarios
        ? { ...dados.dadosBancarios }
        : undefined,
      dependentes: dependentesIniciais,
      alimentandos: (dados.alimentandos ?? []).map((a) => ({
        documento: this.normalizarDoc(a.documento),
        nome: a.nome.trim(),
        dataNascimento: a.dataNascimento,
      })),
      criadoEm: new Date(),
    };

    this.fichas.push(ficha);
    return ficha;
  }

  /**
   * Adiciona dependente à ficha validando duplicidade no exercício (CA-2)
   */
  public adicionarDependente(
    fichaId: string,
    dep: Omit<DependenteIr, 'id'>
  ): FichaContribuinteIr {
    const ficha = this.fichas.find((f) => f.id === fichaId.trim());
    if (!ficha) {
      throw this.criarErro('Ficha do contribuinte não encontrada.', 404);
    }
    const docNorm = this.normalizarDoc(dep.documento);
    if (!docNorm || !dep.nome?.trim() || !dep.parentesco?.trim()) {
      throw this.criarErro(
        'Dependente deve possuir documento, nome e parentesco.',
        400
      );
    }
    this.verificarDuplicidadeDependente(ficha.exercicio, docNorm);

    ficha.dependentes.push({
      id: crypto.randomUUID(),
      documento: docNorm,
      nome: dep.nome.trim(),
      parentesco: dep.parentesco.trim(),
      dataNascimento: dep.dataNascimento,
    });
    return ficha;
  }

  public buscarPorId(fichaId: string): FichaContribuinteIr {
    const ficha = this.fichas.find((f) => f.id === fichaId.trim());
    if (!ficha) {
      throw this.criarErro('Ficha do contribuinte não encontrada.', 404);
    }
    return ficha;
  }

  public limpar(): void {
    this.fichas = [];
  }
}
