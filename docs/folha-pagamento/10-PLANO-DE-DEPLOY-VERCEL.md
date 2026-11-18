# 10 — Plano de Deploy na Vercel Integrado ao Neon PostgreSQL

**Projeto:** Pagamentus — Módulo de Folha de Pagamento  
**Arquitetura Alvo:** `Navegador mobile/desktop → Vercel (HTTPS / Static + Serverless API) → Neon PostgreSQL (Pooler SSL)`

---

## 1. Análise de Viabilidade e Compatibilidade com a Vercel

A stack atual escolhida pelos alunos (**Node.js + TypeScript + Express + `pg` + Frontend SPA estático em `src/public`**) é **altamente compatível** com a Vercel, sem qualquer necessidade de trocar de framework ou reescrever o backend:

| Aspecto Técnico | Situação Atual | Adaptação Mínima para Vercel (`ME-12`) |
|---|---|---|
| **Frontend (`src/public/*`)** | HTML5 + CSS + Vanilla JS servidos estaticamente pelo Express. | Pode ser servido tanto pela CDN da Vercel quanto pelo fallback SPA do Express. |
| **Backend (`src/server.ts`)** | Aplicação Express modular (`app`) que só chama `app.listen()` se `require.main === module` (L72). | Criar `api/index.ts` exportando o handler serverless que delega para o `app` de `src/server.ts`. |
| **Inicialização do Banco (`initDatabase`)** | Atualmente chamada apenas dentro de `startServer()` (L56), que não é invocado pela Vercel ao importar `app`. | Criar helper idempotente `ensureDatabaseInitialized()` em `src/db/database.ts` (executado uma única vez por *cold start* da função serverless via middleware antes das rotas `/api/*`). |
| **Conexão com Neon (`pg.Pool`)** | `new Pool({ connectionString: process.env.DATABASE_URL })`. | Adicionar `ssl: { rejectUnauthorized: false }` (para URLs Neon), `options: '-c search_path=pagamentus,public'`, `max: 5` e `idleTimeoutMillis: 30000` para uso ideal com o Connection Pooler do Neon (`-pooler`). |
| **Processos Persistentes / WebSockets** | Não utiliza WebSockets, cron interno em memória nem escrita em disco local para a Folha de Pagamento (após remover o `src/db/database.js` legado de SQLite). | 100% *stateless*; exportações eSocial JSON/TXT são geradas em memória e transmitidas diretamente no response HTTP. |
| **Limites de Execução (Timeouts)** | Cálculos de folha, holerite e eSocial levam `< 150ms` no PostgreSQL. | Bem abaixo do limite de 10s–60s das Serverless Functions da Vercel. |

---

## 2. Estrutura de Configuração para a Vercel (`ME-12`)

### 2.1. Entrypoint Serverless (`api/index.ts`)
```ts
import { Request, Response } from 'express';
import { app } from '../src/server';
import { ensureDatabaseInitialized } from '../src/db/database';

export default async function handler(req: Request, res: Response) {
  await ensureDatabaseInitialized();
  return app(req, res);
}
```

### 2.2. Roteamento (`vercel.json`)
```json
{
  "version": 2,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.ts" },
    { "source": "/(.*)", "destination": "/api/index.ts" }
  ]
}
```
*(Alternativamente, servindo `src/public` diretamente para arquivos estáticos `/css/*`, `/js/*` e `index.html`, garantindo latência zero de borda para o frontend mobile).*

---

## 3. Variáveis de Ambiente Obrigatórias na Vercel

No painel da Vercel (**Project Settings → Environment Variables**), configurar para os ambientes `Production`, `Preview` e `Development`:

| Variável | Descrição | Exemplo de Formato (Fictício) |
|---|---|---|
| `DATABASE_URL` | String de conexão **Pooled** do Neon PostgreSQL (`-pooler` na porta 5432 com `sslmode=require`). | `postgresql://neondb_owner:senha_segura@ep-projeto-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `NODE_ENV` | Ambiente de execução (`production` na Vercel). | `production` |
| `JWT_SECRET` | Segredo criptográfico para tokens/sessões. | `<string-aleatoria-256-bits>` |

---

## 4. Gerenciamento de Conexões e Connection Pooling com Neon

1. **Uso da String Pooled (`-pooler`):**
   - No Neon PostgreSQL, o endpoint com sufixo `-pooler` utiliza o PgBouncer gerenciado pelo Neon, suportando milhares de conexões efêmeras de funções serverless da Vercel.
2. **Parâmetro `search_path` na Conexão:**
   - Para compatibilidade total com o PgBouncer do Neon, `src/db/database.ts` passará `options: '-c search_path=pagamentus,public'` na configuração do `Pool` (ou qualificará o schema / executará `SET search_path` na aquisição da conexão), garantindo que todas as queries operem no schema `pagamentus`.
3. **Prevenção de Vazamento de Conexões:**
   - Todos os blocos transacionais (`client = await pool.connect()`) possuem bloco `finally { client.release(); }` obrigatório.

---

## 5. Estratégia de Deploys de Preview e Produção

- **Preview Deploys (Branches / PRs):** Podem apontar para uma **branch de banco do Neon** (`preview` / `dev`), isolando completamente testes de PR dos dados principais.
- **Production Deploy (`main`):** Aponta para a branch principal (`main` / `production`) do banco Neon do projeto, com HTTPS automático, compressão Brotli/Gzip e logs estruturados no painel da Vercel.
