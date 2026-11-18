import { query, pool } from '../db/database';
import { Employee } from '../types';

export async function getSystemParameter(key: string, defaultValue: number): Promise<number> {
  const res = await query('SELECT valor FROM system_parameters WHERE chave = $1', [key]);
  return res.rows.length > 0 ? parseFloat(res.rows[0].valor) : defaultValue;
}

export async function calculateInss(baseCalculo: number) {
  const teto = await getSystemParameter('teto_inss', 908.85);
  const f1 = 1412.00;
  const f2 = 2666.68;
  const f3 = 4000.03;
  const f4 = 7786.02;

  let inss = 0;
  const faixas: any[] = [];

  if (baseCalculo <= f1) {
    const v = baseCalculo * 0.075;
    inss += v;
    faixas.push({ faixa: 'Até R$ 1.412,00 (7,5%)', base: baseCalculo, aliquota: 0.075, valor: v });
  } else {
    const v1 = f1 * 0.075;
    inss += v1;
    faixas.push({ faixa: '1ª Faixa (7,5%)', base: f1, aliquota: 0.075, valor: v1 });

    if (baseCalculo <= f2) {
      const b2 = baseCalculo - f1;
      const v2 = b2 * 0.09;
      inss += v2;
      faixas.push({ faixa: '2ª Faixa (9,0%)', base: b2, aliquota: 0.09, valor: v2 });
    } else {
      const b2 = f2 - f1;
      const v2 = b2 * 0.09;
      inss += v2;
      faixas.push({ faixa: '2ª Faixa (9,0%)', base: b2, aliquota: 0.09, valor: v2 });

      if (baseCalculo <= f3) {
        const b3 = baseCalculo - f2;
        const v3 = b3 * 0.12;
        inss += v3;
        faixas.push({ faixa: '3ª Faixa (12,0%)', base: b3, aliquota: 0.12, valor: v3 });
      } else {
        const b3 = f3 - f2;
        const v3 = b3 * 0.12;
        inss += v3;
        faixas.push({ faixa: '3ª Faixa (12,0%)', base: b3, aliquota: 0.12, valor: v3 });

        const baseTeto = Math.min(baseCalculo, f4);
        const b4 = baseTeto - f3;
        const v4 = b4 * 0.14;
        inss += v4;
        faixas.push({ faixa: '4ª Faixa (14,0%)', base: b4, aliquota: 0.14, valor: v4 });
      }
    }
  }

  if (inss > teto) {
    inss = teto;
  }

  return {
    valor: Number(inss.toFixed(2)),
    tetoAtingido: inss >= teto,
    faixas
  };
}

export async function calculateIrrf(baseBruta: number, descontoInss: number, dependentes: number = 0) {
  const deducaoPorDependente = await getSystemParameter('deducao_dependente_irrf', 189.59);
  const totalDeducaoDependentes = dependentes * deducaoPorDependente;
  const baseCalculo = Math.max(0, baseBruta - descontoInss - totalDeducaoDependentes);

  let aliquota = 0;
  let deducao = 0;

  if (baseCalculo <= 2259.20) {
    aliquota = 0;
    deducao = 0;
  } else if (baseCalculo <= 2826.65) {
    aliquota = 0.075;
    deducao = 169.44;
  } else if (baseCalculo <= 3751.05) {
    aliquota = 0.15;
    deducao = 381.44;
  } else if (baseCalculo <= 4664.68) {
    aliquota = 0.225;
    deducao = 662.77;
  } else {
    aliquota = 0.275;
    deducao = 896.00;
  }

  const impostoCalculado = (baseCalculo * aliquota) - deducao;
  const valorFinal = Math.max(0, Number(impostoCalculado.toFixed(2)));

  return {
    baseCalculo: Number(baseCalculo.toFixed(2)),
    deducaoDependentes: Number(totalDeducaoDependentes.toFixed(2)),
    aliquotaPercent: aliquota * 100,
    parcelaDedutivel: deducao,
    valor: valorFinal
  };
}

