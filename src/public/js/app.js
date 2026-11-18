/**
 * Frontend SPA Mobile First - Módulo Item 4: Folha de Pagamento & Atendimento
 * Suporte completo a dispositivos móveis, Neon PostgreSQL, Vercel e experiência touch.
 */

// Estado global da aplicação
const state = {
  activeTab: 'dashboard',
  currentRole: localStorage.getItem('user_role') || 'rh_admin',
  currentCompetencia: '2026-11',
  employees: [],
  filteredEmployees: [],
  payrollData: null,
  companyData: null,
  activeHoleriteEmpId: null,
  activeBenefitsEmpId: null
};

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', () => {
  setupRoleSelector();
  setupTabNavigation();
  initGlobalCompetence();
  loadCompanyData();
  loadEmployees();
  loadDashboardData();
  updateStepperProgress();
});

// Configura o seletor de perfil simulado (RF-056)
function setupRoleSelector() {
  const selector = document.getElementById('role-selector');
  const badge = document.getElementById('role-badge');

  if (selector) {
    selector.value = state.currentRole;
    updateRoleVisuals(state.currentRole);

    selector.addEventListener('change', (e) => {
      state.currentRole = e.target.value;
      localStorage.setItem('user_role', state.currentRole);
      updateRoleVisuals(state.currentRole);
      showAlert(`Perfil alternado para: ${state.currentRole === 'rh_admin' ? 'RH / Admin (Acesso Total)' : 'Consulta / Assistente (Dados Mascarados)'}`, 'info');
      refreshActiveTabData();
    });
  }
}

function updateRoleVisuals(role) {
  const badge = document.getElementById('role-badge');
  const approvalContainer = document.getElementById('approval-actions-container');

  if (role === 'rh_admin') {
    if (badge) {
      badge.className = 'text-[11px] px-2 py-0.5 sm:py-1 rounded-md font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300';
      badge.innerText = '🛡️ Acesso Total';
    }
    if (approvalContainer) {
      approvalContainer.style.display = 'flex';
    }
  } else {
    if (badge) {
      badge.className = 'text-[11px] px-2 py-0.5 sm:py-1 rounded-md font-semibold bg-amber-100 text-amber-800 border border-amber-300';
      badge.innerText = '👁️ Dados Mascarados (LGPD)';
    }
    if (approvalContainer) {
      approvalContainer.innerHTML = `
        <span class="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
          🔒 Fechamento restrito a RH/Admin
        </span>
      `;
    }
  }
}

