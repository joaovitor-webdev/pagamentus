# 01 — Diagnóstico Técnico e Funcional Atual

**Projeto:** Pagamentus — Módulo de Folha de Pagamento, Obrigações e RH (Item 4 / SPEC-4.1 e SPEC-4.2)  
**Data da Auditoria:** 18/11/2026  
**Status da Execução:** Auditoria Inicial (Somente Leitura e Planejamento)

---

## 1. Visão Geral do Repositório Encontrado

O repositório `pagamentus-main` é um monólito modular em **Node.js + TypeScript + Express** desenvolvido sob a metodologia **Spec-Driven Development (SDD)** pelas frentes do 2º e 4º períodos de GTI.

Durante a inspeção real dos arquivos, constatou-se que o repositório contém **duas árvores de execução coexistentes**:

1. **Árvore de Plataforma e Contabilidade (`src/index.ts` → `src/app.ts`):**
   - Implementa as especificações `SPEC-1.4` a `SPEC-1.9` (Autenticação, MFA, Isolamento de Clientes, Cadastro PF/PJ, Estabelecimentos, Anexos, Auditoria) e `SPEC-2.1` a `SPEC-2.4` (Plano de Contas, Lançamentos Contábeis, Modelos Recorrentes, Importação em Lote).
   - **Situação de Persistência:** Utiliza repositórios **em memória** (`InMemory*Repository`), embora possua migrações DDL SQL em `src/database/migrations/001_initial_schema.sql` a `007_auditoria_historico_cadastral.sql` e gerenciador de pool em `src/database/connection.ts`.
   - Está configurada como ponto de entrada padrão no `package.json` (`"main": "dist/index.js"`, `"start": "node dist/index.js"`, `"dev": "ts-node src/index.ts"`).

2. **Árvore de Folha de Pagamento — Item 4 (`server.js` → `src/server.ts`):**
   - Implementa o sistema completo da **Folha de Pagamento (SPEC-4.1 e SPEC-4.2)** com **persistência relacional PostgreSQL (`src/db/database.ts`)** e interface web SPA (`src/public/index.html` + `src/public/js/app.js` + `src/public/css/custom.css`).
   - Está configurada como ponto de entrada do `Dockerfile` (`CMD ["node", "dist/server.js"]`) e do `server.js` na raiz.

---

## 2. Inventário Técnico Completo (20 Pontos de Auditoria)

