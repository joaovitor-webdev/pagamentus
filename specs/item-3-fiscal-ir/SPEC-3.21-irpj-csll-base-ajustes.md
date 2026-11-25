# SPEC-3.21 – IRPJ/CSLL: base e ajustes

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 3B – Imposto de Renda | @contafaculdade73-maker | @joaovitor-webdev | A definir | Revisando |

## 1. Contexto e objetivo
Esta especificação define a **organização das informações contábeis/fiscais e o controle de adições, exclusões, compensação de prejuízos fiscais e apuração da base de cálculo de IRPJ e CSLL** por empresa, período e regime.

## 2. Requisitos relacionados
- **RF-042:** Organizar informações contábeis e fiscais necessárias à preparação de obrigações de IRPJ/CSLL, conforme regime e escopo.
- **RF-043:** Controlar adições, exclusões, compensações, prejuízos fiscais e bases de cálculo quando aplicáveis.

## 3. Escopo
- **Dentro do escopo:**
  - Apuração da base de cálculo de IRPJ/CSLL por empresa, competência e regime (`LUCRO_REAL` ou `LUCRO_PRESUMIDO`), recebendo lucro contábil (ou receita bruta no presumido), lista de **adições**, lista de **exclusões** e saldo/compensação de **prejuízos fiscais** (respeitando limite percentual parametrizado, ex.: 30% no Lucro Real).
  - Registro do histórico de bases apuradas e atualização do saldo remanescente de prejuízo fiscal.
- **Fora do escopo:**
  - Geração de arquivo ECF completo (tratado na SPEC-3.22).

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário informa regime, competência, lucro contábil (ou receita bruta + percentual de presunção), adições, exclusões e prejuízo fiscal a compensar.
  - O sistema calcula a base ajustada (`lucroContabil + adicoes - exclusoes`), aplica a compensação de prejuízo fiscal dentro do teto parametrizado e retorna a base final de IRPJ/CSLL e o saldo remanescente de prejuízo fiscal.
- **Fluxo de erro/exceção:**
  - Se o regime for inválido, a competência não seguir `YYYY-MM` ou houver valores negativos em adições/exclusões/prejuízos, o sistema recusa a operação (HTTP 400).

## 5. Critérios de aceite
- **CA-1 (Controle de adições, exclusões e base ajustada):** Dada uma empresa no `LUCRO_REAL` com lucro contábil, adições e exclusões, quando a apuração for executada, então o sistema deve calcular corretamente a base ajustada (`lucroContabil + totalAdicoes - totalExclusoes`) (`RF-042`, `RF-043`).
- **CA-2 (Compensação de prejuízo fiscal com limite parametrizado):** Dado um saldo de prejuízo fiscal e um limite percentual de compensação (ex.: `30%`), quando a compensação for aplicada sobre base positiva, então o sistema deve limitar o abatimento ao teto permitido e atualizar o saldo remanescente de prejuízo (`RF-043`).
- **CA-3 (Validações e histórico):** Dados regime inválido, competência malformada ou valores negativos, o sistema deve recusar com HTTP 400; e deve permitir listar o histórico de apurações da empresa (`RF-042`, `RF-043`).

## 6. Plano técnico
- **Modelos (`src/models/IrpjCsllBaseAjustesModel.ts`):** `AjusteFiscalItem`, `EntradaApuracaoIrpjCsll` e `ResultadoBaseIrpjCsll`.
- **Serviço (`src/services/IrpjCsllBaseAjustesService.ts`):** Cálculo de base ajustada, compensação de prejuízo fiscal e histórico em memória.
- **Controller e Rotas (`src/controllers/IrpjCsllBaseAjustesController.ts` e `src/routes/irpjCsllBaseAjustesRoutes.ts`):**
  - `POST /api/empresas/:empresaId/irpj-csll/base`
  - `GET /api/empresas/:empresaId/irpj-csll/base`
- **Integração (`src/app.ts`):** Registrar serviço, controller e rotas em `criarApp()`.
- **Testes (`tests/irpjCsllBaseAjustes.test.ts`):** Cenários cobrindo CA-1 a CA-3.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/IrpjCsllBaseAjustesModel.ts`.
- [x] Implementar `IrpjCsllBaseAjustesService` em `src/services/IrpjCsllBaseAjustesService.ts`.
- [x] Implementar `IrpjCsllBaseAjustesController` e `irpjCsllBaseAjustesRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/irpjCsllBaseAjustes.test.ts` cobrindo CA-1 a CA-3.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- Nenhuma dependência bloqueante.

## 9. Como validar
1. Executar `npx jest tests/irpjCsllBaseAjustes.test.ts` e confirmar aprovação de `CA-1` a `CA-3`.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- Modelos, serviço, controller e rotas em `src/models/IrpjCsllBaseAjustesModel.ts`, `src/services/IrpjCsllBaseAjustesService.ts`, `src/controllers/IrpjCsllBaseAjustesController.ts` e `src/routes/irpjCsllBaseAjustesRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/irpjCsllBaseAjustes.test.ts` aprovada (1 suíte, 3 testes: CA-1 a CA-3).
- Compilação `npm run build` (`tsc`) concluída sem erros.
- PR: https://github.com/joaovitor-webdev/pagamentus/pull/68

## 11. Histórico de revisão
- Revisão técnica por `@joaovitor-webdev`.
