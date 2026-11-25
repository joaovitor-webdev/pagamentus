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
import { Building2, FileText } from 'lucide-react';

const CADASTROS_EMPRESAS = [
  {
    id: '1',
    razaoSocial: 'Tecnologia Horizonte S/A (Fictícia)',
    documento: '98.765.432/0001-10',
    regime: 'Lucro Presumido',
    cnae: '6201-5/01',
    municipioUf: 'Recife / PE',
    anexos: 'Contrato Social + Procuração e-CAC',
  },
  {
    id: '2',
    razaoSocial: 'Comércio Estrela do Sul Ltda (Fictícia)',
    documento: '45.123.789/0001-55',
    regime: 'Simples Nacional',
    cnae: '4711-3/02',
    municipioUf: 'São Paulo / SP',
    anexos: 'Contrato Social',
  },
  {
    id: '3',
    razaoSocial: 'João da Silva (Contribuinte Fictício)',
    documento: '111.222.333-44',
    regime: 'Pessoa Física (IRPF)',
    cnae: '—',
    municipioUf: 'Olinda / PE',
    anexos: 'Informes de Rendimentos 2026',
  },
];

export function ModuloCadastros() {
  const [filtro, setFiltro] = useState('');

  const filtrados = CADASTROS_EMPRESAS.filter(
    (c) =>
      c.razaoSocial.toLowerCase().includes(filtro.toLowerCase()) ||
      c.documento.includes(filtro)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Cadastros de Empresas, Clientes e Documentos (RF-001 a RF-005)
            </CardTitle>
            <CardDescription>
              Centralização cadastral com regime tributário, CNAE, município/UF e anexos.
            </CardDescription>
          </div>
          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar por nome ou CPF/CNPJ..."
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Razão Social / Nome</TableHead>
              <TableHead>CPF / CNPJ</TableHead>
              <TableHead>Regime</TableHead>
              <TableHead>CNAE</TableHead>
              <TableHead>Município / UF</TableHead>
              <TableHead>Documentos Anexos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.map((item) => (
              <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                <TableCell className="font-medium">{item.razaoSocial}</TableCell>
                <TableCell className="font-mono text-xs">{item.documento}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{item.regime}</Badge>
                </TableCell>
                <TableCell className="text-xs">{item.cnae}</TableCell>
                <TableCell className="text-xs">{item.municipioUf}</TableCell>
                <TableCell className="text-xs text-slate-600 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  {item.anexos}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
