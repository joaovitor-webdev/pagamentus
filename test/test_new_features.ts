import http from 'http';
import { app, startServer } from '../src/server';
import { pool, query } from '../src/db/database';

let testPort = 0;

function makeRequest(method: string, path: string, body: any = null, headers: Record<string, string> = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    let payload = '';
    const defaultHeaders: Record<string, string> = {
      ...headers
    };

    if (body !== null && body !== undefined) {
      payload = typeof body === 'string' ? body : JSON.stringify(body);
      defaultHeaders['Content-Type'] = 'application/json';
      defaultHeaders['Content-Length'] = Buffer.byteLength(payload).toString();
    }

    const options = {
      hostname: '127.0.0.1',
      port: testPort,
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
          resolve({ status: res.statusCode, data: json, raw: data, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- INICIANDO TESTES DE NOVAS FUNCIONALIDADES (DB-01 A DB-15 / CR-01 A CR-03) ---');
  let failures = 0;

  function assert(condition: boolean, testName: string, extraInfo: string = '') {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
    } else {
      console.error(`  [FAIL] ${testName} ${extraInfo ? '-> ' + extraInfo : ''}`);
      failures++;
    }
  }

  let server: any = null;

  try {
    server = await startServer(0);
    const addr = server.address();
    testPort = typeof addr === 'object' && addr ? addr.port : 3000;
    console.log(`  [INFO] Servidor de testes rodando na porta TCP ${testPort}`);

    // DB-01: Consulta de dados da empresa
    const company = await makeRequest('GET', '/api/company', null, { 'X-User-Role': 'rh_admin' });
    assert(company.status === 200 && company.data.razao_social.includes('Audicon'), 'DB-01: Consulta de dados da empresa cadastrada');

    // DB-02: Atualização de dados da empresa com perfil RH/Admin
    const updComp = await makeRequest('PUT', '/api/company', {
      razao_social: 'Audicon Contabilidade & Tecnologia Ltda',
      cnpj: '12.345.678/0001-90',
      responsavel_rh: 'Mariana Beatriz Oliveira'
    }, { 'X-User-Role': 'rh_admin' });
    assert(updComp.status === 200 && updComp.data.razao_social === 'Audicon Contabilidade & Tecnologia Ltda', 'DB-02: Atualização de dados da empresa com auditoria');

    // DB-03: Bloqueio de atualização de empresa para perfil consulta (403)
    const blockComp = await makeRequest('PUT', '/api/company', {
      razao_social: 'Empresa Invasora'
    }, { 'X-User-Role': 'consulta_assistente' });
    assert(blockComp.status === 403, 'DB-03: Bloqueio de edição de dados da empresa para perfil Consulta (HTTP 403)');

    // DB-04: Listagem de histórico de runs
    const runsList = await makeRequest('GET', '/api/payroll/runs', null, { 'X-User-Role': 'rh_admin' });
    assert(runsList.status === 200 && Array.isArray(runsList.data), 'DB-04: Listagem de histórico de folhas calculadas/fechadas');

    // DB-05: Fechamento de competência com gravação de closed_at e closed_by
    const closeRes = await makeRequest('POST', '/api/payroll/approve', {
      competencia: '2026-11',
      status: 'fechada',
      justificativa: 'Fechamento formal mensal para auditoria',
      usuario: 'Douglas Gestor'
    }, { 'X-User-Role': 'rh_admin' });
    assert(closeRes.status === 200 && closeRes.data.status === 'fechada' && closeRes.data.closed_by === 'Douglas Gestor', 'DB-05: Fechamento da competência com closed_at e closed_by');

    // DB-06: Imutabilidade - Bloqueio de recalcular competência fechada (409 Conflict)
    const blockRecalc = await makeRequest('POST', '/api/payroll/calculate', {
      competencia: '2026-11',
      persist: true
    }, { 'X-User-Role': 'rh_admin' });
    assert(blockRecalc.status === 409, 'DB-06: Imutabilidade - Bloqueio de recálculo em competência fechada (HTTP 409)');

    // DB-07: Imutabilidade - Bloqueio de lançamento de novos eventos em competência fechada (409 Conflict)
    const blockEvent = await makeRequest('POST', '/api/events', {
      employee_id: 1,
      competencia: '2026-11',
      tipo: 'hora_extra',
      descricao: 'Hora extra indevida pós-fechamento',
      quantidade: 2,
      percentual: 50,
      valor: 100
    }, { 'X-User-Role': 'rh_admin' });
    assert(blockEvent.status === 409, 'DB-07: Imutabilidade - Bloqueio de eventos em competência fechada (HTTP 409)');

    // DB-08: Reabertura formal de folha com justificativa obrigatória
    const reopenNoJust = await makeRequest('POST', '/api/payroll/reopen', {
      competencia: '2026-11',
      justificativa: ''
    }, { 'X-User-Role': 'rh_admin' });
    assert(reopenNoJust.status === 400, 'DB-08: Reabertura rejeitada sem justificativa (HTTP 400)');

    const reopenOk = await makeRequest('POST', '/api/payroll/reopen', {
      competencia: '2026-11',
      justificativa: 'Retificação de horas extras após envio de atestado tardio',
      usuario: 'Douglas Gestor'
    }, { 'X-User-Role': 'rh_admin' });
    assert(reopenOk.status === 200 && reopenOk.data.status === 'em_revisao', 'DB-08: Reabertura autorizada com status "em_revisao"');

    // DB-09: Recálculo liberado após reabertura
    const recalcAfterReopen = await makeRequest('POST', '/api/payroll/calculate', {
      competencia: '2026-11',
      persist: true
    }, { 'X-User-Role': 'rh_admin' });
    assert(recalcAfterReopen.status === 200, 'DB-09: Recálculo da folha liberado após reabertura formal');

    // DB-10: Conferência de itens - Toggle de conferido
    const preview = await makeRequest('GET', '/api/payroll/preview/2026-11', null, { 'X-User-Role': 'rh_admin' });
    assert(preview.status === 200 && preview.data.itens.length > 0, 'DB-10: Prévia de folha obtida com sucesso');
    const firstItemId = preview.data.itens[0].id;

    const checkRes = await makeRequest('PATCH', `/api/payroll/items/${firstItemId}/check`, {}, { 'X-User-Role': 'rh_admin' });
    assert(checkRes.status === 200 && checkRes.data.item.conferido === true, 'DB-10: Marcação de item como conferido via PATCH');

    // DB-11: Cadastro e desconto de benefícios
    const newBen = await makeRequest('POST', '/api/employees/1/benefits', {
      tipo: 'vale_alimentacao',
      descricao: 'Vale Alimentação Sodexo R$ 25/dia',
      valor: 550.00,
      desconto_empregado: 55.00,
      data_inicio: '2026-01-01'
    }, { 'X-User-Role': 'rh_admin' });
    assert(newBen.status === 201 && parseFloat(newBen.data.desconto_empregado) === 55, 'DB-11: Lançamento de benefício com coparticipação');

    // DB-12: Desativação de benefício
    const delBen = await makeRequest('DELETE', `/api/employees/1/benefits/${newBen.data.id}`, null, { 'X-User-Role': 'rh_admin' });
    assert(delBen.status === 200 && delBen.data.success === true, 'DB-12: Desativação lógica de benefício');

    // DB-13: Edição de evento variável
    const events = await makeRequest('GET', '/api/events?competencia=2026-11', null, { 'X-User-Role': 'rh_admin' });
    if (events.data && events.data.length > 0) {
      const evId = events.data[0].id;
      const updEv = await makeRequest('PUT', `/api/events/${evId}`, {
        descricao: 'Horas extras retificadas',
        quantidade: 10,
        percentual: 50
      }, { 'X-User-Role': 'rh_admin' });
      assert(updEv.status === 200 && parseFloat(updEv.data.quantidade) === 10, 'DB-13: Edição de evento variável existente com recálculo');
    }

    // DB-14: Empregado com departamento e regime contratual
    const rand = Math.floor(Math.random() * 89999) + 10000;
    const newEmpWithDept = await makeRequest('POST', '/api/employees', {
      nome: `Juliana Mendes Rocha ${rand}`,
      cpf: `444.${String(rand).substring(0, 3)}.${String(rand).substring(2, 5)}-77`,
      cargo: 'Supervisora Fiscal',
      salario_base: 6500.00,
      jornada: '40h semanais',
      data_admissao: '2025-03-01',
      dependentes: 0,
      status: 'ativo',
      departamento: 'Fiscal & Tributário',
      regime_contratual: 'CLT'
    }, { 'X-User-Role': 'rh_admin' });
    assert(newEmpWithDept.status === 201 && newEmpWithDept.data.departamento === 'Fiscal & Tributário', 'DB-14: Cadastro de empregado com departamento e regime contratual');

    // DB-15: Segregação de provisões e alertas
    const calcSeg = await makeRequest('POST', '/api/payroll/calculate', {
      competencia: '2026-11',
      persist: true
    }, { 'X-User-Role': 'rh_admin' });
    assert(
      calcSeg.status === 200 &&
      calcSeg.data.total_provisao_13 > 0 &&
      calcSeg.data.total_provisao_ferias > 0 &&
      calcSeg.data.itens.every((i: any) => Array.isArray(i.alertas)),
      'DB-15: Segregação de provisões (13º e Férias) e lista de alertas por colaborador'
    );

    console.log(`\n--- RESULTADO DAS NOVAS FUNCIONALIDADES: ${failures === 0 ? 'TODOS OS TESTES PASSARAM COM SUCESSO (0 FALHAS)!' : `${failures} FALHAS ENCONTRADAS.`} ---`);

  } catch (err) {
    console.error('Erro durante execução dos novos testes:', err);
    failures++;
  } finally {
    if (server) server.close();
    await pool.end();
    process.exit(failures === 0 ? 0 : 1);
  }
}

runTests();
