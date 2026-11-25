import * as crypto from 'crypto';
import {
  BemDireitoIr,
  CategoriaBemIr,
  DividaOnusIr,
  ResumoPatrimonialIr,
} from '../models/PatrimonioIrModel';

const CATEGORIAS_BEM: CategoriaBemIr[] = [
  'IMOVEL',
  'VEICULO',
  'PARTICIPACAO_SOCIETARIA',
  'APLICACAO_FINANCEIRA',
  'CRIPTOATIVO',
  'OUTRO_BEM',
];

/**
 * Serviço para Bens, Direitos e Dívidas IRPF (SPEC-3.15 / RF-032)
 */
export class PatrimonioIrService {
  private bens: BemDireitoIr[] = [];
  private dividas: DividaOnusIr[] = [];

  private arredondar(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  private validarNaoNegativo(valor: number, campo: string): void {
    if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0) {
      throw new Error(`${campo} deve ser um número maior ou igual a zero.`);
    }
  }

  public registrarBem(dados: {
    fichaId: string;
    categoria: CategoriaBemIr;
    descricao: string;
    situacaoAnterior?: number;
    situacaoAtual: number;
  }): BemDireitoIr {
    if (!dados.fichaId?.trim() || !dados.descricao?.trim()) {
      throw new Error('fichaId e descricao são obrigatórios.');
    }
    if (!CATEGORIAS_BEM.includes(dados.categoria)) {
      throw new Error('Categoria de bem/direito inválida.');
    }
    const anterior = dados.situacaoAnterior ?? 0;
    this.validarNaoNegativo(anterior, 'situacaoAnterior');
    this.validarNaoNegativo(dados.situacaoAtual, 'situacaoAtual');

    const bem: BemDireitoIr = {
      id: crypto.randomUUID(),
      fichaId: dados.fichaId.trim(),
      categoria: dados.categoria,
      descricao: dados.descricao.trim(),
      situacaoAnterior: this.arredondar(anterior),
      situacaoAtual: this.arredondar(dados.situacaoAtual),
      criadoEm: new Date(),
    };
    this.bens.push(bem);
    return bem;
  }

  public registrarDivida(dados: {
    fichaId: string;
    credor: string;
    descricao: string;
    saldoAnterior?: number;
    saldoAtual: number;
    valorPagoNoExercicio?: number;
  }): DividaOnusIr {
    if (
      !dados.fichaId?.trim() ||
      !dados.credor?.trim() ||
      !dados.descricao?.trim()
    ) {
      throw new Error('fichaId, credor e descricao são obrigatórios.');
    }
    const anterior = dados.saldoAnterior ?? 0;
    const pago = dados.valorPagoNoExercicio ?? 0;
    this.validarNaoNegativo(anterior, 'saldoAnterior');
    this.validarNaoNegativo(dados.saldoAtual, 'saldoAtual');
    this.validarNaoNegativo(pago, 'valorPagoNoExercicio');

    const divida: DividaOnusIr = {
      id: crypto.randomUUID(),
      fichaId: dados.fichaId.trim(),
      credor: dados.credor.trim(),
      descricao: dados.descricao.trim(),
      saldoAnterior: this.arredondar(anterior),
      saldoAtual: this.arredondar(dados.saldoAtual),
      valorPagoNoExercicio: this.arredondar(pago),
      criadoEm: new Date(),
    };
    this.dividas.push(divida);
    return divida;
  }

  public obterResumo(fichaId: string): ResumoPatrimonialIr {
    if (!fichaId?.trim()) {
      throw new Error('fichaId é obrigatório.');
    }
    const id = fichaId.trim();
    const bens = this.bens.filter((b) => b.fichaId === id);
    const dividas = this.dividas.filter((d) => d.fichaId === id);

    const totalBensAnterior = this.arredondar(
      bens.reduce((acc, b) => acc + b.situacaoAnterior, 0)
    );
    const totalBensAtual = this.arredondar(
      bens.reduce((acc, b) => acc + b.situacaoAtual, 0)
    );
    const totalDividasAtual = this.arredondar(
      dividas.reduce((acc, d) => acc + d.saldoAtual, 0)
    );

    return {
      fichaId: id,
      bens,
      dividas,
      totalBensAnterior,
      totalBensAtual,
      variacaoPatrimonial: this.arredondar(totalBensAtual - totalBensAnterior),
      totalDividasAtual,
      patrimonioLiquidoAtual: this.arredondar(
        totalBensAtual - totalDividasAtual
      ),
    };
  }

  public limpar(): void {
    this.bens = [];
    this.dividas = [];
  }
}
