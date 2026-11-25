# SPEC-2.8 – Balanço, DRE, DFC e DMPL

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 2 – Contabilidade | @joaovitor-webdev | @joaovitor-webdev | https://trello.com/c/SZg1MXdD | Feito |

## 1. Contexto e objetivo
Esta especificação complementa a `SPEC-2.7` e define a geração das demonstrações contábeis de síntese — **Balanço Patrimonial**, **DRE (Demonstração do Resultado do Exercício)**, **DFC (Demonstração dos Fluxos de Caixa)** quando aplicável e **DMPL/DLPA (Demonstração das Mutações do Patrimônio Líquido / Lucros ou Prejuízos Acumulados)** quando aplicável — a partir dos mesmos lançamentos contábeis e plano de contas da empresa, garantindo totais conferidos e consistentes entre si.

## 2. Requisitos relacionados
- **RF-013 (parte 2):** Gerar balanço patrimonial, DRE, DFC quando aplicável e DMPL/DLPA quando aplicável. *(Texto completo do RF-013 referenciado na SPEC-2.7).*

## 3. Escopo
- **Dentro do escopo:**
  - Geração do **Balanço Patrimonial** por empresa e competência (`YYYY-MM`), consolidando `ATIVO`, `PASSIVO` e `PATRIMONIO_LIQUIDO` (com resultado apurado incorporado) e conferindo a equação patrimonial (`Ativo = Passivo + Patrimônio Líquido`).
  - Geração da **DRE** por empresa e competência, consolidando `RECEITA`, `DESPESA` e apurando o resultado líquido do período.
  - Geração da **DFC** (quando aplicável) por empresa e competência, consolidando saldo inicial, entradas, saídas, variação líquida e saldo final das contas de caixa/disponibilidades, ou indicando não aplicável quando não houver contas/movimentação aplicável.
  - Geração da **DMPL/DLPA** (quando aplicável) por empresa e competência, consolidando saldo inicial de `PATRIMONIO_LIQUIDO`, mutações diretas, resultado líquido do período e saldo final, ou indicando não aplicável quando não houver contas/mutações aplicáveis.
  - Validação dos parâmetros obrigatórios de consulta (`empresaId` e `competencia` no formato `YYYY-MM`).
- **Fora do escopo:**
  - Balancete, Razão, Diário e relatórios auxiliares (já cobertos pela `SPEC-2.7`).
  - Exportação em formatos externos (PDF, CSV, XLSX, SPED/ECD) ou notas explicativas.
  - Lançamentos automáticos de encerramento/zeramento de exercício no livro diário.

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário informa a empresa e a competência (`YYYY-MM`) para consultar o Balanço Patrimonial, DRE, DFC e DMPL/DLPA.
  - O sistema consolida os lançamentos efetivados e retorna as demonstrações geradas a partir do mesmo cenário, com totais conferidos entre si.
  - Para DFC e DMPL/DLPA, quando não houver contas ou movimentações aplicáveis na empresa, o sistema sinaliza `aplicavel: false` com os motivos e totais zerados.
- **Fluxo de erro/exceção:**
  - Se o identificador da empresa ou a competência (`YYYY-MM`) não forem informados ou forem inválidos, o sistema recusa a consulta com erro de validação (HTTP 400).

