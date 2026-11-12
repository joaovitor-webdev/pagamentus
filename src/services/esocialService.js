const db = require('../db/database');
const { calculateMonthlyPayroll } = require('./payrollService');

/**
 * Serviço de Preparação e Exportação de Eventos no Padrão dos Sistemas Oficiais (eSocial Simulado)
 * Atende ao RF-054 e RB-010: apenas prepara arquivos para conferência sem transmissão externa.
 */

function generateEsocialPayload(competencia) {
  // Busca folha calculada ou simula
  const payroll = calculateMonthlyPayroll(competencia, false);

  const employees = db.prepare('SELECT * FROM employees ORDER BY id ASC').all();
  const leaves = db.prepare(`
    SELECT l.*, e.nome as employee_nome, e.cpf as employee_cpf
    FROM leaves l
    JOIN employees e ON l.employee_id = e.id
    ORDER BY l.data_inicio DESC
  `).all();

  const contractChanges = db.prepare(`
    SELECT cc.*, e.nome as employee_nome, e.cpf as employee_cpf
    FROM contract_changes cc
    JOIN employees e ON cc.employee_id = e.id
    ORDER BY cc.data_alteracao DESC
  `).all();

  // Cabeçalho institucional do empregador
  const empregador = {
    tpInsc: 1, // 1 = CNPJ
    nrInsc: '00123456000178',
    razaoSocial: 'Audicon Contabilidade & Gestão Empresarial Ltda',
    classificacaoTributaria: '99 - Pessoas Jurídicas em Geral',
    versaoLeiaute: 'S-1.2 (Simulado para Conferência)',
    ambiente: 'Homologação/Testes (Ambiente Local)',
    geradoEm: new Date().toISOString()
  };

  // Evento S-1000: Informações do Empregador
  const eventoS1000 = {
    eventoId: `ID100123456000178${competencia.replace('-', '')}00001`,
    tipoEvento: 'S-1000',
    descricao: 'Informações do Empregador / Contribuinte',
    ideEmpregador: {
      tpInsc: empregador.tpInsc,
      nrInsc: empregador.nrInsc
    },
    infoEmpregador: {
      nmRazao: empregador.razaoSocial,
      classTrib: '99',
      indCoop: 0,
      indConstr: 0,
      indDesFolha: 0
    }
  };

  // Evento S-2200: Cadastramento Inicial do Vínculo e Admissão
  const eventosS2200 = employees.map((emp, idx) => ({
    eventoId: `ID220000123456${String(emp.id).padStart(4, '0')}`,
    tipoEvento: 'S-2200',
    descricao: 'Cadastramento Inicial de Vínculo e Admissão',
    trabalhador: {
      cpfTrab: emp.cpf,
      nmTrab: emp.nome,
      qtdDependentes: emp.dependentes
    },
    vinculo: {
      matricula: `MAT-${String(emp.id).padStart(5, '0')}`,
      tpRegTrab: 1, // 1 = CLT
      tpRegPrev: 1, // 1 = RGPS
      dtAdm: emp.data_admissao,
      cargo: emp.cargo,
      remuneracao: {
        vrSalFx: emp.salario_base,
        undSalFixo: 7 // 7 = Por mês
      },
      duracao: {
        tpContr: 1 // 1 = Prazo indeterminado
      },
      localTrabalho: {
        jornada: emp.jornada
      },
      statusContrato: emp.status
    }
  }));

  // Evento S-2230: Afastamento Temporário
  const eventosS2230 = leaves.map((lv) => ({
    eventoId: `ID223000123456${String(lv.id).padStart(4, '0')}`,
    tipoEvento: 'S-2230',
    descricao: 'Afastamento Temporário',
    ideTrabalhador: {
      cpfTrab: lv.employee_cpf,
      nmTrab: lv.employee_nome
    },
    infoAfastamento: {
      dtIniAfast: lv.data_inicio,
      codMotAfast: lv.tipo,
      dtTermAfast: lv.data_fim || 'Aberto',
      observacao: lv.motivo || ''
    }
  }));

  // Evento S-1200: Remuneração do Trabalhador no Período de Apuração
  const eventosS1200 = payroll.itens.map((it) => {
    let detalhes = {};
    try {
      detalhes = JSON.parse(it.detalhes_json || '{}');
    } catch (e) {
      detalhes = {};
    }

    return {
      eventoId: `ID120000123456${competencia.replace('-', '')}${String(it.employee_id).padStart(4, '0')}`,
      tipoEvento: 'S-1200',
      descricao: 'Remuneração de Trabalhador vinculado ao RGPS',
      ideTrabalhador: {
        cpfTrab: it.cpf,
        nmTrab: it.nome,
        matricula: `MAT-${String(it.employee_id).padStart(5, '0')}`
      },
      dmDev: {
        ideDmDev: `DEMO-${competencia}-${it.employee_id}`,
        perApur: competencia,
        itensRemun: [
          ...(detalhes.proventos || []).map(p => ({
            codRubr: p.codigo,
            dscRubr: p.descricao,
            tpRubr: 1, // 1 = Vencimento / Provento
            vrRubr: p.valor
          })),
          ...(detalhes.descontos || []).map(d => ({
            codRubr: d.codigo,
            dscRubr: d.descricao,
            tpRubr: 2, // 2 = Desconto
            vrRubr: d.valor
          }))
        ],
        basesCalculo: {
          vrBcCp: it.base_inss, // Base da Previdência Social
          vrBcFgts: it.base_fgts,
          vrFgts: it.valor_fgts,
          vrInssPatronal: it.inss_patronal
        },
        totaisTrabalhador: {
          totalProventos: it.total_proventos,
          totalDescontos: it.total_descontos,
          liquidoAReceber: it.salario_liquido
        }
      }
    };
  });

  return {
    cabecalho: empregador,
    resumoFolha: {
      competencia,
      totalTrabalhadores: payroll.total_colaboradores,
      totalProventos: payroll.total_proventos,
      totalDescontos: payroll.total_descontos,
      totalLiquido: payroll.total_liquido,
      totalEncargos: payroll.total_encargos,
      totalProvisoes: payroll.total_provisoes
    },
    eventos: {
      S1000: eventoS1000,
      S2200: eventosS2200,
      S2230: eventosS2230,
      S1200: eventosS1200
    },
    avisoLegal: 'ESTE ARQUIVO FOI GERADO EXCLUSIVAMENTE PARA CONFERÊNCIA INTERNA E HOMOLOGAÇÃO (RF-054/RB-010). NÃO CONSTITUI TRANSMISSÃO DIRETA AO AMBIENTE NACIONAL DO ESOCIAL.'
  };
}

