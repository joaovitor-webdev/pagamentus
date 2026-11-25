# SPEC-3.2 – Notas de entrada e saída

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 3A – Fiscal e tributos | @matheusbdsousa-lgtm | A definir | https://trello.com/c/bPvrb2Ge | Feito |

## 1. Contexto e objetivo
Esta especificação define o **registro e controle de notas fiscais de entrada, saída e serviços**, contemplando **retenções, cancelamentos, devoluções e ajustes aplicáveis** vinculados à empresa, para manter o registro fiscal organizado e rastreável.

## 2. Requisitos relacionados
- **RF-017:** Registrar notas de entrada e saída, serviços, retenções, cancelamentos, devoluções e ajustes aplicáveis.

## 3. Escopo
- **Dentro do escopo:**
  - Registro e consulta de notas por empresa com tipo (`ENTRADA`, `SAIDA`, `SERVICO`), número, série, data de emissão, competência (`YYYY-MM`), participante, valor bruto, lista/valores de retenções (`IRRF`, `ISS`, `INSS`, `PIS`, `COFINS`, `CSLL`, etc.) e valor líquido calculado.
  - Cancelamento de nota ativa mediante data e motivo, alterando o status para `CANCELADA`.
  - Registro de devolução total ou parcial vinculada a uma nota ativa, atualizando o total devolvido e o status (`DEVOLVIDA` quando integral ou mantendo registro de devolução parcial).
  - Registro de ajustes aplicáveis vinculados à nota (tipo, descrição, valor e data).
- **Fora do escopo:**
  - Transmissão ou autorização online em SEFAZ/prefeituras.
  - Tabelas tributárias oficiais de alíquotas automáticas por NCM/CFOP/ISS municipal (os valores de retenção são informados na nota).
  - Geração automática de títulos financeiros ou lançamentos contábeis.

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário registra uma nota de entrada, saída ou serviço com valor bruto e eventuais retenções; o sistema calcula `totalRetencoes` e `valorLiquido` e grava a nota com status `ATIVA`.
  - Caso a nota seja cancelada, o sistema altera seu status para `CANCELADA` registrando data e motivo.
  - Caso haja devolução ou ajuste aplicável sobre uma nota ativa, o sistema registra o evento vinculado à nota e atualiza os totais.
- **Fluxo de erro/exceção:**
  - Se faltarem número, tipo, competência (`YYYY-MM`), participante ou se `valorBruto <= 0`, o sistema recusa o registro (HTTP 400).
  - Se alguma retenção for negativa ou `totalRetencoes > valorBruto`, o sistema recusa a operação.
  - Se tentar cancelar, devolver ou ajustar uma nota já `CANCELADA`, ou registrar devolução com valor maior que o saldo disponível da nota, o sistema recusa a operação.

## 5. Critérios de aceite
- **CA-1 (Registro de entrada, saída, serviço e retenções):** Dada uma empresa existente, quando forem registradas notas fiscais de `ENTRADA`, `SAIDA` e `SERVICO` com valor bruto e retenções válidas, então o sistema deve persistir cada nota com `totalRetencoes` e `valorLiquido` calculados e listá-las vinculadas à empresa (RF-017).
- **CA-2 (Cancelamento de nota fiscal):** Dada uma nota fiscal `ATIVA`, quando for registrado o cancelamento com data e motivo, então o status da nota deve mudar para `CANCELADA` preservando os dados do cancelamento (RF-017).
- **CA-3 (Devolução e ajustes aplicáveis):** Dada uma nota fiscal `ATIVA`, quando forem registrados uma devolução (total ou parcial) e/ou um ajuste aplicável, então os registros devem ficar vinculados à nota atualizando o valor devolvido/ajustado e o status quando aplicável (RF-017).
- **CA-4 (Validações e bloqueios):** Dado o registro de nota, cancelamento, devolução ou ajuste, quando faltarem dados obrigatórios, `totalRetencoes > valorBruto`, devolução exceder o valor da nota ou a nota já estiver `CANCELADA`, então o sistema deve recusar a operação (RF-017).

## 6. Plano técnico
- **Modelos (`src/models/NotaFiscalModel.ts`):** Tipos para `TipoNotaFiscal` (`ENTRADA | SAIDA | SERVICO`), `StatusNotaFiscal` (`ATIVA | CANCELADA | DEVOLVIDA`), `RetencaoNotaFiscal`, `DevolucaoNotaFiscal`, `AjusteNotaFiscal` e `NotaFiscal`.
- **Repositório (`src/repositories/NotaFiscalRepository.ts`):** Interface `INotaFiscalRepository` e `InMemoryNotaFiscalRepository`.
- **Serviço (`src/services/NotaFiscalService.ts`):** Regras de registro, cálculo de retenções/líquido, cancelamento, devolução, ajuste e consulta.
- **Controller e Rotas (`src/controllers/NotaFiscalController.ts` e `src/routes/notaFiscalRoutes.ts`):**
  - `POST /api/empresas/:empresaId/fiscal/notas`
  - `GET /api/empresas/:empresaId/fiscal/notas`
  - `GET /api/empresas/:empresaId/fiscal/notas/:notaId`
  - `POST /api/empresas/:empresaId/fiscal/notas/:notaId/cancelar`
  - `POST /api/empresas/:empresaId/fiscal/notas/:notaId/devolucoes`
  - `POST /api/empresas/:empresaId/fiscal/notas/:notaId/ajustes`
- **Integração (`src/app.ts`):** Registro do repositório, serviço, controller e rotas no `criarApp()`.
- **Testes (`tests/notasEntradaSaida.test.ts`):** Cenários de integração com `supertest` cobrindo CA-1 a CA-4.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/NotaFiscalModel.ts`.
- [x] Criar repositório em `src/repositories/NotaFiscalRepository.ts`.
- [x] Implementar `NotaFiscalService` em `src/services/NotaFiscalService.ts`.
- [x] Implementar `NotaFiscalController` e `notaFiscalRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/notasEntradaSaida.test.ts` cobrindo CA-1 a CA-4.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- Módulo base Express/TypeScript e estrutura multi-tenant por `empresaId`.

## 9. Como validar
1. Executar `npx jest tests/notasEntradaSaida.test.ts` e confirmar que todos os cenários (CA-1 a CA-4) passam.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- PR: https://github.com/joaovitor-webdev/pagamentus/pull/38
- Modelos, repositório, serviço, controller e rotas em `src/models/NotaFiscalModel.ts`, `src/repositories/NotaFiscalRepository.ts`, `src/services/NotaFiscalService.ts`, `src/controllers/NotaFiscalController.ts` e `src/routes/notaFiscalRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/notasEntradaSaida.test.ts` aprovada (1 suíte, 4 testes: CA-1 a CA-4).
- Compilação `npm run build` (`tsc`) concluída sem erros.

## 11. Histórico de revisão
- Ainda sem revisões registradas.
