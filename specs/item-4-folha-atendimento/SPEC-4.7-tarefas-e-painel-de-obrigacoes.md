# SPEC-4.7 – Tarefas e painel de obrigações

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 4 – Folha, obrigações e atendimento | @doug26-cmyk | @joaovitor-webdev | A definir | Revisando |

## 1. Contexto e objetivo
Esta especificação define a **gestão de tarefas de obrigações acessórias/operacionais** (com responsável, prazo, prioridade, status, checklist e anexos) e o **painel consolidado de obrigações** agrupando itens pendentes, em preparação, em revisão, entregues e atrasados.

## 2. Requisitos relacionados
- **RF-062:** Criar tarefas com responsável, prazo, prioridade, status, checklist e anexos.
- **RF-065:** Exibir painel de obrigações pendentes, em preparação, em revisão, entregues e atrasadas.

## 3. Escopo
- **Dentro do escopo:**
  - Cadastro de tarefas vinculadas à empresa contendo: título, obrigação, responsável, prazo (`YYYY-MM-DD`), prioridade (`BAIXA`, `MEDIA`, `ALTA`, `CRITICA`), status (`PENDENTE`, `EM_PREPARACAO`, `EM_REVISAO`, `ENTREGUE`), checklist de itens e anexos (nome/referência).
  - Atualização de status e marcação de itens de checklist.
  - Painel consolidado de obrigações por empresa e data de referência, classificando automaticamente tarefas não entregues com prazo anterior à data de referência como **atrasadas**, além de contabilizar `pendentes`, `emPreparacao`, `emRevisao`, `entregues` e `atrasadas`.
- **Fora do escopo:**
  - Envio de e-mail/notificações push (tratado na SPEC-4.8).

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário cria tarefas de obrigações com responsável, prazo, prioridade, checklist e anexos.
  - O usuário atualiza o status das tarefas ao longo do fluxo.
  - Ao consultar o painel de obrigações com uma data de referência, o sistema retorna os contadores e listas agrupadas por status (incluindo atrasadas).
- **Fluxo de erro/exceção:**
  - Se campos obrigatórios estiverem ausentes, prioridade/status forem inválidos ou o prazo não seguir `YYYY-MM-DD`, o sistema recusa com HTTP 400.
  - Se a tarefa informada para atualização não existir, retorna HTTP 404.

## 5. Critérios de aceite
- **CA-1 (Criação de tarefa completa):** Dada uma empresa, quando uma tarefa for criada com responsável, prazo, prioridade, status, checklist e anexos, então o sistema deve persistir e retornar todos os campos vinculados à tarefa (`RF-062`).
- **CA-2 (Painel consolidado de obrigações e identificação de atrasadas):** Dadas tarefas em diferentes status e prazos, quando o painel for consultado para uma data de referência, então o sistema deve exibir os grupos e totais de pendentes, em preparação, em revisão, entregues e atrasadas (`RF-065`).
- **CA-3 (Validações e atualização de status):** Dados prioridade/status/prazo inválidos, o sistema deve recusar com HTTP 400; ao atualizar o status de uma tarefa existente para `ENTREGUE`, ela deve deixar de constar como atrasada no painel (`RF-062`, `RF-065`).

## 6. Plano técnico
- **Modelos (`src/models/TarefaObrigacaoModel.ts`):** `PrioridadeTarefa`, `StatusObrigacao`, `ItemChecklistTarefa`, `TarefaObrigacao` e `PainelObrigacoes`.
- **Serviço (`src/services/TarefaObrigacaoService.ts`):** Criação, atualização de status e geração do painel consolidado.
- **Controller e Rotas (`src/controllers/TarefaObrigacaoController.ts` e `src/routes/tarefaObrigacaoRoutes.ts`):**
  - `POST /api/empresas/:empresaId/obrigacoes/tarefas`
  - `PATCH /api/empresas/:empresaId/obrigacoes/tarefas/:tarefaId/status`
  - `GET /api/empresas/:empresaId/obrigacoes/painel?referencia=YYYY-MM-DD`
- **Integração (`src/app.ts`):** Registrar serviço, controller e rotas em `criarApp()`.
- **Testes (`tests/tarefasPainelObrigacoes.test.ts`):** Cenários cobrindo CA-1 a CA-3.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/TarefaObrigacaoModel.ts`.
- [x] Implementar `TarefaObrigacaoService` em `src/services/TarefaObrigacaoService.ts`.
- [x] Implementar `TarefaObrigacaoController` e `tarefaObrigacaoRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/tarefasPainelObrigacoes.test.ts` cobrindo CA-1 a CA-3.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- Nenhuma dependência bloqueante.

## 9. Como validar
1. Executar `npx jest tests/tarefasPainelObrigacoes.test.ts` e confirmar aprovação de `CA-1` a `CA-3`.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- Modelos, serviço, controller e rotas em `src/models/TarefaObrigacaoModel.ts`, `src/services/TarefaObrigacaoService.ts`, `src/controllers/TarefaObrigacaoController.ts` e `src/routes/tarefaObrigacaoRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/tarefasPainelObrigacoes.test.ts` aprovada (1 suíte, 3 testes: CA-1 a CA-3).
- Compilação `npm run build` (`tsc`) concluída sem erros.

## 11. Histórico de revisão
- Revisão técnica por `@joaovitor-webdev`.
