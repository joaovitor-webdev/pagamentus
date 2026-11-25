'use client';

import React, { useEffect, useState } from 'react';
import { consultarHealthcheck, HealthResponse } from '@/lib/api';
import { ModuloContabil } from '@/components/ModuloContabil';
import { ModuloFolha } from '@/components/ModuloFolha';
import { ModuloFiscalIR } from '@/components/ModuloFiscalIR';
import { ModuloAuditoria } from '@/components/ModuloAuditoria';
import { ModuloCadastros } from '@/components/ModuloCadastros';
import { ModuloFinanceiro } from '@/components/ModuloFinanceiro';
import { Sidebar, ModuloId } from '@/components/Sidebar';
import { TelaLogin } from '@/components/TelaLogin';
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

const EMPRESAS_FICTICIAS = [
  {
    id: '33333333-3333-3333-3333-333333333331',
    nome: 'Tecnologia Horizonte S/A (Fictícia)',
    cnpj: '98.765.432/0001-10',
    regime: 'Lucro Presumido',
    uf: 'PE',
  },
  {
    id: '33333333-3333-3333-3333-333333333332',
    nome: 'Comércio Estrela do Sul Ltda (Fictícia)',
    cnpj: '45.123.789/0001-55',
    regime: 'Simples Nacional',
    uf: 'SP',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    nome: 'João da Silva (Contribuinte IRPF)',
    cnpj: '111.222.333-44',
    regime: 'Pessoa Física',
    uf: 'PE',
  },
];

const OBRIGACOES_INICIAIS = [
  {
    id: '1',
    titulo: 'DCTFWeb - Competência 11/2026',
    empresa: 'Tecnologia Horizonte S/A',
    vencimento: '15/12/2026',
    status: 'EM_PREPARACAO',
    responsavel: 'Carlos Eduardo (Contador)',
  },
  {
    id: '2',
    titulo: 'PGDAS-D - Simples Nacional 11/2026',
    empresa: 'Comércio Estrela do Sul Ltda',
    vencimento: '20/12/2026',
    status: 'PENDENTE',
    responsavel: 'Carlos Eduardo (Contador)',
  },
  {
    id: '3',
    titulo: 'Folha de Pagamento + eSocial 11/2026',
    empresa: 'Tecnologia Horizonte S/A',
    vencimento: '05/12/2026',
    status: 'ENTREGUE',
    responsavel: 'Mariana Silva (RH/DP)',
  },
];

