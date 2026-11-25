/**
 * Modelos de Domínio para Ficha do Contribuinte e Dependentes (SPEC-3.13 / RF-030, RF-034)
 */

export interface EnderecoContribuinte {
  logradouro: string;
  cidade: string;
  uf: string;
  cep?: string;
}

export interface DadosBancariosContribuinte {
  banco: string;
  agencia: string;
  conta: string;
  tipoConta?: 'CORRENTE' | 'POUPANCA';
}

export interface DependenteIr {
  id: string;
  documento: string;
  nome: string;
  parentesco: string;
  dataNascimento: string; // YYYY-MM-DD
}

export interface AlimentandoIr {
  documento: string;
  nome: string;
  dataNascimento: string; // YYYY-MM-DD
}

export interface FichaContribuinteIr {
  id: string;
  exercicio: number;
  documento: string;
  nomeCompleto: string;
  dataNascimento: string; // YYYY-MM-DD
  ocupacao: string;
  endereco: EnderecoContribuinte;
  dadosBancarios?: DadosBancariosContribuinte;
  dependentes: DependenteIr[];
  alimentandos: AlimentandoIr[];
  criadoEm: Date;
}