export async function calculateProvisions(salarioBase: number) {
  const aliqFgts = await getSystemParameter('aliquota_fgts', 0.08);
  const aliqInssPatronal = await getSystemParameter('aliquota_inss_patronal', 0.20);
  const aliqRat = await getSystemParameter('aliquota_rat', 0.02);
  const aliqTerceiros = await getSystemParameter('aliquota_terceiros', 0.058);
  const aliqEncargosTotal = aliqFgts + aliqInssPatronal + aliqRat + aliqTerceiros; // 35.8%

  const prov13Base = salarioBase / 12;
  const enc13 = prov13Base * aliqEncargosTotal;
  const prov13Total = prov13Base + enc13;

  const provFeriasBase = (salarioBase / 12) * (4 / 3);
  const encFerias = provFeriasBase * aliqEncargosTotal;
  const provFeriasTotal = provFeriasBase + encFerias;

  return {
    provisao13Base: Number(prov13Base.toFixed(2)),
    encargos13: Number(enc13.toFixed(2)),
    provisao13Total: Number(prov13Total.toFixed(2)),

    provisaoFeriasBase: Number(provFeriasBase.toFixed(2)),
    encargosFerias: Number(encFerias.toFixed(2)),
    provisaoFeriasTotal: Number(provFeriasTotal.toFixed(2)),

    totalProvisoesComEncargos: Number((prov13Total + provFeriasTotal).toFixed(2))
  };
}

