# Guia de Deploy — Pagamentus no Vercel com PostgreSQL no Supabase

Este guia orienta o processo de deploy contínuo e publicação da API do **Pagamentus** utilizando a infraestrutura serverless da **Vercel** integrada a um banco de dados **PostgreSQL gerenciado no Supabase**.

---

## 1. Pré-requisitos
- Conta ativa na [Vercel](https://vercel.com).
- Conta ativa no [Supabase](https://supabase.com).
- Acesso ao repositório GitHub `joaovitor-webdev/pagamentus`.

---

## 2. Passo 1: Criar o Banco PostgreSQL no Supabase
1. Acesse o painel do Supabase e clique em **New project**.
2. Preencha os dados:
   - **Name:** `pagamentus-db`
   - **Database Password:** Gere e salve uma senha forte com segurança.
   - **Region:** Selecione `South America (São Paulo)` para menor latência.
3. Após a inicialização do projeto, acesse **Project Settings** > **Database**.
4. Na seção **Connection string**, selecione o formato **URI** (modo `Direct connection` ou `Transaction pooler` na porta `5432` ou `6543`).
   - Exemplo: `postgresql://postgres:[SUA-SENHA]@db.[SEU-PROJETO].supabase.co:5432/postgres`

---

## 3. Passo 2: Importar e Configurar o Projeto na Vercel
1. Acesse o dashboard da Vercel e clique em **Add New...** > **Project**.
2. Selecione o repositório **`joaovitor-webdev/pagamentus`**.
3. Em **Framework Preset**, deixe selecionado `Other` (a Vercel reconhecerá automaticamente o `vercel.json`).
4. Expanda a seção **Environment Variables** e adicione:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: URL de conexão do PostgreSQL no Supabase obtida no Passo 1.
   - `PORT`: `3000`
5. Clique em **Deploy**.

---

## 4. Passo 3: Verificação pós-deploy
Após o build e deploy serem concluídos:
1. Acesse o domínio fornecido pela Vercel (ex: `https://pagamentus.vercel.app/api/health`).
2. Confirme que o endpoint responde com status `UP` (SPEC-5.8):
   ```json
   {
     "status": "UP",
     "timestamp": "2026-11-25T...",
     "uptime": 12,
     "versao": "1.0.0"
   }
   ```
3. Acesse a documentação interativa da API (SPEC-5.6):
   - `https://pagamentus.vercel.app/api/docs`
   - `https://pagamentus.vercel.app/api/docs/openapi.json`
