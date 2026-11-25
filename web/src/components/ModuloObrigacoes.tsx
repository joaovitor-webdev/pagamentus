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
import { CalendarDays, CheckCircle2, List, Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ObrigacaoRow {
  id: string;
  empresa_id: string;
  competencia?: string | null;
  titulo: string;
  vencimento: string;
  status: 'PENDENTE' | 'EM_PREPARACAO' | 'ENTREGUE';
  responsavel_nome?: string | null;
  comprovante_url?: string | null;
  valor_guia?: number | null;
}

function getStatusCalculado(o: ObrigacaoRow): {
  label: 'Entregue' | 'Em preparação' | 'Atrasada' | 'Pendente';
  className: string;
} {
  if (o.status === 'ENTREGUE') {
    return { label: 'Entregue', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  }
  const hoje = new Date().toISOString().slice(0, 10);
  if (o.vencimento.slice(0, 10) < hoje) {
    return { label: 'Atrasada', className: 'bg-rose-100 text-rose-800 border-rose-200' };
  }
  if (o.status === 'EM_PREPARACAO') {
    return { label: 'Em preparação', className: 'bg-blue-100 text-blue-800 border-blue-200' };
  }
  return { label: 'Pendente', className: 'bg-amber-100 text-amber-800 border-amber-200' };
}

export function ModuloObrigacoes({
  empresaId,
  competencia = '2026-11',
}: {
  empresaId?: string;
  competencia?: string;
}) {
  const [obrigacoes, setObrigacoes] = useState<ObrigacaoRow[]>([]);
  const [visao, setVisao] = useState<'lista' | 'calendario'>('lista');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [filtroResp, setFiltroResp] = useState<string>('');
  const [entregando, setEntregando] = useState<ObrigacaoRow | null>(null);
  const [comprovante, setComprovante] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const carregar = async () => {
    const supabase = createClient();
    let q = supabase.from('obrigacoes_acessorias').select('*').order('vencimento');
    if (empresaId) q = q.eq('empresa_id', empresaId);
    const { data } = await q;
    if (data) setObrigacoes(data as ObrigacaoRow[]);
  };

  useEffect(() => {
    carregar();
  }, [empresaId, competencia]);

  const gerarCalendario = async () => {
    if (!empresaId) return;
    setErro(null);
    setSucesso(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc('gerar_calendario_obrigacoes', {
      p_empresa_id: empresaId,
      p_competencia: competencia,
    });
    if (error) {
      setErro(error.message);
      return;
    }
    setSucesso(`Calendário de ${competencia} gerado (${data ?? 0} novas obrigações).`);
    await carregar();
  };

  const confirmarEntrega = async () => {
    if (!entregando) return;
    if (!comprovante.trim()) {
      setErro('Informe o protocolo ou link do comprovante para marcar como Entregue.');
      return;
    }
    const supabase = createClient();
    const { error } = await supabase
      .from('obrigacoes_acessorias')
      .update({ status: 'ENTREGUE', comprovante_url: comprovante.trim() })
      .eq('id', entregando.id);
    if (error) {
      setErro(error.message);
      return;
    }
    setEntregando(null);
    setComprovante('');
    setSucesso('Obrigação marcada como Entregue com comprovante.');
    await carregar();
  };

  const filtradas = useMemo(() => {
    return obrigacoes.filter((o) => {
      if (o.competencia && o.competencia !== competencia) return false;
      const st = getStatusCalculado(o).label;
      if (filtroStatus !== 'TODOS' && st !== filtroStatus) return false;
      if (filtroResp && !(o.responsavel_nome || '').toLowerCase().includes(filtroResp.toLowerCase())) return false;
      return true;
    });
  }, [obrigacoes, competencia, filtroStatus, filtroResp]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            Obrigações & Prazos ({competencia})
          </CardTitle>
          <CardDescription>
            Calendário fiscal automático por regime, ajuste de dias úteis/feriados e controle de comprovantes.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant={visao === 'lista' ? 'default' : 'outline'} onClick={() => setVisao('lista')}>
            <List className="w-4 h-4 mr-1" /> Lista
          </Button>
          <Button size="sm" variant={visao === 'calendario' ? 'default' : 'outline'} onClick={() => setVisao('calendario')}>
            <CalendarDays className="w-4 h-4 mr-1" /> Calendário
          </Button>
          <Button size="sm" onClick={gerarCalendario}>
            Gerar calendário
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <Bell className="w-4 h-4 shrink-0" />
          <span>Alertas automáticos por e-mail (7, 3 e 1 dia antes) são recursos auxiliares e não substituem a conferência do calendário oficial.</span>
        </div>

        {erro && <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-sm">{erro}</div>}
        {sucesso && <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">{sucesso}</div>}

        <div className="flex items-center gap-3 flex-wrap">
          <select className="border rounded h-9 px-3 text-sm" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
            <option value="TODOS">Todos os status</option>
            <option value="Pendente">Pendente</option>
            <option value="Em preparação">Em preparação</option>
            <option value="Atrasada">Atrasada</option>
            <option value="Entregue">Entregue</option>
          </select>
          <input
            className="border rounded h-9 px-3 text-sm"
            placeholder="Filtrar por responsável..."
            value={filtroResp}
            onChange={(e) => setFiltroResp(e.target.value)}
          />
        </div>

        {visao === 'lista' ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Obrigação</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.map((o) => {
                const st = getStatusCalculado(o);
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.titulo}</TableCell>
                    <TableCell>{o.vencimento.slice(0, 10).split('-').reverse().join('/')}</TableCell>
                    <TableCell>{o.responsavel_nome || 'Equipe Fiscal'}</TableCell>
                    <TableCell><Badge variant="outline" className={st.className}>{st.label}</Badge></TableCell>
                    <TableCell className="text-right">
                      {o.status !== 'ENTREGUE' ? (
                        <Button size="sm" variant="outline" onClick={() => { setEntregando(o); setErro(null); }}>
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Marcar Entregue
                        </Button>
                      ) : (
                        <span className="text-xs text-emerald-700">{o.comprovante_url}</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-6">
                    Nenhuma obrigação para {competencia}. Clique em &quot;Gerar calendário&quot;.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {filtradas.map((o) => {
              const st = getStatusCalculado(o);
              return (
                <div key={o.id} className="p-3 border rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{o.titulo}</span>
                    <Badge variant="outline" className={st.className}>{st.label}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">Vencimento: {o.vencimento.slice(0, 10).split('-').reverse().join('/')}</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {entregando && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold">Marcar Obrigação como Entregue</h3>
            <p className="text-sm text-slate-500">{entregando.titulo} — Informe o protocolo ou comprovante obrigatório.</p>
            <input
              className="w-full border rounded h-9 px-3 text-sm"
              placeholder="Ex.: Protocolo DCTFWeb #2026-12345"
              value={comprovante}
              onChange={(e) => setComprovante(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEntregando(null)}>Cancelar</Button>
              <Button onClick={confirmarEntrega}>Confirmar Entrega</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
