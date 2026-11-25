# SPEC-4.8 – Alertas de vencimento e atraso

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 4 – Folha, obrigações e atendimento | @doug26-cmyk | @joaovitor-webdev | A definir | Revisando |

## 1. Contexto e objetivo
Esta especificação define o **envio e registro de alertas de vencimento próximo e de atraso** por canais de notificação configurados (`EMAIL`, `SISTEMA`, `WEBHOOK`), com registro de entrega e aviso explícito de que alertas de prazo são auxiliares e não substituem a conferência do prazo oficial pelo responsável.

## 2. Requisitos relacionados
- **RF-063:** Enviar alertas de vencimento e atraso por notificações configuradas, com registro de entrega quando disponível.
- **RB-009:** Alertas de prazo são auxiliares; o responsável continua obrigado a confirmar o prazo oficial aplicável.

## 3. Escopo
- **Dentro do escopo:**
  - Disparo/geração de alertas de `VENCIMENTO_PROXIMO` (quando `0 <= diasRestantes <= diasAntecedencia`) e `ATRASO` (quando `prazo < dataReferencia`) por canal configurado (`EMAIL`, `SISTEMA`, `WEBHOOK`).
  - Registro do histórico de entrega de cada notificação (`ENVIADO`, `ENTREGUE`, `FALHA`) e inclusão obrigatória do aviso `RB-009` em todo alerta gerado.
  - Consulta do histórico de alertas/entregas por empresa.
- **Fora do escopo:**
  - Integração real com servidores SMTP/SMS externos em produção.

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário solicita o processamento de alertas informando a lista de obrigações/prazos, data de referência, dias de antecedência e canais configurados.
  - O sistema identifica itens próximos do vencimento ou atrasados, gera os alertas com aviso `RB-009` e grava o registro de entrega.
- **Fluxo de erro/exceção:**
  - Se a data de referência for inválida, dias de antecedência for negativo ou canal for inválido, o sistema recusa com HTTP 400.

## 5. Critérios de aceite
- **CA-1 (Geração de alertas de vencimento e atraso com registro de entrega):** Dadas obrigações com prazos próximos e vencidos, quando os alertas forem processados para uma data de referência e canais configurados, então o sistema deve emitir alertas de `VENCIMENTO_PROXIMO` e `ATRASO` com registro de entrega (`RF-063`).
- **CA-2 (Aviso obrigatório de caráter auxiliar):** Dado qualquer alerta gerado, então o retorno e o histórico devem conter explicitamente o aviso de que o alerta é auxiliar e o responsável deve confirmar o prazo oficial (`RB-009`).
- **CA-3 (Validações e consulta de histórico):** Dados canal inválido ou data inválida, o sistema deve recusar com HTTP 400; e deve permitir listar o histórico de alertas entregues da empresa (`RF-063`).

## 6. Plano técnico
- **Modelos (`src/models/AlertaVencimentoModel.ts`):** `CanalNotificacaoAlerta`, `TipoAlertaPrazo`, `RegistroAlertaPrazo` e `EntradaProcessamentoAlertas`.
- **Serviço (`src/services/AlertaVencimentoService.ts`):** Cálculo de dias restantes, disparo por canal configurado, inclusão do aviso `RB-009` e histórico em memória.
- **Controller e Rotas (`src/controllers/AlertaVencimentoController.ts` e `src/routes/alertaVencimentoRoutes.ts`):**
  - `POST /api/empresas/:empresaId/obrigacoes/alertas/processar`
  - `GET /api/empresas/:empresaId/obrigacoes/alertas`
- **Integração (`src/app.ts`):** Registrar serviço, controller e rotas em `criarApp()`.
- **Testes (`tests/alertasVencimentoAtraso.test.ts`):** Cenários cobrindo CA-1 a CA-3.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/AlertaVencimentoModel.ts`.
- [x] Implementar `AlertaVencimentoService` em `src/services/AlertaVencimentoService.ts`.
- [x] Implementar `AlertaVencimentoController` e `alertaVencimentoRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/alertasVencimentoAtraso.test.ts` cobrindo CA-1 a CA-3.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- `SPEC-4.7` (tarefas e prazos de obrigações).

## 9. Como validar
1. Executar `npx jest tests/alertasVencimentoAtraso.test.ts` e confirmar aprovação de `CA-1` a `CA-3`.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- Modelos, serviço, controller e rotas em `src/models/AlertaVencimentoModel.ts`, `src/services/AlertaVencimentoService.ts`, `src/controllers/AlertaVencimentoController.ts` e `src/routes/alertaVencimentoRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/alertasVencimentoAtraso.test.ts` aprovada (1 suíte, 3 testes: CA-1 a CA-3).
- Compilação `npm run build` (`tsc`) concluída sem erros.
- PR: https://github.com/joaovitor-webdev/pagamentus/pull/71

## 11. Histórico de revisão
- Revisão técnica por `@joaovitor-webdev`.
