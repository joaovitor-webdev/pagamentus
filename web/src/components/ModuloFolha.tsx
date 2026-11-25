'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Lock,
  Unlock,
  Calculator,
  CheckCircle2,
  FileText,
  PlusCircle,
  AlertTriangle,
  Printer,
  RotateCcw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  calcularFolhaEmpregado,
  selecionarParametrosPorCompetencia,
  MemoriaCalculoFolha,
  ParametroLegalBanco,
} from '@/lib/folha/motor';

interface EmpregadoRow {
  id: string;
  nome: string;
  cpf: string;
  pis: string | null;
  cargo: string;
  cbo: string | null;
  salario_base: number;
  data_admissao: string;
  dependentes: number;
  tipo_contrato: string | null;
  vale_transporte: boolean | null;
  status: 'ATIVO' | 'AFASTADO' | 'DESLIGADO';
}

interface EventoFolhaRow {
  id: string;
  empregado_id: string;
  tipo: 'HORA_EXTRA' | 'BONUS' | 'FALTA' | 'AFASTAMENTO';
  descricao: string;
  valor: number;
}

interface CalculoPessoa {
  empregadoId: string;
  nome: string;
  memoria: MemoriaCalculoFolha;
  conferido: boolean;
}

export function ModuloFolha({
  perfilAtivo,
  competencia,
  empresaId,
}: {
  perfilAtivo: string;
  competencia: string;
  empresaId: string;
}) {
  const [empregados, setEmpregados] = useState<EmpregadoRow[]>([]);
  const [eventos, setEventos] = useState<EventoFolhaRow[]>([]);

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [pis, setPis] = useState('');
  const [cargo, setCargo] = useState('');
  const [cbo, setCbo] = useState('');
  const [salarioBase, setSalarioBase] = useState('');
  const [dataAdmissao, setDataAdmissao] = useState('2026-01-01');
  const [dependentes, setDependentes] = useState('0');
  const [tipoContrato, setTipoContrato] = useState('CLT');
  const [valeTransporte, setValeTransporte] = useState(false);

  const [novoEventoEmpId, setNovoEventoEmpId] = useState('');
  const [novoEventoTipo, setNovoEventoTipo] = useState<EventoFolhaRow['tipo']>('BONUS');
  const [novoEventoDesc, setNovoEventoDesc] = useState('');
  const [novoEventoValor, setNovoEventoValor] = useState('');

  const [calculos, setCalculos] = useState<CalculoPessoa[]>([]);
  const [statusFolha, setStatusFolha] = useState<'ABERTA' | 'CALCULADA' | 'CONFERIDA' | 'FECHADA'>('ABERTA');
  const [parametrosNaoConferidos, setParametrosNaoConferidos] = useState(false);
  const [detalheSelecionado, setDetalheSelecionado] = useState<CalculoPessoa | null>(null);
  const [modalFechamentoAberto, setModalFechamentoAberto] = useState(false);
  const [modalReaberturaAberto, setModalReaberturaAberto] = useState(false);
  const [justificativa, setJustificativa] = useState('');
  const [erroFolha, setErroFolha] = useState<string | null>(null);

  const acessoTotal = perfilAtivo === 'ADMIN' || perfilAtivo === 'RH_DP';
  const ehAdmin = perfilAtivo === 'ADMIN';
  const mascararCpf = (c: string) => (acessoTotal ? c : `***.***.${c.slice(-6)}`);
  const formatarMoeda = (valor: number) =>
    acessoTotal
      ? Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : 'R$ ••••••';

  const carregarDados = async () => {
    if (!empresaId) return;
    const supabase = createClient();

    const { data: emps } = await supabase
      .from('empregados')
      .select('id, nome, cpf, pis, cargo, cbo, salario_base, data_admissao, dependentes, tipo_contrato, vale_transporte, status')
      .eq('empresa_id', empresaId)
      .order('nome');

    if (emps) {
      setEmpregados(emps as EmpregadoRow[]);
      if (emps.length > 0 && !novoEventoEmpId) {
        setNovoEventoEmpId(emps[0].id);
      }
    }

    const { data: evs } = await supabase
      .from('eventos_folha')
      .select('id, empregado_id, tipo, descricao, valor')
      .eq('empresa_id', empresaId)
      .eq('competencia', competencia);
    if (evs) setEventos(evs as EventoFolhaRow[]);

    const { data: compRow } = await supabase
      .from('competencias')
      .select('status_folha')
      .eq('empresa_id', empresaId)
      .eq('ano_mes', competencia)
      .maybeSingle();
    if (compRow?.status_folha) {
      setStatusFolha(compRow.status_folha as typeof statusFolha);
    } else {
      setStatusFolha('ABERTA');
    }

    const { data: calcRows } = await supabase
      .from('folha_calculos')
      .select('empregado_id, memoria_calculo, conferido')
      .eq('empresa_id', empresaId)
      .eq('competencia', competencia);

    if (calcRows && emps) {
      const mapa: CalculoPessoa[] = calcRows.map((row) => {
        const emp = emps.find((e) => e.id === row.empregado_id);
        return {
          empregadoId: row.empregado_id,
          nome: emp?.nome || 'Empregado',
          memoria: row.memoria_calculo as MemoriaCalculoFolha,
          conferido: Boolean(row.conferido),
        };
      });
      setCalculos(mapa);
    }

    const { data: params } = await supabase
      .from('parametros_legais')
      .select('conferido_por_contador')
      .eq('conferido_por_contador', false);
    setParametrosNaoConferidos((params?.length ?? 0) > 0);
  };

  useEffect(() => {
    carregarDados();
  }, [empresaId, competencia]);

  const handleCadastrarEmpregado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acessoTotal || !nome.trim() || !cpf.trim() || !cargo.trim()) return;
    const supabase = createClient();
    const { error } = await supabase.from('empregados').insert({
      empresa_id: empresaId,
      nome: nome.trim(),
      cpf: cpf.trim(),
      pis: pis.trim() || null,
      cargo: cargo.trim(),
      cbo: cbo.trim() || null,
      salario_base: Number(salarioBase) || 0,
      data_admissao: dataAdmissao,
      dependentes: Number(dependentes) || 0,
      tipo_contrato: tipoContrato,
      vale_transporte: valeTransporte,
      status: 'ATIVO',
    });

    if (!error) {
      setNome('');
      setCpf('');
      setPis('');
      setCargo('');
      setCbo('');
      setSalarioBase('');
      await carregarDados();
    }
  };

  const handleAdicionarEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroFolha(null);
    if (!acessoTotal || statusFolha === 'FECHADA' || !novoEventoEmpId) return;
    const v = Number(novoEventoValor);
    if (!novoEventoDesc.trim() || isNaN(v) || v < 0) return;

    const supabase = createClient();
    const { error } = await supabase.from('eventos_folha').insert({
      empresa_id: empresaId,
      empregado_id: novoEventoEmpId,
      competencia,
      tipo: novoEventoTipo,
      descricao: novoEventoDesc.trim(),
      valor: v,
    });

    if (error) {
      setErroFolha(error.message);
      return;
    }

    setNovoEventoDesc('');
    setNovoEventoValor('');
    await carregarDados();
  };

  const calcularEGravar = async () => {
    setErroFolha(null);
    if (statusFolha === 'FECHADA') {
      setErroFolha('Competência fechada. Apenas ADMIN pode reabrir.');
      return;
    }

    const supabase = createClient();
    const { data: paramRows, error: errParam } = await supabase
      .from('parametros_legais')
      .select('vigencia_inicio, vigencia_fim, tipo, faixa_ordem, limite_inferior, limite_superior, aliquota, parcela_deduzir, valor_fixo');

    if (errParam || !paramRows) {
      setErroFolha('Erro ao carregar parâmetros legais do banco.');
      return;
    }

    try {
      const paramsFolha = selecionarParametrosPorCompetencia(
        competencia,
        paramRows as ParametroLegalBanco[]
      );

      const novosCalculos: CalculoPessoa[] = [];
      for (const emp of empregados) {
        const horasExtras50 = eventos
          .filter((ev) => ev.empregado_id === emp.id && ev.tipo === 'HORA_EXTRA')
          .reduce((acc, ev) => acc + Number(ev.valor), 0);
        const bonus = eventos
          .filter((ev) => ev.empregado_id === emp.id && ev.tipo === 'BONUS')
          .reduce((acc, ev) => acc + Number(ev.valor), 0);
        const faltasDias = eventos
          .filter((ev) => ev.empregado_id === emp.id && ev.tipo === 'FALTA')
          .length;

        const memoria = calcularFolhaEmpregado(
          {
            salarioBase: Number(emp.salario_base),
            bonus: bonus + horasExtras50,
            faltasDias,
            dependentes: emp.dependentes,
            optanteValeTransporte: Boolean(emp.vale_transporte),
          },
          paramsFolha
        );

        await supabase.from('folha_calculos').upsert(
          {
            empresa_id: empresaId,
            empregado_id: emp.id,
            competencia,
            salario_base: Number(emp.salario_base),
            total_proventos: memoria.totalProventos,
            total_descontos: memoria.totalDescontos,
            valor_liquido: memoria.valorLiquido,
            fgts_valor: memoria.fgts,
            inss_valor: memoria.inss,
            irrf_valor: memoria.irrf,
            memoria_calculo: memoria,
            conferido: false,
          },
          { onConflict: 'empresa_id,empregado_id,competencia' }
        );

        novosCalculos.push({
          empregadoId: emp.id,
          nome: emp.nome,
          memoria,
          conferido: false,
        });
      }

      await supabase.from('competencias').upsert(
        { empresa_id: empresaId, ano_mes: competencia, status_folha: 'CALCULADA' },
        { onConflict: 'empresa_id,ano_mes' }
      );

      setCalculos(novosCalculos);
      setStatusFolha('CALCULADA');
    } catch (err: unknown) {
      setErroFolha(err instanceof Error ? err.message : 'Erro ao calcular folha.');
    }
  };

  const marcarComoConferida = async () => {
    const supabase = createClient();
    await supabase
      .from('folha_calculos')
      .update({ conferido: true })
      .eq('empresa_id', empresaId)
      .eq('competencia', competencia);
    await supabase
      .from('competencias')
      .update({ status_folha: 'CONFERIDA' })
      .eq('empresa_id', empresaId)
      .eq('ano_mes', competencia);
    setStatusFolha('CONFERIDA');
    setCalculos((prev) => prev.map((c) => ({ ...c, conferido: true })));
  };

  const confirmarFechamento = async () => {
    const supabase = createClient();
    const { error } = await supabase
      .from('competencias')
      .update({ status_folha: 'FECHADA' })
      .eq('empresa_id', empresaId)
      .eq('ano_mes', competencia);

    if (error) {
      setErroFolha(error.message);
      return;
    }

    await supabase.rpc('apropriar_folha_contabil', {
      p_empresa_id: empresaId,
      p_competencia: competencia,
    });

    setStatusFolha('FECHADA');
    setModalFechamentoAberto(false);
  };

  const confirmarReabertura = async () => {
    if (!ehAdmin || !justificativa.trim()) return;
    const supabase = createClient();
    await supabase
      .from('competencias')
      .update({ status_folha: 'CALCULADA' })
      .eq('empresa_id', empresaId)
      .eq('ano_mes', competencia);

    await supabase.rpc('estornar_apropriacao_folha', {
      p_empresa_id: empresaId,
      p_competencia: competencia,
    });

    await supabase.rpc('registrar_auditoria', {
      p_empresa_id: empresaId,
      p_modulo: 'FOLHA',
      p_acao: 'REABRIR_COMPETENCIA',
      p_entidade: 'competencias',
      p_entidade_id: competencia,
      p_depois: { justificativa: justificativa.trim() },
    });
    setStatusFolha('CALCULADA');
    setJustificativa('');
    setModalReaberturaAberto(false);
  };

  const totais = calculos.reduce(
    (acc, c) => ({
      proventos: acc.proventos + c.memoria.totalProventos,
      descontos: acc.descontos + c.memoria.totalDescontos,
      liquido: acc.liquido + c.memoria.valorLiquido,
      fgts: acc.fgts + c.memoria.fgts,
    }),
    { proventos: 0, descontos: 0, liquido: 0, fgts: 0 }
  );

  return (
    <div className="space-y-4">
      {parametrosNaoConferidos && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-900 p-3 rounded-lg text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Existem parâmetros legais de 2026 ainda não conferidos pelo contador responsável (veja em <strong>Parâmetros Legais</strong>).
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">
            Folha da Competência {competencia}:
          </span>
          <Badge
            className={
              statusFolha === 'FECHADA'
                ? 'bg-emerald-600 text-white'
                : statusFolha === 'CONFERIDA'
                ? 'bg-indigo-600 text-white'
                : statusFolha === 'CALCULADA'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-800'
            }
          >
            {statusFolha}
          </Badge>
        </div>

        {acessoTotal ? (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
            <Unlock className="w-3 h-3 mr-1" /> Acesso Total ({perfilAtivo})
          </Badge>
        ) : (
          <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
            <Lock className="w-3 h-3 mr-1" /> Mascaramento Ativo ({perfilAtivo})
          </Badge>
        )}
      </div>

      {erroFolha && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 p-3 rounded-md">
          {erroFolha}
        </div>
      )}

      <Tabs defaultValue="empregados" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="empregados">1. Empregados</TabsTrigger>
          <TabsTrigger value="eventos">2. Eventos &amp; Afastamentos</TabsTrigger>
          <TabsTrigger value="calculo">3. Cálculo de Folha</TabsTrigger>
          <TabsTrigger value="holerite">4. Holerite &amp; Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="empregados" className="mt-4 space-y-4">
          {acessoTotal && (
            <Card>
              <CardHeader>
                <CardTitle>Cadastrar Empregado</CardTitle>
                <CardDescription>Gravação direta no Supabase com auditoria automática.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCadastrarEmpregado} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" className="border border-slate-300 rounded-md px-3 py-1.5 text-sm" />
                  <input type="text" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="CPF (000.000.000-00)" className="border border-slate-300 rounded-md px-3 py-1.5 text-sm" />
                  <input type="text" value={pis} onChange={(e) => setPis(e.target.value)} placeholder="PIS/PASEP" className="border border-slate-300 rounded-md px-3 py-1.5 text-sm" />
                  <input type="text" value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Cargo" className="border border-slate-300 rounded-md px-3 py-1.5 text-sm" />
                  <input type="text" value={cbo} onChange={(e) => setCbo(e.target.value)} placeholder="CBO" className="border border-slate-300 rounded-md px-3 py-1.5 text-sm" />
                  <input type="number" step="0.01" value={salarioBase} onChange={(e) => setSalarioBase(e.target.value)} placeholder="Salário Base (R$)" className="border border-slate-300 rounded-md px-3 py-1.5 text-sm" />
                  <input type="date" value={dataAdmissao} onChange={(e) => setDataAdmissao(e.target.value)} className="border border-slate-300 rounded-md px-3 py-1.5 text-sm" />
                  <div className="flex gap-2 items-center">
                    <select value={tipoContrato} onChange={(e) => setTipoContrato(e.target.value)} className="border border-slate-300 rounded-md px-2 py-1.5 text-sm bg-white">
                      <option value="CLT">CLT</option>
                      <option value="ESTAGIO">Estágio</option>
                      <option value="TEMPORARIO">Temporário</option>
                    </select>
                    <label className="flex items-center gap-1 text-xs">
                      <input type="checkbox" checked={valeTransporte} onChange={(e) => setValeTransporte(e.target.checked)} />
                      VT
                    </label>
                    <Button type="submit" size="sm">
                      <PlusCircle className="w-4 h-4 mr-1" /> Salvar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Empregados Cadastrados ({empregados.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Cargo / CBO</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Salário Base</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empregados.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">{emp.nome}</TableCell>
                      <TableCell className="font-mono text-xs">{mascararCpf(emp.cpf)}</TableCell>
                      <TableCell className="text-xs">{emp.cargo} {emp.cbo ? `(${emp.cbo})` : ''}</TableCell>
                      <TableCell><Badge variant="outline">{emp.status}</Badge></TableCell>
                      <TableCell className="text-right font-semibold">{formatarMoeda(emp.salario_base)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eventos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Eventos &amp; Afastamentos ({competencia})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {acessoTotal && statusFolha !== 'FECHADA' && (
                <form onSubmit={handleAdicionarEvento} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <select value={novoEventoEmpId} onChange={(e) => setNovoEventoEmpId(e.target.value)} className="border border-slate-300 rounded-md px-2.5 py-1.5 text-sm bg-white">
                    {empregados.map((e) => (
                      <option key={e.id} value={e.id}>{e.nome}</option>
                    ))}
                  </select>
                  <select value={novoEventoTipo} onChange={(e) => setNovoEventoTipo(e.target.value as EventoFolhaRow['tipo'])} className="border border-slate-300 rounded-md px-2.5 py-1.5 text-sm bg-white">
                    <option value="HORA_EXTRA">Hora Extra</option>
                    <option value="BONUS">Bônus / Adicional</option>
                    <option value="FALTA">Falta / Desconto</option>
                    <option value="AFASTAMENTO">Afastamento</option>
                  </select>
                  <input type="text" value={novoEventoDesc} onChange={(e) => setNovoEventoDesc(e.target.value)} placeholder="Descrição do evento" className="border border-slate-300 rounded-md px-3 py-1.5 text-sm" />
                  <div className="flex gap-2">
                    <input type="number" step="0.01" value={novoEventoValor} onChange={(e) => setNovoEventoValor(e.target.value)} placeholder="R$ 0.00" className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm" />
                    <Button type="submit" size="sm"><PlusCircle className="w-4 h-4" /></Button>
                  </div>
                </form>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventos.map((ev) => (
                    <TableRow key={ev.id}>
                      <TableCell><Badge variant="outline">{ev.tipo}</Badge></TableCell>
                      <TableCell>{ev.descricao}</TableCell>
                      <TableCell className="text-right font-semibold">{formatarMoeda(ev.valor)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculo" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                <span>Cálculo de Folha 2026 ({competencia})</span>
                <div className="flex flex-wrap gap-2">
                  {statusFolha !== 'FECHADA' && (
                    <Button onClick={calcularEGravar} size="sm">
                      <Calculator className="w-4 h-4 mr-1.5" /> Calcular &amp; Gravar
                    </Button>
                  )}
                  {statusFolha === 'CALCULADA' && calculos.length > 0 && (
                    <Button onClick={marcarComoConferida} size="sm" variant="outline">
                      <CheckCircle2 className="w-4 h-4 mr-1.5" /> Marcar como conferida
                    </Button>
                  )}
                  {statusFolha === 'CONFERIDA' && calculos.length > 0 && (
                    <Button onClick={() => setModalFechamentoAberto(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      Fechar Competência
                    </Button>
                  )}
                  {statusFolha === 'FECHADA' && ehAdmin && (
                    <Button onClick={() => setModalReaberturaAberto(true)} size="sm" variant="outline">
                      <RotateCcw className="w-4 h-4 mr-1.5" /> Reabrir Competência
                    </Button>
                  )}
                </div>
              </CardTitle>
              <CardDescription>
                Cálculo progressivo oficial 2026 (INSS, IRRF Lei 15.270/2025 e FGTS 8%).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {calculos.length === 0 ? (
                <p className="text-sm text-slate-500">Clique em Calcular &amp; Gravar para processar.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead className="text-right">Proventos</TableHead>
                      <TableHead className="text-right">INSS</TableHead>
                      <TableHead className="text-right">IRRF</TableHead>
                      <TableHead className="text-right">Outros Desc.</TableHead>
                      <TableHead className="text-right">FGTS (8%)</TableHead>
                      <TableHead className="text-right">Líquido</TableHead>
                      <TableHead className="text-right">Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculos.map((c) => {
                      const outros = c.memoria.descontoFaltasEDsr + c.memoria.descontoValeTransporte;
                      return (
                        <TableRow key={c.empregadoId}>
                          <TableCell className="font-medium">{c.nome}</TableCell>
                          <TableCell className="text-right">{formatarMoeda(c.memoria.totalProventos)}</TableCell>
                          <TableCell className="text-right text-red-600">{formatarMoeda(c.memoria.inss)}</TableCell>
                          <TableCell className="text-right text-red-600">{formatarMoeda(c.memoria.irrf)}</TableCell>
                          <TableCell className="text-right text-red-600">{formatarMoeda(outros)}</TableCell>
                          <TableCell className="text-right text-slate-500">{formatarMoeda(c.memoria.fgts)}</TableCell>
                          <TableCell className="text-right font-bold text-emerald-700">
                            {formatarMoeda(c.memoria.valorLiquido)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" onClick={() => setDetalheSelecionado(c)}>
                              Conferir
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              {detalheSelecionado && (
                <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/50 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <strong>Detalhamento Rubrica por Rubrica — {detalheSelecionado.nome}</strong>
                    <Button size="sm" variant="ghost" onClick={() => setDetalheSelecionado(null)}>Fechar</Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>Salário Proporcional: <strong>{formatarMoeda(detalheSelecionado.memoria.salarioProporcional)}</strong></div>
                    <div>INSS (progressivo): <strong>{formatarMoeda(detalheSelecionado.memoria.inss)}</strong></div>
                    <div>
                      Base IRRF ({detalheSelecionado.memoria.metodoIrrf === 'DEDUCAO_LEGAL' ? 'Deduções legais' : 'Desconto simplificado'}):{' '}
                      <strong>{formatarMoeda(detalheSelecionado.memoria.baseIrrf)}</strong>
                    </div>
                    <div>Redução Lei 15.270: <strong>{formatarMoeda(detalheSelecionado.memoria.reducaoLei15270)}</strong></div>
                  </div>
                </div>
              )}

              {modalFechamentoAberto && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
                    <h3 className="text-base font-bold text-slate-900">
                      Confirmar Fechamento da Competência {competencia}
                    </h3>
                    <p className="text-xs text-slate-600">
                      Proventos: <strong>{formatarMoeda(totais.proventos)}</strong> | Descontos:{' '}
                      <strong>{formatarMoeda(totais.descontos)}</strong> | Líquido:{' '}
                      <strong>{formatarMoeda(totais.liquido)}</strong> | FGTS:{' '}
                      <strong>{formatarMoeda(totais.fgts)}</strong>
                    </p>
                    <p className="text-xs text-slate-500">
                      Ao fechar, os lançamentos contábeis de apropriação serão gerados automaticamente no Diário.
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button onClick={() => setModalFechamentoAberto(false)} size="sm" variant="outline">
                        Cancelar
                      </Button>
                      <Button onClick={confirmarFechamento} size="sm" className="bg-emerald-600 text-white">
                        Confirmar Fechamento
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {modalReaberturaAberto && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
                    <h3 className="text-base font-bold text-slate-900">
                      Reabrir Competência {competencia}
                    </h3>
                    <p className="text-xs text-slate-600">
                      A reabertura estorna automaticamente os lançamentos contábeis da folha e exige justificativa.
                    </p>
                    <input
                      type="text"
                      value={justificativa}
                      onChange={(e) => setJustificativa(e.target.value)}
                      placeholder="Justificativa obrigatória para auditoria"
                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white"
                    />
                    <div className="flex justify-end gap-2">
                      <Button onClick={() => setModalReaberturaAberto(false)} size="sm" variant="outline">
                        Cancelar
                      </Button>
                      <Button onClick={confirmarReabertura} size="sm">
                        Confirmar Reabertura
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holerite" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Holerite &amp; Histórico por Empregado ({competencia})
                </span>
                <Button size="sm" variant="outline" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-1.5" /> Imprimir Todos (PDF)
                </Button>
              </CardTitle>
              <CardDescription>
                Recibo oficial de pagamento com rubricas, bases de INSS/IRRF/FGTS, líquido, assinatura e histórico por competência.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {calculos.length === 0 ? (
                <p className="text-sm text-slate-500">Execute o cálculo primeiro.</p>
              ) : (
                calculos.map((c) => {
                  const emp = empregados.find((e) => e.id === c.empregadoId);
                  return (
                    <div
                      key={c.empregadoId}
                      data-testid={`holerite-card-${c.nome}`}
                      className="border-2 border-slate-300 rounded-lg p-5 bg-white space-y-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between border-b pb-3 flex-wrap gap-2">
                        <div>
                          <p className="text-xs uppercase font-bold text-slate-500">
                            Demonstrativo de Pagamento de Salário (Holerite)
                          </p>
                          <h4 className="text-base font-bold text-slate-900">{c.nome}</h4>
                          <p className="text-xs text-slate-600">
                            CPF: {emp?.cpf || '—'} · Cargo: {emp?.cargo || '—'} · Admissão:{' '}
                            {emp?.data_admissao ? emp.data_admissao.slice(0, 10).split('-').reverse().join('/') : '—'}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="font-mono">
                            Competência: {competencia.split('-').reverse().join('/')}
                          </Badge>
                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const w = window.open('', '_blank', 'width=800,height=600');
                                if (w) {
                                  w.document.write(`<html><head><title>Holerite - ${c.nome} - ${competencia}</title></head><body style="font-family:sans-serif;padding:24px;"><h2>Recibo de Pagamento de Salário - ${competencia}</h2><p><strong>Empregado:</strong> ${c.nome} (CPF: ${emp?.cpf || ''}) — Cargo: ${emp?.cargo || ''}</p><hr/><p>Total de Proventos: ${formatarMoeda(c.memoria.totalProventos)}</p><p>INSS: ${formatarMoeda(c.memoria.inss)} | IRRF: ${formatarMoeda(c.memoria.irrf)} | Total Descontos: ${formatarMoeda(c.memoria.totalDescontos)}</p><p>Base INSS/FGTS: ${formatarMoeda(c.memoria.totalProventos)} | FGTS (8%): ${formatarMoeda(c.memoria.fgts)} | Base IRRF: ${formatarMoeda(c.memoria.baseIrrf)}</p><h3>Líquido a Receber: ${formatarMoeda(c.memoria.valorLiquido)}</h3><br/><p>Data: ____/____/________ &nbsp;&nbsp; Assinatura: ____________________________________</p></body></html>`);
                                  w.document.close();
                                }
                              }}
                            >
                              <Printer className="w-3.5 h-3.5 mr-1" /> Gerar PDF Individual
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cód.</TableHead>
                            <TableHead>Descrição da Rubrica</TableHead>
                            <TableHead className="text-right">Proventos</TableHead>
                            <TableHead className="text-right">Descontos</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-mono text-xs">001</TableCell>
                            <TableCell>Salário Base Mensal</TableCell>
                            <TableCell className="text-right text-emerald-700 font-medium">
                              {formatarMoeda(c.memoria.salarioProporcional)}
                            </TableCell>
                            <TableCell className="text-right">—</TableCell>
                          </TableRow>
                          {(c.memoria.valorHorasExtras50 + c.memoria.valorHorasExtras100 + c.memoria.bonus) > 0 && (
                            <TableRow>
                              <TableCell className="font-mono text-xs">002</TableCell>
                              <TableCell>Horas Extras / Bônus / Adicionais</TableCell>
                              <TableCell className="text-right text-emerald-700 font-medium">
                                {formatarMoeda(
                                  c.memoria.valorHorasExtras50 + c.memoria.valorHorasExtras100 + c.memoria.bonus
                                )}
                              </TableCell>
                              <TableCell className="text-right">—</TableCell>
                            </TableRow>
                          )}
                          <TableRow>
                            <TableCell className="font-mono text-xs">101</TableCell>
                            <TableCell>INSS (Progressivo)</TableCell>
                            <TableCell className="text-right">—</TableCell>
                            <TableCell className="text-right text-rose-700 font-medium">
                              {formatarMoeda(c.memoria.inss)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-mono text-xs">102</TableCell>
                            <TableCell>IRRF (Tabela Progressiva c/ Redução Lei 15.270)</TableCell>
                            <TableCell className="text-right">—</TableCell>
                            <TableCell className="text-right text-rose-700 font-medium">
                              {formatarMoeda(c.memoria.irrf)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>

                      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 p-3 bg-slate-50 rounded border text-xs">
                        <div>
                          <span className="text-slate-500 block">Base INSS</span>
                          <strong>{formatarMoeda(c.memoria.totalProventos)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Base FGTS</span>
                          <strong>{formatarMoeda(c.memoria.totalProventos)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">FGTS do Mês (8%)</span>
                          <strong>{formatarMoeda(c.memoria.fgts)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Base IRRF</span>
                          <strong>{formatarMoeda(c.memoria.baseIrrf)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Total Descontos</span>
                          <strong className="text-rose-700">{formatarMoeda(c.memoria.totalDescontos)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Líquido a Receber</span>
                          <strong className="text-emerald-700 text-sm">{formatarMoeda(c.memoria.valorLiquido)}</strong>
                        </div>
                      </div>

                      <div className="pt-3 border-t flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs text-slate-600">
                        <span>
                          Declaro ter recebido a importância líquida discriminada neste recibo.
                        </span>
                        <span>Data: ____/____/________ &nbsp;&nbsp; Assinatura do Empregado: _______________________________</span>
                      </div>

                      <div className="pt-2 border-t text-xs text-slate-500">
                        <strong>Histórico de Competências ({c.nome}):</strong>{' '}
                        {competencia.split('-').reverse().join('/')} — Bruto: {formatarMoeda(c.memoria.totalProventos)} |
                        INSS: {formatarMoeda(c.memoria.inss)} | IRRF: {formatarMoeda(c.memoria.irrf)} | Líquido:{' '}
                        <strong>{formatarMoeda(c.memoria.valorLiquido)}</strong>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
