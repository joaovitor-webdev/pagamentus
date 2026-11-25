# SPEC-4.9 – Portal do cliente

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 4 – Folha, obrigações e atendimento | @doug26-cmyk | @joaovitor-webdev | A definir | Revisando |

## 1. Contexto e objetivo
Esta especificação define a **interface de API do Portal do Cliente** permitindo ao cliente enviar e consultar documentos vinculados à sua empresa e abrir/acompanhar solicitações de atendimento junto ao escritório contábil.

## 2. Requisitos relacionados
- **RF-066:** Disponibilizar portal para cliente enviar e consultar documentos e acompanhar solicitações.

## 3. Escopo
- **Dentro do escopo:**
  - Envio e consulta de documentos pelo cliente (`POST/GET /api/portal/clientes/:clienteId/documentos`).
  - Abertura, atualização de status e acompanhamento de solicitações de atendimento (`POST/GET /api/portal/clientes/:clienteId/solicitacoes` e `PATCH /api/portal/clientes/:clienteId/solicitacoes/:solicitacaoId/status`).
  - Isolamento por `clienteId` garantindo que cada cliente consulte apenas seus próprios documentos e solicitações.
- **Fora do escopo:**
  - Chat em tempo real via WebSocket ou envio de notificações push externas.

## 4. Comportamento esperado
- **Fluxo normal:**
  - O cliente envia um documento informando título, categoria e referência do arquivo, e pode consultar todos os documentos enviados.
  - O cliente abre uma solicitação (ex.: "Emissão de certidão negativa") e acompanha a evolução do status (`ABERTA`, `EM_ANDAMENTO`, `CONCLUIDA`).
- **Fluxo de erro/exceção:**
  - Se campos obrigatórios estiverem ausentes ou o status informado for inválido, o sistema recusa com HTTP 400.
  - Se a solicitação não existir para o cliente, retorna HTTP 404.

## 5. Critérios de aceite
- **CA-1 (Envio e consulta de documentos pelo cliente):** Dado um cliente, quando ele enviar documentos pelo portal e consultar sua lista, então o sistema deve retornar apenas os documentos vinculados àquele cliente (`RF-066`).
- **CA-2 (Abertura e acompanhamento de solicitações):** Dado um cliente, quando abrir uma solicitação e seu status evoluir de `ABERTA` para `EM_ANDAMENTO` / `CONCLUIDA`, então o cliente deve conseguir acompanhar o status atualizado (`RF-066`).
- **CA-3 (Validações):** Dados campos obrigatórios ausentes ou status inválido, o sistema deve recusar com HTTP 400 (`RF-066`).

## 6. Plano técnico
- **Modelos (`src/models/PortalClienteModel.ts`):** `DocumentoPortalCliente`, `StatusSolicitacaoPortal` e `SolicitacaoPortalCliente`.
- **Serviço (`src/services/PortalClienteService.ts`):** Gestão de documentos e solicitações isoladas por `clienteId`.
- **Controller e Rotas (`src/controllers/PortalClienteController.ts` e `src/routes/portalClienteRoutes.ts`):**
  - `POST/GET /api/portal/clientes/:clienteId/documentos`
  - `POST/GET /api/portal/clientes/:clienteId/solicitacoes`
  - `PATCH /api/portal/clientes/:clienteId/solicitacoes/:solicitacaoId/status`
- **Integração (`src/app.ts`):** Registrar serviço, controller e rotas em `criarApp()`.
- **Testes (`tests/portalCliente.test.ts`):** Cenários cobrindo CA-1 a CA-3.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/PortalClienteModel.ts`.
- [x] Implementar `PortalClienteService` em `src/services/PortalClienteService.ts`.
- [x] Implementar `PortalClienteController` e `portalClienteRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/portalCliente.test.ts` cobrindo CA-1 a CA-3.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- Nenhuma dependência bloqueante.

## 9. Como validar
1. Executar `npx jest tests/portalCliente.test.ts` e confirmar aprovação de `CA-1` a `CA-3`.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- Modelos, serviço, controller e rotas em `src/models/PortalClienteModel.ts`, `src/services/PortalClienteService.ts`, `src/controllers/PortalClienteController.ts` e `src/routes/portalClienteRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/portalCliente.test.ts` aprovada (1 suíte, 3 testes: CA-1 a CA-3).
- Compilação `npm run build` (`tsc`) concluída sem erros.

## 11. Histórico de revisão
- Revisão técnica por `@joaovitor-webdev`.