export async function calculateMonthlyPayroll(
  competencia: string,
  saveToDatabase: boolean = false,
  usuario: string = 'Douglas (RH)',
  organizationId: number = 1
) {
  // Verificação de Imutabilidade da Competência Fechada
  const runCheck = await query(
    `SELECT id, status FROM payroll_runs WHERE organization_id = $1 AND competencia = $2 AND tipo = 'mensal'`,
    [organizationId, competencia]
  );
  if (saveToDatabase && runCheck.rows.length > 0 && runCheck.rows[0].status === 'fechada') {
    const err: any = new Error(`A folha da competência ${competencia} está fechada e imutável. Para recalcular, realize a reabertura formal.`);
    err.statusCode = 409;
    throw err;
  }

  // Carrega dados da empresa de forma dinâmica
  const compRes = await query(
    `SELECT * FROM companies WHERE organization_id = $1 LIMIT 1`,
    [organizationId]
  );
  const company = compRes.rows[0] || {
    razao_social: 'Audicon Contabilidade & Gestão Empresarial Ltda',
    cnpj: '12.345.678/0001-90',
    endereco: 'Avenida Paulista, 1500, Conjunto 82 - Bela Vista, São Paulo/SP'
  };

  const empRes = await query<Employee>(
    `SELECT * FROM employees WHERE organization_id = $1 AND status != 'inativo' ORDER BY id ASC`,
    [organizationId]
  );
  const employees = empRes.rows;

  const aliqFgts = await getSystemParameter('aliquota_fgts', 0.08);
  const aliqInssPatronal = await getSystemParameter('aliquota_inss_patronal', 0.20);
  const aliqRat = await getSystemParameter('aliquota_rat', 0.02);
  const aliqTerceiros = await getSystemParameter('aliquota_terceiros', 0.058);

  const items: any[] = [];
  let folhaTotalProventos = 0;
  let folhaTotalDescontos = 0;
  let folhaTotalLiquido = 0;
  let folhaTotalEncargos = 0;
  let folhaTotalProvisoes = 0;
  let folhaTotalProv13 = 0;
  let folhaTotalProvFerias = 0;

  for (const emp of employees) {
    const salarioBase = parseFloat(String(emp.salario_base));

    const evRes = await query(
      `SELECT * FROM variable_events WHERE organization_id = $1 AND employee_id = $2 AND competencia = $3`,
      [organizationId, emp.id, competencia]
    );
    const events = evRes.rows;

    let horasExtrasTotal = 0;
    let adicionaisTotal = 0;
    let faltasTotal = 0;
    let outrosDescontos = 0;

    const listaProventos = [
      { codigo: '001', descricao: 'Salário Base', referencia: '30 dias', valor: salarioBase }
    ];
    const listaDescontos: any[] = [];

    for (const ev of events) {
      const valorEv = parseFloat(ev.valor);
      if (ev.tipo === 'hora_extra') {
        horasExtrasTotal += valorEv;
        listaProventos.push({
          codigo: '101',
          descricao: ev.descricao || `Horas Extras ${ev.percentual}%`,
          referencia: `${ev.quantidade}h`,
          valor: valorEv
        });
      } else if (ev.tipo === 'adicional') {
        adicionaisTotal += valorEv;
        listaProventos.push({
          codigo: '102',
          descricao: ev.descricao || 'Adicional',
          referencia: '-',
          valor: valorEv
        });
      } else if (ev.tipo === 'falta') {
        faltasTotal += valorEv;
        listaDescontos.push({
          codigo: '201',
          descricao: ev.descricao || 'Faltas / Atrasos',
          referencia: `${ev.quantidade}d`,
          valor: valorEv
        });
      } else if (ev.tipo === 'desconto') {
        outrosDescontos += valorEv;
        listaDescontos.push({
          codigo: '202',
          descricao: ev.descricao || 'Outros Descontos',
          referencia: '-',
          valor: valorEv
        });
      }
    }

    // Integração com Benefícios Ativos (RF-053)
    const benRes = await query(
      `SELECT * FROM benefits WHERE organization_id = $1 AND employee_id = $2 AND ativo = true`,
      [organizationId, emp.id]
    );
    let totalBeneficiosDesconto = 0;
    for (const ben of benRes.rows) {
      const descVal = parseFloat(String(ben.desconto_empregado || 0));
      if (descVal > 0) {
        totalBeneficiosDesconto += descVal;
        listaDescontos.push({
          codigo: '250',
          descricao: `Benefício: ${ben.descricao || ben.tipo}`,
          referencia: '-',
          valor: descVal
        });
      }
    }
    outrosDescontos = Number((outrosDescontos + totalBeneficiosDesconto).toFixed(2));

    const totalProventos = Number((salarioBase + horasExtrasTotal + adicionaisTotal).toFixed(2));
    const baseTributavel = Math.max(0, totalProventos - faltasTotal);

    const inss = await calculateInss(baseTributavel);
    const irrf = await calculateIrrf(baseTributavel, inss.valor, emp.dependentes);

    listaDescontos.push({
      codigo: '301',
      descricao: 'INSS Folha de Pagamento',
      referencia: inss.tetoAtingido ? 'Teto' : 'Progressivo',
      valor: inss.valor
    });

    if (irrf.valor > 0) {
      listaDescontos.push({
        codigo: '302',
        descricao: 'IRRF Retido na Fonte',
        referencia: `${irrf.aliquotaPercent}%`,
        valor: irrf.valor
      });
    }

    const totalDescontos = Number((faltasTotal + outrosDescontos + inss.valor + irrf.valor).toFixed(2));
    const salarioLiquido = Number((totalProventos - totalDescontos).toFixed(2));

    const baseFgts = baseTributavel;
    const valorFgts = Number((baseFgts * aliqFgts).toFixed(2));
    const inssEmpresa = Number((baseTributavel * aliqInssPatronal).toFixed(2));
    const rat = Number((baseTributavel * aliqRat).toFixed(2));
    const terceiros = Number((baseTributavel * aliqTerceiros).toFixed(2));
    const totalEncargosItem = Number((valorFgts + inssEmpresa + rat + terceiros).toFixed(2));

    const provisoes = await calculateProvisions(salarioBase);

    // Alertas de conferência por colaborador
    const alertas: string[] = [];
    if (salarioLiquido <= 0) {
      alertas.push('Salário líquido zerado ou negativo');
    }
    if (horasExtrasTotal > salarioBase * 0.5) {
      alertas.push('Horas extras expressivas (>50% do salário base)');
    }
    if (faltasTotal > 0) {
      alertas.push(`Desconto por faltas: R$ ${faltasTotal.toFixed(2)}`);
    }
    if (totalDescontos > totalProventos * 0.4) {
      alertas.push('Descontos expressivos (>40% dos proventos)');
    }
    if (alertas.length === 0) {
      alertas.push('Cálculo consistente sem inconsistências');
    }

    const detalhes = {
      empresa: company.razao_social || company.nome_fantasia,
      cnpj: company.cnpj,
      endereco: `${company.endereco || ''} ${company.numero || ''} ${company.cidade || ''}/${company.uf || ''}`.trim(),
      competencia,
      proventos: listaProventos,
      descontos: listaDescontos,
      inssDetalhes: inss,
      irrfDetalhes: irrf,
      encargos: {
        baseFgts,
        valorFgts,
        inssEmpresa,
        rat,
        terceiros,
        totalEncargos: totalEncargosItem
      },
      provisoes,
      alertas
    };

    items.push({
      employee_id: emp.id,
      nome: emp.nome,
      cpf: emp.cpf,
      cargo: emp.cargo,
      salario_base: salarioBase,
      horas_extras_total: horasExtrasTotal,
      adicionais_total: adicionaisTotal,
      faltas_total: faltasTotal,
      desconto_inss: inss.valor,
      desconto_irrf: irrf.valor,
      outros_descontos: outrosDescontos,
      total_proventos: totalProventos,
      total_descontos: totalDescontos,
      salario_liquido: salarioLiquido,
      base_inss: baseTributavel,
      base_fgts: baseFgts,
      valor_fgts: valorFgts,
      inss_patronal: inssEmpresa,
      provisao_13: provisoes.provisao13Total,
      provisao_ferias: provisoes.provisaoFeriasTotal,
      conferido: false,
      alertas,
      detalhes_json: detalhes
    });

    folhaTotalProventos += totalProventos;
    folhaTotalDescontos += totalDescontos;
    folhaTotalLiquido += salarioLiquido;
    folhaTotalEncargos += totalEncargosItem;
    folhaTotalProvisoes += provisoes.totalProvisoesComEncargos;
    folhaTotalProv13 += provisoes.provisao13Total;
    folhaTotalProvFerias += provisoes.provisaoFeriasTotal;
  }

  const resumo: any = {
    competencia,
    tipo: 'mensal',
    status: runCheck.rows.length > 0 ? runCheck.rows[0].status : 'rascunho',
    total_colaboradores: employees.length,
    total_proventos: Number(folhaTotalProventos.toFixed(2)),
    total_descontos: Number(folhaTotalDescontos.toFixed(2)),
    total_liquido: Number(folhaTotalLiquido.toFixed(2)),
    total_encargos: Number(folhaTotalEncargos.toFixed(2)),
    total_provisoes: Number(folhaTotalProvisoes.toFixed(2)),
    total_provisao_13: Number(folhaTotalProv13.toFixed(2)),
    total_provisao_ferias: Number(folhaTotalProvFerias.toFixed(2)),
    custo_total_empresa: Number((folhaTotalProventos + folhaTotalEncargos + folhaTotalProvisoes).toFixed(2)),
    itens: items
  };

  if (saveToDatabase) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const existingRes = await client.query(
        `SELECT id, status FROM payroll_runs WHERE organization_id = $1 AND competencia = $2 AND tipo = 'mensal'`,
        [organizationId, competencia]
      );

      let runId: number;
      if (existingRes.rows.length > 0) {
        if (existingRes.rows[0].status === 'fechada') {
          throw new Error(`A folha da competência ${competencia} está fechada e não pode ser sobrescrita sem reabertura.`);
        }
        runId = existingRes.rows[0].id;
        await client.query(`
          UPDATE payroll_runs
          SET total_proventos = $1, total_descontos = $2, total_liquido = $3,
              total_encargos = $4, total_provisoes = $5, updated_at = CURRENT_TIMESTAMP
          WHERE id = $6
        `, [resumo.total_proventos, resumo.total_descontos, resumo.total_liquido, resumo.total_encargos, resumo.total_provisoes, runId]);

        await client.query('DELETE FROM payroll_items WHERE payroll_run_id = $1', [runId]);
      } else {
        const insRes = await client.query(`
          INSERT INTO payroll_runs (organization_id, competencia, tipo, status, total_proventos, total_descontos, total_liquido, total_encargos, total_provisoes)
          VALUES ($1, $2, 'mensal', 'rascunho', $3, $4, $5, $6, $7)
          RETURNING id
        `, [organizationId, competencia, resumo.total_proventos, resumo.total_descontos, resumo.total_liquido, resumo.total_encargos, resumo.total_provisoes]);
        runId = insRes.rows[0].id;
      }

      for (const it of items) {
        await client.query(`
          INSERT INTO payroll_items (
            organization_id, payroll_run_id, employee_id, salario_base, horas_extras_total, adicionais_total,
            faltas_total, desconto_inss, desconto_irrf, outros_descontos, total_proventos,
            total_descontos, salario_liquido, base_inss, base_fgts, valor_fgts,
            inss_patronal, provisao_13, provisao_ferias, conferido, detalhes_json
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        `, [
          organizationId, runId, it.employee_id, it.salario_base, it.horas_extras_total, it.adicionais_total,
          it.faltas_total, it.desconto_inss, it.desconto_irrf, it.outros_descontos, it.total_proventos,
          it.total_descontos, it.salario_liquido, it.base_inss, it.base_fgts, it.valor_fgts,
          it.inss_patronal, it.provisao_13, it.provisao_ferias, it.conferido, JSON.stringify(it.detalhes_json)
        ]);
      }

      await client.query(`
        INSERT INTO payroll_approval_logs (organization_id, payroll_run_id, competencia, usuario, perfil, acao, detalhes)
        VALUES ($1, $2, $3, $4, 'RH/Admin', 'Cálculo de Folha', $5)
      `, [organizationId, runId, competencia, usuario, `Cálculo executado para ${items.length} empregados. Total Líquido: R$ ${resumo.total_liquido}`]);

      await client.query('COMMIT');
      resumo.runId = runId;
      if (existingRes.rows.length > 0) resumo.status = existingRes.rows[0].status;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  return resumo;
}

