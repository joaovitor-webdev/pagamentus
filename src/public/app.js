// PAGAMENTUS - Módulo Item 2: Contabilidade e Financeiro
// Frontend Controller

const API_BASE = '/api';
const DEFAULT_ORG = 'org-padrao-001';

let contasCache = [];
let contasAnaliticasCache = [];
let contasSinteticasCache = [];
let filtroTipoTitulosAtual = '';
let parcelaEmBaixaAtual = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  inicializarDatasPadrao();
  navegarPara('dashboard');
  carregarContas();

  // Mobile menu toggle
  const btnToggle = document.getElementById('btn-toggle-menu');
  if (btnToggle) {
    btnToggle.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      sidebar.classList.toggle('-translate-x-full');
    });
  }
});

function inicializarDatasPadrao() {
  const hoje = new Date().toISOString().substring(0, 10);
  const elLancData = document.getElementById('lanc-data');
  const elLancComp = document.getElementById('lanc-competencia');
  const elTitEmissao = document.getElementById('titulo-emissao');
  const elTitVenc = document.getElementById('titulo-vencimento');
  const elBxData = document.getElementById('baixa-data');

  if (elLancData) elLancData.value = hoje;
  if (elLancComp) elLancComp.value = hoje.substring(0, 7);
  if (elTitEmissao) elTitEmissao.value = hoje;
  if (elTitVenc) {
    const d30 = new Date();
    d30.setDate(d30.getDate() + 30);
    elTitVenc.value = d30.toISOString().substring(0, 10);
  }
  if (elBxData) elBxData.value = hoje;
}

// ================= NAVEGAÇÃO ENTRE SEÇÕES =================
function navegarPara(secao) {
  const secoes = ['dashboard', 'plano-contas', 'lancamentos', 'titulos'];
  secoes.forEach(s => {
    const el = document.getElementById(`sec-${s}`);
    const nav = document.getElementById(`nav-${s}`);
    if (el) el.classList.add('hidden');
    if (nav) {
      nav.classList.remove('bg-blue-600', 'text-white', 'shadow-sm');
      nav.classList.add('text-slate-400', 'hover:text-white', 'hover:bg-slate-800');
    }
  });

  const elAtiva = document.getElementById(`sec-${secao}`);
  const navAtivo = document.getElementById(`nav-${secao}`);
  if (elAtiva) elAtiva.classList.remove('hidden');
  if (navAtivo) {
    navAtivo.classList.remove('text-slate-400', 'hover:text-white', 'hover:bg-slate-800');
    navAtivo.classList.add('bg-blue-600', 'text-white', 'shadow-sm');
  }

  // Fecha sidebar mobile se aberta
  const sidebar = document.getElementById('sidebar');
  if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
    sidebar.classList.add('-translate-x-full');
  }

  if (secao === 'dashboard') carregarDashboard();
  if (secao === 'plano-contas') carregarContas();
  if (secao === 'lancamentos') carregarLancamentos();
  if (secao === 'titulos') carregarTitulos();
}

