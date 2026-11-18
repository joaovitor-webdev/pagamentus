import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';

declare global {
  namespace Express {
    interface Request {
      userRole?: UserRole;
      isRhAdmin?: boolean;
      organizationId?: number;
      clientId?: number;
    }
  }
}

const SENSITIVE_MONEY_FIELDS = new Set([
  'salario_base', 'salariobase', 'salarioBase',
  'novo_salario', 'novosalario', 'novoSalario',
  'salario_anterior', 'salarioanterior', 'salarioAnterior',
  'desconto_empregado', 'descontoempregado', 'descontoEmpregado',
  'valor', 'val', 'vrSalFx', 'vrRubr',
  'total_proventos', 'totalproventos', 'totalProventos',
  'total_descontos', 'totaldescontos', 'totalDescontos',
  'total_liquido', 'totalliquido', 'totalLiquido', 'salarioLiquido', 'salario_liquido', 'liquidoAReceber',
  'total_encargos', 'totalencargos', 'totalEncargos',
  'total_provisoes', 'totalprovisoes', 'totalProvisoes',
  'horas_extras_total', 'horasextrastotal', 'horasExtrasTotal',
  'adicionais_total', 'adicionaistotal', 'adicionaisTotal',
  'faltas_total', 'faltastotal', 'faltasTotal',
  'desconto_inss', 'descontoinss', 'descontoInss',
  'desconto_irrf', 'descontoirrf', 'descontoIrrf',
  'outros_descontos', 'outrosdescontos', 'outrosDescontos',
  'base_inss', 'baseinss', 'baseInss', 'vrBcCp',
  'base_fgts', 'basefgts', 'baseFgts', 'vrBcFgts',
  'valor_fgts', 'valorfgts', 'valorFgts', 'vrFgts',
  'inss_patronal', 'insspatronal', 'inssPatronal', 'vrInssPatronal',
  'provisao_13', 'provisao13', 'provisao13Base', 'provisao13Total', 'provisao_13_mensal',
  'provisao_ferias', 'provisaoferias', 'provisaoFerias', 'provisaoFeriasBase', 'provisaoFeriasTotal', 'provisao_ferias_mensal',
  'encargos_provisoes', 'custo_total_empresa', 'custo_total', 'custoTotal',
  'totalBruto', 'salarioFerias', 'tercoConstitucional', 'valorIntegral', 'saldoBruto', 'adiantamentoDeduzido'
]);

export function maskCpf(cpf: string | null | undefined): string {
  if (!cpf || typeof cpf !== 'string') return '***.***.***-**';
  const clean = cpf.replace(/\D/g, '');
  if (clean.length === 11) {
    return `${clean.substring(0, 3)}.***.***-${clean.substring(9, 11)}`;
  }
  return '***.***.***-**';
}

export function maskMoneyValue(val?: any): string {
  return 'R$ *****,**';
}

export function maskObject<T = any>(obj: T, isRhAdmin?: boolean): T {
  if (!obj || typeof obj !== 'object' || obj instanceof Date) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => maskObject(item, isRhAdmin)) as unknown as T;
  }

  const cloned: any = { ...obj };

  if (!isRhAdmin) {
    if ('cpf' in cloned) {
      cloned.cpf = maskCpf(cloned.cpf);
    }
    if ('cpfTrab' in cloned) {
      cloned.cpfTrab = maskCpf(cloned.cpfTrab);
    }
    if ('employee_cpf' in cloned) {
      cloned.employee_cpf = maskCpf(cloned.employee_cpf);
    }

    for (const key of Object.keys(cloned)) {
      if (SENSITIVE_MONEY_FIELDS.has(key)) {
        cloned[key] = maskMoneyValue(cloned[key]);
      } else if (cloned[key] && typeof cloned[key] === 'object' && !(cloned[key] instanceof Date)) {
        cloned[key] = maskObject(cloned[key], false);
      }
    }

    if (cloned.detalhes_json) {
      try {
        const parsed = typeof cloned.detalhes_json === 'string'
          ? JSON.parse(cloned.detalhes_json)
          : cloned.detalhes_json;
        cloned.detalhes_json = maskObject(parsed, false);
      } catch (e) {
        cloned.detalhes_json = {};
      }
    }
  }

  return cloned;
}

export function isRhRole(role?: string): boolean {
  return role === 'rh_admin' || role === 'admin';
}

export function roleMiddleware(req: Request, res: Response, next: NextFunction): void {
  const roleHeader = (req.headers['x-user-role'] || req.headers['user-role'] || req.query.role || 'rh_admin') as string;
  req.userRole = roleHeader.toLowerCase() as UserRole;
  req.isRhAdmin = isRhRole(req.userRole);

  // Extrai organization_id para isolamento multi-inquilino (SPEC-1.2)
  const orgHeader = (req.headers['x-organization-id'] || req.query.org_id || '1') as string;
  req.organizationId = parseInt(orgHeader, 10) || 1;
  const clientHeader = (req.headers['x-client-id'] || req.query.client_id || '1') as string;
  req.clientId = parseInt(clientHeader, 10) || 1;

  next();
}
