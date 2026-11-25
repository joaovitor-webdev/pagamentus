'use client';

import React, { useEffect, useState } from 'react';
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
import { Calculator, CheckCircle2, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  calcularComparadorIRPF,
  FaixaIRPFAnual,
} from '@/lib/fiscal/motor';

interface ApuracaoFiscal {
  id: string;
  tributo: string;
  base_calculo: number;
  aliquota: number;
  valor_apurado: number;
  status: 'AGUARDANDO_CONFERENCIA' | 'APROVADA';
  codigo_receita?: string | null;
  vencimento_guia?: string | null;
  anexo_guia_url?: string | null;
}

function formatBRL(v: number) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ModuloFiscalIR({
  perfilAtivo,
  empresaId,
  competencia = '2026-11',
}: {
  perfilAtivo: string;
  empresaId?: string;
  competencia?: string;
}) {
  const [aba, setAba] = useState<'apuracoes' | 'irpf'>('apuracoes');
  const [apuracoes, setApuracoes] = useState<ApuracaoFiscal[]>([]);
  const [tabelaIrpf, setTabelaIrpf] = useState<FaixaIRPFAnual[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  // Formulário IRPF
  const [anoCalendario, setAnoCalendario] = useState<2025 | 2026>(2026);
  const [rendimentos, setRendimentos] = useState('80000');
  const [inss, setInss] = useState('5000');
  const [dependentes, setDependentes] = useState('0');
  const [saude, setSaude] = useState('0');
  const [educacao, setEducacao] = useState('0');
  const [previdencia, setPrevidencia] = useState('0');
  const [livroCaixa, setLivroCaixa] = useState('0');
  const [irRetido, setIrRetido] = useState('0');

  const podeAprovar = perfilAtivo === 'ADMIN' || perfilAtivo === 'CONTADOR';

  const carregarDados = async () => {
    const supabase = createClient();
    let qAp = supabase
      .from('apuracoes_fiscais')
      .select('id, tributo, base_calculo, aliquota, valor_apurado, status, codigo_receita, vencimento_guia, anexo_guia_url')
      .order('tributo');
    if (empresaId) qAp = qAp.eq('empresa_id', empresaId);
    const { data: apData } = await qAp;
    if (apData) setApuracoes(apData as ApuracaoFiscal[]);

    const { data: irpfData } = await supabase
      .from('parametros_irpf_anual')
      .select('*')
      .order('faixa');
    if (irpfData) setTabelaIrpf(irpfData as FaixaIRPFAnual[]);
  };

  useEffect(() => {
    carregarDados();
  }, [empresaId, competencia]);

  const aprovarApuracao = async (id: string) => {
    setErro(null);
    setSucesso(null);
    const supabase = createClient();
    const { error } = await supabase.rpc('aprovar_apuracao_fiscal', { p_apuracao_id: id });
    if (error) {
      setErro(error.message);
      return;
    }
    setSucesso('Apuração aprovada e provisão contábil gerada no Diário (origem FISCAL).');
    await carregarDados();
  };

  const reverterApuracao = async (id: string) => {
    setErro(null);
    setSucesso(null);
    const supabase = createClient();
    const { error } = await supabase.rpc('reverter_apuracao_fiscal', {
      p_apuracao_id: id,
      p_justificativa: 'Reversão solicitada pelo contador',
    });
    if (error) {
      setErro(error.message);
      return;
    }
    setSucesso('Aprovação revertida e lançamento estornado no Diário.');
    await carregarDados();
  };

  const exportarMemoriaCSV = () => {
    const header = 'Tributo;Base Calculo;Aliquota;Valor Apurado;Status;Codigo Receita\n';
    const rows = apuracoes
      .map((a) => `${a.tributo};${a.base_calculo};${a.aliquota};${a.valor_apurado};${a.status};${a.codigo_receita || ''}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memoria-fiscal-${competencia}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabelaAnoSelecionado = tabelaIrpf.filter(
    (f) => (f.ano_calendario ?? 2026) === anoCalendario
  );

  const resultadoIrpf =
    tabelaAnoSelecionado.length > 0
      ? calcularComparadorIRPF({
          rendimentosTributaveis: Number(rendimentos) || 0,
          inss: Number(inss) || 0,
          dependentes: Number(dependentes) || 0,
          saude: Number(saude) || 0,
          educacao: Number(educacao) || 0,
          previdenciaPrivada: Number(previdencia) || 0,
          livroCaixa: Number(livroCaixa) || 0,
          irRetido: Number(irRetido) || 0,
          tabelaAnual: tabelaAnoSelecionado,
        })
      : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            Fiscal & Imposto de Renda ({competencia})
          </CardTitle>
          <CardDescription>
            Apuração parametrizada (Simples / Presumido / CBS-IBS 2026) e Comparador IRPF Anual.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={aba === 'apuracoes' ? 'default' : 'outline'}
            onClick={() => setAba('apuracoes')}
          >
            Apurações Fiscais
          </Button>
          <Button
            size="sm"
            variant={aba === 'irpf' ? 'default' : 'outline'}
            onClick={() => setAba('irpf')}
          >
            Comparador IRPF
          </Button>
          {aba === 'apuracoes' && (
            <Button size="sm" variant="outline" onClick={exportarMemoriaCSV}>
              <FileSpreadsheet className="w-4 h-4 mr-1" />
              Exportar Memória
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

        {aba === 'apuracoes' && (
          <>
            <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-xs">
              <strong>CBS (0,9%) / IBS (0,1%) — Ano-Teste 2026:</strong> Valores meramente informativos (não somados ao total de tributos e não aplicáveis ao Simples Nacional). Recolhimento dispensado em 2026 se cumpridas as obrigações acessórias (LC 214/2025, art. 348).
            </div>
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tributo</TableHead>
                <TableHead className="text-right">Base de Cálculo</TableHead>
                <TableHead className="text-right">Alíquota</TableHead>
                <TableHead className="text-right">Valor Apurado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apuracoes.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.tributo}</TableCell>
                  <TableCell className="text-right">{formatBRL(a.base_calculo)}</TableCell>
                  <TableCell className="text-right">{(Number(a.aliquota) * 100).toFixed(2)}%</TableCell>
                  <TableCell className="text-right font-semibold">{formatBRL(a.valor_apurado)}</TableCell>
                  <TableCell>
                    {a.status === 'APROVADA' ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                        Aprovada
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">
                        Aguardando Conferência
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {podeAprovar && a.status !== 'APROVADA' && (
                      <Button size="sm" variant="outline" onClick={() => aprovarApuracao(a.id)}>
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Aprovar
                      </Button>
                    )}
                    {podeAprovar && a.status === 'APROVADA' && (
                      <Button size="sm" variant="ghost" onClick={() => reverterApuracao(a.id)}>
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Reverter
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {apuracoes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-6">
                    Nenhuma apuração fiscal encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </>
        )}

        {aba === 'irpf' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium block mb-1">Ano-calendário / Exercício</label>
                <select
                  className="w-full border rounded h-9 px-3 text-sm"
                  value={anoCalendario}
                  onChange={(e) => setAnoCalendario(Number(e.target.value) as 2025 | 2026)}
                >
                  <option value={2026}>Ano-calendário 2026 (Exercício 2027 — c/ redução Lei 15.270)</option>
                  <option value={2025}>Ano-calendário 2025 (Exercício 2026 — s/ redução)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Rendimentos Tributáveis (R$)</label>
                <input className="w-full border rounded h-9 px-3 text-sm" type="number" value={rendimentos} onChange={(e) => setRendimentos(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">INSS Oficial (R$)</label>
                <input className="w-full border rounded h-9 px-3 text-sm" type="number" value={inss} onChange={(e) => setInss(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Dependentes (qtd)</label>
                <input className="w-full border rounded h-9 px-3 text-sm" type="number" value={dependentes} onChange={(e) => setDependentes(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Despesas Médicas (R$)</label>
                <input className="w-full border rounded h-9 px-3 text-sm" type="number" value={saude} onChange={(e) => setSaude(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Educação (R$)</label>
                <input className="w-full border rounded h-9 px-3 text-sm" type="number" value={educacao} onChange={(e) => setEducacao(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Previdência Privada (R$)</label>
                <input className="w-full border rounded h-9 px-3 text-sm" type="number" value={previdencia} onChange={(e) => setPrevidencia(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Livro-Caixa (R$)</label>
                <input className="w-full border rounded h-9 px-3 text-sm" type="number" value={livroCaixa} onChange={(e) => setLivroCaixa(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">IR Retido na Fonte (R$)</label>
                <input className="w-full border rounded h-9 px-3 text-sm" type="number" value={irRetido} onChange={(e) => setIrRetido(e.target.value)} />
              </div>
            </div>

            {resultadoIrpf && (
              <div className="space-y-3 p-4 rounded-lg border bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">Resultado Comparativo (Tabela 2026)</span>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    Mais vantajoso: {resultadoIrpf.maisVantajoso}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-white rounded border">
                    <p className="font-medium">Modelo Completo</p>
                    <p className="text-xs text-slate-500">Deduções: {formatBRL(resultadoIrpf.completo.deducoes)}</p>
                    <p className="font-bold mt-1">Imposto: {formatBRL(resultadoIrpf.completo.impostoDevido)}</p>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <p className="font-medium">Modelo Simplificado</p>
                    <p className="text-xs text-slate-500">Desconto: {formatBRL(resultadoIrpf.simplificado.desconto)}</p>
                    <p className="font-bold mt-1">Imposto: {formatBRL(resultadoIrpf.simplificado.impostoDevido)}</p>
                  </div>
                </div>
                <p className="text-xs text-emerald-700 font-medium">
                  Economia estimada: {formatBRL(resultadoIrpf.economia)}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
