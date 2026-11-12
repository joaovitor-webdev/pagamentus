const db = require('../db/database');

/**
 * Motor de Cálculos Trabalhistas e Previdenciários (RF-052 & RF-055)
 * Utiliza tabelas progressivas e parâmetros legais parametrizáveis do SQLite.
 */

function getSystemParameter(key, defaultValue) {
  const row = db.prepare('SELECT valor FROM system_parameters WHERE chave = ?').get(key);
  return row ? row.valor : defaultValue;
}

/**
 * Calcula desconto progressivo fictício de INSS (tabela de referência vigente)
 */
function calculateInss(baseCalculo) {
  const teto = getSystemParameter('teto_inss', 908.85);
  const f1 = 1412.00;
  const f2 = 2666.68;
  const f3 = 4000.03;
  const f4 = 7786.02;

  let inss = 0;
  const faixas = [];

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

/**
 * Calcula desconto fictício de IRRF com dedução por dependente
 */
function calculateIrrf(baseBruta, descontoInss, dependentes = 0) {
  const deducaoPorDependente = getSystemParameter('deducao_dependente_irrf', 189.59);
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

/**
 * Calcula provisões trabalhistas mensais (RF-055): 13º Salário e Férias com encargos
 */
function calculateProvisions(salarioBase) {
  const aliqFgts = getSystemParameter('aliquota_fgts', 0.08);
  const aliqInssPatronal = getSystemParameter('aliquota_inss_patronal', 0.20);
  const aliqRat = getSystemParameter('aliquota_rat', 0.02);
  const aliqTerceiros = getSystemParameter('aliquota_terceiros', 0.058);
  const aliqEncargosTotal = aliqFgts + aliqInssPatronal + aliqRat + aliqTerceiros; // 35.8%

  // Provisão mensal de 13º: 1/12
  const prov13Base = salarioBase / 12;
  const enc13 = prov13Base * aliqEncargosTotal;
  const prov13Total = prov13Base + enc13;

  // Provisão mensal de Férias: 1/12 + 1/3 constitucional
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

/**
 * Simula ou Executa cálculo de Folha Mensal para uma competência
 */
function calculateMonthlyPayroll(competencia, saveToDatabase = false, usuario = 'Douglas (RH)') {
  const employees = db.prepare(`
    SELECT * FROM employees WHERE status != 'inativo' ORDER BY id ASC
  `).all();

  const aliqFgts = getSystemParameter('aliquota_fgts', 0.08);
  const aliqInssPatronal = getSystemParameter('aliquota_inss_patronal', 0.20);
  const aliqRat = getSystemParameter('aliquota_rat', 0.02);
  const aliqTerceiros = getSystemParameter('aliquota_terceiros', 0.058);

  const items = [];
  let folhaTotalProventos = 0;
  let folhaTotalDescontos = 0;
  let folhaTotalLiquido = 0;
  let folhaTotalEncargos = 0;
  let folhaTotalProvisoes = 0;

  for (const emp of employees) {
    // Buscar eventos variáveis vinculados para a competência (RF-053)
    const events = db.prepare(`
      SELECT * FROM variable_events WHERE employee_id = ? AND competencia = ?
    `).all(emp.id, competencia);

    let horasExtrasTotal = 0;
    let adicionaisTotal = 0;
    let faltasTotal = 0;
    let outrosDescontos = 0;

    const listaProventos = [
      { codigo: '001', descricao: 'Salário Base', referencia: '30 dias', valor: emp.salario_base }
    ];
    const listaDescontos = [];

    for (const ev of events) {
      if (ev.tipo === 'hora_extra') {
        horasExtrasTotal += ev.valor;
        listaProventos.push({
          codigo: '101',
          descricao: ev.descricao || `Horas Extras ${ev.percentual}%`,
          referencia: `${ev.quantidade}h`,
          valor: ev.valor
        });
      } else if (ev.tipo === 'adicional') {
        adicionaisTotal += ev.valor;
        listaProventos.push({
          codigo: '102',
          descricao: ev.descricao || 'Adicional',
          referencia: '-',
          valor: ev.valor
        });
      } else if (ev.tipo === 'falta') {
        faltasTotal += ev.valor;
        listaDescontos.push({
          codigo: '201',
          descricao: ev.descricao || 'Faltas / Atrasos',
          referencia: `${ev.quantidade}d`,
          valor: ev.valor
        });
      } else if (ev.tipo === 'desconto') {
        outrosDescontos += ev.valor;
        listaDescontos.push({
          codigo: '202',
          descricao: ev.descricao || 'Outros Descontos',
          referencia: '-',
          valor: ev.valor
        });
      }
    }

    const totalProventos = Number((emp.salario_base + horasExtrasTotal + adicionaisTotal).toFixed(2));
    const baseTributavel = Math.max(0, totalProventos - faltasTotal);

    // Cálculos previdenciários e fiscais
    const inss = calculateInss(baseTributavel);
    const irrf = calculateIrrf(baseTributavel, inss.valor, emp.dependentes);

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

    // Encargos da empresa (RF-055)
    const baseFgts = baseTributavel;
    const valorFgts = Number((baseFgts * aliqFgts).toFixed(2));
    const inssEmpresa = Number((baseTributavel * aliqInssPatronal).toFixed(2));
    const rat = Number((baseTributavel * aliqRat).toFixed(2));
    const terceiros = Number((baseTributavel * aliqTerceiros).toFixed(2));
    const totalEncargosItem = Number((valorFgts + inssEmpresa + rat + terceiros).toFixed(2));

    // Provisões mensais (RF-055)
    const provisoes = calculateProvisions(emp.salario_base);

    const detalhes = {
      empresa: 'Audicon Contabilidade & Gestão Empresarial Ltda',
      cnpj: '00.123.456/0001-78',
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
      provisoes
    };

    items.push({
      employee_id: emp.id,
      nome: emp.nome,
      cpf: emp.cpf,
      cargo: emp.cargo,
      salario_base: emp.salario_base,
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
      detalhes_json: JSON.stringify(detalhes)
    });

    folhaTotalProventos += totalProventos;
    folhaTotalDescontos += totalDescontos;
    folhaTotalLiquido += salarioLiquido;
    folhaTotalEncargos += totalEncargosItem;
    folhaTotalProvisoes += provisoes.totalProvisoesComEncargos;
  }

  const resumo = {
    competencia,
    tipo: 'mensal',
    status: 'rascunho',
    total_colaboradores: employees.length,
    total_proventos: Number(folhaTotalProventos.toFixed(2)),
    total_descontos: Number(folhaTotalDescontos.toFixed(2)),
    total_liquido: Number(folhaTotalLiquido.toFixed(2)),
    total_encargos: Number(folhaTotalEncargos.toFixed(2)),
    total_provisoes: Number(folhaTotalProvisoes.toFixed(2)),
    custo_total_empresa: Number((folhaTotalProventos + folhaTotalEncargos + folhaTotalProvisoes).toFixed(2)),
    itens: items
  };

  if (saveToDatabase) {
    const saveTransaction = db.transaction(() => {
      // Cria ou atualiza folha
      const existing = db.prepare(`
        SELECT id, status FROM payroll_runs WHERE competencia = ? AND tipo = 'mensal'
      `).get(competencia);

      let runId;
      if (existing) {
        runId = existing.id;
        db.prepare(`
          UPDATE payroll_runs
          SET total_proventos = ?, total_descontos = ?, total_liquido = ?,
              total_encargos = ?, total_provisoes = ?, updated_at = datetime('now', 'localtime')
          WHERE id = ?
        `).run(resumo.total_proventos, resumo.total_descontos, resumo.total_liquido, resumo.total_encargos, resumo.total_provisoes, runId);

        // Limpa itens anteriores para reprocessar
        db.prepare('DELETE FROM payroll_items WHERE payroll_run_id = ?').run(runId);
      } else {
        const result = db.prepare(`
          INSERT INTO payroll_runs (competencia, tipo, status, total_proventos, total_descontos, total_liquido, total_encargos, total_provisoes)
          VALUES (?, 'mensal', 'rascunho', ?, ?, ?, ?, ?)
        `).run(competencia, resumo.total_proventos, resumo.total_descontos, resumo.total_liquido, resumo.total_encargos, resumo.total_provisoes);
        runId = result.lastInsertRowid;
      }

      const insertItem = db.prepare(`
        INSERT INTO payroll_items (
          payroll_run_id, employee_id, salario_base, horas_extras_total, adicionais_total,
          faltas_total, desconto_inss, desconto_irrf, outros_descontos, total_proventos,
          total_descontos, salario_liquido, base_inss, base_fgts, valor_fgts,
          inss_patronal, provisao_13, provisao_ferias, detalhes_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const it of items) {
        insertItem.run(
          runId, it.employee_id, it.salario_base, it.horas_extras_total, it.adicionais_total,
          it.faltas_total, it.desconto_inss, it.desconto_irrf, it.outros_descontos, it.total_proventos,
          it.total_descontos, it.salario_liquido, it.base_inss, it.base_fgts, it.valor_fgts,
          it.inss_patronal, it.provisao_13, it.provisao_ferias, it.detalhes_json
        );
      }

      // Log de cálculo (RF-056)
      db.prepare(`
        INSERT INTO payroll_approval_logs (payroll_run_id, competencia, usuario, perfil, acao, detalhes)
        VALUES (?, ?, ?, 'RH/Admin', 'Cálculo de Folha', ?)
      `).run(runId, competencia, usuario, `Cálculo executado para ${items.length} empregados. Total Líquido: R$ ${resumo.total_liquido}`);

      resumo.runId = runId;
      if (existing) resumo.status = existing.status;
    });

    saveTransaction();
  }

  return resumo;
}

/**
 * Simulação de Férias individuais (RF-052)
 */
function calculateVacation(employeeId, diasGozo = 30) {
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId);
  if (!emp) throw new Error('Empregado não encontrado.');

  const proporcao = diasGozo / 30;
  const salarioFerias = Number((emp.salario_base * proporcao).toFixed(2));
  const tercoConstitucional = Number((salarioFerias / 3).toFixed(2));
  const totalBrutoFerias = Number((salarioFerias + tercoConstitucional).toFixed(2));

  const inss = calculateInss(totalBrutoFerias);
  const irrf = calculateIrrf(totalBrutoFerias, inss.valor, emp.dependentes);

  const totalDescontos = Number((inss.valor + irrf.valor).toFixed(2));
  const valorLiquido = Number((totalBrutoFerias - totalDescontos).toFixed(2));

  const aliqFgts = getSystemParameter('aliquota_fgts', 0.08);
  const valorFgts = Number((totalBrutoFerias * aliqFgts).toFixed(2));

  return {
    empregado: emp,
    diasGozo,
    salarioBase: emp.salario_base,
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

/**
 * Simulação de 13º Salário (RF-052)
 * parcela: '1' (adiantamento 50% sem descontos) ou '2' (quitação com descontos totais)
 */
function calculate13Salary(employeeId, parcela = '1', mesesTrabalhados = 12) {
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId);
  if (!emp) throw new Error('Empregado não encontrado.');

  const fracaoAno = mesesTrabalhados / 12;
  const valorIntegral = Number((emp.salario_base * fracaoAno).toFixed(2));

  if (parcela === '1') {
    // 1ª parcela: 50% do salário sem descontos previdenciários
    const valorAdiantamento = Number((valorIntegral * 0.5).toFixed(2));
    const aliqFgts = getSystemParameter('aliquota_fgts', 0.08);
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
    // 2ª parcela: Saldo restante (50%) com descontos sobre o valor integral
    const adiantamentoPago = Number((valorIntegral * 0.5).toFixed(2));
    const inssTotal = calculateInss(valorIntegral);
    const irrfTotal = calculateIrrf(valorIntegral, inssTotal.valor, emp.dependentes);

    const saldoBruto = Number((valorIntegral - adiantamentoPago).toFixed(2));
    const totalDescontos = Number((inssTotal.valor + irrfTotal.valor).toFixed(2));
    const liquido = Number((saldoBruto - totalDescontos).toFixed(2));

    const aliqFgts = getSystemParameter('aliquota_fgts', 0.08);
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

/**
 * Aprovação / Fechamento de Folha (RF-056 & RB-003)
 */
function approvePayroll(competencia, novoStatus, usuario, justificativa) {
  const run = db.prepare('SELECT * FROM payroll_runs WHERE competencia = ? AND tipo = ?').get(competencia, 'mensal');
  if (!run) {
    throw new Error('Folha não encontrada para esta competência. Calcule a folha primeiro.');
  }

  db.prepare(`
    UPDATE payroll_runs
    SET status = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(novoStatus, run.id);

  db.prepare(`
    INSERT INTO payroll_approval_logs (payroll_run_id, competencia, usuario, perfil, acao, detalhes)
    VALUES (?, ?, ?, 'RH/Admin', ?, ?)
  `).run(run.id, competencia, usuario, `Status alterado para ${novoStatus.toUpperCase()}`, justificativa || `Aprovação formal da competência ${competencia}`);

  return { success: true, status: novoStatus };
}

module.exports = {
  calculateMonthlyPayroll,
  calculateVacation,
  calculate13Salary,
  calculateInss,
  calculateIrrf,
  calculateProvisions,
  approvePayroll,
  getSystemParameter
};
