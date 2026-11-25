# SPEC-4.10 – Organização, checklist e correções

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 4 – Folha, obrigações e atendimento | @doug26-cmyk | @joaovitor-webdev | A definir | Revisando |

## 1. Contexto e objetivo
Esta especificação define a **organização documental por cliente, exercício, competência, tipo e processo com busca e filtros**, além do **fluxo de checklist, comentários, pedidos de correção e confirmação de recebimento**.

## 2. Requisitos relacionados
- **RF-067:** Organizar documentos por cliente, exercício, competência, tipo e processo, com busca e filtros.
- **RF-068:** Permitir checklist de documentos, comentários, pedidos de correção e confirmação de recebimento.

## 3. Escopo
- **Dentro do escopo:**
  - Cadastro de documentos organizados por `clienteId`, `exercicio`, `competencia`, `tipo` e `processo`, com checklist de conferência.
  - Busca textual e filtros combinados por `exercicio`, `competencia`, `tipo`, `processo` e termo de busca (`q`).
  - Registro de comentários, solicitação de correção (alterando status para `CORRECAO_SOLICITADA`) e confirmação de recebimento (alterando status para `RECEBIDO`).
- **Fora do escopo:**
  - Armazenamento físico em blob storage externo ou OCR automático.

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário cadastra um documento com metadados completos e checklist opcional.
  - O usuário filtra documentos por exercício, competência, tipo, processo ou busca textual.
  - O usuário adiciona comentários, solicita correção com motivo ou confirma o recebimento do documento.
- **Fluxo de erro/exceção:**
  - Se campos obrigatórios estiverem ausentes ou `exercicio`/`competencia` forem inválidos, retorna HTTP 400.
  - Se o documento informado para comentário/correção/confirmação não existir, retorna HTTP 404.

## 5. Critérios de aceite
- **CA-1 (Organização e filtros combinados):** Dados documentos cadastrados com cliente, exercício, competência, tipo e processo, quando a busca/filtros forem aplicados, então o sistema deve retornar apenas os documentos correspondentes (`RF-067`).
- **CA-2 (Checklist, comentários, pedidos de correção e confirmação de recebimento):** Dado um documento cadastrado, quando forem registrados comentários, pedido de correção e posterior confirmação de recebimento, então o sistema deve manter o histórico e atualizar o status corretamente (`RF-068`).
- **CA-3 (Validações):** Dados campos obrigatórios ausentes ou documento inexistente, o sistema deve recusar com HTTP 400/404 (`RF-067`, `RF-068`).

## 6. Plano técnico
- **Modelos (`src/models/OrganizacaoDocumentoModel.ts`):** `StatusRecebimentoDoc`, `ComentarioDocumento` e `DocumentoOrganizado`.
- **Serviço (`src/services/OrganizacaoDocumentoService.ts`):** Cadastro, filtros/busca, comentários, pedido de correção e confirmação de recebimento.
- **Controller e Rotas (`src/controllers/OrganizacaoDocumentoController.ts` e `src/routes/organizacaoDocumentoRoutes.ts`):**
  - `POST /api/portal/clientes/:clienteId/documentos-organizados`
  - `GET /api/portal/clientes/:clienteId/documentos-organizados`
  - `POST /api/portal/clientes/:clienteId/documentos-organizados/:docId/comentarios`
  - `PATCH /api/portal/clientes/:clienteId/documentos-organizados/:docId/solicitar-correcao`
  - `PATCH /api/portal/clientes/:clienteId/documentos-organizados/:docId/confirmar-recebimento`
- **Integração (`src/app.ts`):** Registrar serviço, controller e rotas em `criarApp()`.
- **Testes (`tests/organizacaoChecklistCorrecoes.test.ts`):** Cenários cobrindo CA-1 a CA-3.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/OrganizacaoDocumentoModel.ts`.
- [x] Implementar `OrganizacaoDocumentoService` em `src/services/OrganizacaoDocumentoService.ts`.
- [x] Implementar `OrganizacaoDocumentoController` e `organizacaoDocumentoRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/organizacaoChecklistCorrecoes.test.ts` cobrindo CA-1 a CA-3.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- `SPEC-4.9` (portal do cliente).

## 9. Como validar
1. Executar `npx jest tests/organizacaoChecklistCorrecoes.test.ts` e confirmar aprovação de `CA-1` a `CA-3`.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- Modelos, serviço, controller e rotas em `src/models/OrganizacaoDocumentoModel.ts`, `src/services/OrganizacaoDocumentoService.ts`, `src/controllers/OrganizacaoDocumentoController.ts` e `src/routes/organizacaoDocumentoRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/organizacaoChecklistCorrecoes.test.ts` aprovada (1 suíte, 3 testes: CA-1 a CA-3).
- Compilação `npm run build` (`tsc`) concluída sem erros.

## 11. Histórico de revisão
- Revisão técnica por `@joaovitor-webdev`.
