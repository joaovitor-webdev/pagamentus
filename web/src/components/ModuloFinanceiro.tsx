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
import { Wallet, CheckCircle2, Clock } from 'lucide-react';

interface TituloFinanceiro {
  id: string;
  tipo: 'RECEBER' | 'PAGAR';
  parceiro: string;
  vencimento: string;
  valor: number;
  status: 'ABERTO' | 'LIQUIDADO';
}

const TITULOS_INICIAIS: TituloFinanceiro[] = [
  {
    id: '1',
    tipo: 'RECEBER',
    parceiro: 'Cliente Alpha Consultoria (Fictício)',
    vencimento: '28/11/2026',
    valor: 12500.0,
    status: 'ABERTO',
  },
  {
    id: '2',
    tipo: 'PAGAR',
    parceiro: 'Fornecedor Cloud & Software Ltda',
    vencimento: '30/11/2026',
    valor: 1850.0,
    status: 'ABERTO',
  },
  {
    id: '3',
    tipo: 'RECEBER',
    parceiro: 'Comércio Estrela do Sul Ltda',
    vencimento: '15/11/2026',
    valor: 4200.0,
    status: 'LIQUIDADO',
  },
];

export function ModuloFinanceiro() {
  const [titulos, setTitulos] = useState<TituloFinanceiro[]>(TITULOS_INICIAIS);

  const baixarTitulo = (id: string) => {
    setTitulos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'LIQUIDADO' } : t))
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-blue-600" />
          Contas a Pagar e Receber (RF-046 a RF-050)
        </CardTitle>
        <CardDescription>
          Controle de títulos, vencimentos, baixas e conciliação bancária integrada.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Cliente / Fornecedor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {titulos.map((t) => (
              <TableRow key={t.id} className="hover:bg-slate-50/80 transition-colors">
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
                <TableCell className="font-medium">{t.parceiro}</TableCell>
                <TableCell>{t.vencimento}</TableCell>
                <TableCell className="text-right font-semibold">
                  {t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </TableCell>
                <TableCell>
                  {t.status === 'LIQUIDADO' ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Liquidado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                      <Clock className="w-3 h-3 mr-1" /> Em Aberto
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {t.status === 'ABERTO' && (
                    <Button size="sm" variant="outline" onClick={() => baixarTitulo(t.id)}>
                      Registrar Baixa
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
