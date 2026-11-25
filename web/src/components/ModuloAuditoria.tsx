'use client';

import React, { useEffect, useState } from 'react';
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
import { createClient } from '@/lib/supabase/client';

interface LogAuditoriaRow {
  id: string;
  data_hora: string;
  usuario_id: string | null;
  modulo: string;
  acao: string;
  entidade: string;
  depois: { justificativa?: string } | null;
}

const ACOES_TRADUZIDAS: Record<string, string> = {
  REABRIR_COMPETENCIA: 'Reabertura de competência',
  CONFERENCIA_CONTADOR: 'Conferência de parâmetros',
  INSERT: 'Inclusão',
  UPDATE: 'Alteração',
  DELETE: 'Exclusão',
};

export function ModuloAuditoria() {
  const [logs, setLogs] = useState<LogAuditoriaRow[]>([]);
  const [usuariosMap, setUsuariosMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase
        .from('auditoria')
        .select('id, data_hora, usuario_id, modulo, acao, entidade, depois')
        .order('data_hora', { ascending: false })
        .limit(25),
      supabase.from('usuarios_perfis').select('usuario_id, nome'),
    ]).then(([audRes, perfRes]) => {
      if (audRes.data) setLogs(audRes.data as LogAuditoriaRow[]);
      if (perfRes.data) {
        const map: Record<string, string> = {};
        for (const p of perfRes.data) {
          map[p.usuario_id] = p.nome;
        }
        setUsuariosMap(map);
      }
    });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          Trilha de Auditoria &amp; LGPD
        </CardTitle>
        <CardDescription>
          Registros imutáveis gravados automaticamente no PostgreSQL.
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
              <TableHead>Justificativa / Entidade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-slate-500">
                  Nenhum registro de auditoria visível para este perfil.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs font-mono">
                    {new Date(log.data_hora).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                    {(log.usuario_id && usuariosMap[log.usuario_id]) || 'Sistema'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{log.modulo}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {ACOES_TRADUZIDAS[log.acao] || log.acao}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {log.depois?.justificativa ? (
                      <span className="font-medium text-amber-800">
                        {log.depois.justificativa}
                      </span>
                    ) : (
                      log.entidade
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
