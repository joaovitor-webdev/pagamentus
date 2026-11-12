/**
 * Frontend SPA - Módulo Item 4: Folha de Pagamento e Atendimento (SPEC-4.1)
 * Vanilla JS modular, sem build complexo.
 */

// Estado global da aplicação
const state = {
  activeTab: 'dashboard',
  currentRole: localStorage.getItem('user_role') || 'rh_admin',
  currentCompetencia: '2026-11',
  employees: [],
  payrollData: null,
  activeHoleriteEmpId: null
};

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', () => {
  setupRoleSelector();
  setupTabNavigation();
  initCompetenceInputs();
  loadEmployees();
  loadDashboardData();
});

// Configura o seletor de perfil simulado (RF-056)
function setupRoleSelector() {
  const selector = document.getElementById('role-selector');
  const badge = document.getElementById('role-badge');

  selector.value = state.currentRole;
  updateRoleVisuals(state.currentRole);

  selector.addEventListener('change', (e) => {
    state.currentRole = e.target.value;
    localStorage.setItem('user_role', state.currentRole);
    updateRoleVisuals(state.currentRole);
    showAlert(`Perfil alternado para: ${state.currentRole === 'rh_admin' ? 'RH / Admin (Acesso Total)' : 'Consulta / Assistente (Dados Mascarados)'}`, 'info');

    // Recarrega os dados da aba atual com a nova regra de mascaramento
    refreshActiveTabData();
  });
}

function updateRoleVisuals(role) {
  const badge = document.getElementById('role-badge');
  const approvalContainer = document.getElementById('approval-actions-container');

  if (role === 'rh_admin') {
    badge.className = 'text-xs px-2.5 py-1 rounded-md font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300';
    badge.innerText = '🛡️ Acesso Total';
    if (approvalContainer) {
      approvalContainer.style.display = 'flex';
    }
  } else {
    badge.className = 'text-xs px-2.5 py-1 rounded-md font-semibold bg-amber-100 text-amber-800 border border-amber-300';
    badge.innerText = '👁️ Dados Mascarados (LGPD)';
    if (approvalContainer) {
      // No perfil consulta, desabilita visualmente e exibe aviso de restrição (RF-056)
      approvalContainer.innerHTML = `
        <span class="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
          🔒 Aprovação restrita ao perfil RH/Admin
        </span>
      `;
    }
  }
}

// Interceptor de requisições com header de papel (RF-056)
async function apiFetch(url, options = {}) {
  const headers = options.headers || {};
  headers['X-User-Role'] = state.currentRole;
  options.headers = headers;

  const response = await fetch(url, options);

  if (!response.ok) {
    let errorMsg = 'Erro na requisição.';
    try {
      const errJson = await response.json();
      errorMsg = errJson.error || errorMsg;
    } catch (e) {
      errorMsg = await response.text();
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

// Configura navegação por abas
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });
}

function switchTab(tabId) {
  state.activeTab = tabId;

  // Atualiza botões
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.className = 'tab-btn px-3 py-2 text-sm font-semibold rounded-lg text-blue-600 bg-blue-50 transition-all flex items-center space-x-1.5';
    } else {
      btn.className = 'tab-btn px-3 py-2 text-sm font-medium rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center space-x-1.5';
    }
  });

  // Atualiza painéis
  document.querySelectorAll('.tab-content').forEach(panel => {
    panel.classList.add('hidden');
  });

  const activePanel = document.getElementById(`tab-${tabId}`);
  if (activePanel) {
    activePanel.classList.remove('hidden');
  }

  refreshActiveTabData();
}

function initCompetenceInputs() {
  const comp = state.currentCompetencia;
  ['events-competencia', 'payroll-competencia', 'receipt-competencia', 'esocial-competencia', 'event-competencia'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = comp;
  });

  // Listeners para sincronizar competência
  ['events-competencia', 'payroll-competencia', 'esocial-competencia'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', (e) => {
        state.currentCompetencia = e.target.value;
        syncCompetenceInputs(e.target.value);
        refreshActiveTabData();
      });
    }
  });
}

function syncCompetenceInputs(value) {
  ['events-competencia', 'payroll-competencia', 'receipt-competencia', 'esocial-competencia'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });
  const label = document.getElementById('dash-comp-label');
  if (label) label.innerText = value;
}