## 5. Critérios de aceite
- **CA-1 (Balanço Patrimonial):** Dado um cenário com lançamentos contábeis registrados para uma empresa até uma competência, quando for solicitado o Balanço Patrimonial da competência, então o sistema deve consolidar as contas de Ativo, Passivo e Patrimônio Líquido (incorporando o resultado apurado) com `totalAtivo` igual a `totalPassivo + totalPatrimonioLiquidoAjustado` (RF-013).
- **CA-2 (DRE):** Dados lançamentos contábeis envolvendo receitas e despesas em uma competência, quando for solicitada a DRE do período, então o sistema deve consolidar as contas de Receita e Despesa, seus respectivos totais e o resultado líquido (`totalReceitas - totalDespesas`) batendo com os lançamentos do cenário (RF-013).
- **CA-3 (DFC e DMPL/DLPA quando aplicáveis):** Dado o mesmo cenário com contas de disponibilidades/caixa e patrimônio líquido movimentadas, quando forem solicitadas a DFC e a DMPL/DLPA da competência, então ambas devem ser geradas com totais conferidos (`saldoInicial + variacaoLiquida = saldoFinal` na DFC e `saldoInicial + mutacoes + resultadoPeriodo = saldoFinal` na DMPL/DLPA), ou indicar `aplicavel: false` quando não aplicável (RF-013).
- **CA-4 (Consistência entre demonstrações e validação de entrada):** Dado o mesmo cenário contábil ou uma consulta com parâmetros ausentes/inválidos, quando as demonstrações forem geradas, então o resultado líquido da DRE deve coincidir com o incorporado no Balanço Patrimonial e na DMPL/DLPA, e consultas com `empresaId` ou `competencia` inválidos devem ser recusadas (RF-013).

## 6. Plano técnico
- **Modelos (`src/models/DemonstracaoContabilModel.ts`):** Interfaces de saída para `BalancoPatrimonial`, `DemonstracaoResultadoExercicio`, `DemonstracaoFluxosCaixa` e `DemonstracaoMutacoesPL`.
- **Serviço (`src/services/DemonstracaoContabilService.ts`):** Serviço exclusivamente de leitura sobre `ILancamentoContabilRepository` e `IPlanoContasRepository` consolidando saldos por classificação (`ATIVO`, `PASSIVO`, `PATRIMONIO_LIQUIDO`, `RECEITA`, `DESPESA`) e identificando aplicabilidade de DFC e DMPL/DLPA.
- **Controller e Rotas (`src/controllers/DemonstracaoContabilController.ts` e `src/routes/demonstracaoContabilRoutes.ts`):**
  - `GET /api/empresas/:empresaId/demonstracoes/balanco?competencia=YYYY-MM`
  - `GET /api/empresas/:empresaId/demonstracoes/dre?competencia=YYYY-MM`
  - `GET /api/empresas/:empresaId/demonstracoes/dfc?competencia=YYYY-MM`
  - `GET /api/empresas/:empresaId/demonstracoes/dmpl?competencia=YYYY-MM`
- **Integração (`src/app.ts`):** Registro do serviço, controller e rotas no `criarApp()`.
- **Testes (`tests/demonstracoesContabeis.test.ts`):** Cenário único completo gerando Balanço, DRE, DFC e DMPL/DLPA, conferindo todos os totais entre si, cenário não aplicável e validações de entrada.

## 7. Tarefas de implementação
- [x] Criar interfaces das demonstrações em `src/models/DemonstracaoContabilModel.ts`.
- [x] Implementar `DemonstracaoContabilService` em `src/services/DemonstracaoContabilService.ts`.
- [x] Implementar `DemonstracaoContabilController` e `demonstracaoContabilRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/demonstracoesContabeis.test.ts` cobrindo CA-1 a CA-4.
- [x] Executar suíte de testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- `SPEC-2.1` – Plano de contas (`IPlanoContasRepository` e classificação/natureza das contas).
- `SPEC-2.2` – Lançamentos contábeis com partidas dobradas (`ILancamentoContabilRepository`).

## 9. Como validar
1. Executar `npx jest tests/demonstracoesContabeis.test.ts` e confirmar que todos os cenários (CA-1 a CA-4) passam.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- PR: https://github.com/joaovitor-webdev/pagamentus/pull/28
- Modelos, serviço, controller e rotas em `src/models/DemonstracaoContabilModel.ts`, `src/services/DemonstracaoContabilService.ts`, `src/controllers/DemonstracaoContabilController.ts` e `src/routes/demonstracaoContabilRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/demonstracoesContabeis.test.ts` aprovada (1 suíte, 4 testes: CA-1 a CA-4).
- Compilação `npm run build` (`tsc`) concluída sem erros.

## 11. Histórico de revisão
- Ainda sem revisões registradas.