// Interceptor de requisições com header de papel e organização (RF-056 & SPEC-1.2)
async function apiFetch(url, options = {}) {
  const headers = options.headers || {};
  headers['X-User-Role'] = state.currentRole;
  headers['X-Organization-Id'] = '1';
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

// Configura navegação por abas (Desktop e Bottom Navigation Mobile)
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

  // Atualiza botões da navegação desktop
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.className = 'tab-btn px-3 py-2 text-sm font-semibold rounded-lg text-blue-600 bg-blue-50 transition-all flex items-center space-x-1.5';
    } else {
      btn.className = 'tab-btn px-3 py-2 text-sm font-medium rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center space-x-1.5';
    }
  });

  // Atualiza botões da navegação mobile inferior
  document.querySelectorAll('.bottom-nav-item').forEach(btn => {
    if (btn.getAttribute('data-bottom-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Atualiza painéis de conteúdo
  document.querySelectorAll('.tab-content').forEach(panel => {
    panel.classList.add('hidden');
  });

  const activePanel = document.getElementById(`tab-${tabId}`);
  if (activePanel) {
    activePanel.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateStepperProgress();
  refreshActiveTabData();
}

// Atualiza o progresso visual do Stepper de 5 passos
function updateStepperProgress() {
  const stepMap = {
    'dashboard': 1,
    'employees': 2,
    'events': 3,
    'payroll': 4,
    'receipts': 5,
    'esocial': 5,
    'audit': 5
  };
  const currentStep = stepMap[state.activeTab] || 1;

  const progressLabel = document.getElementById('stepper-progress-text');
  if (progressLabel) {
    const titles = [
      'Passo 1: Selecionar Competência',
      'Passo 2: Conferir Equipe & Contratos',
      'Passo 3: Lançar Eventos & Afastamentos',
      'Passo 4: Calcular & Conferir Folha',
      'Passo 5: Fechar Competência & Emitir Holerites'
    ];
    progressLabel.innerText = titles[currentStep - 1];
  }

  for (let i = 1; i <= 5; i++) {
    const circle = document.getElementById(`step-circle-${i}`);
    if (!circle) continue;
    if (i < currentStep) {
      circle.className = 'stepper-circle completed';
      circle.innerText = '✓';
    } else if (i === currentStep) {
      circle.className = 'stepper-circle active';
      circle.innerText = String(i);
    } else {
      circle.className = 'stepper-circle pending';
      circle.innerText = String(i);
    }
  }
}

// ==================== GESTÃO DE COMPETÊNCIA GLOBAL ====================

function initGlobalCompetence() {
  const compInput = document.getElementById('global-competencia');
  if (compInput) {
    compInput.value = state.currentCompetencia;
    compInput.addEventListener('change', (e) => {
      setGlobalCompetence(e.target.value);
    });
  }
}

function setGlobalCompetence(newComp) {
  if (!newComp) return;
  state.currentCompetencia = newComp;

  const compInput = document.getElementById('global-competencia');
  if (compInput) compInput.value = newComp;

  const dashLabel = document.getElementById('dash-comp-label');
  if (dashLabel) dashLabel.innerText = newComp;

  const eventComp = document.getElementById('event-competencia');
  if (eventComp) eventComp.value = newComp;

  refreshActiveTabData();
}

function changeCompetenceMonth(delta) {
  const [yearStr, monthStr] = state.currentCompetencia.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) + delta;

  if (month > 12) {
    month = 1;
    year++;
  } else if (month < 1) {
    month = 12;
    year--;
  }

  const newComp = `${year}-${String(month).padStart(2, '0')}`;
  setGlobalCompetence(newComp);
}

function updateCompetenceBadges(status) {
  const cleanStatus = (status || 'rascunho').toLowerCase();
  const globalBadge = document.getElementById('global-folha-badge');
  const dashBadge = document.getElementById('dash-folha-status');
  const payrollBadge = document.getElementById('payroll-status-badge');

  let badgeText = 'RASCUNHO';
  let badgeClass = 'text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-amber-400 text-amber-950 shadow-sm';

  if (cleanStatus === 'aprovada') {
    badgeText = 'APROVADA';
    badgeClass = 'text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-emerald-400 text-emerald-950 shadow-sm';
  } else if (cleanStatus === 'fechada') {
    badgeText = 'FECHADA';
    badgeClass = 'text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-slate-900 text-white shadow-sm';
  } else if (cleanStatus === 'em_revisao') {
    badgeText = 'EM REVISÃO';
    badgeClass = 'text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-rose-500 text-white shadow-sm';
  }

  if (globalBadge) {
    globalBadge.innerText = badgeText;
    globalBadge.className = badgeClass;
  }
  if (dashBadge) {
    dashBadge.innerText = badgeText;
    dashBadge.className = badgeClass;
  }
  if (payrollBadge) {
    payrollBadge.innerText = badgeText;
    payrollBadge.className = badgeClass;
  }

  // Controla exibição dos botões de Reabertura vs Fechamento
  const btnClose = document.getElementById('btn-close-payroll');
  const btnReopen = document.getElementById('btn-reopen-payroll');
  if (btnClose && btnReopen) {
    if (cleanStatus === 'fechada') {
      btnClose.classList.add('hidden');
      btnReopen.classList.remove('hidden');
    } else {
      btnClose.classList.remove('hidden');
      btnReopen.classList.add('hidden');
    }
  }
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

// ==================== DADOS DA EMPRESA (COMPANIES) ====================

async function loadCompanyData() {
  try {
    const comp = await apiFetch('/api/company');
    state.companyData = comp;

    const headerName = document.getElementById('header-company-name');
    if (headerName) headerName.innerText = comp.nome_fantasia || comp.razao_social;

    const holeriteRazao = document.getElementById('holerite-empresa-razao');
    if (holeriteRazao) holeriteRazao.innerText = comp.razao_social;

    const holeriteCnpj = document.getElementById('holerite-empresa-cnpj');
    if (holeriteCnpj) holeriteCnpj.innerText = `CNPJ: ${comp.cnpj} · ${comp.cidade || ''}/${comp.uf || ''}`;

  } catch (error) {
    console.warn('Não foi possível carregar dados da empresa:', error);
  }
}

function openCompanyModal() {
  const comp = state.companyData || {};
  document.getElementById('comp-razao-social').value = comp.razao_social || '';
  document.getElementById('comp-nome-fantasia').value = comp.nome_fantasia || '';
  document.getElementById('comp-cnpj').value = comp.cnpj || '';
  document.getElementById('comp-cnae').value = comp.cnae_principal || '';
  document.getElementById('comp-resp-rh').value = comp.responsavel_rh || '';
  document.getElementById('comp-endereco').value = comp.endereco || '';
  document.getElementById('comp-cidade').value = comp.cidade || '';
  document.getElementById('comp-uf').value = comp.uf || '';
  document.getElementById('comp-telefone').value = comp.telefone || '';

  document.getElementById('modal-company').classList.remove('hidden');
}

function closeCompanyModal() {
  document.getElementById('modal-company').classList.add('hidden');
}

async function handleCompanySubmit(e) {
  e.preventDefault();
  const payload = {
    razao_social: document.getElementById('comp-razao-social').value,
    nome_fantasia: document.getElementById('comp-nome-fantasia').value,
    cnpj: document.getElementById('comp-cnpj').value,
    cnae_principal: document.getElementById('comp-cnae').value,
    responsavel_rh: document.getElementById('comp-resp-rh').value,
    endereco: document.getElementById('comp-endereco').value,
    cidade: document.getElementById('comp-cidade').value,
    uf: document.getElementById('comp-uf').value,
    telefone: document.getElementById('comp-telefone').value
  };

  try {
    const updated = await apiFetch('/api/company', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    state.companyData = updated;
    showAlert('Dados da empresa atualizados com sucesso!', 'success');
    closeCompanyModal();
    loadCompanyData();
  } catch (error) {
    showAlert(error.message, 'error');
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

    updateCompetenceBadges(payroll.status);
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
  }
}

// ==================== EMPREGADOS & CONTRATOS (RF-051) ====================

async function loadEmployees() {
  try {
    const employees = await apiFetch('/api/employees');
    state.employees = employees;
    state.filteredEmployees = employees;
    renderEmployees(employees);
    populateEmployeeDropdowns(employees);
  } catch (error) {
    showAlert(`Erro ao listar colaboradores: ${error.message}`, 'error');
  }
}

function filterEmployeesList() {
  const queryText = (document.getElementById('employee-search-input').value || '').toLowerCase().trim();
  if (!queryText) {
    state.filteredEmployees = state.employees;
  } else {
    state.filteredEmployees = state.employees.filter(e =>
      e.nome.toLowerCase().includes(queryText) ||
      (e.cargo && e.cargo.toLowerCase().includes(queryText)) ||
      (e.departamento && e.departamento.toLowerCase().includes(queryText))
    );
  }
  renderEmployees(state.filteredEmployees);
}

function renderEmployees(employees) {
  renderEmployeesCards(employees);
  renderEmployeesTable(employees);
}

// Renderização Mobile First: Cartões Verticais
function renderEmployeesCards(employees) {
  const container = document.getElementById('employees-mobile-container');
  if (!container) return;

  if (!employees || employees.length === 0) {
    container.innerHTML = `<div class="p-6 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs">Nenhum colaborador encontrado.</div>`;
    return;
  }

  container.innerHTML = employees.map(emp => {
    let statusBadge = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (emp.status === 'afastado') statusBadge = 'bg-amber-100 text-amber-800 border-amber-200';
    if (emp.status === 'inativo') statusBadge = 'bg-slate-100 text-slate-600 border-slate-200';

    return `
      <div class="mobile-card space-y-3">
        <div class="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div>
            <h3 class="font-bold text-slate-900 text-sm">${escapeHtml(emp.nome)}</h3>
            <p class="text-xs text-slate-600 font-medium">${escapeHtml(emp.cargo)}</p>
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${statusBadge}">
            ${escapeHtml(emp.status)}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span class="text-[10px] text-slate-400 block">Salário Base</span>
            <span class="font-bold text-slate-900 text-sm text-emerald-700">${formatCurrency(emp.salario_base)}</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 block">CPF (LGPD)</span>
            <span class="font-mono text-slate-700">${escapeHtml(emp.cpf)}</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 block">Departamento</span>
            <span class="text-slate-700 font-medium">${escapeHtml(emp.departamento || 'Geral')}</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 block">Jornada / Admissão</span>
            <span class="text-slate-600">${escapeHtml(emp.jornada)} · ${formatDate(emp.data_admissao)}</span>
          </div>
        </div>

        <!-- Ações Touch Acessíveis (>= 44px) -->
        <div class="pt-2 border-t border-slate-100 grid grid-cols-4 gap-1.5">
          <button onclick="editEmployee(${emp.id})" class="touch-target py-2 px-1 text-center text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200">
            Editar
          </button>
          <button onclick="openBenefitsModal(${emp.id})" class="touch-target py-2 px-1 text-center text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200">
            Benefícios
          </button>
          <button onclick="openLeaveModalFor(${emp.id})" class="touch-target py-2 px-1 text-center text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200">
            Licença
          </button>
          <button onclick="deleteEmployee(${emp.id})" class="touch-target py-2 px-1 text-center text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200">
            Inativar
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Renderização Desktop: Tabela Tradicional
function renderEmployeesTable(employees) {
  const tbody = document.getElementById('employees-table-body');
  if (!tbody) return;

  if (!employees || employees.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="py-6 text-center text-slate-400">Nenhum colaborador cadastrado.</td></tr>`;
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
        <td class="py-3 px-4 text-slate-700 text-xs">${escapeHtml(emp.cargo)} <span class="text-slate-400 block">${escapeHtml(emp.departamento || 'Geral')}</span></td>
        <td class="py-3 px-4 font-bold text-slate-900">${formatCurrency(emp.salario_base)}</td>
        <td class="py-3 px-4 text-xs text-slate-600">${escapeHtml(emp.jornada)}</td>
        <td class="py-3 px-4 text-xs text-slate-600">${formatDate(emp.data_admissao)}</td>
        <td class="py-3 px-4 text-center font-medium">${emp.dependentes || 0}</td>
        <td class="py-3 px-4">
          <span class="text-xs px-2 py-0.5 rounded-full font-semibold border ${statusClass}">
            ${escapeHtml(emp.status)}
          </span>
        </td>
        <td class="py-3 px-4 text-right space-x-1 whitespace-nowrap">
          <button onclick="editEmployee(${emp.id})" class="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200">
            Editar
          </button>
          <button onclick="openBenefitsModal(${emp.id})" class="px-2 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200">
            Benefícios
          </button>
          <button onclick="openLeaveModalFor(${emp.id})" class="px-2 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200">
            Licença
          </button>
          <button onclick="deleteEmployee(${emp.id})" class="px-2 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200">
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
    title.innerText = 'Editar Colaborador';
    document.getElementById('emp-id').value = emp.id;
    document.getElementById('emp-nome').value = emp.nome;
    document.getElementById('emp-cpf').value = emp.cpf;
    document.getElementById('emp-cargo').value = emp.cargo;
    document.getElementById('emp-salario').value = typeof emp.salario_base === 'number' ? emp.salario_base : '';
    document.getElementById('emp-jornada').value = emp.jornada;
    document.getElementById('emp-admissao').value = emp.data_admissao ? emp.data_admissao.substring(0, 10) : '';
    document.getElementById('emp-dependentes').value = emp.dependentes || 0;
    document.getElementById('emp-departamento').value = emp.departamento || '';
    document.getElementById('emp-regime').value = emp.regime_contratual || 'CLT';
    document.getElementById('emp-status').value = emp.status || 'ativo';
  } else {
    title.innerText = 'Novo Colaborador';
    document.getElementById('emp-id').value = '';
    document.getElementById('emp-admissao').value = new Date().toISOString().substring(0, 10);
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
    showAlert(error.message, 'error');
  }
}

async function handleEmployeeSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('emp-id').value;
  const payload = {
    nome: document.getElementById('emp-nome').value,
    cpf: document.getElementById('emp-cpf').value,
    cargo: document.getElementById('emp-cargo').value,
    salario_base: parseFloat(document.getElementById('emp-salario').value),
    jornada: document.getElementById('emp-jornada').value,
    data_admissao: document.getElementById('emp-admissao').value,
    dependentes: parseInt(document.getElementById('emp-dependentes').value, 10) || 0,
    departamento: document.getElementById('emp-departamento').value,
    regime_contratual: document.getElementById('emp-regime').value,
    status: document.getElementById('emp-status').value
  };

  try {
    if (id) {
      await apiFetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      showAlert('Dados cadastrais atualizados com sucesso!', 'success');
    } else {
      await apiFetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      showAlert('Colaborador cadastrado com sucesso!', 'success');
    }
    closeEmployeeModal();
    loadEmployees();
    loadDashboardData();
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

async function deleteEmployee(id) {
  if (!confirm('Deseja marcar este colaborador como inativo?')) return;
  try {
    await apiFetch(`/api/employees/${id}`, { method: 'DELETE' });
    showAlert('Colaborador inativado com sucesso.', 'success');
    loadEmployees();
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

// ==================== GESTÃO DE BENEFÍCIOS (RF-053) ====================

async function openBenefitsModal(empId) {
  state.activeBenefitsEmpId = empId;
  const emp = state.employees.find(e => e.id === empId);
  document.getElementById('modal-benefits-emp-name').innerText = emp ? emp.nome : `#${empId}`;
  document.getElementById('benefit-emp-id').value = empId;

  document.getElementById('modal-benefits').classList.remove('hidden');
  loadEmployeeBenefits(empId);
}

function closeBenefitsModal() {
  document.getElementById('modal-benefits').classList.add('hidden');
}

async function loadEmployeeBenefits(empId) {
  const container = document.getElementById('benefits-list-container');
  try {
    const list = await apiFetch(`/api/employees/${empId}/benefits`);
    if (!list || list.length === 0) {
      container.innerHTML = `<div class="p-3 bg-white rounded-lg border border-slate-200 text-center text-slate-400">Nenhum benefício cadastrado para este colaborador.</div>`;
      return;
    }

    container.innerHTML = list.map(b => `
      <div class="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
        <div>
          <div class="flex items-center space-x-1.5">
            <span class="font-bold text-slate-900">${escapeHtml(b.descricao || b.tipo)}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded font-bold ${b.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}">
              ${b.ativo ? 'ATIVO' : 'INATIVO'}
            </span>
          </div>
          <div class="text-[11px] text-slate-500 mt-0.5">
            Valor Total: <strong>${formatCurrency(b.valor)}</strong> · Desconto Folha: <strong class="text-rose-600">- ${formatCurrency(b.desconto_empregado)}</strong>
          </div>
        </div>
        ${b.ativo ? `
          <button onclick="deactivateBenefit(${empId}, ${b.id})" class="touch-target px-2.5 py-1 text-xs text-rose-600 hover:text-rose-800 font-semibold bg-rose-50 rounded-lg">
            Remover
          </button>
        ` : ''}
      </div>
    `).join('');
  } catch (error) {
    container.innerHTML = `<div class="text-rose-600 text-xs">${error.message}</div>`;
  }
}

async function handleBenefitSubmit(e) {
  e.preventDefault();
  const empId = state.activeBenefitsEmpId;
  const payload = {
    tipo: document.getElementById('benefit-tipo').value,
    descricao: document.getElementById('benefit-descricao').value,
    valor: parseFloat(document.getElementById('benefit-valor').value),
    desconto_empregado: parseFloat(document.getElementById('benefit-desconto').value),
    data_inicio: new Date().toISOString().substring(0, 10)
  };

  try {
    await apiFetch(`/api/employees/${empId}/benefits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    showAlert('Benefício vinculado ao colaborador!', 'success');
    document.getElementById('form-new-benefit').reset();
    loadEmployeeBenefits(empId);
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

async function deactivateBenefit(empId, benefitId) {
  if (!confirm('Deseja desativar este benefício?')) return;
  try {
    await apiFetch(`/api/employees/${empId}/benefits/${benefitId}`, { method: 'DELETE' });
    showAlert('Benefício removido.', 'success');
    loadEmployeeBenefits(empId);
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

// ==================== EVENTOS & AFASTAMENTOS (RF-053) ====================

function toggleEventsSubtab(subtab) {
  ['rubricas', 'afastamentos', 'contratuais'].forEach(st => {
    const btn = document.getElementById(`subtab-btn-${st}`);
    const content = document.getElementById(`subtab-${st}`);
    if (st === subtab) {
      btn.className = 'touch-target py-1.5 text-xs font-bold text-blue-700 bg-white rounded-lg shadow-sm transition-all text-center';
      content.classList.remove('hidden');
    } else {
      btn.className = 'touch-target py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-all text-center';
      content.classList.add('hidden');
    }
  });

  if (subtab === 'rubricas') loadVariableEvents();
  if (subtab === 'afastamentos') loadLeaves();
  if (subtab === 'contratuais') loadContractChanges();
}

async function loadVariableEvents() {
  try {
    const events = await apiFetch(`/api/events?competencia=${state.currentCompetencia}`);
    renderVariableEvents(events);
  } catch (error) {
    showAlert(`Erro ao listar eventos: ${error.message}`, 'error');
  }
}

function renderVariableEvents(events) {
  renderVariableEventsCards(events);
  renderVariableEventsTable(events);
}

function renderVariableEventsCards(events) {
  const container = document.getElementById('variable-events-mobile-container');
  if (!container) return;

  if (!events || events.length === 0) {
    container.innerHTML = `<div class="p-6 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs">Nenhum evento registrado nesta competência.</div>`;
    return;
  }

  container.innerHTML = events.map(ev => {
    let tipoBadge = 'bg-blue-100 text-blue-800';
    if (ev.tipo === 'falta') tipoBadge = 'bg-rose-100 text-rose-800';
    if (ev.tipo === 'adicional') tipoBadge = 'bg-emerald-100 text-emerald-800';
    if (ev.tipo === 'desconto') tipoBadge = 'bg-amber-100 text-amber-800';

    return `
      <div class="mobile-card space-y-2">
        <div class="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
          <div>
            <h4 class="font-bold text-slate-900 text-sm">${escapeHtml(ev.employee_nome)}</h4>
            <p class="text-xs text-slate-600">${escapeHtml(ev.descricao)}</p>
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded font-bold ${tipoBadge}">
            ${escapeHtml(ev.tipo.replace('_', ' ').toUpperCase())}
          </span>
        </div>

        <div class="flex items-center justify-between text-xs pt-1">
          <div>
            <span class="text-[10px] text-slate-400 block">Qtd / Percentual</span>
            <span class="text-slate-700 font-medium">${ev.quantidade ? ev.quantidade + (ev.tipo === 'hora_extra' ? 'h' : 'd') : '-'} ${ev.percentual ? `(${ev.percentual}%)` : ''}</span>
          </div>
          <div class="text-right">
            <span class="text-[10px] text-slate-400 block">Valor Calculado</span>
            <span class="font-extrabold text-slate-900 text-sm">${formatCurrency(ev.valor)}</span>
          </div>
        </div>

        <div class="pt-2 border-t border-slate-100 flex justify-end space-x-2">
          <button onclick="editEvent(${ev.id})" class="touch-target px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg">
            Editar
          </button>
          <button onclick="deleteEvent(${ev.id})" class="touch-target px-3 py-1 text-xs font-semibold text-rose-700 bg-rose-50 rounded-lg">
            Excluir
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderVariableEventsTable(events) {
  const tbody = document.getElementById('variable-events-table-body');
  if (!tbody) return;

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
        <td class="py-2.5 px-3 font-semibold text-slate-900">${escapeHtml(ev.employee_nome)}</td>
        <td class="py-2.5 px-3">
          <span class="text-xs px-2 py-0.5 rounded font-semibold ${tipoBadge}">
            ${escapeHtml(ev.tipo.replace('_', ' ').toUpperCase())}
          </span>
        </td>
        <td class="py-2.5 px-3 text-slate-700 text-xs">${escapeHtml(ev.descricao)}</td>
        <td class="py-2.5 px-3 text-center font-medium">${ev.quantidade || '-'}</td>
        <td class="py-2.5 px-3 text-center text-xs text-slate-500">${ev.percentual ? ev.percentual + '%' : '-'}</td>
        <td class="py-2.5 px-3 font-bold text-slate-900">${formatCurrency(ev.valor)}</td>
        <td class="py-2.5 px-3 text-right space-x-1">
          <button onclick="editEvent(${ev.id})" class="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1">
            Editar
          </button>
          <button onclick="deleteEvent(${ev.id})" class="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1">
            Excluir
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openEventModal(eventObj = null) {
  document.getElementById('form-event').reset();
  document.getElementById('event-competencia').value = state.currentCompetencia;
  document.getElementById('event-perc').value = 50;

  if (eventObj) {
    document.getElementById('modal-event-title').innerText = 'Editar Evento de Folha';
    document.getElementById('event-id').value = eventObj.id;
    document.getElementById('event-emp-id').value = eventObj.employee_id;
    document.getElementById('event-tipo').value = eventObj.tipo;
    document.getElementById('event-descricao').value = eventObj.descricao;
    document.getElementById('event-qtd').value = eventObj.quantidade || 0;
    document.getElementById('event-perc').value = eventObj.percentual || 50;
    document.getElementById('event-valor').value = eventObj.valor || 0;
  } else {
    document.getElementById('modal-event-title').innerText = 'Lançar Evento de Folha';
    document.getElementById('event-id').value = '';
  }

  adjustEventFields();
  calculateEventPreview();
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

// Cálculo em Tempo Real no Lançamento de Eventos (UX Mobile)
function calculateEventPreview() {
  const empId = parseInt(document.getElementById('event-emp-id').value, 10);
  const tipo = document.getElementById('event-tipo').value;
  const qtd = parseFloat(document.getElementById('event-qtd').value) || 0;
  const perc = parseFloat(document.getElementById('event-perc').value) || 0;
  const valFixo = parseFloat(document.getElementById('event-valor').value) || 0;

  const previewVal = document.getElementById('event-preview-value');
  const previewFormula = document.getElementById('event-preview-formula');

  if (valFixo > 0) {
    previewVal.innerText = formatCurrency(valFixo);
    previewFormula.innerText = 'Valor manual informado diretamente.';
    return;
  }

  const emp = state.employees.find(e => e.id === empId);
  if (!emp || qtd <= 0) {
    previewVal.innerText = 'R$ 0,00';
    previewFormula.innerText = 'Informe o colaborador e a quantidade para calcular.';
    return;
  }

  const salBase = parseFloat(emp.salario_base);
  const divisor = emp.jornada && emp.jornada.includes('40h') ? 200 : 220;
  const valorHora = salBase / divisor;

  if (tipo === 'hora_extra') {
    const fator = 1 + ((perc || 50) / 100);
    const totalHE = valorHora * fator * qtd;
    previewVal.innerText = formatCurrency(totalHE);
    previewFormula.innerText = `R$ ${salBase.toFixed(2)} / ${divisor}h = R$ ${valorHora.toFixed(2)}/h × ${fator} × ${qtd}h`;
  } else if (tipo === 'falta') {
    const valorDia = salBase / 30;
    const totalFalta = valorDia * qtd;
    previewVal.innerText = `- ${formatCurrency(totalFalta)}`;
    previewFormula.innerText = `R$ ${salBase.toFixed(2)} / 30d = R$ ${valorDia.toFixed(2)}/dia × ${qtd}d`;
  } else {
    previewVal.innerText = 'R$ 0,00';
    previewFormula.innerText = 'Informe o valor no campo de valor fixo.';
  }
}

async function handleEventSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('event-id').value;
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
    if (id) {
      await apiFetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      showAlert('Evento atualizado com sucesso!', 'success');
    } else {
      await apiFetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      showAlert('Evento registrado com sucesso!', 'success');
    }
    closeEventModal();
    loadVariableEvents();
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

async function editEvent(id) {
  try {
    const events = await apiFetch(`/api/events?competencia=${state.currentCompetencia}`);
    const ev = events.find(e => e.id === id);
    if (ev) openEventModal(ev);
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
    renderLeaves(leaves);
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

function renderLeaves(leaves) {
  const container = document.getElementById('leaves-mobile-container');
  const tbody = document.getElementById('leaves-table-body');

  if (container) {
    if (!leaves || leaves.length === 0) {
      container.innerHTML = `<div class="p-4 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs">Nenhum afastamento registrado.</div>`;
    } else {
      container.innerHTML = leaves.map(l => `
        <div class="mobile-card space-y-1.5 text-xs">
          <div class="flex justify-between items-start">
            <span class="font-bold text-slate-900">${escapeHtml(l.employee_nome)}</span>
            <span class="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">${escapeHtml(l.tipo)}</span>
          </div>
          <div class="text-slate-500">
            Período: <strong>${formatDate(l.data_inicio)}</strong> até <strong>${l.data_fim ? formatDate(l.data_fim) : 'Em aberto'}</strong>
          </div>
          <p class="text-[11px] text-slate-600 bg-slate-50 p-2 rounded">${escapeHtml(l.motivo || '-')}</p>
        </div>
      `).join('');
    }
  }

  if (tbody) {
    if (!leaves || leaves.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400">Nenhum afastamento registrado.</td></tr>`;
    } else {
      tbody.innerHTML = leaves.map(l => `
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="py-2.5 px-3 font-semibold text-slate-900">${escapeHtml(l.employee_nome)}</td>
          <td class="py-2.5 px-3 font-medium text-amber-700">${escapeHtml(l.tipo)}</td>
          <td class="py-2.5 px-3 text-slate-600">${formatDate(l.data_inicio)}</td>
          <td class="py-2.5 px-3 text-slate-600">${l.data_fim ? formatDate(l.data_fim) : '<span class="text-emerald-600 font-semibold">Em aberto</span>'}</td>
          <td class="py-2.5 px-3 text-xs text-slate-500">${escapeHtml(l.motivo || '-')}</td>
        </tr>
      `).join('');
    }
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
    renderContractChanges(changes);
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

function renderContractChanges(changes) {
  const container = document.getElementById('contract-changes-mobile-container');
  const tbody = document.getElementById('contract-changes-table-body');

  if (container) {
    if (!changes || changes.length === 0) {
      container.innerHTML = `<div class="p-4 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs">Nenhum histórico registrado.</div>`;
    } else {
      container.innerHTML = changes.map(cc => `
        <div class="mobile-card space-y-1.5 text-xs">
          <div class="flex justify-between items-start">
            <span class="font-bold text-slate-900">${escapeHtml(cc.employee_nome)}</span>
            <span class="text-[10px] text-slate-400 font-mono">${formatDate(cc.data_alteracao)}</span>
          </div>
          <div class="font-medium text-blue-700">${escapeHtml(cc.tipo_alteracao)}</div>
          <p class="text-slate-600">${escapeHtml(cc.descricao)}</p>
          <div class="flex justify-between pt-1 border-t border-slate-100 text-[11px]">
            <span>Anterior: <strong>${cc.salario_anterior ? formatCurrency(cc.salario_anterior) : '-'}</strong></span>
            <span class="text-emerald-700 font-bold">Novo: ${formatCurrency(cc.novo_salario)}</span>
          </div>
        </div>
      `).join('');
    }
  }

  if (tbody) {
    if (!changes || changes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-slate-400">Nenhuma alteração contratual registrada.</td></tr>`;
    } else {
      tbody.innerHTML = changes.map(cc => `
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="py-2.5 px-3 font-semibold text-slate-900">${escapeHtml(cc.employee_nome)}</td>
          <td class="py-2.5 px-3 text-xs text-slate-500">${formatDate(cc.data_alteracao)}</td>
          <td class="py-2.5 px-3 font-medium text-blue-700 text-xs">${escapeHtml(cc.tipo_alteracao)}</td>
          <td class="py-2.5 px-3 text-xs text-slate-600">${escapeHtml(cc.descricao)}</td>
          <td class="py-2.5 px-3 text-slate-500">${cc.salario_anterior ? formatCurrency(cc.salario_anterior) : '-'}</td>
          <td class="py-2.5 px-3 font-semibold text-slate-900">${formatCurrency(cc.novo_salario)}</td>
        </tr>
      `).join('');
    }
  }
}

// ==================== CÁLCULO & CONFERÊNCIA DE FOLHA (RF-052) ====================

async function calculatePayroll(persist = true) {
  const btn = document.getElementById('btn-calc-payroll');
  if (btn) btn.disabled = true;

  try {
    const result = await apiFetch('/api/payroll/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ competencia: state.currentCompetencia, persist, usuario: 'Douglas (RH)' })
    });

    state.payrollData = result;
    renderPayrollResults(result);
    showAlert(`Folha calculada para a competência ${state.currentCompetencia}!`, 'success');
  } catch (error) {
    showAlert(`Erro no cálculo de folha: ${error.message}`, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function loadPayrollPreview() {
  try {
    const result = await apiFetch(`/api/payroll/preview/${state.currentCompetencia}`);
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

  updateCompetenceBadges(payroll.status);

  const runInfo = document.getElementById('payroll-run-info');
  if (runInfo) {
    if (payroll.closed_at) {
      runInfo.innerText = `Fechada em ${formatDate(payroll.closed_at)} por ${payroll.closed_by || 'Gestor'}`;
    } else {
      runInfo.innerText = `${payroll.total_colaboradores || (payroll.itens ? payroll.itens.length : 0)} colaboradores`;
    }
  }

  renderPayrollCards(payroll);
  renderPayrollTable(payroll);
}

// Renderização Mobile First de Conferência de Folha
function renderPayrollCards(payroll) {
  const container = document.getElementById('payroll-cards-container');
  if (!container) return;

  if (!payroll.itens || payroll.itens.length === 0) {
    container.innerHTML = `<div class="p-8 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs">Nenhum item calculado. Toque em "Calcular & Gravar".</div>`;
    return;
  }

  container.innerHTML = payroll.itens.map((it, idx) => {
    const isConferido = Boolean(it.conferido);
    const alertas = it.alertas || [];
    const hasWarnings = alertas.some(a => !a.includes('consistente'));

    let alertaHtml = '';
    if (hasWarnings) {
      alertaHtml = `
        <div class="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 font-semibold space-y-0.5">
          ${alertas.map(a => `<div>⚠️ ${escapeHtml(a)}</div>`).join('')}
        </div>
      `;
    } else {
      alertaHtml = `
        <div class="text-[11px] text-emerald-700 font-semibold flex items-center space-x-1">
          <span>✓</span> <span>Cálculo consistente sem divergências</span>
        </div>
      `;
    }

    return `
      <div class="mobile-card space-y-3 ${isConferido ? 'border-emerald-300 bg-emerald-50/20' : ''}">
        <!-- Topo: Nome, Cargo e Botão Conferido -->
        <div class="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
          <div>
            <h3 class="font-bold text-slate-900 text-sm">${escapeHtml(it.nome)}</h3>
            <p class="text-xs text-slate-500">${escapeHtml(it.cargo)}</p>
          </div>
          <button onclick="toggleItemCheck(${it.id})" class="touch-target px-2.5 py-1 text-xs font-bold rounded-lg border transition-all flex items-center space-x-1 ${isConferido ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-300'}">
            <span>${isConferido ? '✓ Conferido' : 'Conferir'}</span>
          </button>
        </div>

        <!-- Banner Principal de Salário Líquido -->
        <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
          <div>
            <span class="text-[10px] text-emerald-800 uppercase font-bold block">Salário Líquido a Pagar</span>
            <span class="text-lg font-extrabold text-emerald-700">${formatCurrency(it.salario_liquido)}</span>
          </div>
          <div class="text-right text-xs">
            <span class="text-slate-400 block text-[10px]">Bruto</span>
            <span class="font-semibold text-slate-800">${formatCurrency(it.total_proventos)}</span>
          </div>
        </div>

        <!-- Bloco de Alertas -->
        ${alertaHtml}

        <!-- Resumo Rápido de Deduções -->
        <div class="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
          <div><span class="text-slate-400 block">INSS</span><span class="font-mono text-rose-600 font-bold">- ${formatCurrency(it.desconto_inss)}</span></div>
          <div><span class="text-slate-400 block">IRRF</span><span class="font-mono text-rose-600 font-bold">- ${formatCurrency(it.desconto_irrf)}</span></div>
          <div><span class="text-slate-400 block">FGTS (8%)</span><span class="font-mono text-slate-700 font-bold">${formatCurrency(it.valor_fgts)}</span></div>
        </div>

        <!-- Accordion para Detalhes Completos -->
        <div>
          <button onclick="togglePayrollAccordion('acc-${idx}')" class="touch-target w-full text-left text-xs font-bold text-blue-600 flex justify-between items-center py-1">
            <span>Detalhes completos da memória de cálculo</span>
            <span id="acc-icon-acc-${idx}">▼</span>
          </button>
          <div id="acc-${idx}" class="accordion-content space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div class="space-y-1">
              <span class="font-semibold text-slate-700 block text-[11px]">Proventos Detalhados:</span>
              <div class="flex justify-between"><span>Salário Base:</span><strong>${formatCurrency(it.salario_base)}</strong></div>
              ${it.horas_extras_total > 0 ? `<div class="flex justify-between text-blue-700"><span>Horas Extras:</span><strong>+ ${formatCurrency(it.horas_extras_total)}</strong></div>` : ''}
              ${it.adicionais_total > 0 ? `<div class="flex justify-between text-blue-700"><span>Adicionais/Bônus:</span><strong>+ ${formatCurrency(it.adicionais_total)}</strong></div>` : ''}
            </div>
            <div class="space-y-1 pt-1 border-t border-slate-100">
              <span class="font-semibold text-slate-700 block text-[11px]">Descontos Detalhados:</span>
              ${it.faltas_total > 0 ? `<div class="flex justify-between text-rose-600"><span>Faltas/Atrasos:</span><strong>- ${formatCurrency(it.faltas_total)}</strong></div>` : ''}
              <div class="flex justify-between text-rose-600"><span>INSS:</span><strong>- ${formatCurrency(it.desconto_inss)}</strong></div>
              <div class="flex justify-between text-rose-600"><span>IRRF:</span><strong>- ${formatCurrency(it.desconto_irrf)}</strong></div>
              ${it.outros_descontos > 0 ? `<div class="flex justify-between text-rose-600"><span>Benefícios/Outros:</span><strong>- ${formatCurrency(it.outros_descontos)}</strong></div>` : ''}
            </div>
            <div class="space-y-1 pt-1 border-t border-slate-100 bg-slate-50 p-2 rounded text-[11px]">
              <span class="font-semibold text-slate-700 block">Provisões & Encargos Patronais:</span>
              <div class="flex justify-between"><span>Provisão 13º:</span><span>${formatCurrency(it.provisao_13)}</span></div>
              <div class="flex justify-between"><span>Provisão Férias:</span><span>${formatCurrency(it.provisao_ferias)}</span></div>
              <div class="flex justify-between"><span>INSS Patronal (20%):</span><span>${formatCurrency(it.inss_patronal)}</span></div>
            </div>
          </div>
        </div>

        <!-- Botão Visualizar Holerite -->
        <div class="pt-2 border-t border-slate-100">
          <button onclick="viewEmployeeReceipt(${it.employee_id})" class="touch-target w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center space-x-1">
            <span>📄 Abrir Recibo de Pagamento</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderPayrollTable(payroll) {
  const tbody = document.getElementById('payroll-items-table-body');
  if (!tbody) return;

  if (!payroll.itens || payroll.itens.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="py-8 text-center text-slate-400">Nenhum item calculado. Clique em "Calcular & Gravar".</td></tr>`;
    return;
  }

  tbody.innerHTML = payroll.itens.map(it => {
    const isConferido = Boolean(it.conferido);
    return `
      <tr class="hover:bg-slate-50 transition-colors ${isConferido ? 'bg-emerald-50/40' : ''}">
        <td class="py-2.5 px-3">
          <input type="checkbox" onchange="toggleItemCheck(${it.id})" ${isConferido ? 'checked' : ''} class="w-4 h-4 text-emerald-600 rounded cursor-pointer">
        </td>
        <td class="py-2.5 px-3 font-semibold text-slate-900">${escapeHtml(it.nome)}</td>
        <td class="py-2.5 px-3 text-slate-600">${formatCurrency(it.salario_base)}</td>
        <td class="py-2.5 px-3 font-medium text-slate-900">${formatCurrency(it.total_proventos)}</td>
        <td class="py-2.5 px-3 text-xs font-mono text-rose-600">${formatCurrency(it.desconto_inss)}</td>
        <td class="py-2.5 px-3 text-xs font-mono text-rose-600">${formatCurrency(it.desconto_irrf)}</td>
        <td class="py-2.5 px-3 font-bold text-rose-700">${formatCurrency(it.total_descontos)}</td>
        <td class="py-2.5 px-3 font-extrabold text-emerald-700">${formatCurrency(it.salario_liquido)}</td>
        <td class="py-2.5 px-3 text-right">
          <button onclick="viewEmployeeReceipt(${it.employee_id})" class="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200">
            Recibo
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function togglePayrollAccordion(accId) {
  const content = document.getElementById(accId);
  const icon = document.getElementById(`acc-icon-${accId}`);
  if (!content) return;
  if (content.classList.contains('expanded')) {
    content.classList.remove('expanded');
    if (icon) icon.innerText = '▼';
  } else {
    content.classList.add('expanded');
    if (icon) icon.innerText = '▲';
  }
}

async function toggleItemCheck(itemId) {
  try {
    await apiFetch(`/api/payroll/items/${itemId}/check`, { method: 'PATCH' });
    loadPayrollPreview();
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

// Fechamento de Folha Acessível (Modal Mobile)
function openCloseModal() {
  if (state.currentRole !== 'rh_admin') {
    showAlert('Apenas usuários com perfil RH/Admin podem fechar a folha (RF-056).', 'error');
    return;
  }
  const payroll = state.payrollData || {};
  document.getElementById('close-modal-comp').innerText = state.currentCompetencia;
  document.getElementById('close-modal-colabs').innerText = payroll.total_colaboradores || (payroll.itens ? payroll.itens.length : 0);
  document.getElementById('close-modal-liquido').innerText = formatCurrency(payroll.total_liquido || 0);
  document.getElementById('close-modal-encargos').innerText = formatCurrency(payroll.total_encargos || 0);

  document.getElementById('modal-close-payroll').classList.remove('hidden');
}

function closeCloseModal() {
  document.getElementById('modal-close-payroll').classList.add('hidden');
}

async function confirmClosePayroll() {
  const just = document.getElementById('close-modal-justificativa').value || 'Fechamento formal mensal.';
  try {
    await apiFetch('/api/payroll/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        competencia: state.currentCompetencia,
        status: 'fechada',
        justificativa: just,
        usuario: 'Douglas (Gestor de RH)'
      })
    });
    showAlert(`Competência ${state.currentCompetencia} FECHADA com sucesso!`, 'success');
    closeCloseModal();
    loadPayrollPreview();
    loadDashboardData();
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

// Reabertura de Folha Formal (Modal Mobile)
function openReopenModal() {
  if (state.currentRole !== 'rh_admin') {
    showAlert('Apenas usuários com perfil RH/Admin podem reabrir a folha.', 'error');
    return;
  }
  document.getElementById('reopen-modal-comp').innerText = state.currentCompetencia;
  document.getElementById('reopen-modal-justificativa').value = '';
  document.getElementById('modal-reopen-payroll').classList.remove('hidden');
}

function closeReopenModal() {
  document.getElementById('modal-reopen-payroll').classList.add('hidden');
}

async function confirmReopenPayroll() {
  const just = document.getElementById('reopen-modal-justificativa').value;
  if (!just || !just.trim()) {
    showAlert('Justificativa é obrigatória para registrar a reabertura na trilha de auditoria.', 'error');
    return;
  }

  try {
    await apiFetch('/api/payroll/reopen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        competencia: state.currentCompetencia,
        justificativa: just.trim(),
        usuario: 'Douglas (Gestor de RH)'
      })
    });
    showAlert(`Competência ${state.currentCompetencia} REABERTA para revisão!`, 'success');
    closeReopenModal();
    loadPayrollPreview();
    loadDashboardData();
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

// ==================== RECIBO / HOLERITE (RF-055) ====================

async function loadReceipt() {
  const sel = document.getElementById('receipt-emp-selector');
  let empId = sel ? sel.value : null;

  if (!empId && state.employees.length > 0) {
    empId = state.employees[0].id;
    if (sel) sel.value = empId;
  }

  if (!empId) return;
  state.activeHoleriteEmpId = empId;

  try {
    const data = await apiFetch(`/api/payroll/receipt/${state.currentCompetencia}/${empId}`);
    renderReceipt(data);
  } catch (error) {
    console.warn('Erro ao carregar holerite:', error);
  }
}

function viewEmployeeReceipt(empId) {
  const sel = document.getElementById('receipt-emp-selector');
  if (sel) sel.value = empId;
  switchTab('receipts');
  loadReceipt();
}

function navigateReceiptEmployee(delta) {
  if (!state.employees || state.employees.length === 0) return;
  const currentId = parseInt(document.getElementById('receipt-emp-selector').value, 10);
  const currentIndex = state.employees.findIndex(e => e.id === currentId);

  let nextIndex = currentIndex + delta;
  if (nextIndex >= state.employees.length) nextIndex = 0;
  if (nextIndex < 0) nextIndex = state.employees.length - 1;

  const nextEmp = state.employees[nextIndex];
  if (nextEmp) {
    document.getElementById('receipt-emp-selector').value = nextEmp.id;
    loadReceipt();
  }
}

function renderReceipt(data) {
  const colab = data.colaborador || {};
  const totais = data.totais || {};
  const bases = data.bases || {};
  const provis = data.provisoes || {};

  document.getElementById('holerite-comp').innerText = data.competencia || state.currentCompetencia;
  document.getElementById('holerite-nome').innerText = colab.nome || '--';
  document.getElementById('holerite-cpf').innerText = colab.cpf || '--';
  document.getElementById('holerite-cargo').innerText = colab.cargo || '--';
  document.getElementById('holerite-adm').innerText = `${formatDate(colab.dataAdmissao)} · Dep: ${colab.dependentes || 0}`;

  document.getElementById('holerite-tot-venc').innerText = formatCurrency(totais.totalProventos);
  document.getElementById('holerite-tot-desc').innerText = formatCurrency(totais.totalDescontos);
  document.getElementById('holerite-tot-liq').innerText = formatCurrency(totais.salarioLiquido);

  document.getElementById('holerite-base-sal').innerText = formatCurrency(bases.salarioBase);
  document.getElementById('holerite-base-inss').innerText = formatCurrency(bases.baseInss);
  document.getElementById('holerite-base-fgts').innerText = formatCurrency(bases.baseFgts);
  document.getElementById('holerite-val-fgts').innerText = formatCurrency(bases.valorFgts);
  document.getElementById('holerite-base-irrf').innerText = formatCurrency(bases.baseIrrf);

  document.getElementById('prov-13-val').innerText = formatCurrency(provis.provisao13Total || 0);
  document.getElementById('prov-ferias-val').innerText = formatCurrency(provis.provisaoFeriasTotal || 0);
  document.getElementById('prov-custo-total').innerText = formatCurrency(
    (totais.totalProventos || 0) + (provis.totalProvisoesComEncargos || 0)
  );

  const tbody = document.getElementById('holerite-rubricas-body');
  const proventos = data.proventos || [];
  const descontos = data.descontos || [];
  const maxRows = Math.max(proventos.length, descontos.length, 1);

  let rowsHtml = '';
  for (let i = 0; i < maxRows; i++) {
    const p = proventos[i];
    const d = descontos[i];
    if (p) {
      rowsHtml += `
        <tr>
          <td class="py-1.5 px-3 text-slate-500">${p.codigo || '001'}</td>
          <td class="py-1.5 px-3 font-semibold text-slate-900">${escapeHtml(p.descricao)}</td>
          <td class="py-1.5 px-3 text-slate-500">${p.referencia || '-'}</td>
          <td class="py-1.5 px-3 text-right font-bold text-slate-900">${formatCurrency(p.valor)}</td>
          <td class="py-1.5 px-3 text-right text-slate-300">-</td>
        </tr>
      `;
    }
    if (d) {
      rowsHtml += `
        <tr>
          <td class="py-1.5 px-3 text-slate-500">${d.codigo || '200'}</td>
          <td class="py-1.5 px-3 font-semibold text-rose-700">${escapeHtml(d.descricao)}</td>
          <td class="py-1.5 px-3 text-slate-500">${d.referencia || '-'}</td>
          <td class="py-1.5 px-3 text-right text-slate-300">-</td>
          <td class="py-1.5 px-3 text-right font-bold text-rose-600">${formatCurrency(d.valor)}</td>
        </tr>
      `;
    }
  }

  tbody.innerHTML = rowsHtml;
}

// Compartilhamento Mobile do Holerite (Web Share API)
async function shareReceipt() {
  const colabName = document.getElementById('holerite-nome').innerText;
  const comp = document.getElementById('holerite-comp').innerText;
  const liq = document.getElementById('holerite-tot-liq').innerText;
  const shareText = `Demonstrativo de Pagamento (${comp})\nColaborador: ${colabName}\nLíquido a Receber: ${liq}\nEmitido por Pagamentus.`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `Holerite ${colabName} - ${comp}`,
        text: shareText
      });
    } catch (e) {
      // cancelado pelo usuário
    }
  } else {
    // Fallback para cópia
    navigator.clipboard.writeText(shareText);
    showAlert('Resumo do holerite copiado para a área de transferência!', 'info');
  }
}

// ==================== SIMULADOR DE FÉRIAS E 13º (RF-052) ====================

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
        <div class="flex justify-between py-1 border-b bg-blue-50 font-bold p-1 rounded"><span>Total Bruto:</span><span>${formatCurrency(res.totalBruto)}</span></div>
        <div class="flex justify-between py-1 border-b text-rose-600"><span>INSS:</span><span>- ${formatCurrency(res.descontoInss)}</span></div>
        <div class="flex justify-between py-1 border-b text-rose-600"><span>IRRF:</span><span>- ${formatCurrency(res.descontoIrrf)}</span></div>
        <div class="flex justify-between py-1.5 bg-emerald-50 text-emerald-800 font-extrabold text-sm rounded px-2"><span>Líquido a Receber:</span><span>${formatCurrency(res.valorLiquido)}</span></div>
        <div class="flex justify-between py-1 text-slate-500 text-[11px]"><span>FGTS Depositado (8%):</span><span>${formatCurrency(res.valorFgts)}</span></div>
      `;
    } else {
      const parcela = mod === '13_1' ? '1' : '2';
      const res = await apiFetch(`/api/payroll/13th?employee_id=${empId}&parcela=${parcela}&meses=12`);

      details.innerHTML = `
        <div class="flex justify-between py-1 border-b"><span>Parcela:</span><strong>${escapeHtml(res.parcela)}</strong></div>
        <div class="flex justify-between py-1 border-b"><span>Valor Integral de Referência:</span><strong>${formatCurrency(res.valorIntegral)}</strong></div>
        <div class="flex justify-between py-1.5 bg-emerald-50 text-emerald-800 font-extrabold text-sm rounded px-2"><span>Líquido a Receber:</span><span>${formatCurrency(res.valorLiquido)}</span></div>
        <div class="flex justify-between py-1 text-slate-500 text-[11px]"><span>FGTS Depositado (8%):</span><span>${formatCurrency(res.fgts)}</span></div>
      `;
    }

    resultBox.classList.remove('hidden');
  } catch (error) {
    showAlert(error.message, 'error');
  }
}

// ==================== eSOCIAL SIMULADO (RF-054) ====================

async function loadEsocialPreview() {
  try {
    const data = await apiFetch(`/api/esocial/preview/${state.currentCompetencia}`);
    const preview = document.getElementById('esocial-code-preview');
    if (preview) {
      preview.innerText = JSON.stringify(data, null, 2);
    }
  } catch (error) {
    console.error('Erro eSocial:', error);
  }
}

function downloadEsocial(format) {
  const url = `/api/esocial/download/${state.currentCompetencia}?format=${format}`;
  window.open(url, '_blank');
}

// ==================== AUDITORIA & PARÂMETROS (RF-056) ====================

async function loadAuditLogs() {
  try {
    const logs = await apiFetch('/api/payroll/audit-logs');
    renderAuditLogs(logs);
  } catch (error) {
    console.error('Erro logs:', error);
  }
}

function renderAuditLogs(logs) {
  const container = document.getElementById('audit-logs-mobile-container');
  const tbody = document.getElementById('audit-logs-table-body');

  if (container) {
    if (!logs || logs.length === 0) {
      container.innerHTML = `<div class="p-4 text-center text-slate-400 text-xs">Nenhum log registrado.</div>`;
    } else {
      container.innerHTML = logs.map(l => `
        <div class="mobile-card space-y-1 text-xs">
          <div class="flex justify-between items-start">
            <span class="font-bold text-slate-900">${escapeHtml(l.acao)}</span>
            <span class="text-[10px] text-slate-400 font-mono">${formatDate(l.data_hora)}</span>
          </div>
          <div class="text-[11px] text-slate-500">${escapeHtml(l.usuario)} · ${escapeHtml(l.perfil)}</div>
          <p class="text-slate-700 bg-slate-50 p-2 rounded text-[11px]">${escapeHtml(l.detalhes || '-')}</p>
        </div>
      `).join('');
    }
  }

  if (tbody) {
    if (!logs || logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-slate-400">Nenhum log registrado.</td></tr>`;
    } else {
      tbody.innerHTML = logs.map(l => `
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="py-2 px-3 text-slate-500 font-mono text-[11px]">${formatDate(l.data_hora)}</td>
          <td class="py-2 px-3 font-semibold text-slate-900">${escapeHtml(l.usuario)}</td>
          <td class="py-2 px-3 font-bold text-blue-700 text-xs">${escapeHtml(l.acao)}</td>
          <td class="py-2 px-3 text-slate-600 text-xs">${escapeHtml(l.detalhes || '-')}</td>
        </tr>
      `).join('');
    }
  }
}

async function loadParameters() {
  try {
    const params = await apiFetch('/api/parameters');
    const container = document.getElementById('parameters-container');
    if (!container) return;

    container.innerHTML = params.map(p => `
      <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
        <div>
          <span class="font-bold text-slate-800 block">${escapeHtml(p.chave)}</span>
          <span class="text-[10px] text-slate-500">${escapeHtml(p.descricao)}</span>
        </div>
        <span class="font-mono font-bold text-blue-700 bg-white px-2 py-1 rounded-lg border border-slate-200">${p.valor}</span>
      </div>
    `).join('');
  } catch (error) {
    console.error('Erro parâmetros:', error);
  }
}

// ==================== UTILITÁRIOS ====================

function formatCurrency(val) {
  if (val === undefined || val === null) return 'R$ 0,00';
  if (typeof val === 'string' && val.includes('*****')) return val; // Mascarado LGPD
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return 'R$ 0,00';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr) {
  if (!dateStr) return '--';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch (e) {
    return dateStr;
  }
}

function escapeHtml(str) {
  if (!str) return '';
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
  const msgEl = document.getElementById('alert-message');

  msgEl.innerText = message;
  banner.classList.remove('hidden');

  if (type === 'error') {
    content.className = 'p-3 rounded-xl flex items-center justify-between text-xs sm:text-sm shadow-sm bg-rose-50 text-rose-800 border border-rose-300';
  } else if (type === 'success') {
    content.className = 'p-3 rounded-xl flex items-center justify-between text-xs sm:text-sm shadow-sm bg-emerald-50 text-emerald-800 border border-emerald-300';
  } else {
    content.className = 'p-3 rounded-xl flex items-center justify-between text-xs sm:text-sm shadow-sm bg-blue-50 text-blue-800 border border-blue-300';
  }

  setTimeout(() => {
    hideAlert();
  }, 6000);
}

function hideAlert() {
  const banner = document.getElementById('alert-banner');
  if (banner) banner.classList.add('hidden');
}

// Modal Mais Opções (Mobile Bottom Sheet)
function openMoreMenuModal() {
  const m = document.getElementById('modal-more-menu');
  if (m) m.classList.remove('hidden');
}

function closeMoreMenuModal() {
  const m = document.getElementById('modal-more-menu');
  if (m) m.classList.add('hidden');
}

// Fechamento de modais com clique fora (backdrop) e tecla ESC
document.addEventListener('click', (e) => {
  if (e.target && e.target.classList && e.target.classList.contains('fixed') && e.target.id && e.target.id.startsWith('modal-')) {
    e.target.classList.add('hidden');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const openModals = document.querySelectorAll("div[id^='modal-']:not(.hidden)");
    openModals.forEach(modal => modal.classList.add('hidden'));
  }
});