function refreshActiveTabData() {
  switch (state.activeTab) {
    case 'dashboard':
      loadDashboardData();
      break;
    case 'employees':
      loadEmployees();
      break;
    case 'events':
      loadVariableEvents();
      break;
    case 'payroll':
      loadPayrollPreview();
      break;
    case 'receipts':
      loadReceipt();
      break;
    case 'esocial':
      loadEsocialPreview();
      break;
    case 'audit':
      loadAuditLogs();
      loadParameters();
      break;
  }
}

// ==================== DASHBOARD ====================

async function loadDashboardData() {
  try {
    const employees = await apiFetch('/api/employees');
    state.employees = employees;
    document.getElementById('dash-colaboradores').innerText = employees.length;

    const payroll = await apiFetch(`/api/payroll/preview/${state.currentCompetencia}`);
    state.payrollData = payroll;

    document.getElementById('dash-proventos').innerText = formatCurrency(payroll.total_proventos);
    document.getElementById('dash-encargos').innerText = formatCurrency(payroll.total_encargos);
    document.getElementById('dash-provisoes').innerText = formatCurrency(payroll.total_provisoes);
    document.getElementById('dash-folha-status').innerText = (payroll.status || 'rascunho').toUpperCase();

    const statusBadge = document.getElementById('dash-folha-status');
    if (payroll.status === 'aprovada') {
      statusBadge.className = 'font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200';
    } else if (payroll.status === 'fechada') {
      statusBadge.className = 'font-semibold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-300';
    } else {
      statusBadge.className = 'font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200';
    }
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
  }
}

// ==================== EMPREGADOS & CONTRATOS (RF-051) ====================

async function loadEmployees() {
  try {
    const employees = await apiFetch('/api/employees');
    state.employees = employees;
    renderEmployeesTable(employees);
    populateEmployeeDropdowns(employees);
  } catch (error) {
    showAlert(`Erro ao listar empregados: ${error.message}`, 'error');
  }
}

