import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const USUARIOS_TESTE = [
  { email: 'admin@pagamentus.test', papel: 'ADMIN' },
  { email: 'contador@pagamentus.test', papel: 'CONTADOR' },
  { email: 'rh@pagamentus.test', papel: 'RH_DP' },
  { email: 'financeiro@pagamentus.test', papel: 'FINANCEIRO' },
  { email: 'cliente@pagamentus.test', papel: 'CLIENTE' },
];

describe('E2E Supabase Auth (GoTrue) - Login dos 5 Usuários do Seed', () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  it.each(USUARIOS_TESTE)(
    'deve autenticar $email ($papel) via signInWithPassword e retornar sessão válida',
    async ({ email, papel }) => {
      if (!url || !anonKey) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY devem estar em web/.env.local');
      }

      const supabase = createClient(url, anonKey);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: 'Pagamentus@2026',
      });

      expect(error).toBeNull();
      expect(data.session).not.toBeNull();
      expect(data.user?.email).toBe(email);

      const { data: perfil, error: errPerfil } = await supabase
        .from('usuarios_perfis')
        .select('papel')
        .eq('usuario_id', data.user!.id)
        .single();

      expect(errPerfil).toBeNull();
      expect(perfil?.papel).toBe(papel);

      await supabase.auth.signOut();
    }
  );
});