export async function calculateVacation(employeeId: number, diasGozo: number = 30, organizationId: number = 1) {
  const empRes = await query('SELECT * FROM employees WHERE organization_id = $1 AND id = $2', [organizationId, employeeId]);
  if (empRes.rows.length === 0) throw new Error('Empregado não encontrado.');
  const emp = empRes.rows[0];
  const salarioBase = parseFloat(emp.salario_base);

  const proporcao = diasGozo / 30;
  const salarioFerias = Number((salarioBase * proporcao).toFixed(2));
  const tercoConstitucional = Number((salarioFerias / 3).toFixed(2));
  const totalBrutoFerias = Number((salarioFerias + tercoConstitucional).toFixed(2));

  const inss = await calculateInss(totalBrutoFerias);
  const irrf = await calculateIrrf(totalBrutoFerias, inss.valor, emp.dependentes);

  const totalDescontos = Number((inss.valor + irrf.valor).toFixed(2));
  const valorLiquido = Number((totalBrutoFerias - totalDescontos).toFixed(2));

  const aliqFgts = await getSystemParameter('aliquota_fgts', 0.08);
  const valorFgts = Number((totalBrutoFerias * aliqFgts).toFixed(2));

  return {
    empregado: emp,
    diasGozo,
    salarioBase,
    salarioFerias,
    tercoConstitucional,
    totalBruto: totalBrutoFerias,
    descontoInss: inss.valor,
    inssDetalhes: inss,
    descontoIrrf: irrf.valor,
    irrfDetalhes: irrf,
    totalDescontos,
    valorLiquido,
    valorFgts
  };
}

