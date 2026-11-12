const { app, server } = require('../server');
const http = require('http');

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path,
      method,
      headers: defaultHeaders
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- INICIANDO TESTES AUTOMATIZADOS (SPEC-4.1) ---');
  let failures = 0;

  function assert(condition, testName, extraInfo = '') {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
    } else {
      console.error(`  [FAIL] ${testName} ${extraInfo ? '-> ' + extraInfo : ''}`);
      failures++;
    }
  }

  try {
    // 1. Healthcheck
    const health = await makeRequest('GET', '/api/health');
    assert(health.status === 200 && health.data.status === 'online', 'Healthcheck da API');

    // 2. RF-051: Listar empregados fictícios populados na inicialização (LGPD)
    const emps = await makeRequest('GET', '/api/employees', null, { 'X-User-Role': 'rh_admin' });
    assert(emps.status === 200 && Array.isArray(emps.data) && emps.data.length >= 3, 'RF-051: Empregados iniciais populados automaticamente (LGPD)');

    // 3. RF-051: Criar novo empregado com CPF único
    const randomSuffix = Math.floor(Math.random() * 8999) + 1000;
    const testCpf = `999.${String(randomSuffix).substring(0, 3)}.${String(randomSuffix).substring(1, 4)}-88`;

    const newEmp = await makeRequest('POST', '/api/employees', {
      nome: `Colaborador Teste ${randomSuffix}`,
      cpf: testCpf,
      cargo: 'Técnico Contábil',
      salario_base: 3200.00,
      jornada: '40h semanais',
      data_admissao: '2025-01-15',
      dependentes: 1,
      status: 'ativo'
    }, { 'X-User-Role': 'rh_admin' });
    assert(newEmp.status === 201 && newEmp.data.id, 'RF-051: Criação de novo empregado com validação de campos', JSON.stringify(newEmp.data));

    const createdId = newEmp.data.id;

    // 4. RF-051: Atualizar empregado
    const updEmp = await makeRequest('PUT', `/api/employees/${createdId}`, {
      salario_base: 3400.00,
      cargo: 'Técnico Contábil Sênior'
    }, { 'X-User-Role': 'rh_admin' });
    assert(updEmp.status === 200 && updEmp.data.salario_base === 3400, 'RF-051: Atualização cadastral e registro de histórico salarial');

    // 5. RF-053: Registrar evento variável (horas extras)
    const ev = await makeRequest('POST', '/api/events', {
      employee_id: createdId,
      competencia: '2026-11',
      tipo: 'hora_extra',
      descricao: 'Horas extras de teste',
      quantidade: 5,
      percentual: 50,
      valor: 0 // auto cálculo
    }, { 'X-User-Role': 'rh_admin' });
    assert(ev.status === 201 && ev.data.valor > 0, 'RF-053: Lançamento de horas extras com cálculo automático');

    // 6. RF-053: Registrar afastamento
    const leave = await makeRequest('POST', `/api/employees/${createdId}/leaves`, {
      tipo: 'Médico/Doença',
      data_inicio: '2026-11-01',
      data_fim: '2026-11-03',
      motivo: 'Atestado médico de 3 dias'
    }, { 'X-User-Role': 'rh_admin' });
    assert(leave.status === 201 && leave.data.id, 'RF-053: Registro de afastamento temporário vinculado ao empregado');

    // 7. RF-052: Cálculo de Folha Mensal
    const calc = await makeRequest('POST', '/api/payroll/calculate', {
      competencia: '2026-11',
      persist: true
    }, { 'X-User-Role': 'rh_admin' });
    assert(calc.status === 200 && calc.data.total_liquido > 0 && calc.data.itens.length >= 4, 'RF-052: Cálculo de Folha Mensal com proventos e deduções');

    // 8. RF-052: Simulação de Férias
    const vac = await makeRequest('GET', `/api/payroll/vacation?employee_id=${createdId}&dias=30`, null, { 'X-User-Role': 'rh_admin' });
    assert(vac.status === 200 && vac.data.tercoConstitucional > 0 && vac.data.valorLiquido > 0, 'RF-052: Simulação de férias com 1/3 constitucional');

    // 9. RF-052: Simulação de 13º Salário
    const dec = await makeRequest('GET', `/api/payroll/13th?employee_id=${createdId}&parcela=1`, null, { 'X-User-Role': 'rh_admin' });
    assert(dec.status === 200 && dec.data.valorLiquido === dec.data.valorIntegral / 2, 'RF-052: Simulação de 1ª parcela do 13º sem descontos');

    // 10. RF-055: Geração de Recibo / Holerite e Provisões
    const receipt = await makeRequest('GET', `/api/payroll/receipt/2026-11/${createdId}`, null, { 'X-User-Role': 'rh_admin' });
    assert(receipt.status === 200 && receipt.data.totais.salarioLiquido > 0 && receipt.data.bases.salarioBase > 0, 'RF-055: Geração e visualização de holerite formatado');

    // 11. RF-054: Preparação e exportação de arquivo estruturado oficial (eSocial Simulado)
    const esocialPreview = await makeRequest('GET', '/api/esocial/preview/2026-11', null, { 'X-User-Role': 'rh_admin' });
    assert(esocialPreview.status === 200 && esocialPreview.data.eventos.S1000 && esocialPreview.data.eventos.S1200, 'RF-054: Estruturação dos eventos oficiais (S-1000, S-2200, S-1200)');

    const esocialTxt = await makeRequest('GET', '/api/esocial/download/2026-11?format=txt', null, { 'X-User-Role': 'rh_admin' });
    assert(esocialTxt.status === 200 && esocialTxt.raw.includes('ARQUIVO DE CONFERÊNCIA OFICIAL'), 'RF-054: Download do arquivo estruturado para conferência');

    // 12. RF-056: Controle de Acesso e Mascaramento para Perfil Consulta/Assistente
    const maskedEmps = await makeRequest('GET', '/api/employees', null, { 'X-User-Role': 'consulta_assistente' });
    const firstEmp = maskedEmps.data[0];
    assert(firstEmp.salario_base === 'R$ *****,**', 'RF-056: Salário base mascarado na API para perfil Consulta');
    assert(firstEmp.cpf.includes('***'), 'RF-056: CPF mascarado na API para perfil Consulta');

    const maskedReceipt = await makeRequest('GET', `/api/payroll/receipt/2026-11/${createdId}`, null, { 'X-User-Role': 'consulta_assistente' });
    assert(maskedReceipt.data.totais.salarioLiquido === 'R$ *****,**', 'RF-056: Valores do holerite mascarados para perfil Consulta');

    // 13. RF-056: Bloqueio de aprovação para Perfil Consulta (403 Forbidden)
    const blockApprove = await makeRequest('POST', '/api/payroll/approve', {
      competencia: '2026-11',
      status: 'aprovada'
    }, { 'X-User-Role': 'consulta_assistente' });
    assert(blockApprove.status === 403, 'RF-056: Bloqueio de aprovação de folha para perfil não autorizado (HTTP 403)');

    // 14. RF-056: Aprovação autorizada com Perfil RH/Admin e gravação na trilha de auditoria
    const okApprove = await makeRequest('POST', '/api/payroll/approve', {
      competencia: '2026-11',
      status: 'aprovada',
      justificativa: 'Aprovação final pelo gestor de RH'
    }, { 'X-User-Role': 'rh_admin' });
    assert(okApprove.status === 200 && okApprove.data.success, 'RF-056: Aprovação permitida para perfil RH/Admin');

    const logs = await makeRequest('GET', '/api/payroll/audit-logs', null, { 'X-User-Role': 'rh_admin' });
    assert(logs.status === 200 && logs.data.length > 0, 'RF-056: Trilha de auditoria e aprovação gravada com sucesso');

    console.log(`\n--- RESULTADO: ${failures === 0 ? 'TODOS OS TESTES PASSARAM COM SUCESSO (0 FALHAS)!' : `${failures} FALHAS ENCONTRADAS.`} ---`);

  } catch (err) {
    console.error('Erro durante execução dos testes:', err);
    failures++;
  } finally {
    server.close();
    process.exit(failures === 0 ? 0 : 1);
  }
}

// Aguarda o servidor subir e roda os testes
setTimeout(runTests, 500);
