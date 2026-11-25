'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Wallet,
  Plus,
  CheckCircle2,
  Upload,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  Link2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface TituloFinanceiro {
  id: string;
  escritorio_id: string;
  empresa_id: string;
  tipo: 'RECEBER' | 'PAGAR';
  parceiro_nome: string;
  vencimento: string;
  valor: number;
  valor_pago: number;
  juros: number;
  multa: number;
  desconto: number;
  parcela_numero: number;
  total_parcelas: number;
  recorrente: boolean;
  status: 'ABERTO' | 'LIQUIDADO' | 'PARCIAL' | 'CANCELADO';
  observacao?: string | null;
}

interface ExtratoBancario {
  id: string;
  data_movimento: string;
  descricao: string;
  valor: number;
  tipo: 'CREDITO' | 'DEBITO';
  fitid?: string | null;
  conciliado: boolean;
  titulo_id?: string | null;
}

type AbaFinanceiro = 'titulos' | 'conciliacao' | 'fluxo';

function formatBRL(v: number) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateBR(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

function getStatusCalculado(t: TituloFinanceiro): {
  label: 'Pago' | 'Pago parcialmente' | 'Vence hoje' | 'Vencido' | 'A vencer';
  className: string;
} {
  if (t.status === 'LIQUIDADO') {
    return { label: 'Pago', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  }
  if (t.status === 'PARCIAL' || (Number(t.valor_pago) > 0 && Number(t.valor_pago) < Number(t.valor))) {
    return { label: 'Pago parcialmente', className: 'bg-blue-100 text-blue-800 border-blue-200' };
  }
  const hoje = new Date().toISOString().slice(0, 10);
  const venc = t.vencimento.slice(0, 10);
  if (venc === hoje) {
    return { label: 'Vence hoje', className: 'bg-amber-100 text-amber-800 border-amber-200' };
  }
  if (venc < hoje) {
    return { label: 'Vencido', className: 'bg-rose-100 text-rose-800 border-rose-200' };
  }
  return { label: 'A vencer', className: 'bg-slate-100 text-slate-800 border-slate-200' };
}

function parseOFX(content: string): Array<{
  data_movimento: string;
  descricao: string;
  valor: number;
  tipo: 'CREDITO' | 'DEBITO';
  fitid: string;
}> {
  const blocks = content.split(/<STMTTRN>/i).slice(1);
  const items: Array<{
    data_movimento: string;
    descricao: string;
    valor: number;
    tipo: 'CREDITO' | 'DEBITO';
    fitid: string;
  }> = [];

  for (const block of blocks) {
    const dtMatch = block.match(/<DTPOSTED>(\d{8})/i);
    const amtMatch = block.match(/<TRNAMT>([-+]?\d+(?:[.,]\d+)?)/i);
    const memoMatch = block.match(/<MEMO>([^\r\n<]+)/i) || block.match(/<NAME>([^\r\n<]+)/i);
    const fitMatch = block.match(/<FITID>([^\r\n<]+)/i);

    if (dtMatch && amtMatch) {
      const rawDate = dtMatch[1];
      const data_movimento = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
      const rawAmt = Number(amtMatch[1].replace(',', '.'));
      items.push({
        data_movimento,
        descricao: (memoMatch?.[1] || 'Movimento OFX').trim(),
        valor: Math.abs(rawAmt),
        tipo: rawAmt >= 0 ? 'CREDITO' : 'DEBITO',
        fitid: (fitMatch?.[1] || `${data_movimento}-${rawAmt}`).trim(),
      });
    }
  }
  return items;
}

export function ModuloFinanceiro({
  empresaId,
  escritorioId,
}: {
  empresaId?: string;
  escritorioId?: string;
}) {
  const [aba, setAba] = useState<AbaFinanceiro>('titulos');
  const [titulos, setTitulos] = useState<TituloFinanceiro[]>([]);
  const [extratos, setExtratos] = useState<ExtratoBancario[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'RECEBER' | 'PAGAR'>('TODOS');
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  // Novo título
  const [modalNovo, setModalNovo] = useState(false);
  const [novoTipo, setNovoTipo] = useState<'RECEBER' | 'PAGAR'>('RECEBER');
  const [novoParceiro, setNovoParceiro] = useState('');
  const [novoVencimento, setNovoVencimento] = useState(new Date().toISOString().slice(0, 10));
  const [novoValor, setNovoValor] = useState('');
  const [novasParcelas, setNovasParcelas] = useState('1');
  const [novaRecorrente, setNovaRecorrente] = useState(false);
  const [novaObs, setNovaObs] = useState('');

  // Baixa modal
  const [tituloBaixa, setTituloBaixa] = useState<TituloFinanceiro | null>(null);
  const [dataBaixa, setDataBaixa] = useState(new Date().toISOString().slice(0, 10));
  const [valorPago, setValorPago] = useState('');
  const [juros, setJuros] = useState('0');
  const [multa, setMulta] = useState('0');
  const [desconto, setDesconto] = useState('0');
  const [salvando, setSalvando] = useState(false);

  const carregarDados = async () => {
    const supabase = createClient();
    let qTitulos = supabase.from('titulos_financeiros').select('*').order('vencimento');
    if (empresaId) qTitulos = qTitulos.eq('empresa_id', empresaId);
    const { data: tData } = await qTitulos;
    if (tData) setTitulos(tData as TituloFinanceiro[]);

    let qExtratos = supabase
      .from('extratos_bancarios')
      .select('*')
      .order('data_movimento', { ascending: false });
    if (empresaId) qExtratos = qExtratos.eq('empresa_id', empresaId);
    const { data: eData } = await qExtratos;
    if (eData) setExtratos(eData as ExtratoBancario[]);
  };

  useEffect(() => {
    carregarDados();
  }, [empresaId]);

  const criarTitulo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    const empId = empresaId || titulos[0]?.empresa_id;
    const escId = escritorioId || titulos[0]?.escritorio_id;
    if (!empId || !escId) {
      setErro('Selecione uma empresa antes de criar um título.');
      return;
    }

    const totalParcelas = Math.max(1, parseInt(novasParcelas || '1', 10));
    const valorTotal = Number(novoValor.replace(',', '.'));
    if (!novoParceiro.trim() || !valorTotal || valorTotal <= 0) {
      setErro('Informe o parceiro e um valor válido.');
      return;
    }

    const valorParcela = Number((valorTotal / totalParcelas).toFixed(2));
    const baseDate = new Date(`${novoVencimento}T12:00:00`);
    const rows = Array.from({ length: totalParcelas }, (_, idx) => {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() + idx);
      return {
        escritorio_id: escId,
        empresa_id: empId,
        tipo: novoTipo,
        parceiro_nome:
          totalParcelas > 1 ? `${novoParceiro.trim()} (${idx + 1}/${totalParcelas})` : novoParceiro.trim(),
        vencimento: d.toISOString().slice(0, 10),
        valor: valorParcela,
        parcela_numero: idx + 1,
        total_parcelas: totalParcelas,
        recorrente: novaRecorrente,
        status: 'ABERTO',
        observacao: novaObs.trim() || null,
      };
    });

    const supabase = createClient();
    const { error } = await supabase.from('titulos_financeiros').insert(rows);
    if (error) {
      setErro(error.message);
      return;
    }

    setModalNovo(false);
    setNovoParceiro('');
    setNovoValor('');
    setNovasParcelas('1');
    setNovaRecorrente(false);
    setNovaObs('');
    setSucesso(
      totalParcelas > 1
        ? `${totalParcelas} parcelas criadas com sucesso.`
        : 'Título financeiro criado com sucesso.'
    );
    await carregarDados();
  };

  const abrirBaixa = (t: TituloFinanceiro) => {
    const saldoRestante = Math.max(0, Number(t.valor) - Number(t.valor_pago || 0));
    setTituloBaixa(t);
    setDataBaixa(new Date().toISOString().slice(0, 10));
    setValorPago(saldoRestante.toFixed(2));
    setJuros('0');
    setMulta('0');
    setDesconto('0');
    setErro(null);
  };

  const confirmarBaixa = async () => {
    if (!tituloBaixa) return;
    setSalvando(true);
    setErro(null);
    setSucesso(null);

    const supabase = createClient();
    const { error } = await supabase.rpc('baixar_titulo_com_contabil', {
      p_titulo_id: tituloBaixa.id,
      p_data_baixa: dataBaixa,
      p_valor_pago: Number(valorPago.replace(',', '.')) || 0,
      p_juros: Number(juros.replace(',', '.')) || 0,
      p_multa: Number(multa.replace(',', '.')) || 0,
      p_desconto: Number(desconto.replace(',', '.')) || 0,
    });

    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }

    setTituloBaixa(null);
    setSucesso('Baixa registrada e lançamento contábil gerado automaticamente no Diário.');
    await carregarDados();
  };

  const importarOFX = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro(null);
    setSucesso(null);

    const empId = empresaId || titulos[0]?.empresa_id;
    const escId = escritorioId || titulos[0]?.escritorio_id;
    if (!empId || !escId) {
      setErro('Selecione uma empresa para importar o extrato OFX.');
      return;
    }

    const text = await file.text();
    const parsed = parseOFX(text);
    if (parsed.length === 0) {
      setErro('Nenhuma transação <STMTTRN> encontrada no arquivo OFX.');
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from('extratos_bancarios').insert(
      parsed.map((item) => ({
        escritorio_id: escId,
        empresa_id: empId,
        ...item,
      }))
    );

    if (error) {
      setErro(error.message);
      return;
    }

    setSucesso(`${parsed.length} lançamentos importados do OFX.`);
    await carregarDados();
    e.target.value = '';
  };

  const conciliarExtrato = async (extratoId: string, tituloId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('extratos_bancarios')
      .update({ conciliado: true, titulo_id: tituloId })
      .eq('id', extratoId);
    if (!error) {
      setSucesso('Movimento bancário conciliado com sucesso.');
      await carregarDados();
    }
  };

  const titulosFiltrados = useMemo(() => {
    if (filtroTipo === 'TODOS') return titulos;
    return titulos.filter((t) => t.tipo === filtroTipo);
  }, [titulos, filtroTipo]);

  const projecaoFluxo = useMemo(() => {
    const hoje = new Date();
    const janelas = [30, 60, 90];
    return janelas.map((dias) => {
      const limite = new Date(hoje);
      limite.setDate(limite.getDate() + dias);
      const limiteIso = limite.toISOString().slice(0, 10);

      let receber = 0;
      let pagar = 0;
      for (const t of titulos) {
        if (t.status === 'LIQUIDADO' || t.status === 'CANCELADO') continue;
        if (t.vencimento.slice(0, 10) <= limiteIso) {
          const restante = Math.max(0, Number(t.valor) - Number(t.valor_pago || 0));
          if (t.tipo === 'RECEBER') receber += restante;
          else pagar += restante;
        }
      }
      return {
        dias,
        receber,
        pagar,
        saldo: receber - pagar,
      };
    });
  }, [titulos]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-600" />
              Módulo Financeiro
            </CardTitle>
            <CardDescription>
              Contas a Pagar e Receber, baixa com geração automática no Diário, conciliação OFX e fluxo de caixa.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={aba === 'titulos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAba('titulos')}
            >
              Títulos
            </Button>
            <Button
              variant={aba === 'conciliacao' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAba('conciliacao')}
            >
              Conciliação OFX
            </Button>
            <Button
              variant={aba === 'fluxo' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAba('fluxo')}
            >
              Fluxo de Caixa (30/60/90d)
            </Button>
            {aba === 'titulos' && (
              <Button size="sm" onClick={() => setModalNovo(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Novo Título
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {erro && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-sm">
              {erro}
            </div>
          )}
          {sucesso && (
            <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
              {sucesso}
            </div>
          )}

          {aba === 'titulos' && (
            <>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={filtroTipo === 'TODOS' ? 'secondary' : 'ghost'}
                  onClick={() => setFiltroTipo('TODOS')}
                >
                  Todos
                </Button>
                <Button
                  size="sm"
                  variant={filtroTipo === 'RECEBER' ? 'secondary' : 'ghost'}
                  onClick={() => setFiltroTipo('RECEBER')}
                >
                  A Receber
                </Button>
                <Button
                  size="sm"
                  variant={filtroTipo === 'PAGAR' ? 'secondary' : 'ghost'}
                  onClick={() => setFiltroTipo('PAGAR')}
                >
                  A Pagar
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cliente / Fornecedor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Pago</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {titulosFiltrados.map((t) => {
                    const st = getStatusCalculado(t);
                    return (
                      <TableRow key={t.id}>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              t.tipo === 'RECEBER'
                                ? 'text-emerald-700 border-emerald-200 bg-emerald-50'
                                : 'text-rose-700 border-rose-200 bg-rose-50'
                            }
                          >
                            {t.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {t.parceiro_nome}
                          {t.recorrente && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Recorrente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDateBR(t.vencimento)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatBRL(t.valor)}</TableCell>
                        <TableCell className="text-right text-slate-600">
                          {formatBRL(t.valor_pago || 0)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={st.className}>
                            {st.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {t.status !== 'LIQUIDADO' && (
                            <Button size="sm" variant="outline" onClick={() => abrirBaixa(t)}>
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Registrar Baixa
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {titulosFiltrados.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-slate-500 py-6">
                        Nenhum título encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </>
          )}

          {aba === 'conciliacao' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                <div>
                  <p className="font-medium text-sm">Importar Extrato Bancário (OFX)</p>
                  <p className="text-xs text-slate-500">
                    Selecione um arquivo .ofx para importar os movimentos e conciliar com os títulos.
                  </p>
                </div>
                <label className="cursor-pointer">
                  <input type="file" accept=".ofx,.OFX" className="hidden" onChange={importarOFX} />
                  <span className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
                    <Upload className="w-4 h-4" />
                    Importar OFX
                  </span>
                </label>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Conciliar com Título</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extratos.map((ex) => (
                    <TableRow key={ex.id}>
                      <TableCell>{formatDateBR(ex.data_movimento)}</TableCell>
                      <TableCell>{ex.descricao}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ex.tipo}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatBRL(ex.valor)}</TableCell>
                      <TableCell>
                        {ex.conciliado ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                            Conciliado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!ex.conciliado && titulos.length > 0 && (
                          <select
                            className="border rounded px-2 py-1 text-xs"
                            defaultValue=""
                            onChange={(ev) => {
                              if (ev.target.value) conciliarExtrato(ex.id, ev.target.value);
                            }}
                          >
                            <option value="">Selecionar título...</option>
                            {titulos.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.parceiro_nome} ({formatBRL(t.valor)})
                              </option>
                            ))}
                          </select>
                        )}
                        {ex.conciliado && (
                          <span className="inline-flex items-center text-xs text-emerald-700 gap-1">
                            <Link2 className="w-3 h-3" /> Vinculado
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {extratos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-slate-500 py-6">
                        Nenhum movimento bancário importado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {aba === 'fluxo' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projecaoFluxo.map((p) => (
                <Card key={p.dias}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      Próximos {p.dias} dias
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center justify-between text-emerald-700">
                      <span className="flex items-center gap-1">
                        <ArrowUpCircle className="w-4 h-4" /> Recebimentos
                      </span>
                      <span className="font-semibold">{formatBRL(p.receber)}</span>
                    </div>
                    <div className="flex items-center justify-between text-rose-700">
                      <span className="flex items-center gap-1">
                        <ArrowDownCircle className="w-4 h-4" /> Pagamentos
                      </span>
                      <span className="font-semibold">{formatBRL(p.pagar)}</span>
                    </div>
                    <div className="pt-2 border-t flex items-center justify-between font-bold">
                      <span>Saldo Projetado</span>
                      <span className={p.saldo >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {formatBRL(p.saldo)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Novo Título */}
      {modalNovo && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Novo Título Financeiro</h3>
              <p className="text-sm text-slate-500">
                Cadastre uma conta a receber ou a pagar com opção de parcelamento e recorrência mensal.
              </p>
            </div>
            <form onSubmit={criarTitulo} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Tipo</label>
                  <select
                    className="w-full border rounded-md h-9 px-3 text-sm"
                    value={novoTipo}
                    onChange={(e) => setNovoTipo(e.target.value as 'RECEBER' | 'PAGAR')}
                  >
                    <option value="RECEBER">A Receber</option>
                    <option value="PAGAR">A Pagar</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Vencimento (1ª parcela)
                  </label>
                  <input
                    className="w-full border rounded-md h-9 px-3 text-sm"
                    type="date"
                    value={novoVencimento}
                    onChange={(e) => setNovoVencimento(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Cliente / Fornecedor
                </label>
                <input
                  className="w-full border rounded-md h-9 px-3 text-sm"
                  value={novoParceiro}
                  onChange={(e) => setNovoParceiro(e.target.value)}
                  placeholder="Ex.: Cliente Alpha Consultoria"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Valor Total (R$)
                  </label>
                  <input
                    className="w-full border rounded-md h-9 px-3 text-sm"
                    type="number"
                    step="0.01"
                    value={novoValor}
                    onChange={(e) => setNovoValor(e.target.value)}
                    placeholder="0,00"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Parcelas</label>
                  <input
                    className="w-full border rounded-md h-9 px-3 text-sm"
                    type="number"
                    min="1"
                    max="60"
                    value={novasParcelas}
                    onChange={(e) => setNovasParcelas(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="recorrente"
                  type="checkbox"
                  checked={novaRecorrente}
                  onChange={(e) => setNovaRecorrente(e.target.checked)}
                />
                <label htmlFor="recorrente" className="text-sm text-slate-700">
                  Título recorrente mensal
                </label>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Observação</label>
                <input
                  className="w-full border rounded-md h-9 px-3 text-sm"
                  value={novaObs}
                  onChange={(e) => setNovaObs(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setModalNovo(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar Título</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Baixa */}
      {tituloBaixa && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Registrar Baixa de Título</h3>
              <p className="text-sm text-slate-500">
                {tituloBaixa.parceiro_nome} — Valor original: {formatBRL(tituloBaixa.valor)}.
                A baixa gera lançamento automático no Diário Contábil.
              </p>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Data da Baixa</label>
                  <input
                    className="w-full border rounded-md h-9 px-3 text-sm"
                    type="date"
                    value={dataBaixa}
                    onChange={(e) => setDataBaixa(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Valor Pago (R$)</label>
                  <input
                    className="w-full border rounded-md h-9 px-3 text-sm"
                    type="number"
                    step="0.01"
                    value={valorPago}
                    onChange={(e) => setValorPago(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Juros (R$)</label>
                  <input
                    className="w-full border rounded-md h-9 px-3 text-sm"
                    type="number"
                    step="0.01"
                    value={juros}
                    onChange={(e) => setJuros(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Multa (R$)</label>
                  <input
                    className="w-full border rounded-md h-9 px-3 text-sm"
                    type="number"
                    step="0.01"
                    value={multa}
                    onChange={(e) => setMulta(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Desconto (R$)</label>
                  <input
                    className="w-full border rounded-md h-9 px-3 text-sm"
                    type="number"
                    step="0.01"
                    value={desconto}
                    onChange={(e) => setDesconto(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setTituloBaixa(null)}>
                Cancelar
              </Button>
              <Button onClick={confirmarBaixa} disabled={salvando}>
                {salvando ? 'Processando...' : 'Confirmar Baixa'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