export default function HomePage() {
  const [usuarioLogado, setUsuarioLogado] = useState<{
    email: string;
    nome: string;
    perfil: string;
  } | null>(null);
  const [moduloAtivo, setModuloAtivo] = useState<ModuloId>('dashboard');
  const [sidebarRecolhida, setSidebarRecolhida] = useState(false);
  const [mobileMenuAberto, setMobileMenuAberto] = useState(false);
  const [competencia, setCompetencia] = useState('2026-11');
  const [empresaSelecionada, setEmpresaSelecionada] = useState(EMPRESAS_FICTICIAS[0]);
  const [perfilAtivo, setPerfilAtivo] = useState('ADMINISTRADOR');
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    consultarHealthcheck().then((data) => {
      if (data) setHealth(data);
    });
  }, []);

  if (!usuarioLogado) {
    return (
      <TelaLogin
        onLoginSuccess={(user) => {
          setUsuarioLogado(user);
          setPerfilAtivo(user.perfil);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar
        moduloAtivo={moduloAtivo}
        onSelectModulo={setModuloAtivo}
        recolhido={sidebarRecolhida}
        onToggleRecolher={() => setSidebarRecolhida(!sidebarRecolhida)}
        mobileAberto={mobileMenuAberto}
        onFecharMobile={() => setMobileMenuAberto(false)}
        usuarioNome={usuarioLogado.nome}
        onLogout={() => setUsuarioLogado(null)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Contextual */}
        <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-30 h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuAberto(true)}
              aria-label="Abrir menu"
              className="lg:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <p className="text-xs text-slate-400">Empresa ativa</p>
              <p className="text-sm font-semibold text-slate-800 truncate max-w-[240px]">
                {empresaSelecionada.nome}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <select
              aria-label="Competência"
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value)}
              className="text-xs sm:text-sm border border-blue-200 rounded-md px-2.5 py-1.5 bg-blue-50 font-semibold text-blue-800 transition-colors hover:bg-blue-100/70"
            >
              <option value="2026-11">Comp: 2026-11</option>
              <option value="2026-10">Comp: 2026-10</option>
              <option value="2026-12">Comp: 2026-12</option>
            </select>

            <select
              aria-label="Selecionar Empresa"
              value={empresaSelecionada.id}
              onChange={(e) => {
                const found = EMPRESAS_FICTICIAS.find((emp) => emp.id === e.target.value);
                if (found) setEmpresaSelecionada(found);
              }}
              className="text-xs sm:text-sm border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-800 max-w-[170px] sm:max-w-none"
            >
              {EMPRESAS_FICTICIAS.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nome}
                </option>
              ))}
            </select>

            <select
              aria-label="Perfil RBAC"
              value={perfilAtivo}
              onChange={(e) => setPerfilAtivo(e.target.value)}
              className="hidden md:block text-xs sm:text-sm border border-slate-300 rounded-md px-2.5 py-1.5 bg-slate-50 font-medium text-slate-700"
            >
              <option value="ADMINISTRADOR">Administrador</option>
              <option value="CONTADOR">Contador Responsável</option>
              <option value="FISCAL_TRIBUTARIO">Fiscal / Tributário</option>
              <option value="RH_DP">Departamento Pessoal / RH</option>
              <option value="CLIENTE_IR">Cliente Contribuinte IR</option>
            </select>
          </div>
        </header>

        {/* Área de Conteúdo */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6 transition-all duration-200">
          {moduloAtivo === 'dashboard' && (
            <div className="space-y-6">
              {/* Banner de Contexto */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-3">
                  <Building2 className="w-8 h-8 text-blue-600 shrink-0" />
                  <div>
                    <h2 className="font-semibold text-slate-900">{empresaSelecionada.nome}</h2>
                    <p className="text-xs text-slate-500">
                      Documento: {empresaSelecionada.cnpj} · Regime: {empresaSelecionada.regime} · UF:{' '}
                      {empresaSelecionada.uf}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      health?.status === 'UP'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                    }
                  >
                    <Database className="w-3 h-3 mr-1" />
                    {health?.status === 'UP'
                      ? `API Online (v${health.versao})`
                      : 'Dados Fictícios Prontos'}
                  </Badge>
                  <a
                    href="/api/docs"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-md text-xs font-medium border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-100 text-slate-800 transition-colors"
                  >
                    API Docs <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                  </a>
                </div>
              </div>

              {/* Cards Clicáveis (Atalhos para os Módulos) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card
                  onClick={() => setModuloAtivo('folha')}
                  className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-slate-200"
                >
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center justify-between">
                      <span>Folha &amp; RH (RF-051/056)</span>
                      <Users className="w-4 h-4 text-emerald-600" />
                    </CardDescription>
                    <CardTitle className="text-2xl">2 Empregados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-slate-500">Clique para calcular e fechar a folha</p>
                  </CardContent>
                </Card>

                <Card
                  onClick={() => setModuloAtivo('contabil')}
                  className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-slate-200"
                >
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center justify-between">
                      <span>Contabilidade (RF-006/008)</span>
                      <Calculator className="w-4 h-4 text-blue-600" />
                    </CardDescription>
                    <CardTitle className="text-2xl">100% Balanceado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-slate-500">Partidas dobradas (RB-001)</p>
                  </CardContent>
                </Card>

                <Card
                  onClick={() => setModuloAtivo('fiscal')}
                  className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-slate-200"
                >
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center justify-between">
                      <span>Fiscal &amp; IR (RF-016/045)</span>
                      <FileText className="w-4 h-4 text-indigo-600" />
                    </CardDescription>
                    <CardTitle className="text-2xl">2 Apurações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-slate-500">Aguardando conferência (RB-003)</p>
                  </CardContent>
                </Card>

                <Card
                  onClick={() => setModuloAtivo('obrigacoes')}
                  className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-slate-200"
                >
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center justify-between">
                      <span>Obrigações (RF-061/065)</span>
                      <CalendarClock className="w-4 h-4 text-amber-600" />
                    </CardDescription>
                    <CardTitle className="text-2xl">2 Pendentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-slate-500">Alertas auxiliares ativos (RB-009)</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {moduloAtivo === 'folha' && (
            <ModuloFolha perfilAtivo={perfilAtivo} competencia={competencia} />
          )}

          {moduloAtivo === 'contabil' && (
            <ModuloContabil empresaNome={empresaSelecionada.nome} />
          )}

          {moduloAtivo === 'financeiro' && <ModuloFinanceiro />}

          {moduloAtivo === 'fiscal' && <ModuloFiscalIR perfilAtivo={perfilAtivo} />}

          {moduloAtivo === 'cadastros' && <ModuloCadastros />}

          {moduloAtivo === 'obrigacoes' && (
            <Card>
              <CardHeader>
                <CardTitle>Painel de Obrigações Acessórias (RF-065)</CardTitle>
                <CardDescription>
                  Acompanhamento de entregas por empresa e competência. Alertas são auxiliares (RB-009).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Obrigação</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {OBRIGACOES_INICIAIS.map((ob) => (
                      <TableRow key={ob.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell className="font-medium">{ob.titulo}</TableCell>
                        <TableCell>{ob.empresa}</TableCell>
                        <TableCell>{ob.vencimento}</TableCell>
                        <TableCell>{ob.responsavel}</TableCell>
                        <TableCell>
                          {ob.status === 'ENTREGUE' ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Entregue
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                              <AlertTriangle className="w-3 h-3 mr-1" /> {ob.status}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {moduloAtivo === 'auditoria' && <ModuloAuditoria />}
        </main>
      </div>
    </div>
  );
}
