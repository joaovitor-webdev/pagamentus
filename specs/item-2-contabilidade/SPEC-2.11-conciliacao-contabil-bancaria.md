# SPEC-2.11 – Conciliação contábil e bancária

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 2 – Contabilidade | @joaovitor-webdev | @joaovitor-webdev | https://trello.com/c/zGPxV9HL | Feito |

## 1. Contexto e objetivo
Esta especificação define a **importação de extratos bancários com sugestão automática de conciliação e confirmação manual**, além da **conciliação de saldos contábeis** com extratos bancários, contas a pagar/receber, folha e módulos fiscais. O objetivo é permitir que o usuário confira divergências de saldos e valide manualmente os vínculos entre movimentações bancárias e registros do sistema.

## 2. Requisitos relacionados
- **RF-011:** Conciliar saldos contábeis com extratos bancários, contas a pagar/receber, folha e módulos fiscais.
- **RF-048:** Importar extratos e sugerir conciliações bancárias; permitir confirmação manual.

## 3. Escopo
- **Dentro do escopo:**
  - Importação de extrato bancário por empresa e conta contábil/bancária, registrando os itens (data, histórico, tipo `CREDITO` ou `DEBITO` e valor).
  - Geração automática de sugestões de conciliação comparando itens do extrato com lançamentos contábeis e baixas financeiras da empresa (por valor e proximidade de data).
  - Confirmação manual da conciliação pelo usuário (aceitando a sugestão ou informando manualmente a referência vinculada), alterando o status do item para `CONCILIADA`.
  - Conciliação de saldos contábeis da competência comparando o saldo contábil apurado com extrato bancário, contas a pagar/receber e valores informados de folha e módulos fiscais, apontando eventuais divergências.
- **Fora do escopo:**
  - Integração automática via Open Finance / APIs bancárias em tempo real.
  - Geração automática de lançamentos contábeis ou baixas financeiras a partir do extrato.
  - Consulta direta a tabelas externas de folha ou módulos fiscais ainda não integrados (seus saldos de referência são informados na requisição de conciliação).

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário importa um extrato bancário contendo uma lista de movimentações; o sistema persiste os itens e identifica sugestões de conciliação com lançamentos/baixas compatíveis.
  - O usuário revisa as sugestões (ou itens pendentes) e confirma manualmente a conciliação, registrando o vínculo definitivo.
  - Ao solicitar a conciliação de saldos contábeis de uma competência, o sistema compara o saldo contábil com o extrato, o saldo em aberto de pagar/receber e os valores informados de folha e módulos fiscais, exibindo se está conciliado ou a diferença apurada.
- **Fluxo de erro/exceção:**
  - Se o extrato for enviado sem itens ou com item contendo data inválida ou valor menor/igual a zero, o sistema recusa a importação (HTTP 400).
  - Se tentar confirmar manualmente um item inexistente ou já conciliado, o sistema recusa a operação.
  - Se faltarem parâmetros obrigatórios na conciliação de saldos (como `empresaId` ou `competencia` no formato `YYYY-MM`), o sistema recusa a consulta.

## 5. Critérios de aceite
- **CA-1 (Importação de extrato e sugestão de conciliação):** Dada uma empresa com lançamentos contábeis ou baixas registradas, quando um extrato bancário for importado com itens compatíveis em valor e data, então o sistema deve persistir os itens do extrato e sugerir automaticamente as conciliações correspondentes (`SUGERIDA`) (RF-048).
- **CA-2 (Confirmação manual de conciliação):** Dado um item de extrato importado (sugerido ou pendente), quando o usuário confirmar manualmente a conciliação informando o vínculo e o usuário confirmador, então o item deve passar para o status `CONCILIADA` preservando o vínculo confirmado (RF-048).
- **CA-3 (Conciliação de saldos contábeis com extrato e módulos):** Dados saldos contábeis da empresa, extrato bancário, contas a pagar/receber e valores de referência de folha e módulos fiscais em uma competência, quando for solicitada a conciliação de saldos, então o sistema deve retornar o comparativo entre o saldo contábil e cada origem indicando `conciliado` ou a diferença apurada (RF-011).
- **CA-4 (Validações e bloqueios):** Dada a importação de extrato, confirmação manual ou conciliação de saldos, quando o extrato estiver vazio/com valor inválido, faltar parâmetro obrigatório ou tentar confirmar item inexistente ou já conciliado, então o sistema deve recusar a operação (RF-011, RF-048).

## 6. Plano técnico
- **Modelos (`src/models/ConciliacaoModel.ts`):** Tipos para `ItemExtratoBancario`, `StatusConciliacaoItem` (`PENDENTE | SUGERIDA | CONCILIADA`), `SugestaoConciliacao`, `ExtratoBancario` e `ResultadoConciliacaoSaldos`.
- **Repositório (`src/repositories/ConciliacaoRepository.ts`):** Interface `IConciliacaoRepository` e `InMemoryConciliacaoRepository`.
- **Serviço (`src/services/ConciliacaoService.ts`):** Importação de extrato com motor de sugestão sobre `ILancamentoContabilRepository` e `IBaixaTituloRepository`, confirmação manual e conciliação de saldos com `IPlanoContasRepository` e `ITituloFinanceiroRepository`.
- **Controller e Rotas (`src/controllers/ConciliacaoController.ts` e `src/routes/conciliacaoRoutes.ts`):**
  - `POST /api/empresas/:empresaId/conciliacao/extratos`
  - `GET /api/empresas/:empresaId/conciliacao/extratos`
  - `POST /api/empresas/:empresaId/conciliacao/itens/:itemId/confirmar`
  - `POST /api/empresas/:empresaId/conciliacao/saldos`
- **Integração (`src/app.ts`):** Registro do repositório, serviço, controller e rotas no `criarApp()`.
- **Testes (`tests/conciliacaoContabilBancaria.test.ts`):** Cenários de integração com `supertest` cobrindo CA-1 a CA-4.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/ConciliacaoModel.ts`.
- [x] Criar repositório em `src/repositories/ConciliacaoRepository.ts`.
- [x] Implementar `ConciliacaoService` em `src/services/ConciliacaoService.ts`.
- [x] Implementar `ConciliacaoController` e `conciliacaoRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/conciliacaoContabilBancaria.test.ts` cobrindo CA-1 a CA-4.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- `SPEC-2.1`, `SPEC-2.2`, `SPEC-2.9` e `SPEC-2.10`.

## 9. Como validar
1. Executar `npx jest tests/conciliacaoContabilBancaria.test.ts` e confirmar que todos os cenários (CA-1 a CA-4) passam.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- PR: https://github.com/joaovitor-webdev/pagamentus/pull/31
- Modelos, repositório, serviço, controller e rotas em `src/models/ConciliacaoModel.ts`, `src/repositories/ConciliacaoRepository.ts`, `src/services/ConciliacaoService.ts`, `src/controllers/ConciliacaoController.ts` e `src/routes/conciliacaoRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/conciliacaoContabilBancaria.test.ts` aprovada (1 suíte, 3 testes: CA-1 a CA-4).
- Compilação `npm run build` (`tsc`) concluída sem erros.

## 11. Histórico de revisão
- Ainda sem revisões registradas.
