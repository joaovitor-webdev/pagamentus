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
import { AlertTriangle, CheckCircle2, Scale } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ParametroRow {
  id: string;
  vigencia_inicio: string;
  vigencia_fim: string | null;
  tipo: string;
  faixa_ordem: number;
  aliquota: number;
  valor_fixo: number;
  fonte_legal: string;
  conferido_por_contador: boolean;
}

export function ModuloParametros({ perfilAtivo }: { perfilAtivo: string }) {
  const [parametros, setParametros] = useState<ParametroRow[]>([]);
  const podeEditar = perfilAtivo === 'ADMIN' || perfilAtivo === 'CONTADOR';

  const carregar = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('parametros_legais')
      .select('id, vigencia_inicio, vigencia_fim, tipo, faixa_ordem, aliquota, valor_fixo, fonte_legal, conferido_por_contador')
      .order('vigencia_inicio', { ascending: false })
      .order('tipo')
      .order('faixa_ordem');
    if (data) setParametros(data as ParametroRow[]);
  };

  useEffect(() => {
    carregar();
  }, []);

  const marcarConferido = async (id: string) => {
    if (!podeEditar) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('parametros_legais')
      .update({ conferido_por_contador: true, conferido_em: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      await supabase.rpc('registrar_auditoria', {
        p_empresa_id: null,
        p_modulo: 'PARAMETROS_LEGAIS',
        p_acao: 'CONFERENCIA_CONTADOR',
        p_entidade: 'parametros_legais',
        p_entidade_id: id,
      });
      await carregar();
    }
  };

  const pendentes = parametros.filter((p) => !p.conferido_por_contador).length;

  return (
    <div className="space-y-4">
      {pendentes > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 text-amber-900 p-4 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-sm">
            <strong>Atenção:</strong> Existem <strong>{pendentes}</strong> parâmetros legais ainda não conferidos pelo contador responsável. Confira com as fontes oficiais antes de fechar a competência.
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-600" />
            Parâmetros Legais com Vigência (INSS, IRRF, FGTS, Salário Mínimo)
          </CardTitle>
          <CardDescription>
            Somente ADMIN ou CONTADOR podem marcar parâmetros como conferidos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Vigência</TableHead>
                <TableHead>Alíquota / Valor</TableHead>
                <TableHead>Fonte Legal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parametros.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-xs">
                    {p.tipo} {p.faixa_ordem > 1 ? `#${p.faixa_ordem}` : ''}
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    {p.vigencia_inicio} → {p.vigencia_fim || 'Atual'}
                  </TableCell>
                  <TableCell className="text-xs font-semibold">
                    {Number(p.aliquota) > 0
                      ? `${Number(p.aliquota)}%`
                      : Number(p.valor_fixo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 max-w-xs truncate" title={p.fonte_legal}>
                    {p.fonte_legal}
                  </TableCell>
                  <TableCell>
                    {p.conferido_por_contador ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Conferido
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                        Pendente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!p.conferido_por_contador && podeEditar && (
                      <Button size="sm" variant="outline" onClick={() => marcarConferido(p.id)}>
                        Marcar como conferido
                      </Button>
                    )}
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
