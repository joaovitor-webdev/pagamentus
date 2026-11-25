'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Lock, Unlock, Calculator, CheckCircle2, FileText, PlusCircle, RotateCcw } from 'lucide-react';

interface Empregado {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  salarioBase: number;
  admissao: string;
}

interface EventoFolha {
  id: string;
  empregadoNome: string;
  tipo: 'HORA_EXTRA' | 'BONUS' | 'FALTA' | 'AFASTAMENTO';
  descricao: string;
  valor: number;
}

interface CalculoPessoa {
  empregadoId: string;
  nome: string;
  proventos: number;
  descontos: number;
  liquido: number;
  conferido: boolean;
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

export function ModuloFolha({
  perfilAtivo,
  competencia,
}: {
  perfilAtivo: string;
  competencia: string;
}) {
  const [empregados] = useState<Empregado[]>(EMPREGADOS_INICIAIS);
  const [eventos, setEventos] = useState<EventoFolha[]>([
    {
      id: 'ev-1',
      empregadoNome: 'Lucas Ferreira (Fictício)',
      tipo: 'HORA_EXTRA',
      descricao: 'Horas extras 50% (4h)',
      valor: 180.0,
    },
  ]);

  const [novoEventoEmp, setNovoEventoEmp] = useState(EMPREGADOS_INICIAIS[0].nome);
  const [novoEventoTipo, setNovoEventoTipo] = useState<EventoFolha['tipo']>('BONUS');
  const [novoEventoDesc, setNovoEventoDesc] = useState('');
  const [novoEventoValor, setNovoEventoValor] = useState('');

  const [calculos, setCalculos] = useState<CalculoPessoa[]>([]);
  const [statusFolha, setStatusFolha] = useState<'ABERTA' | 'CALCULADA' | 'FECHADA'>('ABERTA');
  const [justificativa, setJustificativa] = useState('');
  const [mostrarFechamento, setMostrarFechamento] = useState(false);

  const acessoTotal = perfilAtivo === 'ADMINISTRADOR' || perfilAtivo === 'RH_DP';
  const mascararCpf = (cpf: string) => (acessoTotal ? cpf : `***.***.${cpf.slice(-6)}`);
  const formatarMoeda = (valor: number) =>
    acessoTotal
      ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : 'R$ ••••••';

  const handleAdicionarEvento = (e: React.FormEvent) => {
    e.preventDefault();
    if (statusFolha === 'FECHADA') return;
    const v = Number(novoEventoValor);
    if (!novoEventoDesc.trim() || isNaN(v) || v <= 0) return;
    setEventos([
      ...eventos,
      {
        id: String(Date.now()),
        empregadoNome: novoEventoEmp,
        tipo: novoEventoTipo,
        descricao: novoEventoDesc.trim(),
        valor: v,
      },
    ]);
    setNovoEventoDesc('');
    setNovoEventoValor('');
  };

  const calcularEGravar = () => {
    const novosCalculos: CalculoPessoa[] = empregados.map((emp) => {
      const extras = eventos
        .filter((ev) => ev.empregadoNome === emp.nome && (ev.tipo === 'HORA_EXTRA' || ev.tipo === 'BONUS'))
        .reduce((acc, ev) => acc + ev.valor, 0);
      const faltas = eventos
        .filter((ev) => ev.empregadoNome === emp.nome && ev.tipo === 'FALTA')
        .reduce((acc, ev) => acc + ev.valor, 0);

      const proventos = emp.salarioBase + extras;
      const inssEstimado = proventos * 0.11;
      const descontos = inssEstimado + faltas;
      return {
        empregadoId: emp.id,
        nome: emp.nome,
        proventos,
        descontos,
        liquido: proventos - descontos,
        conferido: false,
      };
    });
    setCalculos(novosCalculos);
    setStatusFolha('CALCULADA');
  };

  const marcarConferido = (empregadoId: string) => {
    setCalculos((prev) =>
      prev.map((c) => (c.empregadoId === empregadoId ? { ...c, conferido: true } : c))
    );
  };

  const confirmarFechamento = () => {
    if (!justificativa.trim()) return;
    setStatusFolha('FECHADA');
    setMostrarFechamento(false);
  };

  const reabrirFolha = () => {
    if (!justificativa.trim()) return;
    setStatusFolha('CALCULADA');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">
            Folha da Competência {competencia}:
          </span>
          <Badge
            className={
              statusFolha === 'FECHADA'
                ? 'bg-emerald-600 text-white'
                : statusFolha === 'CALCULADA'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-800'
            }
          >
            {statusFolha}
          </Badge>
        </div>

        {acessoTotal ? (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
            <Unlock className="w-3 h-3 mr-1" /> Acesso Total ({perfilAtivo})
          </Badge>
        ) : (
          <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
            <Lock className="w-3 h-3 mr-1" /> Mascaramento LGPD Ativo ({perfilAtivo})
          </Badge>
        )}
      </div>

      <Tabs defaultValue="empregados" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="empregados">1. Empregados</TabsTrigger>
          <TabsTrigger value="eventos">2. Eventos &amp; Afastamentos</TabsTrigger>
          <TabsTrigger value="calculo">3. Cálculo de Folha</TabsTrigger>
          <TabsTrigger value="holerite">4. Holerite &amp; Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="empregados" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Conferência de Empregados</CardTitle>
              <CardDescription>
                Verifique nomes, cargos e salários antes de lançar eventos e calcular a folha.
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
                        {formatarMoeda(emp.salarioBase)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eventos" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eventos &amp; Afastamentos ({competencia})</CardTitle>
              <CardDescription>
                Registre horas extras, bônus, faltas ou afastamentos ocorridos no mês.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {statusFolha !== 'FECHADA' && (
                <form onSubmit={handleAdicionarEvento} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <select
                    value={novoEventoEmp}
                    onChange={(e) => setNovoEventoEmp(e.target.value)}
                    className="border border-slate-300 rounded-md px-2.5 py-1.5 text-sm bg-white"
                  >
                    {empregados.map((e) => (
                      <option key={e.id} value={e.nome}>
                        {e.nome}
                      </option>
                    ))}
                  </select>
                  <select
                    value={novoEventoTipo}
                    onChange={(e) => setNovoEventoTipo(e.target.value as EventoFolha['tipo'])}
                    className="border border-slate-300 rounded-md px-2.5 py-1.5 text-sm bg-white"
                  >
                    <option value="HORA_EXTRA">Hora Extra</option>
                    <option value="BONUS">Bônus / Adicional</option>
                    <option value="FALTA">Falta / Desconto</option>
                    <option value="AFASTAMENTO">Afastamento</option>
                  </select>
                  <input
                    type="text"
                    value={novoEventoDesc}
                    onChange={(e) => setNovoEventoDesc(e.target.value)}
                    placeholder="Descrição do evento"
                    className="border border-slate-300 rounded-md px-3 py-1.5 text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={novoEventoValor}
                      onChange={(e) => setNovoEventoValor(e.target.value)}
                      placeholder="R$ 0.00"
                      className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm"
                    />
                    <Button type="submit" size="sm">
                      <PlusCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventos.map((ev) => (
                    <TableRow key={ev.id}>
                      <TableCell className="font-medium">{ev.empregadoNome}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ev.tipo}</Badge>
                      </TableCell>
                      <TableCell>{ev.descricao}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatarMoeda(ev.valor)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculo" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Cálculo de Folha ({competencia})</span>
                <div className="flex gap-2">
                  {statusFolha !== 'FECHADA' ? (
                    <Button onClick={calcularEGravar} size="sm">
                      <Calculator className="w-4 h-4 mr-1.5" />
                      Calcular &amp; Gravar
                    </Button>
                  ) : (
                    <Button onClick={reabrirFolha} variant="outline" size="sm">
                      <RotateCcw className="w-4 h-4 mr-1.5" />
                      Reabrir Folha
                    </Button>
                  )}
                </div>
              </CardTitle>
              <CardDescription>
                Calcule proventos, descontos e líquido. Confira cada pessoa antes de fechar a competência.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {calculos.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Clique em <strong>Calcular &amp; Gravar</strong> para processar a folha da competência {competencia}.
                </p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Colaborador</TableHead>
                        <TableHead className="text-right">Proventos</TableHead>
                        <TableHead className="text-right">Descontos</TableHead>
                        <TableHead className="text-right">Líquido</TableHead>
                        <TableHead className="text-right">Conferência</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calculos.map((c) => (
                        <TableRow key={c.empregadoId}>
                          <TableCell className="font-medium">{c.nome}</TableCell>
                          <TableCell className="text-right">{formatarMoeda(c.proventos)}</TableCell>
                          <TableCell className="text-right text-red-600">{formatarMoeda(c.descontos)}</TableCell>
                          <TableCell className="text-right font-bold text-emerald-700">
                            {formatarMoeda(c.liquido)}
                          </TableCell>
                          <TableCell className="text-right">
                            {c.conferido ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Conferido
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => marcarConferido(c.empregadoId)}
                              >
                                Conferir
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {statusFolha !== 'FECHADA' && (
                    <div className="pt-4 border-t border-slate-200 space-y-3">
                      {!mostrarFechamento ? (
                        <Button
                          onClick={() => setMostrarFechamento(true)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Fechar Competência
                        </Button>
                      ) : (
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                          <p className="text-xs font-semibold text-slate-700">
                            Justificativa obrigatória para fechamento da competência {competencia}:
                          </p>
                          <input
                            type="text"
                            value={justificativa}
                            onChange={(e) => setJustificativa(e.target.value)}
                            placeholder="Ex: Valores conferidos e validados pelo RH."
                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={confirmarFechamento}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Confirmar Fechamento
                            </Button>
                            <Button variant="outline" onClick={() => setMostrarFechamento(false)}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holerite" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Holerite &amp; Histórico ({competencia})
              </CardTitle>
              <CardDescription>
                Comprovantes individuais gerados a partir do cálculo gravado. Ambiente demonstrativo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {calculos.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhum holerite disponível ainda. Execute o cálculo na aba <strong>3. Cálculo de Folha</strong>.
                </p>
              ) : (
                calculos.map((c) => (
                  <div
                    key={c.empregadoId}
                    className="p-4 rounded-lg border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{c.nome}</p>
                      <p className="text-xs text-slate-500">
                        Competência: {competencia} · Status da Folha: {statusFolha}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Valor Líquido</p>
                      <p className="text-lg font-bold text-emerald-700">{formatarMoeda(c.liquido)}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