// ================= TOAST NOTIFICATIONS =================
function mostrarToast(mensagem, tipo = 'sucesso') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const corBg = tipo === 'sucesso' ? 'bg-emerald-600' : 'bg-rose-600';
  const icone = tipo === 'sucesso' ? '✓' : '✕';

  toast.className = `${corBg} text-white px-4 py-3 rounded-xl shadow-lg text-sm flex items-center space-x-2 pointer-events-auto transform transition duration-300 translate-y-2 opacity-0`;
  toast.innerHTML = `
    <span class="font-bold text-base">${icone}</span>
    <span class="flex-1">${mensagem}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ================= FORMATADORES =================
function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(dataStr) {
  if (!dataStr) return '-';
  const partes = dataStr.substring(0, 10).split('-');
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// ================= DASHBOARD =================
async function carregarDashboard() {
  try {
    const resResumo = await fetch(`${API_BASE}/financeiro/resumo`, { credentials: 'omit' });
    const resumo = await resResumo.json();

    document.getElementById('kpi-pagar-pendente').textContent = formatarMoeda(resumo.pagar.pendente);
    document.getElementById('kpi-pagar-quitado').textContent = formatarMoeda(resumo.pagar.quitado);
    document.getElementById('kpi-receber-pendente').textContent = formatarMoeda(resumo.receber.pendente);
    document.getElementById('kpi-receber-quitado').textContent = formatarMoeda(resumo.receber.quitado);
    document.getElementById('kpi-saldo-liquido').textContent = formatarMoeda(resumo.saldoLiquidoPendente);

    // Lançamentos recentes
    const resLanc = await fetch(`${API_BASE}/contabilidade/lancamentos`);
    const lancamentos = await resLanc.json();
    const containerLanc = document.getElementById('dashboard-recent-lancamentos');
    if (containerLanc) {
      if (lancamentos.length === 0) {
        containerLanc.innerHTML = `<div class="p-3 text-slate-400 text-center">Nenhum lançamento registrado.</div>`;
      } else {
        containerLanc.innerHTML = lancamentos.slice(0, 4).map(l => `
          <div class="py-2.5 flex items-center justify-between">
            <div>
              <div class="font-medium text-slate-800">${l.historico}</div>
              <div class="text-xs text-slate-400">Lançamento #${l.numero} • ${formatarData(l.data_lancamento)}</div>
            </div>
            <div class="text-right">
              <div class="font-bold text-slate-900">${formatarMoeda(l.valor_total)}</div>
              <span class="text-[10px] uppercase font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Equilibrado</span>
            </div>
          </div>
        `).join('');
      }
    }

    // Próximos vencimentos
    const resTit = await fetch(`${API_BASE}/financeiro/titulos?status=PENDENTE`);
    const titulos = await resTit.json();
    const containerVenc = document.getElementById('dashboard-recent-vencimentos');
    if (containerVenc) {
      if (titulos.length === 0) {
        containerVenc.innerHTML = `<div class="p-3 text-slate-400 text-center">Nenhum título pendente.</div>`;
      } else {
        containerVenc.innerHTML = titulos.slice(0, 4).map(t => `
          <div class="py-2.5 flex items-center justify-between">
            <div>
              <div class="font-medium text-slate-800">${t.pessoa_nome}</div>
              <div class="text-xs text-slate-400">${t.descricao}</div>
            </div>
            <div class="text-right">
              <div class="font-bold ${t.tipo === 'PAGAR' ? 'text-rose-600' : 'text-emerald-600'}">${formatarMoeda(t.total_pendente)}</div>
              <span class="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${t.tipo === 'PAGAR' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}">${t.tipo === 'PAGAR' ? 'A Pagar' : 'A Receber'}</span>
            </div>
          </div>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
  }
}

// ================= SPEC-2.1: PLANO DE CONTAS =================
async function carregarContas() {
  try {
    const res = await fetch(`${API_BASE}/contabilidade/contas`);
    contasCache = await res.json();
    contasAnaliticasCache = contasCache.filter(c => c.tipo === 'ANALITICA' && c.status === 'ATIVA');
    contasSinteticasCache = contasCache.filter(c => c.tipo === 'SINTETICA');

    renderizarArvoreContas();
    renderizarTabelaContas(contasCache);
    preencherSelectContasPai();
  } catch (err) {
    mostrarToast("Erro ao carregar plano de contas", "erro");
  }
}

