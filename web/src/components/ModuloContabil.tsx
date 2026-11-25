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
import { PlusCircle, CheckCircle2, AlertCircle, Lock, RotateCcw, Printer, Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ContaRow {
  id: string;
  codigo: string;
  nome: string;
  tipo: 'SINTETICA' | 'ANALITICA';
  natureza: string;
  grupo: string;
}

interface LancamentoRow {
  id: string;
  data_lancamento: string;
  historico: string;
  conta_debito_id: string;
  conta_credito_id: string;
  valor: number;
  origem: string;
  estornado: boolean;
}

interface LinhaPartida {
  contaId: string;
  tipo: 'DEBITO' | 'CREDITO';
  valor: string;
}

function formatarDataBr(iso: string): string {
  if (!iso) return '—';
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

export function ModuloContabil({
  empresaId,
  empresaNome,
  perfilAtivo = 'ADMIN',
  competencia = '2026-11',
}: {
  empresaId: string;
  empresaNome: string;
  perfilAtivo?: string;
  competencia?: string;
}) {
  const [contas, setContas] = useState<ContaRow[]>([]);
  const [lancamentos, setLancamentos] = useState<LancamentoRow[]>([]);
  const [statusContabil, setStatusContabil] = useState<'ABERTA' | 'EM_FECHAMENTO' | 'FECHADA'>('ABERTA');
  const [historico, setHistorico] = useState('');
  const [partidas, setPartidas] = useState<LinhaPartida[]>([
    { contaId: '', tipo: 'DEBITO', valor: '' },
    { contaId: '', tipo: 'CREDITO', valor: '' },
  ]);
  const [justificativaReabertura, setJustificativaReabertura] = useState('');
  const [modalEncerrarAberto, setModalEncerrarAberto] = useState(false);
  const [contaRazaoId, setContaRazaoId] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const podeEncerrar = perfilAtivo === 'ADMIN' || perfilAtivo === 'CONTADOR';
  const ehAdmin = perfilAtivo === 'ADMIN';

  const carregarContabil = async () => {
    if (!empresaId) return;
    const supabase = createClient();

    const { data: cts } = await supabase
      .from('plano_contas')
      .select('id, codigo, nome, tipo, natureza, grupo')
      .eq('empresa_id', empresaId)
      .order('codigo');

    if (cts) {
      setContas(cts as ContaRow[]);
      const analiticas = cts.filter((c) => c.tipo === 'ANALITICA');
      if (analiticas.length >= 2 && !partidas[0].contaId) {
        setPartidas([
          { contaId: analiticas[0].id, tipo: 'DEBITO', valor: '' },
          { contaId: analiticas[1].id, tipo: 'CREDITO', valor: '' },
        ]);
      }
      if (analiticas.length > 0 && !contaRazaoId) {
        setContaRazaoId(analiticas[0].id);
      }
    }

    const { data: lancs } = await supabase
      .from('lancamentos_contabeis')
      .select('id, data_lancamento, historico, conta_debito_id, conta_credito_id, valor, origem, estornado')
      .eq('empresa_id', empresaId)
      .order('data_lancamento', { ascending: false });

    if (lancs) setLancamentos(lancs as LancamentoRow[]);

    const { data: comp } = await supabase
      .from('competencias')
      .select('status_contabil')
      .eq('empresa_id', empresaId)
      .eq('ano_mes', competencia)
      .maybeSingle();

    setStatusContabil((comp?.status_contabil as typeof statusContabil) || 'ABERTA');
  };

  useEffect(() => {
    carregarContabil();
  }, [empresaId, competencia]);

  const contasAnaliticas = contas.filter((c) => c.tipo === 'ANALITICA');

  const totalDebito = partidas
    .filter((p) => p.tipo === 'DEBITO')
    .reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
  const totalCredito = partidas
    .filter((p) => p.tipo === 'CREDITO')
    .reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
  const partidasBalanceadas =
    totalDebito > 0 && Math.abs(totalDebito - totalCredito) < 0.005;

  const handleAdicionar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    if (statusContabil === 'FECHADA') {
      setErro('Período contábil encerrado.');
      return;
    }
    if (!historico.trim() || !partidasBalanceadas) {
      setErro('Informe o histórico e garanta que Total Débito = Total Crédito.');
      return;
    }

    const primeiroDeb = partidas.find((p) => p.tipo === 'DEBITO');
    const primeiroCred = partidas.find((p) => p.tipo === 'CREDITO');
    if (!primeiroDeb?.contaId || !primeiroCred?.contaId) return;

    const supabase = createClient();
    const { data: comp } = await supabase
      .from('competencias')
      .select('id')
      .eq('empresa_id', empresaId)
      .eq('ano_mes', competencia)
      .maybeSingle();

    if (!comp) {
      setErro('Competência não encontrada.');
      return;
    }

    const { data: novoLanc, error: errIns } = await supabase
      .from('lancamentos_contabeis')
      .insert({
        empresa_id: empresaId,
        competencia_id: comp.id,
        data_lancamento: `${competencia}-25`,
        historico: historico.trim(),
        conta_debito_id: primeiroDeb.contaId,
        conta_credito_id: primeiroCred.contaId,
        valor: totalDebito,
        origem: 'MANUAL',
      })
      .select('id')
      .single();

    if (errIns || !novoLanc) {
      setErro(errIns?.message || 'Erro ao gravar lançamento.');
      return;
    }

    await supabase.from('lancamentos_partidas').insert(
      partidas.map((p) => ({
        lancamento_id: novoLanc.id,
        conta_id: p.contaId,
        tipo: p.tipo,
        valor: Number(p.valor),
      }))
    );

    setHistorico('');
    setPartidas(partidas.map((p) => ({ ...p, valor: '' })));
    setSucesso('Lançamento com múltiplas partidas gravado no Supabase.');
    await carregarContabil();
  };

  const estornarManual = async (lanc: LancamentoRow) => {
    const supabase = createClient();
    await supabase.from('lancamentos_contabeis').insert({
      empresa_id: empresaId,
      competencia_id: (await supabase.from('competencias').select('id').eq('empresa_id', empresaId).eq('ano_mes', competencia).single()).data?.id,
      data_lancamento: lanc.data_lancamento,
      historico: `ESTORNO: ${lanc.historico}`,
      conta_debito_id: lanc.conta_credito_id,
      conta_credito_id: lanc.conta_debito_id,
      valor: lanc.valor,
      origem: 'ESTORNO',
    });
    await supabase.from('lancamentos_contabeis').update({ estornado: true }).eq('id', lanc.id);
    await carregarContabil();
  };

  const encerrarPeriodo = async () => {
    if (!podeEncerrar) return;
    const supabase = createClient();
    await supabase
      .from('competencias')
      .update({ status_contabil: 'FECHADA' })
      .eq('empresa_id', empresaId)
      .eq('ano_mes', competencia);
    setStatusContabil('FECHADA');
  };

  const reabrirPeriodo = async () => {
    if (!ehAdmin || !justificativaReabertura.trim()) return;
    const supabase = createClient();
    await supabase
      .from('competencias')
      .update({ status_contabil: 'ABERTA' })
      .eq('empresa_id', empresaId)
      .eq('ano_mes', competencia);
    await supabase.rpc('registrar_auditoria', {
      p_empresa_id: empresaId,
      p_modulo: 'CONTABIL',
      p_acao: 'REABRIR_COMPETENCIA',
      p_entidade: 'competencias',
      p_entidade_id: competencia,
      p_depois: { justificativa: justificativaReabertura.trim() },
    });
    setJustificativaReabertura('');
    setStatusContabil('ABERTA');
  };

  const nomeConta = (id: string) => {
    const c = contas.find((ct) => ct.id === id);
    return c ? `${c.codigo} - ${c.nome}` : id;
  };

  // Cálculo do Balancete de Verificação
  const balancete = contasAnaliticas.map((c) => {
    const debitos = lancamentos
      .filter((l) => l.conta_debito_id === c.id)
      .reduce((acc, l) => acc + Number(l.valor), 0);
    const creditos = lancamentos
      .filter((l) => l.conta_credito_id === c.id)
      .reduce((acc, l) => acc + Number(l.valor), 0);
    return {
      codigo: c.codigo,
      nome: c.nome,
      grupo: c.grupo,
      debitos,
      creditos,
      saldoAtual: debitos - creditos,
    };
  });

  const totalBalanceteDeb = balancete.reduce((acc, b) => acc + b.debitos, 0);
  const totalBalanceteCred = balancete.reduce((acc, b) => acc + b.creditos, 0);

  const exportarCsvBalancete = () => {
    const linhas = ['Codigo;Conta;Grupo;Debitos;Creditos;Saldo'];
    for (const b of balancete) {
      linhas.push(`${b.codigo};${b.nome};${b.grupo};${b.debitos.toFixed(2)};${b.creditos.toFixed(2)};${b.saldoAtual.toFixed(2)}`);
    }
    const blob = new Blob([linhas.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balancete-${competencia}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Período Contábil {competencia}:</span>
          <Badge className={statusContabil === 'FECHADA' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}>
            {statusContabil}
          </Badge>
        </div>
        <div className="flex gap-2">
          {statusContabil !== 'FECHADA' && podeEncerrar && (
            <Button size="sm" variant="outline" onClick={() => setModalEncerrarAberto(true)}>
              <Lock className="w-3.5 h-3.5 mr-1" /> Encerrar Período
            </Button>
          )}
          {statusContabil === 'FECHADA' && ehAdmin && (
            <div className="flex gap-2">
              <input
                type="text"
                value={justificativaReabertura}
                onChange={(e) => setJustificativaReabertura(e.target.value)}
                placeholder="Justificativa para reabrir"
                className="border rounded-md px-2 py-1 text-xs"
              />
              <Button size="sm" variant="outline" onClick={reabrirPeriodo}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reabrir Período
              </Button>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="diario" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="diario">Lançamentos &amp; Diário</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios Contábeis (Balancete / DRE)</TabsTrigger>
        </TabsList>

        <TabsContent value="diario" className="mt-4 space-y-4">
          {statusContabil !== 'FECHADA' && (
            <Card>
              <CardHeader>
                <CardTitle>Novo Lançamento (Múltiplas Partidas) — {empresaNome}</CardTitle>
                <CardDescription>
                  Total Débito: {totalDebito.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} | Total Crédito:{' '}
                  {totalCredito.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdicionar} className="space-y-3">
                  <input
                    type="text"
                    value={historico}
                    onChange={(e) => setHistorico(e.target.value)}
                    placeholder="Histórico do lançamento"
                    className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm"
                  />

                  {partidas.map((p, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <select
                        value={p.tipo}
                        onChange={(e) => {
                          const next = [...partidas];
                          next[idx].tipo = e.target.value as 'DEBITO' | 'CREDITO';
                          setPartidas(next);
                        }}
                        className="border border-slate-300 rounded-md px-2 py-1.5 text-sm bg-white"
                      >
                        <option value="DEBITO">Débito</option>
                        <option value="CREDITO">Crédito</option>
                      </select>
                      <select
                        value={p.contaId}
                        onChange={(e) => {
                          const next = [...partidas];
                          next[idx].contaId = e.target.value;
                          setPartidas(next);
                        }}
                        className="sm:col-span-2 border border-slate-300 rounded-md px-2 py-1.5 text-sm bg-white"
                      >
                        {contasAnaliticas.map((c) => (
                          <option key={c.id} value={c.id}>{c.codigo} - {c.nome}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        value={p.valor}
                        onChange={(e) => {
                          const next = [...partidas];
                          next[idx].valor = e.target.value;
                          setPartidas(next);
                        }}
                        placeholder="Valor (R$)"
                        className="border border-slate-300 rounded-md px-3 py-1.5 text-sm"
                      />
                    </div>
                  ))}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setPartidas([
                          ...partidas,
                          { contaId: contasAnaliticas[0]?.id || '', tipo: 'DEBITO', valor: '' },
                        ])
                      }
                    >
                      + Adicionar Partida
                    </Button>
                    <Button type="submit" size="sm" disabled={!partidasBalanceadas}>
                      <PlusCircle className="w-4 h-4 mr-1.5" /> Registrar Lançamento
                    </Button>
                  </div>
                </form>

                {erro && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-md">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{erro}</span>
                  </div>
                )}
                {sucesso && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-md">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{sucesso}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Livro Diário ({lancamentos.length} lançamentos)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Histórico</TableHead>
                    <TableHead>Débito</TableHead>
                    <TableHead>Crédito</TableHead>
                    <TableHead className="text-right">Valor (R$)</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lancamentos.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs">{formatarDataBr(l.data_lancamento)}</TableCell>
                      <TableCell><Badge variant="outline">{l.origem || 'MANUAL'}</Badge></TableCell>
                      <TableCell className="font-medium text-xs">{l.historico}</TableCell>
                      <TableCell className="text-xs">{nomeConta(l.conta_debito_id)}</TableCell>
                      <TableCell className="text-xs">{nomeConta(l.conta_credito_id)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {Number(l.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                      <TableCell className="text-right">
                        {l.origem === 'MANUAL' && !l.estornado && (
                          <Button size="sm" variant="outline" onClick={() => estornarManual(l)}>
                            Estornar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                <span>Balancete de Verificação ({competencia})</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={exportarCsvBalancete}>
                    <Download className="w-4 h-4 mr-1" /> Excel / CSV
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => window.print()}>
                    <Printer className="w-4 h-4 mr-1" /> PDF
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Total Débitos: {totalBalanceteDeb.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} |
                Total Créditos: {totalBalanceteCred.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead className="text-right">Débitos</TableHead>
                    <TableHead className="text-right">Créditos</TableHead>
                    <TableHead className="text-right">Saldo Atual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balancete.map((b) => (
                    <TableRow key={b.codigo}>
                      <TableCell className="font-mono text-xs">{b.codigo}</TableCell>
                      <TableCell className="font-medium text-xs">{b.nome}</TableCell>
                      <TableCell className="text-right">{b.debitos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                      <TableCell className="text-right">{b.creditos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {Math.abs(b.saldoAtual).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}{' '}
                        {b.saldoAtual >= 0 ? 'D' : 'C'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Razão por Conta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                <span>Razão por Conta ({competencia})</span>
                <select
                  value={contaRazaoId}
                  onChange={(e) => setContaRazaoId(e.target.value)}
                  className="border border-slate-300 rounded-md px-2.5 py-1 text-xs bg-white font-normal"
                >
                  {contasAnaliticas.map((c) => (
                    <option key={c.id} value={c.id}>{c.codigo} - {c.nome}</option>
                  ))}
                </select>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Histórico</TableHead>
                    <TableHead className="text-right">Débito</TableHead>
                    <TableHead className="text-right">Crédito</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lancamentos
                    .filter((l) => l.conta_debito_id === contaRazaoId || l.conta_credito_id === contaRazaoId)
                    .map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-xs">{formatarDataBr(l.data_lancamento)}</TableCell>
                        <TableCell className="text-xs">{l.historico}</TableCell>
                        <TableCell className="text-right text-xs">
                          {l.conta_debito_id === contaRazaoId ? Number(l.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {l.conta_credito_id === contaRazaoId ? Number(l.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* DRE e Balanço Patrimonial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>DRE do Período ({competencia})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {(() => {
                  const rec = balancete.filter((b) => b.grupo === 'RECEITA').reduce((a, b) => a + (b.creditos - b.debitos), 0);
                  const desp = balancete.filter((b) => b.grupo === 'DESPESA').reduce((a, b) => a + (b.debitos - b.creditos), 0);
                  const res = rec - desp;
                  return (
                    <>
                      <div className="flex justify-between"><span>(+) Receitas</span><strong>{rec.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
                      <div className="flex justify-between text-red-700"><span>(–) Despesas</span><strong>{desp.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
                      <div className="flex justify-between border-t pt-2 font-bold text-emerald-700"><span>(=) Resultado do Período</span><span>{res.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Balanço Patrimonial ({competencia})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {(() => {
                  const ativo = balancete.filter((b) => b.grupo === 'ATIVO').reduce((a, b) => a + (b.debitos - b.creditos), 0);
                  const passivo = balancete.filter((b) => b.grupo === 'PASSIVO').reduce((a, b) => a + (b.creditos - b.debitos), 0);
                  const rec = balancete.filter((b) => b.grupo === 'RECEITA').reduce((a, b) => a + (b.creditos - b.debitos), 0);
                  const desp = balancete.filter((b) => b.grupo === 'DESPESA').reduce((a, b) => a + (b.debitos - b.creditos), 0);
                  const pl = balancete.filter((b) => b.grupo === 'PATRIMONIO_LIQUIDO').reduce((a, b) => a + (b.creditos - b.debitos), 0) + (rec - desp);
                  return (
                    <>
                      <div className="flex justify-between"><span>Ativo Total</span><strong>{ativo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
                      <div className="flex justify-between"><span>Passivo + PL (incl. Resultado)</span><strong>{(passivo + pl).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
                      <div className="text-xs text-emerald-700 font-medium">
                        {Math.abs(ativo - (passivo + pl)) < 0.01 ? '✓ Ativo = Passivo + PL (Equilibrado)' : 'Diferença detectada'}
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {modalEncerrarAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Encerrar Período Contábil {competencia}</h3>
            <p className="text-xs text-slate-600">
              Ao encerrar este período, nenhum lançamento (manual ou automático) será aceito para {competencia}. Apenas ADMIN poderá reabrir com justificativa.
            </p>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setModalEncerrarAberto(false)}>Cancelar</Button>
              <Button size="sm" onClick={async () => { await encerrarPeriodo(); setModalEncerrarAberto(false); }}>Confirmar Encerramento</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
