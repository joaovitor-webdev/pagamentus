# SPEC-3.11 – Simulação de cenários

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 3A – Fiscal e tributos | @matheusbdsousa-lgtm | @joaovitor-webdev | A definir | Revisando |

## 1. Contexto e objetivo
Esta especificação define o **módulo de simulação comparativa de cenários tributários** por empresa, permitindo simular e comparar diferentes regimes/cenários com apresentação explícita de **premissas, limitações e memória de cálculo** (com parâmetros de demonstração, sem caráter de aconselhamento fiscal oficial).

## 2. Requisitos relacionados
- **RF-028:** Permitir simulações de cenários tributários, apresentando premissas, limitações e memória de cálculo.

## 3. Escopo
- **Dentro do escopo:**
  - Execução de simulação para uma empresa informando receita bruta, despesas dedutíveis (opcional) e lista de cenários a simular (nome/regime, alíquota efetiva parametrizada e base de cálculo sobre receita ou lucro).
  - Retorno estruturado por cenário contendo: imposto estimado, carga tributária efetiva (`%`), memória de cálculo detalhada, premissas adotadas e limitações da simulação.
  - Indicação do cenário de menor carga tributária estimada e histórico de simulações realizadas pela empresa.
- **Fora do escopo:**
  - Tabelas oficiais automáticas da Receita Federal ou substituição de planejamento tributário profissional.
  - Alteração automática do regime tributário vigente da empresa.

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário envia receita bruta, despesas dedutíveis e um ou mais cenários tributários com suas premissas/alíquotas parametrizadas.
  - O sistema calcula o tributo estimado de cada cenário, monta a memória de cálculo, lista premissas e limitações explícitas e destaca o cenário de menor carga estimada.
- **Fluxo de erro/exceção:**
  - Se `empresaId` estiver ausente, `receitaBruta <= 0`, `despesasDedutiveis < 0`, lista de cenários vazia ou alíquota inválida (`< 0` ou `> 100`), o sistema recusa a simulação (HTTP 400).

## 5. Critérios de aceite
- **CA-1 (Simulação comparativa com premissas, limitações e memória):** Dada uma empresa com receita bruta, despesas dedutíveis e múltiplos cenários tributários parametrizados, quando a simulação for executada, então o sistema deve calcular cada cenário retornando imposto estimado, carga efetiva, memória de cálculo, premissas, limitações e o cenário mais econômico (`RF-028`).
- **CA-2 (Histórico de simulações):** Dada uma simulação executada, quando o histórico da empresa for consultado, então o sistema deve listar as simulações registradas sem alterar o regime oficial da empresa (`RF-028`).
- **CA-3 (Validações de entrada):** Dados valores inválidos (`receitaBruta <= 0`, `despesasDedutiveis < 0`, cenários vazios ou alíquota fora de `0..100`), quando a simulação for solicitada, então o sistema deve recusar a operação com HTTP 400 (`RF-028`).

## 6. Plano técnico
- **Modelos (`src/models/SimulacaoCenarioTributarioModel.ts`):** `CenarioSimulacaoEntrada`, `ResultadoCenarioSimulado`, `EntradaSimulacaoTributaria` e `ResultadoSimulacaoTributaria`.
- **Serviço (`src/services/SimulacaoCenarioTributarioService.ts`):** Validações, cálculo comparativo com memória de cálculo, premissas, limitações e histórico em memória.
- **Controller e Rotas (`src/controllers/SimulacaoCenarioTributarioController.ts` e `src/routes/simulacaoCenarioTributarioRoutes.ts`):**
  - `POST /api/empresas/:empresaId/fiscal/simulacoes`
  - `GET /api/empresas/:empresaId/fiscal/simulacoes`
- **Integração (`src/app.ts`):** Registrar serviço, controller e rotas em `criarApp()`.
- **Testes (`tests/simulacaoCenariosTributarios.test.ts`):** Cenários cobrindo CA-1 a CA-3.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/SimulacaoCenarioTributarioModel.ts`.
- [x] Implementar `SimulacaoCenarioTributarioService` em `src/services/SimulacaoCenarioTributarioService.ts`.
- [x] Implementar `SimulacaoCenarioTributarioController` e `simulacaoCenarioTributarioRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/simulacaoCenariosTributarios.test.ts` cobrindo CA-1 a CA-3.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- Nenhuma dependência bloqueante.

## 9. Como validar
1. Executar `npx jest tests/simulacaoCenariosTributarios.test.ts` e confirmar aprovação de `CA-1` a `CA-3`.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- Modelos, serviço, controller e rotas em `src/models/SimulacaoCenarioTributarioModel.ts`, `src/services/SimulacaoCenarioTributarioService.ts`, `src/controllers/SimulacaoCenarioTributarioController.ts` e `src/routes/simulacaoCenarioTributarioRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/simulacaoCenariosTributarios.test.ts` aprovada (1 suíte, 3 testes: CA-1 a CA-3).
- Compilação `npm run build` (`tsc`) concluída sem erros.
- PR: https://github.com/joaovitor-webdev/pagamentus/pull/58

## 11. Histórico de revisão
- Revisão técnica por `@joaovitor-webdev`.