function alternarModoVisualizacaoContas(modo) {
  const cArvore = document.getElementById('container-arvore-contas');
  const cTabela = document.getElementById('container-tabela-contas');
  const btnA = document.getElementById('btn-modo-arvore');
  const btnT = document.getElementById('btn-modo-tabela');

  if (modo === 'arvore') {
    cArvore.classList.remove('hidden');
    cTabela.classList.add('hidden');
    btnA.className = 'px-3 py-1.5 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200';
    btnT.className = 'px-3 py-1.5 text-xs font-medium rounded-md text-slate-600 hover:bg-slate-100';
  } else {
    cArvore.classList.add('hidden');
    cTabela.classList.remove('hidden');
    btnT.className = 'px-3 py-1.5 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200';
    btnA.className = 'px-3 py-1.5 text-xs font-medium rounded-md text-slate-600 hover:bg-slate-100';
  }
}

function renderizarArvoreContas() {
  const container = document.getElementById('container-arvore-contas');
  if (!container) return;

  if (contasCache.length === 0) {
    container.innerHTML = `<p class="text-slate-400 text-sm">Nenhuma conta cadastrada.</p>`;
    return;
  }

  container.innerHTML = contasCache.map(c => {
    const indent = (c.nivel - 1) * 24;
    const isSintetica = c.tipo === 'SINTETICA';
    const badgeNaturezaClass = `badge-${c.natureza.toLowerCase().replace('_', '')}`;

    return `
      <div style="padding-left: ${indent}px;" class="py-2 px-3 rounded-lg hover:bg-slate-50 flex items-center justify-between border-b border-slate-100/60 transition">
        <div class="flex items-center space-x-2">
          <span class="font-mono text-xs ${isSintetica ? 'font-bold text-slate-900' : 'text-slate-600'}">${c.codigo}</span>
          <span class="text-sm ${isSintetica ? 'font-bold text-slate-900' : 'text-slate-700'}">${c.nome}</span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-[11px] px-2 py-0.5 rounded-full font-medium ${badgeNaturezaClass}">${c.natureza}</span>
          <span class="text-[11px] px-2 py-0.5 rounded-full ${isSintetica ? 'badge-sintetica' : 'badge-analitica'}">
            ${isSintetica ? 'Sintética (Sem lançamentos)' : 'Analítica (Apta)'}
          </span>
          <span class="text-[11px] px-2 py-0.5 rounded-full ${c.status === 'ATIVA' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}">
            ${c.status}
          </span>
          ${c.status === 'ATIVA' ? `
            <button onclick="desativarConta('${c.id}', '${c.nome}')" title="Desativar conta" class="p-1 text-slate-400 hover:text-rose-600 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
            </button>
          ` : `
            <button onclick="ativarConta('${c.id}')" title="Reativar conta" class="p-1 text-slate-400 hover:text-emerald-600 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function renderizarTabelaContas(contas) {
  const tbody = document.getElementById('tbody-contas');
  if (!tbody) return;

  if (contas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-slate-400">Nenhuma conta encontrada.</td></tr>`;
    return;
  }

  tbody.innerHTML = contas.map(c => `
    <tr class="hover:bg-slate-50 transition">
      <td class="px-4 py-3 font-mono font-medium text-xs text-slate-800">${c.codigo}</td>
      <td class="px-4 py-3 font-medium text-slate-900">${c.nome}</td>
      <td class="px-4 py-3">
        <span class="text-xs px-2 py-0.5 rounded-full badge-${c.natureza.toLowerCase().replace('_', '')}">${c.natureza}</span>
      </td>
      <td class="px-4 py-3">
        <span class="text-xs px-2 py-0.5 rounded-full ${c.tipo === 'SINTETICA' ? 'badge-sintetica' : 'badge-analitica'}">
          ${c.tipo}
        </span>
      </td>
      <td class="px-4 py-3 text-slate-500 text-xs">${c.nivel}</td>
      <td class="px-4 py-3">
        <span class="text-xs px-2 py-0.5 rounded-full ${c.status === 'ATIVA' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}">${c.status}</span>
      </td>
      <td class="px-4 py-3 text-right">
        ${c.status === 'ATIVA' ? `
          <button onclick="desativarConta('${c.id}', '${c.nome}')" class="text-xs text-rose-600 hover:underline">Desativar</button>
        ` : `
          <button onclick="ativarConta('${c.id}')" class="text-xs text-emerald-600 hover:underline">Reativar</button>
        `}
      </td>
    </tr>
  `).join('');
}

function filtrarContas() {
  const termo = document.getElementById('busca-contas').value.toLowerCase().trim();
  const filtradas = contasCache.filter(c => 
    c.codigo.toLowerCase().includes(termo) || c.nome.toLowerCase().includes(termo)
  );
  renderizarTabelaContas(filtradas);
}

function preencherSelectContasPai() {
  const select = document.getElementById('conta-pai-id');
  if (!select) return;
  select.innerHTML = '<option value="">Nenhuma (Conta Raiz)</option>' +
    contasSinteticasCache.map(c => `<option value="${c.id}">${c.codigo} - ${c.nome} (${c.natureza})</option>`).join('');
}

function abrirModalConta() {
  document.getElementById('form-conta').reset();
  preencherSelectContasPai();
  document.getElementById('modal-conta').classList.remove('hidden');
}

function atualizarInstrucaoTipoConta() {
  // Ajustes de interface quando troca entre analítica e sintética
}

async function salvarConta(e) {
  e.preventDefault();
  const codigo = document.getElementById('conta-codigo').value;
  const nome = document.getElementById('conta-nome').value;
  const natureza = document.getElementById('conta-natureza').value;
  const tipo = document.querySelector('input[name="tipo"]:checked').value;
  const conta_pai_id = document.getElementById('conta-pai-id').value || null;

  try {
    const res = await fetch(`${API_BASE}/contabilidade/contas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, nome, natureza, tipo, conta_pai_id })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    mostrarToast(`Conta '${data.codigo} - ${data.nome}' criada com sucesso!`);
    fecharModal('modal-conta');
    carregarContas();
  } catch (err) {
    mostrarToast(err.message, "erro");
  }
}

async function desativarConta(id, nome) {
  if (!confirm(`Deseja realmente desativar a conta '${nome}'? O sistema verificará se existem contas filhas ativas associadas.`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/contabilidade/contas/${id}/desativar`, {
      method: 'PATCH'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    mostrarToast("Conta desativada com sucesso!");
    carregarContas();
  } catch (err) {
    mostrarToast(err.message, "erro");
  }
}

async function ativarConta(id) {
  try {
    const res = await fetch(`${API_BASE}/contabilidade/contas/${id}/ativar`, {
      method: 'PATCH'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    mostrarToast("Conta reativada com sucesso!");
    carregarContas();
  } catch (err) {
    mostrarToast(err.message, "erro");
  }
}

// ================= SPEC-2.2: LANÇAMENTOS COM PARTIDAS DOBRADAS =================
let partidasLancamento = [];

function abrirModalLancamento() {
  document.getElementById('form-lancamento').reset();
  inicializarDatasPadrao();
  partidasLancamento = [];
  
  // Inicia com 2 partidas: 1 Débito e 1 Crédito
  adicionarLinhaPartida('DEBITO');
  adicionarLinhaPartida('CREDITO');
  
  document.getElementById('modal-lancamento').classList.remove('hidden');
}

function adicionarLinhaPartida(tipoDefault = 'DEBITO') {
  const container = document.getElementById('container-partidas');
  if (!container) return;

  const idLinha = 'pt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  
  const optionsContas = contasAnaliticasCache.map(c => 
    `<option value="${c.id}">${c.codigo} - ${c.nome} (${c.natureza})</option>`
  ).join('');

  const div = document.createElement('div');
  div.id = idLinha;
  div.className = 'grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-slate-50 border border-slate-200';
  div.innerHTML = `
    <div class="col-span-3">
      <select onchange="recalcularEquilibrio()" class="partida-tipo text-xs font-semibold px-2 py-1.5 border border-slate-300 rounded-lg w-full bg-white focus:ring-2 focus:ring-indigo-500">
        <option value="DEBITO" ${tipoDefault === 'DEBITO' ? 'selected' : ''}>DÉBITO (+)</option>
        <option value="CREDITO" ${tipoDefault === 'CREDITO' ? 'selected' : ''}>CRÉDITO (-)</option>
      </select>
    </div>
    <div class="col-span-5">
      <select class="partida-conta text-xs px-2 py-1.5 border border-slate-300 rounded-lg w-full bg-white focus:ring-2 focus:ring-indigo-500">
        <option value="">Selecione Conta Analítica...</option>
        ${optionsContas}
      </select>
    </div>
    <div class="col-span-3">
      <input type="number" step="0.01" min="0.01" oninput="recalcularEquilibrio()" placeholder="Valor (R$)" class="partida-valor text-xs px-2 py-1.5 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 font-semibold">
    </div>
    <div class="col-span-1 text-center">
      <button type="button" onclick="removerLinhaPartida('${idLinha}')" class="text-slate-400 hover:text-rose-600 transition p-1">✕</button>
    </div>
  `;

  container.appendChild(div);
  recalcularEquilibrio();
}

function removerLinhaPartida(idLinha) {
  const el = document.getElementById(idLinha);
  if (el) el.remove();
  recalcularEquilibrio();
}

// CÁLCULO E VALIDAÇÃO DE EQUILÍBRIO EM TEMPO REAL (RB-001)
function recalcularEquilibrio() {
  const container = document.getElementById('container-partidas');
  if (!container) return;

  const linhas = container.querySelectorAll('.grid');
  let totalDebitos = 0;
  let totalCreditos = 0;

  linhas.forEach(linha => {
    const tipo = linha.querySelector('.partida-tipo').value;
    const valor = parseFloat(linha.querySelector('.partida-valor').value) || 0;
    if (tipo === 'DEBITO') totalDebitos += valor;
    else totalCreditos += valor;
  });

  totalDebitos = Math.round((totalDebitos + Number.EPSILON) * 100) / 100;
  totalCreditos = Math.round((totalCreditos + Number.EPSILON) * 100) / 100;
  const diferenca = Math.round(Math.abs(totalDebitos - totalCreditos) * 100) / 100;

  document.getElementById('calc-total-debitos').textContent = formatarMoeda(totalDebitos);
  document.getElementById('calc-total-creditos').textContent = formatarMoeda(totalCreditos);
  document.getElementById('calc-diferenca').textContent = formatarMoeda(diferenca);

  const badge = document.getElementById('status-equilibrio-badge');
  const btnSalvar = document.getElementById('btn-salvar-lancamento');

  if (linhas.length < 2 || (totalDebitos === 0 && totalCreditos === 0)) {
    badge.className = 'px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 bg-amber-100 text-amber-800 border border-amber-200';
    badge.innerHTML = '<span>⚠️ Aguardando valores</span>';
    btnSalvar.disabled = true;
  } else if (diferenca === 0 && totalDebitos > 0) {
    badge.className = 'px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300';
    badge.innerHTML = '<span>✓ Equilibrado (RB-001 Atendida)</span>';
    btnSalvar.disabled = false;
  } else {
    badge.className = 'px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 bg-rose-100 text-rose-800 border border-rose-300';
    badge.innerHTML = `<span>✕ Desbalanceado: dif. ${formatarMoeda(diferenca)}</span>`;
    btnSalvar.disabled = true;
  }
}

async function salvarLancamento(e) {
  e.preventDefault();
  const data_lancamento = document.getElementById('lanc-data').value;
  const competencia = document.getElementById('lanc-competencia').value;
  const historico = document.getElementById('lanc-historico').value;

  const container = document.getElementById('container-partidas');
  const linhas = container.querySelectorAll('.grid');
  const partidas = [];

  linhas.forEach(linha => {
    const tipo = linha.querySelector('.partida-tipo').value;
    const conta_id = linha.querySelector('.partida-conta').value;
    const valor = parseFloat(linha.querySelector('.partida-valor').value);
    if (conta_id && valor > 0) {
      partidas.push({ tipo, conta_id, valor });
    }
  });

  try {
    const res = await fetch(`${API_BASE}/contabilidade/lancamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data_lancamento, competencia, historico, partidas })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    mostrarToast(`Lançamento #${data.numero} efetivado com sucesso! (${formatarMoeda(data.valor_total)})`);
    fecharModal('modal-lancamento');
    carregarLancamentos();
    carregarDashboard();
  } catch (err) {
    mostrarToast(err.message, "erro");
  }
}

async function carregarLancamentos() {
  const busca = document.getElementById('busca-lancamentos') ? document.getElementById('busca-lancamentos').value : '';
  try {
    const res = await fetch(`${API_BASE}/contabilidade/lancamentos?busca=${encodeURIComponent(busca)}`);
    const lancamentos = await res.json();
    const tbody = document.getElementById('tbody-lancamentos');
    if (!tbody) return;

    if (lancamentos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400">Nenhum lançamento contábil registrado.</td></tr>`;
      return;
    }

    tbody.innerHTML = lancamentos.map(l => {
      const partidasHtml = l.partidas.map(p => `
        <div class="text-xs flex items-center space-x-1.5 py-0.5">
          <span class="font-bold text-[10px] px-1 py-0.5 rounded ${p.tipo === 'DEBITO' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}">${p.tipo === 'DEBITO' ? 'D' : 'C'}</span>
          <span class="font-mono text-slate-600">${p.conta_codigo}</span>
          <span class="text-slate-800">${p.conta_nome}:</span>
          <span class="font-semibold">${formatarMoeda(p.valor)}</span>
        </div>
      `).join('');

      return `
        <tr class="hover:bg-slate-50 transition">
          <td class="px-4 py-3 font-bold text-slate-900">#${l.numero}</td>
          <td class="px-4 py-3 text-slate-600">${formatarData(l.data_lancamento)}</td>
          <td class="px-4 py-3 text-xs font-mono text-slate-500">${l.competencia}</td>
          <td class="px-4 py-3 font-medium text-slate-900">${l.historico}</td>
          <td class="px-4 py-3">${partidasHtml}</td>
          <td class="px-4 py-3 text-right font-bold text-slate-900">${formatarMoeda(l.valor_total)}</td>
          <td class="px-4 py-3 text-center">
            <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">${l.status}</span>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    mostrarToast("Erro ao carregar lançamentos", "erro");
  }
}

// ================= SPEC-2.3: CONTAS A PAGAR E RECEBER =================
function filtrarTipoTitulos(tipo) {
  filtroTipoTitulosAtual = tipo;
  const btnTodos = document.getElementById('btn-filtro-tipo-todos');
  const btnPagar = document.getElementById('btn-filtro-tipo-pagar');
  const btnReceber = document.getElementById('btn-filtro-tipo-receber');

  [btnTodos, btnPagar, btnReceber].forEach(b => {
    b.className = 'px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200';
  });

  if (tipo === '') btnTodos.className = 'px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 text-white';
  if (tipo === 'PAGAR') btnPagar.className = 'px-3 py-1.5 text-xs font-semibold rounded-md bg-rose-600 text-white';
  if (tipo === 'RECEBER') btnReceber.className = 'px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 text-white';

  carregarTitulos();
}

async function carregarTitulos() {
  const busca = document.getElementById('busca-titulos') ? document.getElementById('busca-titulos').value : '';
  const status = document.getElementById('filtro-status-titulo') ? document.getElementById('filtro-status-titulo').value : '';

  let url = `${API_BASE}/financeiro/titulos?tipo=${filtroTipoTitulosAtual}&status=${status}&busca=${encodeURIComponent(busca)}`;
  try {
    const res = await fetch(url);
    const titulos = await res.json();
    const tbody = document.getElementById('tbody-titulos');
    if (!tbody) return;

    if (titulos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="p-6 text-center text-slate-400">Nenhum título encontrado com os filtros aplicados.</td></tr>`;
      return;
    }

    tbody.innerHTML = titulos.map(t => {
      const isPagar = t.tipo === 'PAGAR';
      const badgeStatus = {
        'PENDENTE': 'bg-blue-50 text-blue-700 border border-blue-200',
        'PARCIAL': 'bg-amber-50 text-amber-700 border border-amber-200',
        'PAGO': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        'CANCELADO': 'bg-slate-100 text-slate-500'
      }[t.status] || 'bg-slate-100 text-slate-700';

      return `
        <tr class="hover:bg-slate-50 transition">
          <td class="px-4 py-3">
            <span class="text-xs px-2 py-0.5 rounded-full font-bold ${isPagar ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}">
              ${isPagar ? 'PAGAR' : 'RECEBER'}
            </span>
          </td>
          <td class="px-4 py-3 font-semibold text-slate-900">${t.pessoa_nome}</td>
          <td class="px-4 py-3 text-slate-700">${t.descricao}</td>
          <td class="px-4 py-3 text-xs text-slate-500">${formatarData(t.data_emissao)}</td>
          <td class="px-4 py-3 font-bold text-slate-900">${formatarMoeda(t.valor_total)}</td>
          <td class="px-4 py-3 font-medium text-emerald-600">${formatarMoeda(t.total_pago)}</td>
          <td class="px-4 py-3 font-bold text-rose-600">${formatarMoeda(t.total_pendente)}</td>
          <td class="px-4 py-3 text-center">
            <span class="text-xs px-2 py-0.5 rounded-full font-bold ${badgeStatus}">${t.status}</span>
          </td>
          <td class="px-4 py-3 text-right">
            <button onclick="abrirDetalhesTitulo('${t.id}')" class="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-medium transition">
              ${t.quantidade_parcelas} parc. • Gerenciar
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    mostrarToast("Erro ao carregar títulos", "erro");
  }
}

function abrirModalTitulo() {
  document.getElementById('form-titulo').reset();
  inicializarDatasPadrao();
  document.getElementById('modal-titulo').classList.remove('hidden');
}

async function salvarTitulo(e) {
  e.preventDefault();
  const tipo = document.querySelector('input[name="tipo_titulo"]:checked').value;
  const pessoa_nome = document.getElementById('titulo-pessoa').value;
  const descricao = document.getElementById('titulo-descricao').value;
  const valor_total = parseFloat(document.getElementById('titulo-valor').value);
  const quantidade_parcelas = parseInt(document.getElementById('titulo-parcelas').value, 10);
  const data_emissao = document.getElementById('titulo-emissao').value;
  const primeiro_vencimento = document.getElementById('titulo-vencimento').value;

  try {
    const res = await fetch(`${API_BASE}/financeiro/titulos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, pessoa_nome, descricao, valor_total, quantidade_parcelas, data_emissao, primeiro_vencimento })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    mostrarToast(`Título cadastrado com sucesso em ${data.quantidade_parcelas} parcela(s)!`);
    fecharModal('modal-titulo');
    carregarTitulos();
    carregarDashboard();
  } catch (err) {
    mostrarToast(err.message, "erro");
  }
}

async function abrirDetalhesTitulo(id) {
  try {
    const res = await fetch(`${API_BASE}/financeiro/titulos/${id}`);
    const titulo = await res.json();
    if (!res.ok) throw new Error(titulo.error);

    document.getElementById('detalhe-titulo-nome').textContent = `${titulo.pessoa_nome} - ${titulo.descricao}`;
    document.getElementById('detalhe-titulo-sub').textContent = `Total: ${formatarMoeda(titulo.valor_total)} • Status: ${titulo.status}`;

    const tbody = document.getElementById('tbody-detalhe-parcelas');
    tbody.innerHTML = titulo.parcelas.map(p => `
      <tr class="hover:bg-slate-50 transition">
        <td class="px-3 py-2 font-bold text-slate-800">Parc. ${p.numero_parcela}/${titulo.quantidade_parcelas}</td>
        <td class="px-3 py-2 text-slate-600">${formatarData(p.data_vencimento)}</td>
        <td class="px-3 py-2 font-medium">${formatarMoeda(p.valor_original)}</td>
        <td class="px-3 py-2 font-medium text-emerald-600">${formatarMoeda(p.valor_pago)}</td>
        <td class="px-3 py-2 font-bold text-rose-600">${formatarMoeda(p.saldo_pendente)}</td>
        <td class="px-3 py-2">
          <span class="text-xs px-2 py-0.5 rounded-full font-bold ${p.status === 'PAGO' ? 'bg-emerald-50 text-emerald-700' : (p.status === 'PARCIAL' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700')}">
            ${p.status}
          </span>
        </td>
        <td class="px-3 py-2 text-right">
          ${p.status !== 'PAGO' ? `
            <button onclick="abrirModalBaixa('${p.id}', '${p.numero_parcela}/${titulo.quantidade_parcelas}', ${p.valor_original}, ${p.valor_pago}, ${p.saldo_pendente})" class="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium shadow-sm transition">
              Efetuar Baixa
            </button>
          ` : `
            <span class="text-xs text-slate-400">Quitada</span>
          `}
        </td>
      </tr>
    `).join('');

    document.getElementById('modal-detalhes-titulo').classList.remove('hidden');
  } catch (err) {
    mostrarToast(err.message, "erro");
  }
}

function abrirModalBaixa(parcelaId, numeroFormatado, valorOriginal, valorPago, saldoPendente) {
  parcelaEmBaixaAtual = { parcelaId, saldoPendente };

  document.getElementById('baixa-parcela-id').value = parcelaId;
  document.getElementById('baixa-info-numero').textContent = numeroFormatado;
  document.getElementById('baixa-info-original').textContent = formatarMoeda(valorOriginal);
  document.getElementById('baixa-info-pago').textContent = formatarMoeda(valorPago);
  document.getElementById('baixa-info-pendente').textContent = formatarMoeda(saldoPendente);

  const inputValor = document.getElementById('baixa-valor');
  inputValor.value = saldoPendente.toFixed(2);
  inputValor.max = saldoPendente.toFixed(2);

  inicializarDatasPadrao();
  document.getElementById('modal-baixa').classList.remove('hidden');
}

function preencherBaixaTotal() {
  if (!parcelaEmBaixaAtual) return;
  document.getElementById('baixa-valor').value = parcelaEmBaixaAtual.saldoPendente.toFixed(2);
}

async function confirmarBaixa(e) {
  e.preventDefault();
  const parcelaId = document.getElementById('baixa-parcela-id').value;
  const valor_pago = parseFloat(document.getElementById('baixa-valor').value);
  const data_baixa = document.getElementById('baixa-data').value;
  const forma_pagamento = document.getElementById('baixa-forma').value;
  const observacao = document.getElementById('baixa-observacao').value;

  try {
    const res = await fetch(`${API_BASE}/financeiro/parcelas/${parcelaId}/baixa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valor_pago, data_baixa, forma_pagamento, observacao })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    mostrarToast("Baixa registrada com sucesso!");
    fecharModal('modal-baixa');
    fecharModal('modal-detalhes-titulo');
    carregarTitulos();
    carregarDashboard();
  } catch (err) {
    mostrarToast(err.message, "erro");
  }
}

// ================= MODAL HELPERS =================
function fecharModal(idModal) {
  const el = document.getElementById(idModal);
  if (el) el.classList.add('hidden');
}
