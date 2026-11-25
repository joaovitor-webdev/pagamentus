'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface TelaLoginProps {
  onLoginSuccess: (usuario: { id: string; email: string; nome: string; papel: string }) => void;
}

export function TelaLogin({ onLoginSuccess }: TelaLoginProps) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setMensagemSucesso(null);

    if (!email.trim() || !senha.trim()) {
      setErro('Informe o e-mail e a senha para entrar.');
      return;
    }

    setCarregando(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (error || !data.user) {
        setErro(error?.message || 'Credenciais inválidas. Verifique o e-mail e a senha.');
        return;
      }

      const { data: perfil } = await supabase
        .from('usuarios_perfis')
        .select('nome, papel')
        .eq('usuario_id', data.user.id)
        .single();

      onLoginSuccess({
        id: data.user.id,
        email: data.user.email || email.trim(),
        nome: perfil?.nome || data.user.email?.split('@')[0] || 'Usuário',
        papel: perfil?.papel || 'CLIENTE',
      });
    } catch {
      setErro('Erro ao conectar ao servidor de autenticação.');
    } finally {
      setCarregando(false);
    }
  };

  const handleRecuperarSenha = async () => {
    setErro(null);
    setMensagemSucesso(null);
    if (!email.trim()) {
      setErro('Digite seu e-mail acima para receber o link de recuperação de senha.');
      return;
    }
    const supabase = createClient();
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/redefinir-senha`
        : 'https://pagamentus.vercel.app/redefinir-senha';
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    if (error) {
      setErro(error.message);
    } else {
      setMensagemSucesso('Se o e-mail existir na base, um link de recuperação foi enviado.');
    }
  };

  const preencherDemo = () => {
    setEmail('admin@pagamentus.test');
    setSenha('Pagamentus@2026');
    setErro(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center mx-auto shadow-md">
            PG
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Pagamentus</h1>
          <p className="text-xs text-slate-500">
            Sistema Integrado de Contabilidade, Fiscal e Imposto de Renda
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span>Entrar no Pagamentus</span>
              <Badge variant="secondary" className="text-xs">
                <Lock className="w-3 h-3 mr-1" /> Supabase Auth
              </Badge>
            </CardTitle>
            <CardDescription>
              Acesso restrito a usuários convidados pelo administrador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@pagamentus.test"
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">Senha</label>
                  <button
                    type="button"
                    onClick={handleRecuperarSenha}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {erro && (
                <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-md">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{erro}</span>
                </div>
              )}

              {mensagemSucesso && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-md">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{mensagemSucesso}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={carregando}>
                <LogIn className="w-4 h-4 mr-2" />
                {carregando ? 'Autenticando...' : 'Entrar no Pagamentus'}
              </Button>

              {process.env.NODE_ENV === 'development' && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Ambiente de desenvolvimento</span>
                  <button
                    type="button"
                    onClick={preencherDemo}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Preencher admin dev
                  </button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
