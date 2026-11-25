'use client';

import React, { useEffect, useState } from 'react';
import { consultarHealthcheck, HealthResponse } from '@/lib/api';
import { ModuloContabil } from '@/components/ModuloContabil';
import { ModuloFolha } from '@/components/ModuloFolha';
import { ModuloFiscalIR } from '@/components/ModuloFiscalIR';
import { ModuloAuditoria } from '@/components/ModuloAuditoria';
import {
  Building2,
  Calculator,
  FileText,
  Users,
  ShieldCheck,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Database,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [empresaSelecionada, setEmpresaSelecionada] = useState(EMPRESAS_FICTICIAS[0]);
  const [perfilAtivo, setPerfilAtivo] = useState('ADMINISTRADOR');
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    consultarHealthcheck().then((data) => {
      if (data) setHealth(data);
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Principal */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shadow-sm">
              PG
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 text-base sm:text-lg leading-none">
                  Pagamentus
                </h1>
                <Badge variant="secondary" className="text-xs">
                  Next.js + Supabase
                </Badge>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Sistema Integrado de Contabilidade, Fiscal e Imposto de Renda
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              aria-label="Selecionar Empresa"
              value={empresaSelecionada.id}
              onChange={(e) => {
                const found = EMPRESAS_FICTICIAS.find((emp) => emp.id === e.target.value);
                if (found) setEmpresaSelecionada(found);
              }}
              className="text-xs sm:text-sm border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-800"
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
              className="text-xs sm:text-sm border border-slate-300 rounded-md px-2.5 py-1.5 bg-slate-50 font-medium text-slate-700"
            >
              <option value="ADMINISTRADOR">Administrador</option>
              <option value="CONTADOR">Contador Responsável</option>
              <option value="FISCAL_TRIBUTARIO">Fiscal / Tributário</option>
              <option value="RH_DP">Departamento Pessoal / RH</option>
              <option value="CLIENTE_IR">Cliente Contribuinte IR</option>
            </select>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner de Contexto da Empresa */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
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
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200'
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200'
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

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center justify-between">
                <span>Contabilidade (RF-006/008)</span>
                <Calculator className="w-4 h-4 text-blue-600" />
              </CardDescription>
              <CardTitle className="text-2xl">100% Balanceado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Competência 11/2026 aberta (RB-001)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center justify-between">
                <span>Fiscal &amp; IR (RF-016/045)</span>
                <FileText className="w-4 h-4 text-indigo-600" />
              </CardDescription>
              <CardTitle className="text-2xl">2 Apurações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Aguardando conferência profissional (RB-003)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center justify-between">
                <span>Folha &amp; RH (RF-051/056)</span>
                <Users className="w-4 h-4 text-emerald-600" />
              </CardDescription>
              <CardTitle className="text-2xl">2 Empregados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Mascaramento LGPD ativo por perfil</p>
            </CardContent>
          </Card>

          <Card>
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

        {/* Navegação por Módulos do Escopo */}
        <Tabs defaultValue="obrigacoes" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
            <TabsTrigger value="obrigacoes">Obrigações &amp; Prazos</TabsTrigger>
            <TabsTrigger value="contabil">Contábil</TabsTrigger>
            <TabsTrigger value="fiscal">Fiscal &amp; IR</TabsTrigger>
            <TabsTrigger value="folha">Folha &amp; RH</TabsTrigger>
            <TabsTrigger value="auditoria">Auditoria &amp; LGPD</TabsTrigger>
          </TabsList>

          <TabsContent value="obrigacoes" className="mt-4">
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
                      <TableRow key={ob.id}>
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
          </TabsContent>

          <TabsContent value="contabil" className="mt-4">
            <ModuloContabil empresaNome={empresaSelecionada.nome} />
          </TabsContent>

          <TabsContent value="fiscal" className="mt-4">
            <ModuloFiscalIR perfilAtivo={perfilAtivo} />
          </TabsContent>

          <TabsContent value="folha" className="mt-4">
            <ModuloFolha perfilAtivo={perfilAtivo} />
          </TabsContent>

          <TabsContent value="auditoria" className="mt-4">
            <ModuloAuditoria />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
