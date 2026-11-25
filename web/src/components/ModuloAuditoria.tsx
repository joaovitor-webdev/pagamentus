'use client';

import React from 'react';
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
import { ShieldCheck } from 'lucide-react';

const LOGS_AUDITORIA = [
  {
    id: '1',
    dataHora: '25/11/2026 01:40:12',
    usuario: 'Carlos Eduardo (Contador)',
    modulo: 'CONTABIL',
    acao: 'LANCAMENTO_CRIADO',
    detalhes: 'Partida dobrada registrada (Competência 11/2026)',
  },
  {
    id: '2',
    dataHora: '25/11/2026 01:42:05',
    usuario: 'Mariana Silva (RH/DP)',
    modulo: 'FOLHA_RH',
    acao: 'CONSULTA_SALARIAL',
    detalhes: 'Acesso autorizado aos dados da folha 11/2026',
  },
  {
    id: '3',
    dataHora: '25/11/2026 01:45:30',
    usuario: 'Sistema (Observabilidade)',
    modulo: 'SEGURANCA',
    acao: 'MASCARAMENTO_LGPD',
    detalhes: 'Dados sensíveis protegidos contra exposição em logs (RNF-014)',
  },
];

export function ModuloAuditoria() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          Trilha de Auditoria &amp; LGPD (RNF-002 / RNF-004 / RNF-014)
        </CardTitle>
        <CardDescription>
          Registro imutável de ações relevantes com usuário, horário, módulo e resultado, sem exposição de segredos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data / Hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Módulo</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {LOGS_AUDITORIA.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs font-mono">{log.dataHora}</TableCell>
                <TableCell className="font-medium">{log.usuario}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{log.modulo}</Badge>
                </TableCell>
                <TableCell className="text-xs font-mono">{log.acao}</TableCell>
                <TableCell className="text-xs text-slate-600">{log.detalhes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