function renderEmployeesTable(employees) {
  const tbody = document.getElementById('employees-table-body');
  if (!employees || employees.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="py-6 text-center text-slate-400">Nenhum empregado cadastrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = employees.map(emp => {
    let statusClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (emp.status === 'afastado') statusClass = 'bg-amber-100 text-amber-800 border-amber-200';
    if (emp.status === 'inativo') statusClass = 'bg-slate-100 text-slate-600 border-slate-200';

    return `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="py-3 px-4 font-semibold text-slate-900">${escapeHtml(emp.nome)}</td>
        <td class="py-3 px-4 font-mono text-xs text-slate-600">${escapeHtml(emp.cpf)}</td>
        <td class="py-3 px-4 text-slate-700">${escapeHtml(emp.cargo)}</td>
        <td class="py-3 px-4 font-semibold text-slate-900">${formatCurrency(emp.salario_base)}</td>
        <td class="py-3 px-4 text-xs text-slate-600">${escapeHtml(emp.jornada)}</td>
        <td class="py-3 px-4 text-xs text-slate-600">${formatDate(emp.data_admissao)}</td>
        <td class="py-3 px-4 text-center font-medium">${emp.dependentes || 0}</td>
        <td class="py-3 px-4">
          <span class="text-xs px-2 py-0.5 rounded-full font-semibold border ${statusClass}">
            ${escapeHtml(emp.status)}
          </span>
        </td>
        <td class="py-3 px-4 text-right space-x-1 whitespace-nowrap">
          <button onclick="editEmployee(${emp.id})" class="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200">
            Editar
          </button>
          <button onclick="openLeaveModalFor(${emp.id})" class="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200">
            Licença
          </button>
          <button onclick="deleteEmployee(${emp.id})" class="px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200">
            Inativar
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function populateEmployeeDropdowns(employees) {
  const selectors = ['event-emp-id', 'leave-emp-id', 'receipt-emp-selector', 'sim-emp-id'];
  selectors.forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = '<option value="">Selecione o colaborador...</option>' +
      employees.map(e => `<option value="${e.id}">${escapeHtml(e.nome)} (${e.cargo})</option>`).join('');
    if (currentVal) sel.value = currentVal;
  });

  // Se o seletor de holerite estiver vazio e houver empregados, seleciona o primeiro
  const receiptSel = document.getElementById('receipt-emp-selector');
  if (receiptSel && !receiptSel.value && employees.length > 0) {
    receiptSel.value = employees[0].id;
  }
}

function openEmployeeModal(emp = null) {
  const modal = document.getElementById('modal-employee');
  const title = document.getElementById('modal-employee-title');
  const form = document.getElementById('form-employee');

  form.reset();
  if (emp) {
    title.innerText = 'Editar Empregado';
    document.getElementById('emp-id').value = emp.id;
    document.getElementById('emp-nome').value = emp.nome;
    document.getElementById('emp-cpf').value = emp.cpf;
    document.getElementById('emp-cargo').value = emp.cargo;
    document.getElementById('emp-salario').value = typeof emp.salario_base === 'number' ? emp.salario_base : '';
    document.getElementById('emp-jornada').value = emp.jornada;
    document.getElementById('emp-admissao').value = emp.data_admissao;
    document.getElementById('emp-dependentes').value = emp.dependentes || 0;
    document.getElementById('emp-status').value = emp.status;
  } else {
    title.innerText = 'Novo Empregado';
    document.getElementById('emp-id').value = '';
    document.getElementById('emp-dependentes').value = 0;
    document.getElementById('emp-status').value = 'ativo';
  }

  modal.classList.remove('hidden');
}

function closeEmployeeModal() {
  document.getElementById('modal-employee').classList.add('hidden');
}

async function editEmployee(id) {
  try {
    const emp = await apiFetch(`/api/employees/${id}`);
    openEmployeeModal(emp);
  } catch (error) {
    showAlert(`Erro ao obter empregado: ${error.message}`, 'error');
  }
}

async function handleEmployeeSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('emp-id').value;
  const payload = {
    nome: document.getElementById('emp-nome').value,
    cpf: document.getElementById('emp-cpf').value,
    cargo: document.getElementById('emp-cargo').value,
    salario_base: parseFloat(document.getElementById('emp-salario').value),
    jornada: document.getElementById('emp-jornada').value,
    data_admissao: document.getElementById('emp-admissao').value,
    dependentes: parseInt(document.getElementById('emp-dependentes').value, 10) || 0,
    status: document.getElementById('emp-status').value
  };

  try {
    if (id) {
      await apiFetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      showAlert('Empregado atualizado com sucesso!', 'success');
    } else {
      await apiFetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      showAlert('Empregado cadastrado com sucesso!', 'success');
    }

    closeEmployeeModal();
    loadEmployees();
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

async function deleteEmployee(id) {
  if (!confirm('Deseja realmente inativar este colaborador do quadro? O histórico contábil será preservado.')) return;

  try {
    await apiFetch(`/api/employees/${id}`, { method: 'DELETE' });
    showAlert('Empregado inativado com sucesso.', 'success');
    loadEmployees();
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

// ==================== EVENTOS VARIÁVEIS & AFASTAMENTOS (RF-053) ====================

function toggleEventsSubtab(subtab) {
  ['rubricas', 'afastamentos', 'contratuais'].forEach(name => {
    const panel = document.getElementById(`subtab-${name}`);
    const btn = document.getElementById(`subtab-btn-${name}`);
    if (name === subtab) {
      panel.classList.remove('hidden');
      btn.className = 'px-3 py-1.5 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg';
    } else {
      panel.classList.add('hidden');
      btn.className = 'px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg';
    }
  });

  if (subtab === 'afastamentos') loadLeaves();
  if (subtab === 'contratuais') loadContractChanges();
}

async function loadVariableEvents() {
  const comp = document.getElementById('events-competencia').value || state.currentCompetencia;
  try {
    const events = await apiFetch(`/api/events?competencia=${comp}`);
    renderVariableEventsTable(events);
  } catch (error) {
    showAlert(`Erro ao listar eventos: ${error.message}`, 'error');
  }
}

function renderVariableEventsTable(events) {
  const tbody = document.getElementById('variable-events-table-body');
  if (!events || events.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-slate-400">Nenhum evento registrado nesta competência.</td></tr>`;
    return;
  }

  tbody.innerHTML = events.map(ev => {
    let tipoBadge = 'bg-blue-100 text-blue-800';
    if (ev.tipo === 'falta') tipoBadge = 'bg-rose-100 text-rose-800';
    if (ev.tipo === 'adicional') tipoBadge = 'bg-emerald-100 text-emerald-800';
    if (ev.tipo === 'desconto') tipoBadge = 'bg-amber-100 text-amber-800';

    return `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="py-3 px-4 font-semibold text-slate-900">${escapeHtml(ev.employee_nome)}</td>
        <td class="py-3 px-4">
          <span class="text-xs px-2 py-0.5 rounded font-semibold ${tipoBadge}">
            ${escapeHtml(ev.tipo.replace('_', ' ').toUpperCase())}
          </span>
        </td>
        <td class="py-3 px-4 text-slate-700">${escapeHtml(ev.descricao)}</td>
        <td class="py-3 px-4 text-center font-medium">${ev.quantidade || '-'}</td>
        <td class="py-3 px-4 text-center text-xs text-slate-500">${ev.percentual ? ev.percentual + '%' : '-'}</td>
        <td class="py-3 px-4 font-bold text-slate-900">${formatCurrency(ev.valor)}</td>
        <td class="py-3 px-4 text-right">
          <button onclick="deleteEvent(${ev.id})" class="px-2 py-1 text-xs text-rose-600 hover:text-rose-800 font-medium">
            Excluir
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openEventModal() {
  document.getElementById('form-event').reset();
  document.getElementById('event-competencia').value = state.currentCompetencia;
  document.getElementById('event-perc').value = 50;
  document.getElementById('modal-event').classList.remove('hidden');
}

function closeEventModal() {
  document.getElementById('modal-event').classList.add('hidden');
}

function adjustEventFields() {
  const tipo = document.getElementById('event-tipo').value;
  const labelQtd = document.getElementById('label-event-qtd');
  const percInput = document.getElementById('event-perc');

  if (tipo === 'hora_extra') {
    labelQtd.innerText = 'Horas (Qtd)';
    percInput.disabled = false;
    percInput.value = 50;
  } else if (tipo === 'falta') {
    labelQtd.innerText = 'Dias (Qtd)';
    percInput.disabled = true;
    percInput.value = 0;
  } else {
    labelQtd.innerText = 'Qtd / Referência';
    percInput.disabled = true;
    percInput.value = 0;
  }
}

async function handleEventSubmit(e) {
  e.preventDefault();
  const payload = {
    employee_id: parseInt(document.getElementById('event-emp-id').value, 10),
    competencia: document.getElementById('event-competencia').value,
    tipo: document.getElementById('event-tipo').value,
    descricao: document.getElementById('event-descricao').value,
    quantidade: parseFloat(document.getElementById('event-qtd').value) || 0,
    percentual: parseFloat(document.getElementById('event-perc').value) || 0,
    valor: parseFloat(document.getElementById('event-valor').value) || 0
  };

  try {
    await apiFetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    showAlert('Evento variável registrado!', 'success');
    closeEventModal();
    loadVariableEvents();
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

async function deleteEvent(id) {
  if (!confirm('Deseja excluir este evento?')) return;
  try {
    await apiFetch(`/api/events/${id}`, { method: 'DELETE' });
    showAlert('Evento excluído.', 'success');
    loadVariableEvents();
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

// Afastamentos e Licenças (RF-053)
async function loadLeaves() {
  try {
    const leaves = await apiFetch('/api/events/leaves');
    const tbody = document.getElementById('leaves-table-body');
    if (!leaves || leaves.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400">Nenhum afastamento registrado.</td></tr>`;
      return;
    }
    tbody.innerHTML = leaves.map(l => `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="py-3 px-4 font-semibold text-slate-900">${escapeHtml(l.employee_nome)}</td>
        <td class="py-3 px-4 font-medium text-amber-700">${escapeHtml(l.tipo)}</td>
        <td class="py-3 px-4 text-slate-600">${formatDate(l.data_inicio)}</td>
        <td class="py-3 px-4 text-slate-600">${l.data_fim ? formatDate(l.data_fim) : '<span class="text-emerald-600 font-semibold">Em aberto</span>'}</td>
        <td class="py-3 px-4 text-xs text-slate-500">${escapeHtml(l.motivo || '-')}</td>
      </tr>
    `).join('');
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

function openLeaveModal() {
  document.getElementById('form-leave').reset();
  document.getElementById('modal-leave').classList.remove('hidden');
}

function openLeaveModalFor(empId) {
  openLeaveModal();
  document.getElementById('leave-emp-id').value = empId;
}

function closeLeaveModal() {
  document.getElementById('modal-leave').classList.add('hidden');
}

async function handleLeaveSubmit(e) {
  e.preventDefault();
  const empId = document.getElementById('leave-emp-id').value;
  const payload = {
    tipo: document.getElementById('leave-tipo').value,
    data_inicio: document.getElementById('leave-inicio').value,
    data_fim: document.getElementById('leave-fim').value || null,
    motivo: document.getElementById('leave-motivo').value
  };

  try {
    await apiFetch(`/api/employees/${empId}/leaves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    showAlert('Afastamento registrado com sucesso!', 'success');
    closeLeaveModal();
    loadLeaves();
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

// Histórico Contratual (RF-053)
async function loadContractChanges() {
  try {
    const changes = await apiFetch('/api/events/contract-changes');
    const tbody = document.getElementById('contract-changes-table-body');
    if (!changes || changes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-slate-400">Nenhuma alteração contratual registrada.</td></tr>`;
      return;
    }
    tbody.innerHTML = changes.map(cc => `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="py-3 px-4 font-semibold text-slate-900">${escapeHtml(cc.employee_nome)}</td>
        <td class="py-3 px-4 text-xs text-slate-500">${formatDate(cc.data_alteracao)}</td>
        <td class="py-3 px-4 font-medium text-blue-700">${escapeHtml(cc.tipo_alteracao)}</td>
        <td class="py-3 px-4 text-xs text-slate-600">${escapeHtml(cc.descricao)}</td>
        <td class="py-3 px-4 text-slate-500">${cc.salario_anterior ? formatCurrency(cc.salario_anterior) : '-'}</td>
        <td class="py-3 px-4 font-semibold text-slate-900">${formatCurrency(cc.novo_salario)}</td>
      </tr>
    `).join('');
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

// ==================== CÁLCULO DE FOLHA & MEMÓRIA (RF-052) ====================

async function calculatePayroll(persist = true) {
  const comp = document.getElementById('payroll-competencia').value || state.currentCompetencia;
  try {
    const result = await apiFetch('/api/payroll/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ competencia: comp, persist, usuario: 'Douglas (RH)' })
    });

    state.payrollData = result;
    renderPayrollResults(result);
    showAlert(`Folha de pagamento calculada para a competência ${comp}!`, 'success');
  } catch (error) {
    showAlert(`Erro no cálculo de folha: ${error.message}`, 'error');
  }
}

async function loadPayrollPreview() {
  const comp = document.getElementById('payroll-competencia').value || state.currentCompetencia;
  try {
    const result = await apiFetch(`/api/payroll/preview/${comp}`);
    state.payrollData = result;
    renderPayrollResults(result);
  } catch (error) {
    showAlert(`Erro ao obter prévia da folha: ${error.message}`, 'error');
  }
}

function renderPayrollResults(payroll) {
  document.getElementById('tot-proventos').innerText = formatCurrency(payroll.total_proventos);
  document.getElementById('tot-descontos').innerText = formatCurrency(payroll.total_descontos);
  document.getElementById('tot-liquido').innerText = formatCurrency(payroll.total_liquido);
  document.getElementById('tot-encargos').innerText = formatCurrency(payroll.total_encargos);
  document.getElementById('tot-provisoes').innerText = formatCurrency(payroll.total_provisoes);

  const statusBadge = document.getElementById('payroll-status-badge');
  const status = payroll.status || 'rascunho';
  statusBadge.innerText = status.toUpperCase();

  if (status === 'aprovada') {
    statusBadge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300';
  } else if (status === 'fechada') {
    statusBadge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300';
  } else {
    statusBadge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300';
  }

  const tbody = document.getElementById('payroll-items-table-body');
  if (!payroll.itens || payroll.itens.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="py-8 text-center text-slate-400">Nenhum item calculado.</td></tr>`;
    return;
  }

  tbody.innerHTML = payroll.itens.map(it => `
    <tr class="hover:bg-slate-50 transition-colors">
      <td class="py-3 px-4 font-semibold text-slate-900">${escapeHtml(it.nome)}</td>
      <td class="py-3 px-4 text-slate-600">${formatCurrency(it.salario_base)}</td>
      <td class="py-3 px-4 font-medium text-slate-900">${formatCurrency(it.total_proventos)}</td>
      <td class="py-3 px-4 text-xs font-mono text-rose-600">${formatCurrency(it.desconto_inss)}</td>
      <td class="py-3 px-4 text-xs font-mono text-rose-600">${formatCurrency(it.desconto_irrf)}</td>
      <td class="py-3 px-4 font-bold text-rose-700">${formatCurrency(it.total_descontos)}</td>
      <td class="py-3 px-4 font-extrabold text-emerald-700">${formatCurrency(it.salario_liquido)}</td>
      <td class="py-3 px-4 text-xs text-slate-500">${formatCurrency(it.valor_fgts)}</td>
      <td class="py-3 px-4 text-right">
        <button onclick="viewEmployeeReceipt(${it.employee_id})" class="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200">
          Ver Holerite
        </button>
      </td>
    </tr>
  `).join('');
}

// Aprovação de Folha (RF-056 & RB-003)
async function handleApprovePayroll(novoStatus) {
  // Verificação de perfil na interface
  if (state.currentRole !== 'rh_admin') {
    showAlert('Apenas usuários com perfil RH/Admin têm permissão para aprovar ou fechar a folha (RF-056).', 'error');
    return;
  }

  const comp = document.getElementById('payroll-competencia').value || state.currentCompetencia;
  const just = prompt(`Informe uma observação/justificativa para a ${novoStatus === 'aprovada' ? 'aprovação' : 'fechamento'} da competência ${comp}:`, 'Conferência de encargos e proventos realizada com sucesso.');

  if (just === null) return; // cancelado

  try {
    await apiFetch('/api/payroll/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        competencia: comp,
        status: novoStatus,
        justificativa: just,
        usuario: 'Douglas (Gestor de RH)'
      })
    });

    showAlert(`Folha da competência ${comp} marcada como ${novoStatus.toUpperCase()}! Trilha de auditoria registrada.`, 'success');
    loadPayrollPreview();
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

// Simulador de Férias e 13º (RF-052)
function openSimulationModal() {
  document.getElementById('modal-simulation').classList.remove('hidden');
  document.getElementById('sim-result-box').classList.add('hidden');
}

function closeSimulationModal() {
  document.getElementById('modal-simulation').classList.add('hidden');
}

function toggleSimFields() {
  const mod = document.getElementById('sim-modalidade').value;
  const feriasBox = document.getElementById('sim-ferias-options');
  if (mod === 'ferias') {
    feriasBox.classList.remove('hidden');
  } else {
    feriasBox.classList.add('hidden');
  }
}

async function runSimulation() {
  const empId = document.getElementById('sim-emp-id').value;
  const mod = document.getElementById('sim-modalidade').value;
  if (!empId) {
    showAlert('Selecione um colaborador para a simulação.', 'error');
    return;
  }

  const resultBox = document.getElementById('sim-result-box');
  const details = document.getElementById('sim-result-details');

  try {
    if (mod === 'ferias') {
      const dias = document.getElementById('sim-dias').value || 30;
      const res = await apiFetch(`/api/payroll/vacation?employee_id=${empId}&dias=${dias}`);

      details.innerHTML = `
        <div class="flex justify-between py-1 border-b"><span>Salário Base:</span><strong>${formatCurrency(res.salarioBase)}</strong></div>
        <div class="flex justify-between py-1 border-b"><span>Férias (${res.diasGozo} dias):</span><strong>${formatCurrency(res.salarioFerias)}</strong></div>
        <div class="flex justify-between py-1 border-b"><span>1/3 Constitucional:</span><strong>${formatCurrency(res.tercoConstitucional)}</strong></div>
        <div class="flex justify-between py-1 border-b bg-blue-50 font-bold"><span>Total Bruto de Férias:</span><span>${formatCurrency(res.totalBruto)}</span></div>
        <div class="flex justify-between py-1 border-b text-rose-600"><span>Desconto INSS:</span><span>- ${formatCurrency(res.descontoInss)}</span></div>
        <div class="flex justify-between py-1 border-b text-rose-600"><span>Desconto IRRF:</span><span>- ${formatCurrency(res.descontoIrrf)}</span></div>
        <div class="flex justify-between py-1 bg-emerald-50 text-emerald-800 font-extrabold text-sm rounded px-1"><span>Líquido a Receber:</span><span>${formatCurrency(res.valorLiquido)}</span></div>
        <div class="flex justify-between py-1 text-slate-500 text-[11px]"><span>FGTS Depositado (8%):</span><span>${formatCurrency(res.valorFgts)}</span></div>
      `;
    } else {
      const parcela = mod === '13_1' ? '1' : '2';
      const res = await apiFetch(`/api/payroll/13th?employee_id=${empId}&parcela=${parcela}&meses=12`);

      details.innerHTML = `
        <div class="flex justify-between py-1 border-b"><span>Parcela:</span><strong>${escapeHtml(res.parcela)}</strong></div>
        <div class="flex justify-between py-1 border-b"><span>Valor Integral de Referência:</span><strong>${formatCurrency(res.valorIntegral)}</strong></div>
        <div class="flex justify-between py-1 border-b bg-blue-50 font-bold"><span>Vencimento da Parcela:</span><span>${formatCurrency(res.saldoBruto || res.proventos)}</span></div>
        ${res.adiantamentoDeduzido ? `<div class="flex justify-between py-1 border-b text-slate-600"><span>Adiantamento 1ª Parcela Deduzido:</span><span>- ${formatCurrency(res.adiantamentoDeduzido)}</span></div>` : ''}
        <div class="flex justify-between py-1 border-b text-rose-600"><span>Desconto INSS:</span><span>- ${formatCurrency(res.descontoInss)}</span></div>
        <div class="flex justify-between py-1 border-b text-rose-600"><span>Desconto IRRF:</span><span>- ${formatCurrency(res.descontoIrrf)}</span></div>
        <div class="flex justify-between py-1 bg-emerald-50 text-emerald-800 font-extrabold text-sm rounded px-1"><span>Líquido a Pagar:</span><span>${formatCurrency(res.valorLiquido)}</span></div>
      `;
    }

    resultBox.classList.remove('hidden');
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

// ==================== RECIBOS (HOLERITE) & PROVISÕES (RF-055) ====================

function viewEmployeeReceipt(empId) {
  document.getElementById('receipt-emp-selector').value = empId;
  switchTab('receipts');
}

async function loadReceipt() {
  const empId = document.getElementById('receipt-emp-selector').value;
  const comp = document.getElementById('receipt-competencia').value || state.currentCompetencia;

  if (!empId) {
    return;
  }

  try {
    const data = await apiFetch(`/api/payroll/receipt/${comp}/${empId}`);

    // Preenche cabeçalho e dados cadastrais
    document.getElementById('holerite-comp').innerText = data.competencia;
    document.getElementById('holerite-nome').innerText = `${String(data.colaborador.id).padStart(4, '0')} - ${data.colaborador.nome}`;
    document.getElementById('holerite-cpf').innerText = data.colaborador.cpf;
    document.getElementById('holerite-cargo').innerText = data.colaborador.cargo;
    document.getElementById('holerite-adm').innerText = `${formatDate(data.colaborador.dataAdmissao)} · ${data.colaborador.dependentes} dep`;

    // Tabela de Rubricas
    const tbody = document.getElementById('holerite-rubricas-body');
    const rubricas = [];

    (data.proventos || []).forEach(p => {
      rubricas.push(`
        <tr>
          <td class="py-1.5 px-3 text-slate-500">${escapeHtml(p.codigo)}</td>
          <td class="py-1.5 px-3 font-medium text-slate-800">${escapeHtml(p.descricao)}</td>
          <td class="py-1.5 px-3 text-slate-500">${escapeHtml(p.referencia || '')}</td>
          <td class="py-1.5 px-3 text-right font-bold text-slate-900">${formatCurrency(p.valor)}</td>
          <td class="py-1.5 px-3 text-right text-slate-300">-</td>
        </tr>
      `);
    });

    (data.descontos || []).forEach(d => {
      rubricas.push(`
        <tr>
          <td class="py-1.5 px-3 text-slate-500">${escapeHtml(d.codigo)}</td>
          <td class="py-1.5 px-3 font-medium text-slate-800">${escapeHtml(d.descricao)}</td>
          <td class="py-1.5 px-3 text-slate-500">${escapeHtml(d.referencia || '')}</td>
          <td class="py-1.5 px-3 text-right text-slate-300">-</td>
          <td class="py-1.5 px-3 text-right font-bold text-rose-600">${formatCurrency(d.valor)}</td>
        </tr>
      `);
    });

    tbody.innerHTML = rubricas.join('');

    // Totais
    document.getElementById('holerite-tot-venc').innerText = formatCurrency(data.totais.totalProventos);
    document.getElementById('holerite-tot-desc').innerText = formatCurrency(data.totais.totalDescontos);
    document.getElementById('holerite-tot-liq').innerText = formatCurrency(data.totais.salarioLiquido);

    // Rodapé de Bases
    document.getElementById('holerite-base-sal').innerText = formatCurrency(data.bases.salarioBase);
    document.getElementById('holerite-base-inss').innerText = formatCurrency(data.bases.baseInss);
    document.getElementById('holerite-base-fgts').innerText = formatCurrency(data.bases.baseFgts);
    document.getElementById('holerite-val-fgts').innerText = formatCurrency(data.bases.valorFgts);
    document.getElementById('holerite-base-irrf').innerText = formatCurrency(data.bases.baseIrrf);

    // Atualiza demonstrativo de provisões gerais da empresa
    const preview = await apiFetch(`/api/payroll/preview/${comp}`);
    const prov13Estimada = preview.total_provisoes ? (preview.total_provisoes * 0.43) : 0;
    const provFeriasEstimada = preview.total_provisoes ? (preview.total_provisoes * 0.57) : 0;

    document.getElementById('prov-13-val').innerText = formatCurrency(prov13Estimada);
    document.getElementById('prov-ferias-val').innerText = formatCurrency(provFeriasEstimada);
    document.getElementById('prov-custo-total').innerText = formatCurrency(preview.custo_total_empresa);

  } catch (error) {
    showAlert(`Erro ao gerar holerite: ${error.message}`, 'error');
  }
}

// ==================== eSOCIAL SIMULADO / SISTEMAS OFICIAIS (RF-054) ====================

async function loadEsocialPreview() {
  const comp = document.getElementById('esocial-competencia').value || state.currentCompetencia;
  const pre = document.getElementById('esocial-code-preview');
  pre.innerText = '// Carregando eventos do eSocial simulado...';

  try {
    const data = await apiFetch(`/api/esocial/preview/${comp}`);
    pre.innerText = JSON.stringify(data, null, 2);

    if (data.eventos && data.eventos.S2200) {
      document.getElementById('badge-s2200-count').innerText = `${data.eventos.S2200.length} Registros`;
    }
    if (data.eventos && data.eventos.S1200) {
      document.getElementById('badge-s1200-count').innerText = `${data.eventos.S1200.length} Trabalhadores`;
    }
  } catch (error) {
    pre.innerText = `Erro ao carregar dados oficiais: ${error.message}`;
  }
}

function downloadEsocial(format = 'json') {
  const comp = document.getElementById('esocial-competencia').value || state.currentCompetencia;
  const url = `/api/esocial/download/${comp}?format=${format}&role=${state.currentRole}`;
  window.location.href = url;
}

// ==================== AUDITORIA & PARÂMETROS (RF-056 & RF-052) ====================

async function loadAuditLogs() {
  try {
    const logs = await apiFetch('/api/payroll/audit-logs');
    const tbody = document.getElementById('audit-logs-table-body');
    if (!logs || logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400">Nenhum log registrado.</td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map(l => `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="py-2.5 px-3 font-mono text-[11px] text-slate-500">${escapeHtml(l.data_hora)}</td>
        <td class="py-2.5 px-3 font-semibold text-slate-800">${escapeHtml(l.usuario)}</td>
        <td class="py-2.5 px-3"><span class="bg-slate-100 text-slate-700 font-medium px-1.5 py-0.5 rounded">${escapeHtml(l.perfil)}</span></td>
        <td class="py-2.5 px-3 font-semibold text-blue-700">${escapeHtml(l.acao)}</td>
        <td class="py-2.5 px-3 text-slate-600">${escapeHtml(l.detalhes || '')}</td>
      </tr>
    `).join('');
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

async function loadParameters() {
  try {
    const params = await apiFetch('/api/parameters');
    const container = document.getElementById('parameters-container');

    container.innerHTML = params.map(p => `
      <div class="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
        <div class="flex justify-between items-center">
          <span class="font-mono text-xs font-semibold text-slate-800">${escapeHtml(p.chave)}</span>
          <span class="font-bold text-blue-700 text-xs">${typeof p.valor === 'number' && p.valor < 1 && p.valor > 0 ? (p.valor * 100).toFixed(1) + '%' : p.valor}</span>
        </div>
        <p class="text-[11px] text-slate-500 mt-0.5">${escapeHtml(p.descricao)}</p>
      </div>
    `).join('');
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

// ==================== UTILITÁRIOS ====================

function formatCurrency(val) {
  if (typeof val === 'string') {
    return val; // Já mascarado
  }
  if (typeof val !== 'number') return 'R$ 0,00';
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(isoStr) {
  if (!isoStr) return '--';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoStr;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showAlert(message, type = 'info') {
  const banner = document.getElementById('alert-banner');
  const content = document.getElementById('alert-content');
  const text = document.getElementById('alert-message');

  text.innerText = message;
  banner.classList.remove('hidden');

  if (type === 'error') {
    content.className = 'p-3 rounded-lg flex items-center justify-between text-sm bg-rose-50 border border-rose-200 text-rose-800';
  } else if (type === 'success') {
    content.className = 'p-3 rounded-lg flex items-center justify-between text-sm bg-emerald-50 border border-emerald-200 text-emerald-800';
  } else {
    content.className = 'p-3 rounded-lg flex items-center justify-between text-sm bg-blue-50 border border-blue-200 text-blue-800';
  }

  setTimeout(() => {
    hideAlert();
  }, 5000);
}

function hideAlert() {
  document.getElementById('alert-banner').classList.add('hidden');
}
