# Checklist de Entrada em Produção — Pagamentus

Siga este roteiro antes de liberar o sistema para uso real pelo escritório contábil:

---

## 1. Remoção dos Usuários de Teste e Dados Fictícios
- [ ] No painel do Supabase (**Authentication > Users**), remover os 5 usuários de demonstração (`admin@pagamentus.test`, `contador@pagamentus.test`, `financeiro@pagamentus.test`, `rh@pagamentus.test`, `cliente@pagamentus.test`).
- [ ] Remover ou arquivar as 3 empresas fictícias do seed (`Tecnologia Horizonte S/A (Fictícia)`, `Comércio Estrela do Sul Ltda (Fictícia)`, `João da Silva (Contribuinte Fictício)`) e o escritório de demonstração (`11111111-1111-1111-1111-111111111111`).
- [ ] Confirmar que `supabase/config.toml` está com `[db.seed] enabled = false` e que `supabase db push --remote` aplica apenas migrations (`supabase/migrations/*.sql`), nunca `seed.sql`.

---

## 2. Criação do Administrador Definitivo
- [ ] Criar o usuário administrador real do escritório pelo painel do Supabase (**Authentication > Users > Add User**) com e-mail corporativo e senha forte (ou fluxo de redefinição de senha via `/redefinir-senha`).
- [ ] Inserir o registro do escritório real em `public.escritorios` e vincular o `usuario_id` recém-criado em `public.usuarios_perfis` com `papel = 'ADMIN'` e `ativo = true`.

---

## 3. Segurança e Autenticação no Supabase
- [ ] **Desligar Signup público:** em **Authentication > Providers > Email** (e **Authentication > Settings / User Signups**), desabilitar **"Allow new users to sign up"** para que novos usuários só possam ser convidados pelo `ADMIN` do escritório.
- [ ] **Confirmar RLS ativo em todas as tabelas:** verificar em **Database > Tables** que nenhuma tabela do schema `public` está com RLS desabilitado.
- [ ] **Bucket `documentos`:** confirmar em **Storage > Buckets** que o bucket `documentos` permanece **Private** (`public = false`).
- [ ] **Conferência de Parâmetros Legais:** solicitar ao contador responsável que revise as telas de **Parâmetros Legais**, **Fiscal** e **Obrigações** e marque `conferido_por_contador = true`.

---

## 4. Variáveis de Ambiente na Vercel
Configurar em **Vercel > Project Settings > Environment Variables** (apenas para `Production` e `Preview`):
- [ ] `NEXT_PUBLIC_SUPABASE_URL`: URL oficial do projeto Supabase (`https://<project_ref>.supabase.co`).
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave pública `anon` do Supabase.
- [ ] `CRON_SECRET`: segredo para autenticar chamadas ao endpoint `/api/cron/alertas-obrigacoes`.
- [ ] **Atenção:** **NUNCA** cadastrar `SUPABASE_SERVICE_ROLE_KEY` nem `DATABASE_URL` com prefixo `NEXT_PUBLIC_` ou expô-las ao cliente.

---

## 5. Backup e Monitoramento do Banco de Dados
- [ ] Habilitar **Daily Backups** (e Point-in-Time Recovery, se aplicável ao plano) no painel do Supabase (**Database > Backups**).
- [ ] Executar um dump inicial de segurança da estrutura após limpar os dados fictícios:
  ```bash
  supabase db dump --remote -f backup_estrutura_producao.sql
  ```
- [ ] Configurar alertas de falha de Cron na Vercel para o job diário `/api/cron/alertas-obrigacoes`.