export async function calculate13Salary(
  employeeId: number,
  parcela: string = '1',
  mesesTrabalhados: number = 12,
  organizationId: number = 1
) {
  const empRes = await query('SELECT * FROM employees WHERE organization_id = $1 AND id = $2', [organizationId, employeeId]);
  if (empRes.rows.length === 0) throw new Error('Empregado não encontrado.');
  const emp = empRes.rows[0];
  const salarioBase = parseFloat(emp.salario_base);

  const fracaoAno = mesesTrabalhados / 12;
  const valorIntegral = Number((salarioBase * fracaoAno).toFixed(2));
  const aliqFgts = await getSystemParameter('aliquota_fgts', 0.08);

  if (parcela === '1') {
    const valorAdiantamento = Number((valorIntegral * 0.5).toFixed(2));
    const fgts = Number((valorAdiantamento * aliqFgts).toFixed(2));

    return {
      empregado: emp,
      parcela: '1ª Parcela (Adiantamento)',
      mesesTrabalhados,
      valorIntegral,
      proventos: valorAdiantamento,
      descontoInss: 0,
      descontoIrrf: 0,
      totalDescontos: 0,
      valorLiquido: valorAdiantamento,
      fgts
    };
  } else {
    const adiantamentoPago = Number((valorIntegral * 0.5).toFixed(2));
    const inssTotal = await calculateInss(valorIntegral);
    const irrfTotal = await calculateIrrf(valorIntegral, inssTotal.valor, emp.dependentes);

    const saldoBruto = Number((valorIntegral - adiantamentoPago).toFixed(2));
    const totalDescontos = Number((inssTotal.valor + irrfTotal.valor).toFixed(2));
    const liquido = Number((saldoBruto - totalDescontos).toFixed(2));
    const fgts = Number((saldoBruto * aliqFgts).toFixed(2));

    return {
      empregado: emp,
      parcela: '2ª Parcela (Quitação)',
      mesesTrabalhados,
      valorIntegral,
      saldoBruto,
      adiantamentoDeduzido: adiantamentoPago,
      descontoInss: inssTotal.valor,
      inssDetalhes: inssTotal,
      descontoIrrf: irrfTotal.valor,
      irrfDetalhes: irrfTotal,
      totalDescontos,
      valorLiquido: liquido,
      fgts
    };
  }
}

