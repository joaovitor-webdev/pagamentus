# SPEC-2.12 – Fluxo de caixa e relatórios financeiros

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 2 – Contabilidade | @joaovitor-webdev | @joaovitor-webdev | https://trello.com/c/CYwJPRPs | Feito |

## 1. Contexto e objetivo
Esta especificação define a geração dos relatórios gerenciais financeiros da empresa — **Fluxo de Caixa**, **Posição Financeira**, **Aging de Recebíveis**, **Previsão de Pagamentos** e **Relatório Financeiro por Centro de Custo** — a partir dos títulos a pagar/receber (`SPEC-2.9`), baixas registradas (`SPEC-2.10`) e centros de custo (`SPEC-2.6`). O objetivo é consolidar a visão financeira com totais conferidos.

## 2. Requisitos relacionados
- **RF-049:** Gerar fluxo de caixa, posição financeira, aging de recebíveis, previsão de pagamentos e relatórios por centro de custo.

## 3. Escopo
- **Dentro do escopo:**
  - **Fluxo de Caixa** por empresa e intervalo de datas (`dataInicio` a `dataFim`), consolidando entradas e saídas realizadas (baixas ativas) e previstas (parcelas em aberto) e o saldo líquido do período.
  - **Posição Financeira** na `dataReferencia`, consolidando total a receber em aberto, total a pagar em aberto, saldo projetado (`aReceber - aPagar`) e resultado realizado acumulado (`recebimentos - pagamentos`).
  - **Aging de Recebíveis** na `dataReferencia`, agrupando o saldo em aberto das parcelas a receber nas faixas: `A_VENCER`, `1_30_DIAS`, `31_60_DIAS`, `61_90_DIAS` e `ACIMA_90_DIAS`.
  - **Previsão de Pagamentos** no intervalo (`dataInicio` a `dataFim`), listando parcelas a pagar em aberto por vencimento com total previsto (com filtro opcional por `centroCustoId`).
  - **Relatório Financeiro por Centro de Custo**, consolidando totais a pagar, a receber, baixados e em aberto por centro de custo associado aos títulos/lançamentos.
- **Fora do escopo:**
  - Exportação em formatos externos (PDF, XLSX, CSV) ou gráficos no frontend.
  - Projeções estatísticas, simulação de empréstimos ou edição de títulos/baixas pelos relatórios.

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário consulta os relatórios informando a empresa e os parâmetros de data exigidos (`YYYY-MM-DD`).
  - O sistema consolida os títulos e baixas não estornadas da empresa e retorna os totais exatamente conferidos.
- **Fluxo de erro/exceção:**
  - Se `empresaId`, `dataReferencia`, `dataInicio` ou `dataFim` estiverem ausentes ou fora do formato `YYYY-MM-DD`, ou se `dataInicio > dataFim`, o sistema recusa a consulta (HTTP 400).

## 5. Critérios de aceite
- **CA-1 (Fluxo de caixa e posição financeira):** Dados títulos a pagar/receber e baixas ativas na empresa, quando forem solicitados o fluxo de caixa (para um intervalo de datas) e a posição financeira (para uma data de referência), então o sistema deve consolidar corretamente entradas, saídas realizadas/previstas, saldos em aberto a pagar/receber e saldo líquido (RF-049).
- **CA-2 (Aging de recebíveis):** Dadas parcelas a receber em aberto com diferentes vencimentos em relação à data de referência, quando for solicitado o aging de recebíveis, então os valores devem ser distribuídos corretamente entre as faixas de vencimento/atraso com soma total igual ao total a receber em aberto (RF-049).
- **CA-3 (Previsão de pagamentos e relatório por centro de custo):** Dadas parcelas a pagar em aberto no período e títulos/movimentações associados a centros de custo, quando forem solicitados a previsão de pagamentos e o relatório financeiro por centro de custo, então os totais previstos e consolidados por centro de custo devem bater com os registros cadastrados (RF-049).
- **CA-4 (Validações de parâmetros):** Dada a consulta a qualquer um dos relatórios financeiros, quando parâmetros obrigatórios de data estiverem ausentes/inválidos ou `dataInicio > dataFim`, então o sistema deve recusar a consulta com erro de validação (RF-049).

## 6. Plano técnico
- **Modelos (`src/models/RelatorioFinanceiroModel.ts`):** Interfaces de saída para `FluxoCaixaFinanceiro`, `PosicaoFinanceira`, `AgingRecebiveis`, `PrevisaoPagamentos` e `RelatorioFinanceiroCentroCusto`.
- **Serviço (`src/services/RelatorioFinanceiroService.ts`):** Serviço exclusivamente de leitura sobre `ITituloFinanceiroRepository`, `IBaixaTituloRepository` e `ICentroCustoRepository`. *(Inclusão de campo opcional `centroCustoId` em `TituloFinanceiro` caso informado no cadastro para suportar o agrupamento por centro de custo).*
- **Controller e Rotas (`src/controllers/RelatorioFinanceiroController.ts` e `src/routes/relatorioFinanceiroRoutes.ts`):**
  - `GET /api/empresas/:empresaId/financeiro/fluxo-caixa?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD`
  - `GET /api/empresas/:empresaId/financeiro/posicao?dataReferencia=YYYY-MM-DD`
  - `GET /api/empresas/:empresaId/financeiro/aging-recebiveis?dataReferencia=YYYY-MM-DD`
  - `GET /api/empresas/:empresaId/financeiro/previsao-pagamentos?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD`
  - `GET /api/empresas/:empresaId/financeiro/por-centro-custo`
- **Integração (`src/app.ts`):** Registro do serviço, controller e rotas no `criarApp()`.
- **Testes (`tests/fluxoCaixaRelatoriosFinanceiros.test.ts`):** Cenários de integração com `supertest` cobrindo CA-1 a CA-4.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/RelatorioFinanceiroModel.ts` (e suporte opcional a `centroCustoId` em `TituloFinanceiroModel.ts`/`TituloFinanceiroService.ts`).
- [x] Implementar `RelatorioFinanceiroService` em `src/services/RelatorioFinanceiroService.ts`.
- [x] Implementar `RelatorioFinanceiroController` e `relatorioFinanceiroRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/fluxoCaixaRelatoriosFinanceiros.test.ts` cobrindo CA-1 a CA-4.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- `SPEC-2.6` (Centros de custo), `SPEC-2.9` (Títulos a pagar e receber) e `SPEC-2.10` (Baixas e juros).

## 9. Como validar
1. Executar `npx jest tests/fluxoCaixaRelatoriosFinanceiros.test.ts` e confirmar que todos os cenários (CA-1 a CA-4) passam.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- PR: https://github.com/joaovitor-webdev/pagamentus/pull/32
- Modelos, serviço, controller e rotas em `src/models/RelatorioFinanceiroModel.ts`, `src/services/RelatorioFinanceiroService.ts`, `src/controllers/RelatorioFinanceiroController.ts` e `src/routes/relatorioFinanceiroRoutes.ts`, registrados em `src/app.ts`.
- Suporte a `centroCustoId` opcional em `src/models/TituloFinanceiroModel.ts` e `src/services/TituloFinanceiroService.ts`.
- Suíte de testes `npx jest tests/fluxoCaixaRelatoriosFinanceiros.test.ts tests/titulosPagarReceberVinculos.test.ts` aprovada (2 suítes, 7 testes: CA-1 a CA-4 + regressão).
- Compilação `npm run build` (`tsc`) concluída sem erros.

## 11. Histórico de revisão
- Ainda sem revisões registradas.
