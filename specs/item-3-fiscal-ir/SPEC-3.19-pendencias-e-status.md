# SPEC-3.19 – Pendências e status

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 3B – Imposto de Renda | @contafaculdade73-maker | @joaovitor-webdev | A definir | Revisando |

## 1. Contexto e objetivo
Esta especificação define o **acompanhamento de status da declaração de IRPF** (`EM_PREPARACAO`, `EM_REVISAO`, `AUTORIZADA`, `TRANSMITIDA_EXTERNA`, `TRANSMITIDA_INTEGRACAO`, `RETIFICACAO`, `COM_PENDENCIAS`) e a **geração de lista de documentos faltantes, pendências, alertas e resumo para revisão do contribuinte**.

## 2. Requisitos relacionados
- **RF-038:** Gerar lista de documentos faltantes, pendências, alertas e resumo para revisão do contribuinte.
- **RF-040:** Acompanhar status de preparação, revisão, autorização, transmissão realizada externamente ou por integração autorizada, retificação e pendências.

## 3. Escopo
- **Dentro do escopo:**
  - Registro e resolução de documentos faltantes, pendências e alertas vinculados a uma declaração (`fichaId`).
  - Controle de status da declaração (`EM_PREPARACAO`, `EM_REVISAO`, `AUTORIZADA`, `TRANSMITIDA_EXTERNA`, `TRANSMITIDA_INTEGRACAO`, `RETIFICACAO`, `COM_PENDENCIAS`) com histórico de transições.
  - Geração de resumo consolidado para revisão do contribuinte contendo status atual, lista de documentos faltantes, pendências em aberto e alertas.
- **Fora do escopo:**
  - Transmissão real à Receita Federal ou envio automático de e-mail/WhatsApp ao contribuinte.

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário registra documentos faltantes, pendências ou alertas na declaração e acompanha/atualiza o status conforme o avanço da preparação, revisão, autorização, transmissão ou retificação.
  - Ao consultar o resumo para revisão do contribuinte, o sistema retorna status atual, histórico de status e itens pendentes/alertas.
- **Fluxo de erro/exceção:**
  - Se o status informado for inválido ou faltarem campos obrigatórios, o sistema recusa a operação (HTTP 400).
  - Se a pendência informada para resolução não existir, retorna HTTP 404.

## 5. Critérios de aceite
- **CA-1 (Lista de documentos faltantes, pendências, alertas e resumo):** Dada uma declaração (`fichaId`), quando documentos faltantes, pendências e alertas forem registrados, então o sistema deve gerar o resumo consolidado para revisão do contribuinte listando todos os itens pendentes e alertas (`RF-038`).
- **CA-2 (Acompanhamento de status e histórico):** Dada uma declaração (`fichaId`), quando seu status evoluir entre preparação, revisão, autorização, transmissão externa/integração, retificação ou pendências, então o sistema deve atualizar o status atual e manter o histórico das transições (`RF-040`).
- **CA-3 (Validações e resolução de pendências):** Dados status inválido ou campos ausentes, o sistema deve recusar com HTTP 400; ao resolver uma pendência existente, deve marcá-la como resolvida e removê-la das pendências abertas (`RF-038`, `RF-040`).

## 6. Plano técnico
- **Modelos (`src/models/PendenciaStatusIrModel.ts`):** `StatusDeclaracaoIr`, `TipoItemPendenciaIr`, `ItemPendenciaIr`, `TransicaoStatusIr` e `ResumoRevisaoContribuinteIr`.
- **Serviço (`src/services/PendenciaStatusIrService.ts`):** Gestão de pendências/alertas, transições de status e geração de resumo consolidado.
- **Controller e Rotas (`src/controllers/PendenciaStatusIrController.ts` e `src/routes/pendenciaStatusIrRoutes.ts`):**
  - `POST /api/ir/fichas/:fichaId/pendencias`
  - `PATCH /api/ir/fichas/:fichaId/pendencias/:pendenciaId/resolver`
  - `PATCH /api/ir/fichas/:fichaId/status`
  - `GET /api/ir/fichas/:fichaId/resumo-revisao`
- **Integração (`src/app.ts`):** Registrar serviço, controller e rotas em `criarApp()`.
- **Testes (`tests/pendenciasStatusIr.test.ts`):** Cenários cobrindo CA-1 a CA-3.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/PendenciaStatusIrModel.ts`.
- [x] Implementar `PendenciaStatusIrService` em `src/services/PendenciaStatusIrService.ts`.
- [x] Implementar `PendenciaStatusIrController` e `pendenciaStatusIrRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/pendenciasStatusIr.test.ts` cobrindo CA-1 a CA-3.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- `SPEC-3.13` (referência a `fichaId`).

## 9. Como validar
1. Executar `npx jest tests/pendenciasStatusIr.test.ts` e confirmar aprovação de `CA-1` a `CA-3`.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- Modelos, serviço, controller e rotas em `src/models/PendenciaStatusIrModel.ts`, `src/services/PendenciaStatusIrService.ts`, `src/controllers/PendenciaStatusIrController.ts` e `src/routes/pendenciaStatusIrRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/pendenciasStatusIr.test.ts` aprovada (1 suíte, 3 testes: CA-1 a CA-3).
- Compilação `npm run build` (`tsc`) concluída sem erros.

## 11. Histórico de revisão
- Revisão técnica por `@joaovitor-webdev`.
