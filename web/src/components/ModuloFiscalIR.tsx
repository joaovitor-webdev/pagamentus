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
import { CheckCircle2, FileCheck2, AlertTriangle } from 'lucide-react';

interface ApuracaoFiscal {
  id: string;
  tributo: string;
  regime: string;
  baseCalculo: number;
  aliquota: number;
  valorApurado: number;
  status: 'AGUARDANDO_CONFERENCIA' | 'APROVADA';
}

const APURACOES_INICIAIS: ApuracaoFiscal[] = [
  {
    id: '1',
    tributo: 'ISSQN (Serviços)',
    regime: 'Lucro Presumido',
    baseCalculo: 15000.0,
    aliquota: 5.0,
    valorApurado: 750.0,
    status: 'AGUARDANDO_CONFERENCIA',
  },
  {
    id: '2',
    tributo: 'PIS / COFINS Cumulativo',
    regime: 'Lucro Presumido',
    baseCalculo: 15000.0,
    aliquota: 3.65,
    valorApurado: 547.5,
    status: 'AGUARDANDO_CONFERENCIA',
  },
];

export function ModuloFiscalIR({ perfilAtivo }: { perfilAtivo: string }) {
  const [apuracoes, setApuracoes] = useState<ApuracaoFiscal[]>(APURACOES_INICIAIS);

  // RB-003: Somente Contador ou Administrador pode aprovar apurações
  const podeAprovar = perfilAtivo === 'ADMINISTRADOR' || perfilAtivo === 'CONTADOR';

  const aprovarApuracao = (id: string) => {
    if (!podeAprovar) return;
    setApuracoes((prev) =>
      prev.map((ap) => (ap.id === id ? { ...ap, status: 'APROVADA' } : ap))
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Apuração Fiscal &amp; Memória de Cálculo (RF-020 / RF-021 / RB-003)</span>
            <Badge variant="outline" className="text-indigo-700 border-indigo-200 bg-indigo-50">
              Conferência Profissional Obrigatória
            </Badge>
          </CardTitle>
          <CardDescription>
            Nenhuma apuração é marcada como aprovada sem revisão de Contador ou Administrador (RB-003).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tributo</TableHead>
                <TableHead>Regime</TableHead>
                <TableHead className="text-right">Base (R$)</TableHead>
                <TableHead className="text-right">Alíquota (%)</TableHead>
                <TableHead className="text-right">Valor Apurado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apuracoes.map((ap) => (
                <TableRow key={ap.id}>
                  <TableCell className="font-medium">{ap.tributo}</TableCell>
                  <TableCell>{ap.regime}</TableCell>
                  <TableCell className="text-right">
                    {ap.baseCalculo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                  <TableCell className="text-right">{ap.aliquota.toFixed(2)}%</TableCell>
                  <TableCell className="text-right font-semibold">
                    {ap.valorApurado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                  <TableCell>
                    {ap.status === 'APROVADA' ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Aprovada
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Aguardando Conferência
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {ap.status !== 'APROVADA' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!podeAprovar}
                        onClick={() => aprovarApuracao(ap.id)}
                      >
                        <FileCheck2 className="w-3.5 h-3.5 mr-1" />
                        {podeAprovar ? 'Aprovar' : 'Sem Permissão'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comparador IRPF — Exercício 2026 (RF-037)</CardTitle>
          <CardDescription>
            Simulação comparativa entre Tributação Completa e Desconto Simplificado para contribuinte fictício.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
            <p className="text-xs font-semibold text-slate-500 uppercase">Modelo Completo</p>
            <p className="text-xl font-bold text-slate-900 mt-1">R$ 2.480,00</p>
            <p className="text-xs text-slate-600 mt-1">Deduções legais aplicadas: Previdência + Saúde + Educação</p>
          </div>
          <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-emerald-700 uppercase">Desconto Simplificado</p>
              <Badge className="bg-emerald-600 text-white">Mais Vantajoso</Badge>
            </div>
            <p className="text-xl font-bold text-emerald-900 mt-1">R$ 1.890,00</p>
            <p className="text-xs text-emerald-700 mt-1">Economia estimada de R$ 590,00 (teto parametrizado)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