export async function approvePayroll(
  competencia: string,
  novoStatus: string,
  usuario: string,
  justificativa?: string,
  organizationId: number = 1
) {
  const res = await query(
    'SELECT * FROM payroll_runs WHERE organization_id = $1 AND competencia = $2 AND tipo = $3',
    [organizationId, competencia, 'mensal']
  );
  if (res.rows.length === 0) {
    throw new Error('Folha não encontrada para esta competência. Calcule a folha primeiro.');
  }

  const run = res.rows[0];
  const isClosed = novoStatus === 'fechada';

  await query(
    `UPDATE payroll_runs
     SET status = $1,
         closed_at = CASE WHEN $2 = true THEN CURRENT_TIMESTAMP ELSE NULL END,
         closed_by = CASE WHEN $2 = true THEN $3 ELSE NULL END,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4`,
    [novoStatus, isClosed, usuario, run.id]
  );

  await query(`
    INSERT INTO payroll_approval_logs (organization_id, payroll_run_id, competencia, usuario, perfil, acao, detalhes)
    VALUES ($1, $2, $3, $4, 'RH/Admin', $5, $6)
  `, [
    organizationId,
    run.id,
    competencia,
    usuario,
    `Status alterado para ${novoStatus.toUpperCase()}`,
    justificativa || `Aprovação formal da competência ${competencia}`
  ]);

  return {
    success: true,
    status: novoStatus,
    closed_at: isClosed ? new Date().toISOString() : null,
    closed_by: isClosed ? usuario : null
  };
}

export async function reopenPayroll(
  competencia: string,
  usuario: string,
  justificativa: string,
  organizationId: number = 1
) {
  if (!justificativa || !justificativa.trim()) {
    throw new Error('Justificativa é obrigatória para reabertura de folha de pagamento.');
  }

  const res = await query(
    'SELECT * FROM payroll_runs WHERE organization_id = $1 AND competencia = $2 AND tipo = $3',
    [organizationId, competencia, 'mensal']
  );
  if (res.rows.length === 0) {
    throw new Error('Folha não encontrada para esta competência.');
  }

  const run = res.rows[0];

  await query(
    `UPDATE payroll_runs
     SET status = 'em_revisao',
         closed_at = NULL,
         closed_by = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [run.id]
  );

  await query(`
    INSERT INTO payroll_approval_logs (organization_id, payroll_run_id, competencia, usuario, perfil, acao, detalhes)
    VALUES ($1, $2, $3, $4, 'RH/Admin', 'REABERTURA DE FOLHA', $5)
  `, [
    organizationId,
    run.id,
    competencia,
    usuario,
    `Folha reaberta para revisão. Justificativa: ${justificativa.trim()}`
  ]);

  return {
    success: true,
    status: 'em_revisao',
    message: `Competência ${competencia} reaberta para revisão com sucesso.`
  };
}
