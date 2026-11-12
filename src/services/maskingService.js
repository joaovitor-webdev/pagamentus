/**
 * Serviço de Mascaramento de Dados Sensíveis e Salariais (RF-056 & LGPD / RNF-002)
 * Quando o perfil não for 'rh_admin' (ex: 'consulta_assistente'), todas as remunerações,
 * proventos, descontos e CPFs são ofuscados tanto na resposta da API quanto na interface.
 */

const SENSITIVE_MONEY_FIELDS = new Set([
  'salario_base', 'salariobase', 'salarioBase',
  'novo_salario', 'novosalario', 'novoSalario',
  'salario_anterior', 'salarioanterior', 'salarioAnterior',
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

function maskCpf(cpf) {
  if (!cpf || typeof cpf !== 'string') return '***.***.***-**';
  const clean = cpf.replace(/\D/g, '');
  if (clean.length === 11) {
    return `${clean.substring(0, 3)}.***.***-${clean.substring(9, 11)}`;
  }
  return '***.***.***-**';
}

function maskMoneyValue(val) {
  return 'R$ *****,**';
}

function maskObject(obj, isRhAdmin) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => maskObject(item, isRhAdmin));
  }

  const cloned = { ...obj };

  if (!isRhAdmin) {
    // Mascarar CPF
    if ('cpf' in cloned) {
      cloned.cpf = maskCpf(cloned.cpf);
    }
    if ('cpfTrab' in cloned) {
      cloned.cpfTrab = maskCpf(cloned.cpfTrab);
    }
    if ('employee_cpf' in cloned) {
      cloned.employee_cpf = maskCpf(cloned.employee_cpf);
    }

    // Mascarar campos monetários sensíveis e objetos aninhados
    for (const key of Object.keys(cloned)) {
      if (SENSITIVE_MONEY_FIELDS.has(key)) {
        cloned[key] = maskMoneyValue(cloned[key]);
      } else if (cloned[key] && typeof cloned[key] === 'object') {
        cloned[key] = maskObject(cloned[key], false);
      }
    }

    // Se houver detalhes_json ou memória de cálculo serializada
    if (cloned.detalhes_json && typeof cloned.detalhes_json === 'string') {
      try {
        const parsed = JSON.parse(cloned.detalhes_json);
        cloned.detalhes_json = JSON.stringify(maskObject(parsed, false));
      } catch (e) {
        cloned.detalhes_json = '{}';
      }
    }
  }

  return cloned;
}

function isRhRole(role) {
  return role === 'rh_admin' || role === 'admin';
}

function roleMiddleware(req, res, next) {
  const roleHeader = req.headers['x-user-role'] || req.headers['user-role'] || req.query.role || 'rh_admin';
  req.userRole = roleHeader.toLowerCase();
  req.isRhAdmin = isRhRole(req.userRole);
  next();
}

module.exports = {
  maskObject,
  maskCpf,
  maskMoneyValue,
  isRhRole,
  roleMiddleware
};
