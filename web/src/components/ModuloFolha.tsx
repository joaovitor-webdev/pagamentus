'use client';

import React, { useState } from 'react';
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
import { Lock, Unlock } from 'lucide-react';

interface Empregado {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  salarioBase: number;
  admissao: string;
}

const EMPREGADOS_INICIAIS: Empregado[] = [
  {
    id: '1',
    nome: 'Lucas Ferreira (Fictício)',
    cpf: '222.333.444-55',
    cargo: 'Analista Contábil Pleno',
    salarioBase: 5200.0,
    admissao: '01/03/2024',
  },
  {
    id: '2',
    nome: 'Beatriz Costa (Fictícia)',
    cpf: '333.444.555-66',
    cargo: 'Assistente Fiscal',
    salarioBase: 3400.0,
    admissao: '15/01/2025',
  },
];

export function ModuloFolha({ perfilAtivo }: { perfilAtivo: string }) {
  const [empregados] = useState<Empregado[]>(EMPREGADOS_INICIAIS);

  // RF-056: Dados salariais e CPF completos visíveis apenas para ADMINISTRADOR ou RH_DP
  const acessoTotal = perfilAtivo === 'ADMINISTRADOR' || perfilAtivo === 'RH_DP';

  const mascararCpf = (cpf: string) => (acessoTotal ? cpf : `***.***.${cpf.slice(-6)}`);

  const formatarSalario = (valor: number) =>
    acessoTotal
      ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : 'R$ •••••• (Restrito)';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Folha de Pagamento &amp; Empregados (RF-051 a RF-056)</span>
          {acessoTotal ? (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
              <Unlock className="w-3 h-3 mr-1" /> Acesso Total ({perfilAtivo})
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
              <Lock className="w-3 h-3 mr-1" /> Mascaramento LGPD Ativo ({perfilAtivo})
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Altere o perfil RBAC no topo da página para testar a proteção de dados salariais (RF-056).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colaborador</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Admissão</TableHead>
              <TableHead className="text-right">Salário Base</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {empregados.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell className="font-medium">{emp.nome}</TableCell>
                <TableCell className="font-mono text-xs">{mascararCpf(emp.cpf)}</TableCell>
                <TableCell>{emp.cargo}</TableCell>
                <TableCell>{emp.admissao}</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatarSalario(emp.salarioBase)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