function generateEsocialTxt(competencia) {
  const json = generateEsocialPayload(competencia);
  const lines = [];

  lines.push('================================================================================');
  lines.push(`ARQUIVO DE CONFERÊNCIA OFICIAL DE FOLHA - SIMULAÇÃO ESOCIAL (RF-054)`);
  lines.push(`COMPETÊNCIA: ${competencia} | GERADO EM: ${new Date().toLocaleString('pt-BR')}`);
  lines.push(`EMPREGADOR: ${json.cabecalho.razaoSocial} (CNPJ: ${json.cabecalho.nrInsc})`);
  lines.push('================================================================================\n');

  lines.push(`--- [EVENTO S-1000: IDENTIFICAÇÃO DO EMPREGADOR] ---`);
  lines.push(`REG|S1000|${json.eventos.S1000.ideEmpregador.nrInsc}|${json.eventos.S1000.infoEmpregador.nmRazao}|CLT|TRIB-99`);
  lines.push('');

  lines.push(`--- [EVENTO S-2200: CADASTRO INICIAL E ADMISSÕES (${json.eventos.S2200.length} REGISTROS)] ---`);
  for (const s2200 of json.eventos.S2200) {
    lines.push(`REG|S2200|${s2200.vinculo.matricula}|${s2200.trabalhador.cpfTrab}|${s2200.trabalhador.nmTrab}|${s2200.vinculo.cargo}|R$ ${s2200.vinculo.remuneracao.vrSalFx.toFixed(2)}|${s2200.vinculo.dtAdm}|DEP:${s2200.trabalhador.qtdDependentes}`);
  }
  lines.push('');

  lines.push(`--- [EVENTO S-2230: AFASTAMENTOS E LICENÇAS (${json.eventos.S2230.length} REGISTROS)] ---`);
  for (const s2230 of json.eventos.S2230) {
    lines.push(`REG|S2230|${s2230.ideTrabalhador.cpfTrab}|${s2230.ideTrabalhador.nmTrab}|${s2230.infoAfastamento.codMotAfast}|INI:${s2230.infoAfastamento.dtIniAfast}|FIM:${s2230.infoAfastamento.dtTermAfast}|OBS:${s2230.infoAfastamento.observacao}`);
  }
  lines.push('');

  lines.push(`--- [EVENTO S-1200: REMUNERAÇÃO E RUBRICAS DA FOLHA (${json.eventos.S1200.length} COLABORADORES)] ---`);
  for (const s1200 of json.eventos.S1200) {
    lines.push(`REG|S1200|${s1200.ideTrabalhador.matricula}|${s1200.ideTrabalhador.cpfTrab}|${s1200.ideTrabalhador.nmTrab}`);
    for (const r of s1200.dmDev.itensRemun) {
      const tipo = r.tpRubr === 1 ? 'PROVENTO' : 'DESCONTO';
      lines.push(`  RUBR|${r.codRubr}|${r.dscRubr.padEnd(30, ' ')}|${tipo}|R$ ${r.vrRubr.toFixed(2)}`);
    }
    lines.push(`  TOTAIS|BRUTO: R$ ${s1200.dmDev.totaisTrabalhador.totalProventos.toFixed(2)} | DESC: R$ ${s1200.dmDev.totaisTrabalhador.totalDescontos.toFixed(2)} | LÍQUIDO: R$ ${s1200.dmDev.totaisTrabalhador.liquidoAReceber.toFixed(2)} | FGTS(8%): R$ ${s1200.dmDev.basesCalculo.vrFgts.toFixed(2)}`);
    lines.push('--------------------------------------------------------------------------------');
  }

  lines.push('\n--- [TOTALIZADOR GERAL DA FOLHA DA EMPRESA] ---');
  lines.push(`TOTAL BRUTO: R$ ${json.resumoFolha.totalProventos.toFixed(2)}`);
  lines.push(`TOTAL DESCONTOS: R$ ${json.resumoFolha.totalDescontos.toFixed(2)}`);
  lines.push(`TOTAL LÍQUIDO PAGO: R$ ${json.resumoFolha.totalLiquido.toFixed(2)}`);
  lines.push(`TOTAL ENCARGOS PATRONAIS: R$ ${json.resumoFolha.totalEncargos.toFixed(2)}`);
  lines.push(`TOTAL PROVISÕES (13º + FÉRIAS): R$ ${json.resumoFolha.totalProvisoes.toFixed(2)}`);
  lines.push('\n[FIM DO ARQUIVO]');

  return lines.join('\n');
}

module.exports = {
  generateEsocialPayload,
  generateEsocialTxt
};
