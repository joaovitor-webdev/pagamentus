'use client';

import React, { useState } from 'react';
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
import { PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';

interface Lancamento {
  id: string;
  data: string;
  historico: string;
  contaDebito: string;
  contaCredito: string;
  valor: number;
}

const CONTAS_INICIAIS = [
  { codigo: '1.1.01.001', nome: 'Caixa e Equivalentes (Ativo)' },
  { codigo: '1.1.02.001', nome: 'Bancos Conta Movimento (Ativo)' },
  { codigo: '3.1.01.001', nome: 'Receita de Prestação de Serviços (Receita)' },
  { codigo: '4.1.01.001', nome: 'Despesas com Folha de Pagamento (Despesa)' },
];

const LANCAMENTOS_INICIAIS: Lancamento[] = [
  {
    id: '1',
    data: '2026-11-10',
    historico: 'Recebimento de serviços de consultoria NF-001',
    contaDebito: '1.1.01.001 - Caixa e Equivalentes',
    contaCredito: '3.1.01.001 - Receita de Prestação de Serviços',
    valor: 15000.0,
  },
  {
    id: '2',
    data: '2026-11-20',
    historico: 'Apropriação da folha de pagamento 11/2026',
    contaDebito: '4.1.01.001 - Despesas com Folha de Pagamento',
    contaCredito: '1.1.02.001 - Bancos Conta Movimento',
    valor: 8600.0,
  },
];

export function ModuloContabil({ empresaNome }: { empresaNome: string }) {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>(LANCAMENTOS_INICIAIS);
  const [historico, setHistorico] = useState('');
  const [contaDebito, setContaDebito] = useState(CONTAS_INICIAIS[0].codigo);
  const [contaCredito, setContaCredito] = useState(CONTAS_INICIAIS[2].codigo);
  const [valor, setValor] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const handleAdicionar = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    const valorNum = Number(valor);
    if (!historico.trim()) {
      setErro('Informe o histórico do lançamento.');
      return;
    }
    if (isNaN(valorNum) || valorNum <= 0) {
      setErro('O valor do lançamento deve ser maior que zero.');
      return;
    }
    if (contaDebito === contaCredito) {
      setErro('Violação RB-001: A conta de débito não pode ser igual à conta de crédito.');
      return;
    }

    const debLabel = CONTAS_INICIAIS.find((c) => c.codigo === contaDebito);
    const credLabel = CONTAS_INICIAIS.find((c) => c.codigo === contaCredito);

    const novo: Lancamento = {
      id: String(Date.now()),
      data: new Date().toISOString().slice(0, 10),
      historico: historico.trim(),
      contaDebito: `${contaDebito} - ${debLabel?.nome || ''}`,
      contaCredito: `${contaCredito} - ${credLabel?.nome || ''}`,
      valor: valorNum,
    };

    setLancamentos([novo, ...lancamentos]);
    setHistorico('');
    setValor('');
    setSucesso('Lançamento registrado com partidas dobradas balanceadas (RB-001).');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Novo Lançamento Contábil — {empresaNome}</span>
            <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
              Partidas Dobradas (RB-001)
            </Badge>
          </CardTitle>
          <CardDescription>
            Débito e crédito devem ser iguais e em contas analíticas distintas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdicionar} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Histórico</label>
              <input
                type="text"
                value={historico}
                onChange={(e) => setHistorico(e.target.value)}
                placeholder="Ex: Pagamento de fornecedor NF-123"
                className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Conta Débito</label>
              <select
                value={contaDebito}
                onChange={(e) => setContaDebito(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-sm bg-white"
              >
                {CONTAS_INICIAIS.map((c) => (
                  <option key={c.codigo} value={c.codigo}>
                    {c.codigo} - {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Conta Crédito</label>
              <select
                value={contaCredito}
                onChange={(e) => setContaCredito(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-sm bg-white"
              >
                {CONTAS_INICIAIS.map((c) => (
                  <option key={c.codigo} value={c.codigo}>
                    {c.codigo} - {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0.00"
                className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm"
              />
            </div>

            <div className="flex items-end">
              <Button type="submit" className="w-full">
                <PlusCircle className="w-4 h-4 mr-1.5" />
                Registrar Lançamento
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

      <Card>
        <CardHeader>
          <CardTitle>Diário Contábil (Competência 11/2026)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Histórico</TableHead>
                <TableHead>Débito</TableHead>
                <TableHead>Crédito</TableHead>
                <TableHead className="text-right">Valor (R$)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lancamentos.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs">{l.data}</TableCell>
                  <TableCell className="font-medium">{l.historico}</TableCell>
                  <TableCell className="text-xs">{l.contaDebito}</TableCell>
                  <TableCell className="text-xs">{l.contaCredito}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {l.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
