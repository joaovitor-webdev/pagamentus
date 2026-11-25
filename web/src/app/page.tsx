'use client';

import React, { useEffect, useState } from 'react';
import { consultarHealthcheck, HealthResponse } from '@/lib/api';
import { ModuloContabil } from '@/components/ModuloContabil';
import { ModuloFolha } from '@/components/ModuloFolha';
import { ModuloFiscalIR } from '@/components/ModuloFiscalIR';
import { ModuloObrigacoes } from '@/components/ModuloObrigacoes';
import { ModuloAuditoria } from '@/components/ModuloAuditoria';
import { ModuloCadastros } from '@/components/ModuloCadastros';
import { ModuloFinanceiro } from '@/components/ModuloFinanceiro';
import { ModuloParametros } from '@/components/ModuloParametros';
import { Sidebar, ModuloId } from '@/components/Sidebar';
import { TelaLogin } from '@/components/TelaLogin';
import { createClient } from '@/lib/supabase/client';
import { podeAcessarModulo, PapelUsuario } from '@/lib/permissoes';
import {
  Building2,
  Calculator,
  FileText,
  Users,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Database,
  Menu,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface EmpresaItem {
  id: string;
  nome: string;
  cnpj: string;
  regime: string;
  uf: string;
}

interface ObrigacaoRow {
  id: string;
  titulo: string;
  competencia: string;
  vencimento: string;
  status: string;
}

export default function HomePage() {
  const [usuarioLogado, setUsuarioLogado] = useState<{
    id: string;
    email: string;
    nome: string;
    papel: string;
  } | null>(null);
  const [moduloAtivo, setModuloAtivo] = useState<ModuloId>('dashboard');
  const [sidebarRecolhida, setSidebarRecolhida] = useState(false);
  const [mobileMenuAberto, setMobileMenuAberto] = useState(false);
  const [competencia, setCompetencia] = useState('2026-11');
  const [empresas, setEmpresas] = useState<EmpresaItem[]>([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<EmpresaItem>({
    id: '',
    nome: 'Carregando...',
    cnpj: '—',
    regime: '—',
    uf: '—',
  });
  const [obrigacoes, setObrigacoes] = useState<ObrigacaoRow[]>([]);
  const [contagens, setContagens] = useState({
    empregados: 0,
    lancamentos: 0,
    apuracoes: 0,
    apuracoesAprovadas: 0,
    impostosMesValor: 0,
    folhaStatus: 'ABERTA',
    folhaLiquidoTotal: 0,
    obrigacoesPendentes: 0,
  });
  const [health, setHealth] = useState<HealthResponse | null>(null);

  const perfilAtivo = usuarioLogado?.papel || 'CLIENTE';

  // 1. Verifica sessão existente ao carregar a página
  useEffect(() => {
    consultarHealthcheck().then((data) => {
      if (data) setHealth(data);
    });

    const params = new URLSearchParams(window.location.search);
    const compUrl = params.get('comp');
    if (compUrl) setCompetencia(compUrl);

    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: perfil } = await supabase
        .from('usuarios_perfis')
        .select('nome, papel')
        .eq('usuario_id', data.user.id)
        .single();

      setUsuarioLogado({
        id: data.user.id,
        email: data.user.email || '',
        nome: perfil?.nome || data.user.email || 'Usuário',
        papel: perfil?.papel || 'CLIENTE',
      });
    });
  }, []);

  // 2. Carrega empresas e obrigações sempre que o usuário logar
  useEffect(() => {
    if (!usuarioLogado) return;
    const supabase = createClient();
    const params = new URLSearchParams(window.location.search);

    supabase
      .from('empresas')
      .select('id, razao_social, cpf_cnpj, regime_tributario, uf')
      .eq('ativo', true)
      .order('razao_social')
      .then(({ data: empRows, error }) => {
        if (error) {
          console.error('Erro ao carregar empresas:', error.message);
          return;
        }
        if (empRows && empRows.length > 0) {
          const mapeadas: EmpresaItem[] = empRows.map((e) => ({
            id: e.id,
            nome: e.razao_social,
            cnpj: e.cpf_cnpj,
            regime: e.regime_tributario,
            uf: e.uf || 'PE',
          }));
          setEmpresas(mapeadas);
          const empUrl = params.get('empresa');
          const encontrada = mapeadas.find((m) => m.id === empUrl) || mapeadas[0];
          setEmpresaSelecionada(encontrada);
        }
      });

    supabase
      .from('obrigacoes_acessorias')
      .select('id, titulo, competencia, vencimento, status')
      .order('vencimento')
      .then(({ data: obRows }) => {
        if (obRows) setObrigacoes(obRows as ObrigacaoRow[]);
      });
  }, [usuarioLogado?.id]);

  // 3. Carrega contagens reais da empresa selecionada
  useEffect(() => {
    if (!usuarioLogado || !empresaSelecionada.id) return;
    const supabase = createClient();
    const hoje = new Date().toISOString().slice(0, 10);
    const seteDias = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

    Promise.all([
      supabase.from('empregados').select('id', { count: 'exact', head: true }).eq('empresa_id', empresaSelecionada.id),
      supabase.from('lancamentos_contabeis').select('id', { count: 'exact', head: true }).eq('empresa_id', empresaSelecionada.id).eq('estornado', false),
      supabase.from('apuracoes_fiscais').select('valor_apurado, status').eq('empresa_id', empresaSelecionada.id).eq('competencia', competencia),
      supabase
        .from('obrigacoes_acessorias')
        .select('id', { count: 'exact', head: true })
        .eq('empresa_id', empresaSelecionada.id)
        .neq('status', 'ENTREGUE')
        .gte('vencimento', hoje)
        .lte('vencimento', seteDias),
      supabase.from('competencias').select('status_folha').eq('empresa_id', empresaSelecionada.id).eq('ano_mes', competencia).maybeSingle(),
      supabase.from('folha_calculos').select('valor_liquido').eq('empresa_id', empresaSelecionada.id).eq('competencia', competencia),
    ]).then(([empRes, lancRes, apRes, obRes, compRes, folhaRes]) => {
      const aps = apRes.data || [];
      const impostosTotal = aps.reduce((acc, a) => acc + Number(a.valor_apurado || 0), 0);
      const aprovadas = aps.filter((a) => a.status === 'APROVADA').length;
      const liqTotal = (folhaRes.data || []).reduce((acc, f) => acc + Number(f.valor_liquido || 0), 0);

      setContagens({
        empregados: empRes.count ?? 0,
        lancamentos: lancRes.count ?? 0,
        apuracoes: aps.length,
        apuracoesAprovadas: aprovadas,
        impostosMesValor: impostosTotal,
        folhaStatus: compRes.data?.status_folha || 'ABERTA',
        folhaLiquidoTotal: liqTotal,
        obrigacoesPendentes: obRes.count ?? 0,
      });
    });
  }, [usuarioLogado?.id, empresaSelecionada.id, competencia]);

  // Persiste ?empresa=...&comp=... na URL somente quando houver empresa selecionada
  useEffect(() => {
    if (!usuarioLogado || !empresaSelecionada.id) return;
    const url = new URL(window.location.href);
    url.searchParams.set('empresa', empresaSelecionada.id);
    url.searchParams.set('comp', competencia);
    window.history.replaceState({}, '', url.toString());
  }, [empresaSelecionada.id, competencia, usuarioLogado]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUsuarioLogado(null);
    setEmpresas([]);
  };

  if (!usuarioLogado) {
    return (
      <TelaLogin
        onLoginSuccess={(user) => {
          setUsuarioLogado(user);
        }}
      />
    );
  }

  const REGIME_NOME: Record<string, string> = {
    PRESUMIDO: 'Lucro Presumido',
    SIMPLES: 'Simples Nacional',
    PF: 'Pessoa Física',
    REAL: 'Lucro Real',
  };

  const FOLHA_STATUS_NOME: Record<string, string> = {
    ABERTA: 'Aberta',
    CALCULADA: 'Calculada',
    CONFERIDA: 'Conferida',
    FECHADA: 'Fechada',
  };

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-x-hidden w-full max-w-full">
      <Sidebar
        moduloAtivo={moduloAtivo}
        onSelectModulo={setModuloAtivo}
        recolhido={sidebarRecolhida}
        onToggleRecolher={() => setSidebarRecolhida(!sidebarRecolhida)}
        mobileAberto={mobileMenuAberto}
        onFecharMobile={() => setMobileMenuAberto(false)}
        usuarioNome={usuarioLogado.nome}
        usuarioPapel={usuarioLogado.papel}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
        {/* Header Contextual */}
        <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-30 min-h-14 py-2 px-3 sm:px-6 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuAberto(true)}
              aria-label="Abrir menu"
              className="lg:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100 shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:block min-w-0">
              <p className="text-xs text-slate-400">Empresa ativa</p>
              <p className="text-sm font-semibold text-slate-800 truncate max-w-[220px]">
                {empresaSelecionada.nome}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <select
              aria-label="Competência"
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value)}
              className="text-xs sm:text-sm border border-blue-200 rounded-md px-2 py-1.5 bg-blue-50 font-semibold text-blue-800 transition-colors hover:bg-blue-100/70 shrink-0"
            >
              <option value="2026-11">Comp: 2026-11</option>
              <option value="2026-10">Comp: 2026-10</option>
              <option value="2026-12">Comp: 2026-12</option>
            </select>

            <select
              aria-label="Selecionar Empresa"
              value={empresaSelecionada.id}
              onChange={(e) => {
                const found = empresas.find((emp) => emp.id === e.target.value);
                if (found) setEmpresaSelecionada(found);
              }}
              className="text-xs sm:text-sm border border-slate-300 rounded-md px-2 py-1.5 bg-white text-slate-800 max-w-[160px] sm:max-w-[240px] truncate"
            >
              {empresas.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nome}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Área de Conteúdo */}
        <main className="flex-1 p-3 sm:p-6 max-w-7xl w-full mx-auto space-y-6 transition-all duration-200 overflow-x-hidden">
          {moduloAtivo === 'dashboard' && (
            <div className="space-y-6">
              {/* Banner de Contexto */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <Building2 className="w-8 h-8 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <h2 className="font-semibold text-slate-900 truncate">{empresaSelecionada.nome}</h2>
                    <p className="text-xs text-slate-500 break-words">
                      Documento: {empresaSelecionada.cnpj} · Regime:{' '}
                      {REGIME_NOME[empresaSelecionada.regime] || empresaSelecionada.regime} · UF:{' '}
                      {empresaSelecionada.uf}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cards Clicáveis (Atalhos Acionáveis para os Módulos - Fase 8) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card
                  onClick={() => setModuloAtivo('obrigacoes')}
                  className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-slate-200"
                >
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center justify-between">
                      <span>Obrigações vencendo (7 dias)</span>
                      <CalendarClock className="w-4 h-4 text-amber-600" />
                    </CardDescription>
                    <CardTitle className="text-2xl">{contagens.obrigacoesPendentes} Pendentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-slate-500">Vencimento nos próximos 7 dias · Clique para abrir calendário</p>
                  </CardContent>
                </Card>

                <Card
                  onClick={() => setModuloAtivo('financeiro')}
                  className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-slate-200"
                >
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center justify-between">
                      <span>Contas vencidas &amp; da semana</span>
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    </CardDescription>
                    <CardTitle className="text-2xl">R$ 1.850,00</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-slate-500">1 título a pagar na semana · Clique para baixar ou conciliar OFX</p>
                  </CardContent>
                </Card>

                <Card
                  onClick={() => setModuloAtivo('folha')}
                  className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-slate-200"
                >
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center justify-between">
                      <span>Status da Folha ({competencia.split('-').reverse().join('/')})</span>
                      <Users className="w-4 h-4 text-emerald-600" />
                    </CardDescription>
                    <CardTitle className="text-xl">
                      {FOLHA_STATUS_NOME[contagens.folhaStatus] || contagens.folhaStatus} ·{' '}
                      {contagens.folhaLiquidoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-slate-500">
                      {contagens.empregados} empregados ativos · Clique para ver folha e holerites PDF
                    </p>
                  </CardContent>
                </Card>

                <Card
                  onClick={() => setModuloAtivo('fiscal')}
                  className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-slate-200"
                >
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center justify-between">
                      <span>Impostos a recolher do mês</span>
                      <FileText className="w-4 h-4 text-indigo-600" />
                    </CardDescription>
                    <CardTitle className="text-2xl">
                      {contagens.impostosMesValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-slate-500">
                      {contagens.apuracoesAprovadas} de {contagens.apuracoes} guias aprovadas · Clique para conferir
                    </p>
                  </CardContent>
                </Card>

                <Card
                  onClick={() => setModuloAtivo('contabil')}
                  className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-slate-200"
                >
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center justify-between">
                      <span>Diário, Balancete &amp; DRE</span>
                      <Calculator className="w-4 h-4 text-blue-600" />
                    </CardDescription>
                    <CardTitle className="text-2xl">{contagens.lancamentos} Lançamentos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-slate-500">Partidas dobradas · Clique para abrir relatórios contábeis</p>
                  </CardContent>
                </Card>

                <Card
                  onClick={() => setModuloAtivo('cadastros')}
                  className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-slate-200"
                >
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center justify-between">
                      <span>Documentos vencendo (30 dias)</span>
                      <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    </CardDescription>
                    <CardTitle className="text-2xl">1 Certidão</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-slate-500">CND Federal vence em breve · Clique para renovar documento</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {moduloAtivo === 'folha' && (
            <ModuloFolha
              perfilAtivo={perfilAtivo}
              competencia={competencia}
              empresaId={empresaSelecionada.id}
            />
          )}

          {moduloAtivo === 'contabil' && (
            <ModuloContabil
              empresaId={empresaSelecionada.id}
              empresaNome={empresaSelecionada.nome}
              competencia={competencia}
            />
          )}

          {moduloAtivo === 'financeiro' && <ModuloFinanceiro empresaId={empresaSelecionada.id} />}

          {moduloAtivo === 'fiscal' && (
            <ModuloFiscalIR
              perfilAtivo={perfilAtivo}
              empresaId={empresaSelecionada.id}
              competencia={competencia}
            />
          )}

          {moduloAtivo === 'cadastros' && <ModuloCadastros />}

          {moduloAtivo === 'obrigacoes' && (
            <ModuloObrigacoes empresaId={empresaSelecionada.id} competencia={competencia} />
          )}

          {moduloAtivo === 'parametros' && <ModuloParametros perfilAtivo={perfilAtivo} />}

          {moduloAtivo === 'auditoria' && <ModuloAuditoria />}
        </main>
      </div>
    </div>
  );
}
