# SPEC-2.7 – Balancete, razão e diário

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 2 – Contabilidade | @joaovitor-webdev | @joaovitor-webdev | https://trello.com/c/fVr1VbaO | Feito |

## 1. Contexto e objetivo
Esta especificação define a geração dos relatórios contábeis básicos — **Balancete de Verificação**, **Livro Razão**, **Livro Diário** e **livro/relatório auxiliar** — a partir dos lançamentos contábeis e do plano de contas da empresa. O objetivo é permitir a conferência dos saldos e da movimentação contábil de forma consistente com os lançamentos registrados no sistema.

## 2. Requisitos relacionados
- **RF-013 (parte 1):** Gerar balancete, razão, diário e livro/relatórios auxiliares. *(A segunda parte do RF-013 — Balanço Patrimonial, DRE, DFC e DMPL/DLPA — será tratada em especificação própria).*

## 3. Escopo
- **Dentro do escopo:**
  - Geração do **Balancete de Verificação** por empresa e período/competência, exibindo por conta contábil o saldo anterior, total de débitos, total de créditos e saldo final, além dos totais gerais.
  - Geração do **Livro Razão** por empresa, conta contábil e período/competência, listando cronologicamente as partidas da conta e o saldo progressivo.
  - Geração do **Livro Diário** por empresa e período/competência, listando cronologicamente os lançamentos contábeis com suas respectivas partidas dobradas e totais do período.
  - Geração de **livro/relatório auxiliar** (resumo analítico de movimentação por conta/documento ou centro de custo no período) coerente com os lançamentos registrados.
  - Validação dos parâmetros obrigatórios de consulta (identificador da empresa, período no formato `YYYY-MM` e conta contábil no razão).
- **Fora do escopo:**
  - Geração de Balanço Patrimonial, DRE, DFC e DMPL/DLPA.
  - Exportação em formatos externos (PDF, CSV, XLSX ou SPED/ECD).
  - Criação, edição ou estorno de lançamentos a partir dos relatórios.

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário informa a empresa e o período desejado (e a conta, no caso do Razão) para consultar o Balancete, Razão, Diário ou relatório auxiliar.
  - O sistema consolida os lançamentos efetivados da empresa e retorna os relatórios com valores exatos e balanceados.
  - Caso não haja lançamentos no período informado, o sistema retorna os relatórios com listas vazias e totais zerados.
- **Fluxo de erro/exceção:**
  - Se o identificador da empresa, o período (`YYYY-MM`) ou a conta (no Razão) não forem informados ou forem inválidos, o sistema recusa a consulta com erro de validação (HTTP 400).
  - Se a conta solicitada no Razão não existir para a empresa, o sistema recusa a consulta informando que a conta não foi encontrada.

## 5. Critérios de aceite
- **CA-1 (Balancete de Verificação):** Dado um cenário com lançamentos contábeis registrados para uma empresa em um período, quando for solicitado o balancete de verificação da competência, então o relatório deve apresentar cada conta movimentada com saldo anterior, débitos do período, créditos do período e saldo final batendo com os lançamentos, com total de débitos igual ao total de créditos (RF-013).
- **CA-2 (Livro Razão):** Dada uma conta contábil analítica pertencente à empresa e com lançamentos no período, quando for solicitado o livro razão da conta na competência, então o sistema deve listar em ordem cronológica todas as partidas da conta com data, histórico, valor a débito/crédito e saldo acumulado batendo com os lançamentos do cenário (RF-013).
- **CA-3 (Livro Diário):** Dados lançamentos contábeis registrados para uma empresa em um período, quando for solicitado o livro diário da competência, então o sistema deve retornar os lançamentos em ordem cronológica com data, histórico, documento de origem, partidas de débito e crédito e totais do período batendo exatamente com os lançamentos registrados (RF-013).
- **CA-4 (Livro/Relatório Auxiliar e validação de consulta):** Dados lançamentos registrados no período, quando for solicitado o livro/relatório auxiliar ou quando forem omitidos/invalidados parâmetros obrigatórios (período ou conta inexistente no razão), então o relatório auxiliar deve consolidar os valores em total acordo com os lançamentos e a consulta inválida deve ser recusada (RF-013).

## 6. Plano técnico
- **Modelos (`src/models/RelatorioContabilModel.ts`):** Interfaces de saída para `BalanceteVerificacao`, `LivroRazao`, `LivroDiario` e `RelatorioAuxiliarContabil`.
- **Serviço (`src/services/RelatorioContabilService.ts`):** Regras de consolidação exclusivamente de leitura sobre `ILancamentoContabilRepository` e `IPlanoContasRepository`, ordenação cronológica e cálculo de saldos (respeitando a natureza devedora/credora da conta no plano de contas).
- **Controller e Rotas (`src/controllers/RelatorioContabilController.ts` e `src/routes/relatorioContabilRoutes.ts`):**
  - `GET /api/empresas/:empresaId/relatorios/balancete?competencia=YYYY-MM`
  - `GET /api/empresas/:empresaId/relatorios/razao?contaId=...&competencia=YYYY-MM`
  - `GET /api/empresas/:empresaId/relatorios/diario?competencia=YYYY-MM`
  - `GET /api/empresas/:empresaId/relatorios/auxiliar?competencia=YYYY-MM`
- **Integração (`src/app.ts`):** Registro do serviço, controller e rotas no `criarApp()`.
- **Testes (`tests/relatoriosContabeis.test.ts`):** Cenário completo com múltiplos lançamentos conferindo se Balancete, Razão, Diário e relatório auxiliar batem com os lançamentos e validando recusas de parâmetros inválidos.

## 7. Tarefas de implementação
- [x] Criar interfaces dos relatórios em `src/models/RelatorioContabilModel.ts`.
- [x] Implementar `RelatorioContabilService` em `src/services/RelatorioContabilService.ts` para Balancete, Razão, Diário e relatório auxiliar.
- [x] Implementar `RelatorioContabilController` e `relatorioContabilRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/relatoriosContabeis.test.ts` cobrindo CA-1 a CA-4.
- [x] Executar suíte de testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- `SPEC-2.1` – Plano de contas (`IPlanoContasRepository` e natureza/código das contas).
- `SPEC-2.2` – Lançamentos contábeis com partidas dobradas (`ILancamentoContabilRepository`).

## 9. Como validar
1. Executar `npx jest tests/relatoriosContabeis.test.ts` e confirmar que todos os cenários (CA-1 a CA-4) passam.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- PR: https://github.com/joaovitor-webdev/pagamentus/pull/27
- Modelos, serviço, controller e rotas em `src/models/RelatorioContabilModel.ts`, `src/services/RelatorioContabilService.ts`, `src/controllers/RelatorioContabilController.ts` e `src/routes/relatorioContabilRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/relatoriosContabeis.test.ts` aprovada (1 suíte, 4 testes: CA-1 a CA-4).
- Compilação `npm run build` (`tsc`) concluída sem erros.

## 11. Histórico de revisão
- Ainda sem revisões registradas.
