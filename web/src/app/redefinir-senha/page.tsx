'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (novaSenha.length < 6) {
      setErro('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmacao) {
      setErro('As senhas não coincidem.');
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    if (error) {
      setErro(error.message);
      return;
    }

    setSucesso(true);
    setTimeout(() => router.push('/'), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-blue-600" />
            Definir Nova Senha
          </CardTitle>
          <CardDescription>
            Digite sua nova senha de acesso ao Pagamentus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nova Senha</label>
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Confirmar Nova Senha</label>
              <input
                type="password"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              />
            </div>

            {erro && (
              <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-md">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            {sucesso && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-md">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Senha atualizada! Redirecionando...</span>
              </div>
            )}

            <Button type="submit" className="w-full">
              Salvar Nova Senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
