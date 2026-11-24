# SPEC-3.12 – Revisão e aprovação profissional

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 3A – Fiscal e tributos | @matheusbdsousa-lgtm | @joaovitor-webdev | A definir | Revisando |

## 1. Contexto e objetivo
Esta especificação define o **fluxo de conferência, revisão e aprovação profissional obrigatória** antes da finalização de qualquer apuração tributária, obrigação acessória ou declaração, garantindo que nenhuma apuração/declaração seja marcada como aprovada ou finalizada sem revisão e aprovação de usuário autorizado.

## 2. Requisitos relacionados
- **RF-029:** Exigir conferência/aprovação de profissional autorizado antes de finalizar apuração ou obrigação.
- **RB-003:** Nenhuma declaração ou apuração será marcada como aprovada sem revisão e aprovação de usuário autorizado.

## 3. Escopo
- **Dentro do escopo:**
  - Criação de processo de apuração/obrigação em status `RASCUNHO` ou `EM_REVISAO`.
  - Registro de conferência/revisão e aprovação (ou rejeição com justificativa) exclusivamente por profissional com perfil autorizado (`CONTADOR`, `RESPONSAVEL_FISCAL`, `AUDITOR_APROVADOR`) e registro profissional informado (ex.: CRC).
  - Bloqueio explícito (HTTP 403/400) ao tentar finalizar ou aprovar sem revisão prévia ou com usuário sem perfil autorizado.
  - Trilha de histórico da revisão/aprovação contendo responsável, perfil, registro profissional, data/hora e parecer.
- **Fora do escopo:**
  - Assinatura digital ICP-Brasil (e-CPF/e-CNPJ) ou transmissão direta à Receita Federal.

## 4. Comportamento esperado
- **Fluxo normal:**
  - Uma apuração ou obrigação é criada em status `EM_REVISAO`.
  - Um profissional autorizado registra a conferência/aprovação informando identificador, perfil autorizado, registro profissional e parecer; o status passa para `APROVADA`.
  - Com status `APROVADA`, a apuração/obrigação pode ser marcada como `FINALIZADA`.
- **Fluxo de erro/exceção:**
  - Tentar finalizar diretamente sem aprovação prévia retorna erro explícito (HTTP 400).
  - Tentar aprovar com perfil não autorizado (ex.: `ASSISTENTE`, `CLIENTE`) retorna erro explícito de permissão (HTTP 403).
  - Tentar consultar/aprovar/finalizar processo inexistente retorna HTTP 404.

## 5. Critérios de aceite
- **CA-1 (Aprovação por profissional autorizado e finalização):** Dada uma apuração/obrigação em `EM_REVISAO`, quando um profissional autorizado (`CONTADOR`, `RESPONSAVEL_FISCAL` ou `AUDITOR_APROVADOR`) registrar a revisão e aprovação com parecer, então o sistema deve marcar como `APROVADA`, gravar a trilha de aprovação e permitir a finalização (`RF-029`, `RB-003`).
- **CA-2 (Bloqueio de finalização sem aprovação prévia):** Dada uma apuração/obrigação em `EM_REVISAO` (não aprovada), quando for solicitada sua finalização, então o sistema deve recusar a operação (HTTP 400) preservando o status anterior (`RF-029`, `RB-003`).
- **CA-3 (Bloqueio de aprovação por usuário não autorizado e rejeição):** Dada uma apuração/obrigação em `EM_REVISAO`, quando um usuário sem perfil autorizado tentar aprovar, então o sistema deve recusar com HTTP 403; e quando um profissional autorizado rejeitar com motivo, o status deve passar para `REJEITADA` impedindo a finalização (`RB-003`).

## 6. Plano técnico
- **Modelos (`src/models/RevisaoAprovacaoFiscalModel.ts`):** `StatusAprovacaoFiscal`, `PerfilAprovadorFiscal`, `RegistroRevisaoFiscal` e `ProcessoAprovacaoFiscal`.
- **Serviço (`src/services/RevisaoAprovacaoFiscalService.ts`):** Criação de processo, revisão/aprovação ou rejeição com validação de perfil autorizado, finalização condicionada à aprovação prévia e consulta de histórico.
- **Controller e Rotas (`src/controllers/RevisaoAprovacaoFiscalController.ts` e `src/routes/revisaoAprovacaoFiscalRoutes.ts`):**
  - `POST /api/empresas/:empresaId/fiscal/aprovacoes`
  - `POST /api/empresas/:empresaId/fiscal/aprovacoes/:processoId/revisar`
  - `POST /api/empresas/:empresaId/fiscal/aprovacoes/:processoId/finalizar`
  - `GET /api/empresas/:empresaId/fiscal/aprovacoes`
- **Integração (`src/app.ts`):** Registrar serviço, controller e rotas em `criarApp()`.
- **Testes (`tests/revisaoAprovacaoProfissional.test.ts`):** Cenários cobrindo CA-1 a CA-3.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/RevisaoAprovacaoFiscalModel.ts`.
- [x] Implementar `RevisaoAprovacaoFiscalService` em `src/services/RevisaoAprovacaoFiscalService.ts`.
- [x] Implementar `RevisaoAprovacaoFiscalController` e `revisaoAprovacaoFiscalRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/revisaoAprovacaoProfissional.test.ts` cobrindo CA-1 a CA-3.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- Nenhuma dependência bloqueante.

## 9. Como validar
1. Executar `npx jest tests/revisaoAprovacaoProfissional.test.ts` e confirmar aprovação de `CA-1` a `CA-3`.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- Modelos, serviço, controller e rotas em `src/models/RevisaoAprovacaoFiscalModel.ts`, `src/services/RevisaoAprovacaoFiscalService.ts`, `src/controllers/RevisaoAprovacaoFiscalController.ts` e `src/routes/revisaoAprovacaoFiscalRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/revisaoAprovacaoProfissional.test.ts` aprovada (1 suíte, 3 testes: CA-1 a CA-3).
- Compilação `npm run build` (`tsc`) concluída sem erros.
- PR: https://github.com/joaovitor-webdev/pagamentus/pull/59

## 11. Histórico de revisão
- Revisão técnica por `@joaovitor-webdev`.
