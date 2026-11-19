/**
 * Definições de Tipos e Interfaces do Módulo Item 4 (SPEC-4.1)
 * Suporte a TypeScript rigoroso e Multi-inquilino (organization_id).
 */

export type UserRole = 'rh_admin' | 'consulta_assistente' | 'cliente';

export interface Employee {
  id: number;
  organization_id: number;
  nome: string;
  cpf: string;
  cargo: string;
  salario_base: number | string;
  jornada: string;
  departamento?: string | null;
  regime_contratual?: string | null;
  data_admissao: string;
  status: 'ativo' | 'afastado' | 'inativo';
  dependentes: number;
  created_at?: string;
  updated_at?: string;
}

export interface ContractChange {
  id: number;
  organization_id: number;
  employee_id: number;
  tipo_alteracao: string;
  descricao: string;
  salario_anterior?: number | string | null;
  novo_salario?: number | string | null;
  cargo_anterior?: string | null;
  novo_cargo?: string | null;
  jornada_anterior?: string | null;
  nova_jornada?: string | null;
  departamento_anterior?: string | null;
  novo_departamento?: string | null;
  regime_anterior?: string | null;
  novo_regime?: string | null;
  data_alteracao: string;
  created_at?: string;
}

export interface Leave {
  id: number;
  organization_id: number;
  employee_id: number;
  tipo: string;
  data_inicio: string;
  data_fim?: string | null;
  motivo?: string | null;
  created_at?: string;
}

export interface VariableEvent {
  id: number;
  organization_id: number;
  employee_id: number;
  competencia: string;
  tipo: 'hora_extra' | 'falta' | 'adicional' | 'desconto';
  descricao: string;
  quantidade: number;
  percentual: number;
  valor: number | string;
  created_at?: string;
}

export interface PayrollRun {
  id: number;
  organization_id: number;
  competencia: string;
  tipo: 'mensal' | 'ferias' | '13_primeira' | '13_segunda';
  status: 'rascunho' | 'em_revisao' | 'aprovada' | 'fechada';
  total_proventos: number | string;
  total_descontos: number | string;
  total_liquido: number | string;
  total_encargos: number | string;
  total_provisoes: number | string;
  created_at?: string;
  updated_at?: string;
}

export interface PayrollItem {
  id: number;
  organization_id: number;
  payroll_run_id: number;
  employee_id: number;
  salario_base: number | string;
  horas_extras_total: number | string;
  adicionais_total: number | string;
  faltas_total: number | string;
  desconto_inss: number | string;
  desconto_irrf: number | string;
  outros_descontos: number | string;
  total_proventos: number | string;
  total_descontos: number | string;
  salario_liquido: number | string;
  base_inss: number | string;
  base_fgts: number | string;
  valor_fgts: number | string;
  inss_patronal: number | string;
  provisao_13: number | string;
  provisao_ferias: number | string;
  detalhes_json?: any;
  created_at?: string;
}

export interface ApprovalLog {
  id: number;
  organization_id: number;
  payroll_run_id?: number | null;
  competencia: string;
  usuario: string;
  perfil: string;
  acao: string;
  detalhes?: string | null;
  data_hora?: string;
}

export interface SystemParameter {
  chave: string;
  valor: number;
  descricao: string;
}
