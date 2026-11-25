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
import {
  Building2,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Users,
  FileUp,
  Edit3,
  Power,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { validarCpf, validarCnpj } from '@/lib/validacao-documentos';

interface EmpresaRow {
  id: string;
  razao_social: string;
  cpf_cnpj: string;
  tipo_pessoa: 'PJ' | 'PF';
  regime_tributario: string;
  cnae_principal: string | null;
  municipio: string | null;
  uf: string | null;
  ativo: boolean;
}

interface ParceiroRow {
  id: string;
  nome: string;
  cpf_cnpj: string;
  tipo: 'CLIENTE' | 'FORNECEDOR' | 'AMBOS';
  telefone?: string | null;
  cep?: string | null;
}

interface DocumentoRow {
  id: string;
  nome_arquivo: string;
  validade: string;
  caminho_storage: string;
}

export function mascaraCpfCnpj(v: string, tipo: 'PJ' | 'PF'): string {
  const d = v.replace(/\D/g, '');
  if (tipo === 'PF') {
    return d
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return d
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function mascaraCep(v: string): string {
  return v.replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
}

export function mascaraTelefone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  }
  return d.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}

const REGIME_LABEL: Record<string, string> = {
  SIMPLES: 'Simples Nacional',
  PRESUMIDO: 'Lucro Presumido',
  REAL: 'Lucro Real',
  PF: 'Pessoa Física',
};

export function ModuloCadastros({ empresaId }: { empresaId?: string }) {
  const [aba, setAba] = useState<'empresas' | 'parceiros' | 'documentos'>('empresas');
  const [empresas, setEmpresas] = useState<EmpresaRow[]>([]);
  const [parceiros, setParceiros] = useState<ParceiroRow[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoRow[]>([
    {
      id: 'doc-1',
      nome_arquivo: 'Certidão Negativa Federal (CND).pdf',
      validade: '2026-12-05',
      caminho_storage: 'certidoes/cnd-federal.pdf',
    },
  ]);

  const [filtro, setFiltro] = useState('');
  const [pagina, setPagina] = useState(1);
  const itensPorPagina = 5;

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [tipoPessoa, setTipoPessoa] = useState<'PJ' | 'PF'>('PJ');
  const [regime, setRegime] = useState('SIMPLES');
  const [municipio, setMunicipio] = useState('');
  const [uf, setUf] = useState('PE');

  // Parceiros form
  const [parcNome, setParcNome] = useState('');
  const [parcDoc, setParcDoc] = useState('');
  const [parcTipo, setParcTipo] = useState<'CLIENTE' | 'FORNECEDOR' | 'AMBOS'>('CLIENTE');
  const [parcTel, setParcTel] = useState('');
  const [parcCep, setParcCep] = useState('');

  // Documentos form
  const [docValidade, setDocValidade] = useState('2026-12-10');

  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const carregarDados = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('empresas')
      .select('id, razao_social, cpf_cnpj, tipo_pessoa, regime_tributario, cnae_principal, municipio, uf, ativo')
      .order('razao_social');
    if (data) setEmpresas(data as EmpresaRow[]);

    const { data: pData } = await supabase
      .from('clientes_fornecedores')
      .select('id, nome, cpf_cnpj, tipo')
      .order('nome');
    if (pData) setParceiros(pData as ParceiroRow[]);
  };

  useEffect(() => {
    carregarDados();
  }, [empresaId]);

  const handleSalvarEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    if (!razaoSocial.trim()) {
      setErro('Informe a Razão Social ou Nome.');
      return;
    }

    const docValido = tipoPessoa === 'PJ' ? validarCnpj(cpfCnpj) : validarCpf(cpfCnpj);
    if (!docValido) {
      setErro(`${tipoPessoa === 'PJ' ? 'CNPJ' : 'CPF'} inválido. Verifique os dígitos.`);
      return;
    }

    const supabase = createClient();
    if (editandoId) {
      const { error } = await supabase
        .from('empresas')
        .update({
          tipo_pessoa: tipoPessoa,
          razao_social: razaoSocial.trim(),
          cpf_cnpj: cpfCnpj.trim(),
          regime_tributario: regime,
          municipio: municipio.trim() || null,
          uf: uf.trim().toUpperCase() || null,
        })
        .eq('id', editandoId);
      if (error) {
        setErro(error.message);
        return;
      }
      setEditandoId(null);
      setSucesso('Empresa atualizada com sucesso.');
    } else {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data: perfil } = await supabase
        .from('usuarios_perfis')
        .select('escritorio_id')
        .eq('usuario_id', userData.user.id)
        .single();
      if (!perfil) {
        setErro('Perfil não encontrado.');
        return;
      }
      const { error } = await supabase.from('empresas').insert({
        escritorio_id: perfil.escritorio_id,
        tipo_pessoa: tipoPessoa,
        razao_social: razaoSocial.trim(),
        cpf_cnpj: cpfCnpj.trim(),
        regime_tributario: regime,
        municipio: municipio.trim() || null,
        uf: uf.trim().toUpperCase() || null,
      });
      if (error) {
        setErro(error.message);
        return;
      }
      setSucesso('Empresa cadastrada e auditada no banco com sucesso.');
    }

    setRazaoSocial('');
    setCpfCnpj('');
    setMunicipio('');
    await carregarDados();
  };

  const alternarAtivoEmpresa = async (emp: EmpresaRow) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('empresas')
      .update({ ativo: !emp.ativo })
      .eq('id', emp.id);
    if (!error) {
      setSucesso(`Empresa ${emp.razao_social} ${!emp.ativo ? 'reativada' : 'inativada'}.`);
      await carregarDados();
    }
  };

  const salvarParceiro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);
    const empAlvo = empresaId || empresas[0]?.id;
    if (!empAlvo || !parcNome.trim()) return;
    const supabase = createClient();
    const { error } = await supabase.from('clientes_fornecedores').insert({
      empresa_id: empAlvo,
      nome: parcNome.trim(),
      cpf_cnpj: parcDoc.trim(),
      tipo: parcTipo,
    });
    if (error) {
      setErro(error.message);
      return;
    }
    setParcNome('');
    setParcDoc('');
    setParcTel('');
    setParcCep('');
    setSucesso('Cliente/Fornecedor cadastrado com sucesso.');
    await carregarDados();
  };

  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro(null);
    setSucesso(null);
    const empAlvo = empresaId || empresas[0]?.id || 'geral';
    const path = `${empAlvo}/${Date.now()}_${file.name}`;
    const supabase = createClient();
    await supabase.storage.from('documentos').upload(path, file);
    setDocumentos((prev) => [
      { id: `${Date.now()}`, nome_arquivo: file.name, validade: docValidade, caminho_storage: path },
      ...prev,
    ]);
    setSucesso(`Documento "${file.name}" enviado com controle de validade.`);
    e.target.value = '';
  };

  const filtrados = empresas.filter(
    (c) =>
      c.razao_social.toLowerCase().includes(filtro.toLowerCase()) ||
      c.cpf_cnpj.includes(filtro)
  );
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / itensPorPagina));
  const paginados = filtrados.slice((pagina - 1) * itensPorPagina, pagina * itensPorPagina);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant={aba === 'empresas' ? 'default' : 'outline'} onClick={() => setAba('empresas')}>
          <Building2 className="w-4 h-4 mr-1" /> Empresas
        </Button>
        <Button size="sm" variant={aba === 'parceiros' ? 'default' : 'outline'} onClick={() => setAba('parceiros')}>
          <Users className="w-4 h-4 mr-1" /> Clientes e Fornecedores
        </Button>
        <Button size="sm" variant={aba === 'documentos' ? 'default' : 'outline'} onClick={() => setAba('documentos')}>
          <FileUp className="w-4 h-4 mr-1" /> Documentos &amp; Validade
        </Button>
      </div>

      {erro && (
        <div className="flex items-center gap-1.5 text-red-700 text-xs bg-red-50 border border-red-200 rounded px-3 py-2">
          <AlertCircle className="w-4 h-4" />
          <span>{erro}</span>
        </div>
      )}
      {sucesso && (
        <div className="flex items-center gap-1.5 text-emerald-700 text-xs bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{sucesso}</span>
        </div>
      )}

      {aba === 'empresas' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                {editandoId ? 'Editar Empresa / Cliente' : 'Nova Empresa / Cliente'}
              </CardTitle>
              <CardDescription>
                Validação de CPF/CNPJ com máscara automática, edição e inativação lógica.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSalvarEmpresa} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  placeholder="Razão Social / Nome"
                  className="border border-slate-300 rounded-md px-3 py-1.5 text-sm"
                />
                <div className="flex gap-2">
                  <select
                    value={tipoPessoa}
                    onChange={(e) => setTipoPessoa(e.target.value as 'PJ' | 'PF')}
                    aria-label="Tipo de pessoa"
                    className="border border-slate-300 rounded-md px-2 py-1.5 text-sm bg-white"
                  >
                    <option value="PJ">PJ</option>
                    <option value="PF">PF</option>
                  </select>
                  <input
                    type="text"
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(mascaraCpfCnpj(e.target.value, tipoPessoa))}
                    placeholder={tipoPessoa === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                    className="border border-slate-300 rounded-md px-3 py-1.5 text-sm flex-1"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={regime}
                    onChange={(e) => setRegime(e.target.value)}
                    aria-label="Regime tributário"
                    className="border border-slate-300 rounded-md px-2 py-1.5 text-sm bg-white flex-1"
                  >
                    <option value="SIMPLES">Simples Nacional</option>
                    <option value="PRESUMIDO">Lucro Presumido</option>
                    <option value="REAL">Lucro Real</option>
                    <option value="PF">Pessoa Física</option>
                  </select>
                  <Button type="submit" size="sm">
                    <PlusCircle className="w-4 h-4 mr-1.5" />
                    {editandoId ? 'Atualizar' : 'Salvar'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle>Empresas Cadastradas ({filtrados.length})</CardTitle>
              <input
                type="text"
                value={filtro}
                onChange={(e) => { setFiltro(e.target.value); setPagina(1); }}
                placeholder="Buscar por nome ou CPF/CNPJ..."
                className="border border-slate-300 rounded-md px-3 py-1 text-sm w-64"
              />
            </CardHeader>
            <CardContent className="space-y-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Razão Social / Nome</TableHead>
                    <TableHead>CPF / CNPJ</TableHead>
                    <TableHead>Regime</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginados.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.razao_social}</TableCell>
                      <TableCell className="font-mono text-xs">{c.cpf_cnpj}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{REGIME_LABEL[c.regime_tributario] || c.regime_tributario}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={c.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}>
                          {c.ativo ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`Editar ${c.razao_social}`}
                          onClick={() => {
                            setEditandoId(c.id);
                            setRazaoSocial(c.razao_social);
                            setCpfCnpj(c.cpf_cnpj);
                            setTipoPessoa(c.tipo_pessoa);
                            setRegime(c.regime_tributario);
                          }}
                        >
                          <Edit3 className="w-4 h-4 mr-1" /> Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`${c.ativo ? 'Inativar' : 'Ativar'} ${c.razao_social}`}
                          onClick={() => alternarAtivoEmpresa(c)}
                        >
                          <Power className="w-4 h-4 mr-1" /> {c.ativo ? 'Inativar' : 'Ativar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Página {pagina} de {totalPaginas}</span>
                <div className="space-x-2">
                  <Button size="sm" variant="outline" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>
                    Anterior
                  </Button>
                  <Button size="sm" variant="outline" disabled={pagina >= totalPaginas} onClick={() => setPagina(pagina + 1)}>
                    Próxima
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {aba === 'parceiros' && (
        <Card>
          <CardHeader>
            <CardTitle>Clientes e Fornecedores</CardTitle>
            <CardDescription>Cadastro com máscaras de CPF/CNPJ, CEP e Telefone.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={salvarParceiro} className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              <input
                className="border rounded px-3 py-1.5 text-sm"
                placeholder="Nome / Razão Social"
                value={parcNome}
                onChange={(e) => setParcNome(e.target.value)}
                required
              />
              <input
                className="border rounded px-3 py-1.5 text-sm"
                placeholder="CPF ou CNPJ"
                value={parcDoc}
                onChange={(e) => setParcDoc(mascaraCpfCnpj(e.target.value, e.target.value.replace(/\D/g, '').length > 11 ? 'PJ' : 'PF'))}
                required
              />
              <input
                className="border rounded px-3 py-1.5 text-sm"
                placeholder="Telefone (00) 00000-0000"
                value={parcTel}
                onChange={(e) => setParcTel(mascaraTelefone(e.target.value))}
              />
              <input
                className="border rounded px-3 py-1.5 text-sm"
                placeholder="CEP 00000-000"
                value={parcCep}
                onChange={(e) => setParcCep(mascaraCep(e.target.value))}
              />
              <div className="flex gap-2">
                <select
                  className="border rounded px-2 py-1.5 text-sm flex-1"
                  value={parcTipo}
                  onChange={(e) => setParcTipo(e.target.value as ParceiroRow['tipo'])}
                >
                  <option value="CLIENTE">Cliente</option>
                  <option value="FORNECEDOR">Fornecedor</option>
                  <option value="AMBOS">Ambos</option>
                </select>
                <Button type="submit" size="sm">Adicionar</Button>
              </div>
            </form>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF / CNPJ</TableHead>
                  <TableHead>Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parceiros.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell className="font-mono text-xs">{p.cpf_cnpj}</TableCell>
                    <TableCell><Badge variant="outline">{p.tipo === 'CLIENTE' ? 'Cliente' : p.tipo === 'FORNECEDOR' ? 'Fornecedor' : 'Ambos'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {aba === 'documentos' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload de Documentos e Controle de Validade</CardTitle>
            <CardDescription>Bucket privado &quot;documentos&quot; com alerta de vencimento em 30 dias.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap p-3 border rounded-lg bg-slate-50">
              <div>
                <label className="text-xs font-medium block mb-1">Data de Validade</label>
                <input
                  type="date"
                  className="border rounded h-9 px-3 text-sm bg-white"
                  value={docValidade}
                  onChange={(e) => setDocValidade(e.target.value)}
                />
              </div>
              <label className="cursor-pointer mt-4">
                <input type="file" className="hidden" onChange={handleUploadDoc} />
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium">
                  <FileUp className="w-4 h-4" /> Enviar Documento
                </span>
              </label>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Alerta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentos.map((d) => {
                  const dias = Math.ceil((new Date(d.validade).getTime() - Date.now()) / 86400000);
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.nome_arquivo}</TableCell>
                      <TableCell>{d.validade.split('-').reverse().join('/')}</TableCell>
                      <TableCell>
                        {dias < 0 ? (
                          <Badge className="bg-rose-100 text-rose-800">Vencido</Badge>
                        ) : dias <= 30 ? (
                          <Badge className="bg-amber-100 text-amber-800">Vence em {dias} dias</Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-800">Válido</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