| # | Item Auditado | Situação Observada (Fatos e Evidências) |
|---|---|---|
| **1** | **Estrutura de diretórios** | Bem organizada em `src/` (`controllers`, `database`, `db`, `models`, `public`, `repositories`, `routes`, `services`, `tests`, `types`), `specs/`, `docs/`, `tests/`, `test/` e `docker/`. Não há pasta `node_modules` instalada nem diretório `.git` ativo na cópia local auditada. |
| **2** | **Linguagens e frameworks** | Backend em TypeScript (`^5.4.5`) + Node.js + Express (`^4.21.2`), driver `pg` (`^8.23.1`), `dotenv` (`^18.0.10`). Frontend em HTML5, Vanilla JS (`src/public/js/app.js`, 971 linhas) e Tailwind CSS via CDN (`https://cdn.tailwindcss.com`). |
| **3** | **Arquitetura** | API RESTful Express + SPA estática servida pelo mesmo processo Express (`src/server.ts`). Separação clara entre rotas (`src/routes/*`), serviços (`src/services/*`) e camada de banco (`src/db/database.ts`). |
| **4** | **Componentes frontend** | SPA de 7 abas em `src/public/index.html` (921 linhas): Dashboard, Empregados (RF-051), Eventos & Afastamentos (RF-053), Cálculo de Folha (RF-052), Holerite & Provisões (RF-055), eSocial Simulado (RF-054) e Auditoria & Parâmetros (RF-056), além de 4 modais (Empregado, Evento, Afastamento, Simulador Férias/13º). |
| **5** | **Serviços backend** | `payrollService.ts` (motor de folha mensal, INSS progressivo, IRRF, FGTS, encargos patronais, provisões de 13º/férias, simulador de férias e 13º, aprovação), `esocialService.ts` (geração de S-1000, S-2200, S-2230, S-1200 em JSON e TXT), `maskingService.ts` (RBAC e ofuscação LGPD), `rf053Validation.ts` (validações estritas de data, competência, hora e números). |
| **6** | **APIs de Folha** | 6 módulos de rotas montados em `src/server.ts`: `/api/employees`, `/api/events`, `/api/time-records`, `/api/payroll`, `/api/esocial`, `/api/parameters` + `/api/health`. |
| **7** | **Banco e modelos** | Esquema `pagamentus` em PostgreSQL (`src/db/database.ts` + `src/db/migrations/002_spec_4_2_rf053.sql`): tabelas `system_parameters`, `employees`, `contract_changes`, `leaves`, `variable_events`, `payroll_runs`, `payroll_items`, `payroll_approval_logs`, `time_records` e `benefits`. |
| **8** | **Migrações** | Duas frentes separadas: `src/database/migrations/001..007.sql` (Item 1) e `src/db/database.ts` (`initDatabase()`) + `src/db/migrations/002_spec_4_2_rf053.sql` (Item 4). Notou-se que `initDatabase()` em `src/db/database.ts` **não executa automaticamente** `002_spec_4_2_rf053.sql` (que só era aplicado manualmente no `beforeAll` do teste `spec42-rf053.integration.test.ts`). |
| **9** | **Autenticação** | No Item 1 (`src/services/AutenticacaoService.ts`), existe autenticação com senha forte, MFA e sessão (em memória). No Item 4 (`src/server.ts`), não há tela de login ligada ao backend; usa-se um seletor de perfil simulado (`X-User-Role` e `X-Organization-Id`). |
| **10** | **Autorização (RBAC)** | Implementada em `src/services/maskingService.ts`: perfis `rh_admin` (acesso total) e `consulta_assistente` (mascaramento automático de 38 campos monetários e CPFs no payload da API e bloqueio HTTP 403 em aprovação de folha e alteração de parâmetros). |
| **11** | **Regras de negócio** | Cálculo progressivo por faixas de INSS, cálculo de IRRF com dedução por dependente, FGTS (8%), encargos patronais (20% INSS + 2% RAT + 5,8% Terceiros = 35,8%), provisões de 13º (1/12 + encargos) e férias (1/12 + 1/3 + encargos), cálculo automático de hora extra (50%/100% sobre divisor 200/220) e faltas (salário/30). |
| **12** | **Funcionalidades de folha** | CRUD de empregados, alterações contratuais, afastamentos (com bloqueio de sobreposição via `daterange`), eventos variáveis, ponto importado, benefícios, cálculo e gravação de folha mensal, simulação de férias/13º, emissão de holerite individual, exportação eSocial JSON/TXT e log de aprovação. |
| **13** | **Testes** | 11 suítes em `tests/*.test.ts` (incluindo `tests/spec42-rf053.integration.test.ts`), `src/tests/integrity.test.ts` e `test/test_endpoints.ts` (14 cenários E2E da folha). |
| **14** | **Scripts** | `build`, `start`, `dev`, `migrate`, `test:integrity`, `test:unit`, `test`. Divergência: `npm start` e `npm run dev` apontam para `src/index.ts` (sem rotas de folha) em vez de `src/server.ts` (ou unificação de ambos). |
| **15** | **Configurações** | `.env.example`, `tsconfig.json`, `jest.config.js`, `Dockerfile`, `docker-compose.yml`. Não há `vercel.json`. |
| **16** | **Documentação** | `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `docs/escopo.md`, `docs/organizacao.md`, `docs/arquitetura/ADR-001-stack-e-ambientes.md` e `specs/`. |
| **17** | **Compatibilidade mobile** | A SPA usa classes utilitárias Tailwind (`sm:`, `md:`, `lg:`), porém depende de **6 tabelas horizontais** (`overflow-x-auto`), `window.prompt()` / `window.confirm()` nativos, abas horizontais que sofrem scroll no topo, holerite de largura fixa de impressão e falta de fluxos/cartões adaptados ao toque. |
| **18** | **Compatibilidade Vercel** | Ainda não configurado para Vercel: `src/server.ts` faz `app.listen()` e chama `initDatabase()` apenas dentro de `startServer()`, não há `api/index.ts` ou `vercel.json`, e `src/db/database.ts` não configura `ssl` nem `search_path` por conexão no pool para o Neon Serverless/Pooler. |
| **19** | **Integração Neon** | Usa driver `pg` com `process.env.DATABASE_URL`, compatível com PostgreSQL 16/Neon, mas requer ajuste de SSL (`ssl: { rejectUnauthorized: false }` / `sslmode=require`), definição de `options: '-c search_path=pagamentus,public'` no Pool e remoção de código legado SQLite. |
| **20** | **Erros e limitações** | Presença de **8 arquivos `.js` legados de SQLite** (`src/db/database.js`, `src/routes/*.js`, `src/services/*.js`) na mesma árvore dos `.ts`, fazendo o Node/CommonJS carregar `better-sqlite3` por engano quando importado sem extensão! Além disso, folha fechada permite recálculo/edição de eventos, dados da empresa estão fixos (hardcoded) no holerite e eSocial, e benefícios/ponto da SPEC-4.2 não estão expostos na UI nem integrados ao cálculo da folha. |

---

## 3. Classificação de Preservação por Componente (Regra da Seção 2)

Seguindo estritamente o princípio de **Preservação do Trabalho dos Alunos**, nenhum módulo funcional será descartado ou reescrito do zero. Abaixo está a classificação individualizada:

| Componente / Arquivo | Classificação | Justificativa Técnica e Evidência |
|---|---|---|
| `src/server.ts` | **AJUSTAR** | Excelente estrutura Express da Folha. Ajustar para também unificar/expor o `app` para serverless (Vercel) e inicializar migrações de forma segura e idempotente. |
| `src/app.ts` e `src/index.ts` | **APROVEITAR / INTEGRAR** | Contém as rotas dos Itens 1 e 2. Integrar as rotas de `src/server.ts` ou unificar o ponto de entrada para que `npm run dev` e `npm start` sirvam a aplicação completa com a Folha de Pagamento. |
| `src/db/database.ts` | **AJUSTAR** | Já usa `pg.Pool` e cria o schema `pagamentus` e 8 tabelas da SPEC-4.1. Ajustar para: (1) configurar SSL e `search_path` no Pool para o **Neon PostgreSQL**; (2) incorporar as tabelas/constraints da `002_spec_4_2_rf053.sql` e tabela `organizations`/`companies`; (3) controlar seed apenas quando autorizado. |
| `src/db/migrations/002_spec_4_2_rf053.sql` | **APROVEITAR** | Excelente DDL com `time_records`, `benefits`, FKs compostas tenant-aware e constraints `CHECK`. Será integrado ao fluxo automático de migração do banco Neon. |
| `src/db/database.js`, `src/routes/*.js`, `src/services/*.js` (8 arquivos `.js` em `src/`) | **REMOVER** | **Justificativa Objetiva:** São cópias legadas da versão antiga em SQLite (`better-sqlite3`, pacote nem listado no `package.json`) que colidem com os arquivos `.ts` de mesmo nome (forçando `jest.mock` em `tests/spec42-rf053.integration.test.ts` linhas 1-5). As versões evoluídas e tipadas já estão nos respectivos arquivos `.ts`. |
| `src/routes/employeeRoutes.ts` | **AJUSTAR** | Possui CRUD de empregados, benefícios, alterações contratuais e licenças com transação e lock (`FOR UPDATE`). Ajustar apenas para expor campos `departamento`/`regime_contratual` no POST/PUT principal e bloquear alterações em competência fechada quando aplicável. |
| `src/routes/eventRoutes.ts` | **AJUSTAR** | Já lista, cria (com cálculo automático de HE/falta) e exclui eventos variáveis. Ajustar para impedir inclusão/exclusão de eventos em competência já `fechada` e permitir edição rápida no mobile. |
| `src/routes/timeRecordRoutes.ts` | **APROVEITAR** | Implementação robusta da SPEC-4.2 com validação de batidas e transação atômica. Será conectada à interface mobile e ao cálculo da folha. |
| `src/routes/payrollRoutes.ts` | **COMPLEMENTAR** | Já calcula, gera prévia, simula férias/13º, gera holerite, aprova e lista logs. Complementar com listagem de histórico de competências (`GET /api/payroll/runs`), bloqueio de recálculo em folha `fechada`, reabertura controlada com justificativa e dados reais da empresa cadastrada. |
| `src/routes/esocialRoutes.ts` | **APROVEITAR** | Funciona perfeitamente gerando preview JSON e download JSON/TXT dos eventos S-1000, S-2200, S-2230 e S-1200. |
| `src/routes/parameterRoutes.ts` | **APROVEITAR** | Lista e atualiza parâmetros com log de auditoria e proteção RBAC. |
| `src/services/payrollService.ts` | **COMPLEMENTAR** | Motor de cálculo claro e bem estruturado. Complementar para: (1) considerar descontos de `benefits` ativos e horas extras de `time_records` (ou consolidá-los); (2) tratar empregados afastados/admitidos no mês; (3) travar recálculo de competência `fechada`; (4) ler dados da empresa do banco em vez de string fixa; (5) retornar alertas de conferência. |
| `src/services/esocialService.ts` | **AJUSTAR** | Ajustar apenas para ler razão social e CNPJ da empresa cadastrada no banco (com fallback para a empresa padrão). |
| `src/services/maskingService.ts` | **APROVEITAR** | Excelente implementação de RBAC e mascaramento profundo (LGPD). |
| `src/services/rf053Validation.ts` | **APROVEITAR** | Funções puras de validação bem construídas. |
| `src/public/index.html`, `src/public/js/app.js`, `src/public/css/custom.css` | **COMPLEMENTAR / AJUSTAR** | Preservar a arquitetura leve em HTML5 + Vanilla JS + Tailwind CSS escolhida pelos alunos (sem recriar em React/Next), evoluindo o layout para **Mobile First**: navegação inferior para celular, cartões responsivos no lugar de tabelas horizontais em telas pequenas, barra de jornada passo a passo do fechamento, modais adaptados para toque (*bottom sheets* no mobile), substituição de `prompt()`/`confirm()` por modais claros e novas ações de Benefícios, Ponto, Empresa e Histórico. |

---

## 4. Defeitos e Limitações Técnicas Encontradas (Com Evidências no Código)

1. **Colisão de Módulos `.js` (SQLite) vs `.ts` (PostgreSQL):**
   - **Evidência:** Em `src/db/database.js` (linha 3: `const Database = require('better-sqlite3')`) e `src/routes/employeeRoutes.js`, `eventRoutes.js`, `payrollRoutes.js`, `parameterRoutes.js`, `esocialRoutes.js`, `src/services/payrollService.js`, `esocialService.js`, `maskingService.js`. Em `tests/spec42-rf053.integration.test.ts` (linhas 1-5), o autor precisou escrever `jest.mock('../src/db/database', () => jest.requireActual('../src/db/database.ts'))` porque o Node resolve `.js` antes de `.ts`.
2. **Desconexão entre `package.json` (`src/index.ts`) e Servidor da Folha (`src/server.ts`):**
   - **Evidência:** `package.json` linhas 8-9 executam `src/index.ts` (que monta `src/app.ts`), onde **nenhuma rota de folha** (`/api/employees`, `/api/payroll`, etc.) nem os arquivos estáticos `src/public` estão registrados.
3. **Migração `002_spec_4_2_rf053.sql` Não Executada no Inicializador do Servidor:**
   - **Evidência:** `src/db/database.ts` (`initDatabase()`, linhas 25-184) cria apenas as 8 tabelas da SPEC-4.1. As tabelas `time_records` e `benefits` e as colunas `departamento` e `regime_contratual` de `employees` estão apenas em `src/db/migrations/002_spec_4_2_rf053.sql`, que não é chamada por `initDatabase()`. Se o usuário chamar `GET /api/employees/:id/benefits` ou `GET /api/time-records` subindo o servidor normal, ocorre erro SQL `relation "benefits" does not exist`.
4. **Search Path do Schema `pagamentus` Não Persistido no Pool de Conexões:**
   - **Evidência:** Em `src/db/database.ts` linhas 32-34, `SET search_path TO pagamentus, public;` é executado apenas em **uma conexão** durante `initDatabase()`. Em ambientes serverless ou com múltiplas conexões no `pg.Pool` (como no Neon), novas conexões abertas pelo pool usam o `search_path` padrão (`"$user", public`) e podem não enxergar as tabelas criadas em `pagamentus` se não estiverem qualificadas ou se o `options: '-c search_path=pagamentus,public'` não estiver configurado no Pool.
5. **Ausência de Trava de Imutabilidade após Fechamento da Competência (RB-002):**
   - **Evidência:** Em `src/services/payrollService.ts` linhas 323-334, `calculateMonthlyPayroll(..., saveToDatabase=true)` sobrescreve `payroll_runs` e apaga/recria `payroll_items` (`DELETE FROM payroll_items WHERE payroll_run_id = $1`) **mesmo quando `existingRes.rows[0].status === 'fechada'`**. Da mesma forma, `POST /api/events` e `DELETE /api/events/:id` (`src/routes/eventRoutes.ts`) permitem adicionar ou remover eventos em uma competência já fechada.
6. **Dados da Empresa Fixos (Hardcoded) no Código:**
   - **Evidência:** Em `src/routes/payrollRoutes.ts` linhas 177-181, `src/services/payrollService.ts` linhas 250-251, `src/services/esocialService.ts` linhas 19-23 e `src/public/index.html` linhas 455-456, a empresa `"Audicon Contabilidade & Gestão Empresarial Ltda"` e CNPJ `"00.123.456/0001-78"` estão fixos no código, sem permitir cadastrar/editar os dados da empresa empregadora da folha.
7. **Benefícios, Ponto e Alteração Contratual Manual Sem Interface ou Integração no Cálculo:**
   - **Evidência:** Embora `POST /api/employees/:id/benefits`, `POST /api/time-records/import` e `POST /api/employees/:id/contract-changes` existam no backend (`SPEC-4.2`), não há controles para eles em `src/public/index.html` / `src/public/js/app.js`, e `calculateMonthlyPayroll` (`src/services/payrollService.ts`) não lê os descontos de `benefits` ativos nem as horas extras registradas em `time_records`.
8. **Provisões no Rodapé do Holerite Calculadas por Aproximação Fixa no Frontend:**
   - **Evidência:** Em `src/public/js/app.js` linhas 834-835: `const prov13Estimada = preview.total_provisoes ? (preview.total_provisoes * 0.43) : 0; const provFeriasEstimada = preview.total_provisoes ? (preview.total_provisoes * 0.57) : 0;` — multiplica por `0.43` e `0.57` no frontend em vez de somar os campos exatos `provisao_13` e `provisao_ferias` já calculados em `payroll_items`.
