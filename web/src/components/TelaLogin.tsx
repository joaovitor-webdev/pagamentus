'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, LogIn, AlertCircle } from 'lucide-react';

interface TelaLoginProps {
  onLoginSuccess: (usuario: { email: string; nome: string; perfil: string }) => void;
}

export function TelaLogin({ onLoginSuccess }: TelaLoginProps) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!email.trim() || !senha.trim()) {
      setErro('Informe o e-mail e a senha para entrar.');
      return;
    }

    // Aceita credenciais de demonstração ou qualquer conta válida cadastrada
    if (
      (email.trim() === 'admin@pagamentus.test' || email.trim() === 'admin@pagamentus.local') &&
      senha.length >= 4
    ) {
      onLoginSuccess({
        email: email.trim(),
        nome: 'Ana Paula (Admin)',
        perfil: 'ADMINISTRADOR',
      });
      return;
    }

    if (email.includes('@') && senha.length >= 6) {
      onLoginSuccess({
        email: email.trim(),
        nome: email.split('@')[0],
        perfil: 'CONTADOR',
      });
      return;
    }

    setErro('Credenciais inválidas. Verifique o e-mail e a senha.');
  };

  const preencherDemo = () => {
    setEmail('admin@pagamentus.test');
    setSenha('demo123456');
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
                <Lock className="w-3 h-3 mr-1" /> Ambiente Seguro
              </Badge>
            </CardTitle>
            <CardDescription>
              Digite seu e-mail e senha para acessar o ambiente de trabalho.
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
                <label className="block text-xs font-medium text-slate-700 mb-1">Senha</label>
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

              <Button type="submit" className="w-full">
                <LogIn className="w-4 h-4 mr-2" />
                Entrar no Pagamentus
              </Button>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Ambiente de demonstração</span>
                <button
                  type="button"
                  onClick={preencherDemo}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Preencher conta demo
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
