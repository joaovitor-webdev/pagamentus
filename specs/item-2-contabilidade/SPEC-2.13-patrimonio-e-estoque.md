# SPEC-2.13 – Patrimônio e estoque

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 2 – Contabilidade | @joaovitor-webdev | @joaovitor-webdev | https://trello.com/c/oK7jfxFh | Feito |

## 1. Contexto e objetivo
Esta especificação define o controle de **patrimônio (bens imobilizados/intangíveis/exauríveis)** — incluindo cadastro, cálculo de depreciação/amortização/exaustão, baixas, transferências, reavaliações permitidas e histórico documental — e a **importação de saldos e movimentações de estoque** da empresa.

## 2. Requisitos relacionados
- **RF-057:** Cadastrar bens, localização, responsável, data de aquisição, custo, vida útil e valor residual.
- **RF-058:** Calcular e registrar depreciação/amortização/exaustão conforme política contábil e fiscal configurada.
- **RF-059:** Controlar baixas, transferências, reavaliações permitidas e histórico documental.
- **RF-060:** Importar saldos e movimentações de estoque ou integrar com sistema de gestão, quando houver.

## 3. Escopo
- **Dentro do escopo:**
  - Cadastro e listagem de bens patrimoniais por empresa com descrição, tipo de encargo (`DEPRECIACAO`, `AMORTIZACAO`, `EXAUSTAO`), localização, responsável, data de aquisição, custo, vida útil (em meses), valor residual e política configurada (contábil/fiscal e se permite reavaliação).
  - Cálculo e registro de depreciação/amortização/exaustão por competência (`YYYY-MM`), respeitando o valor residual e bloqueando cálculo duplicado na mesma competência ou em bem baixado.
  - Controle de transferência (atualizando localização e/ou responsável), reavaliação (quando permitida pela política), baixa patrimonial e manutenção do histórico documental de cada evento.
  - Importação de saldos e movimentações de estoque (`SALDO_INICIAL`, `ENTRADA`, `SAIDA`, `AJUSTE`) e consulta do saldo consolidado por item/produto.
- **Fora do escopo:**
  - Conexão direta em tempo real com ERP externo proprietário (a integração ocorre via endpoint estruturado de importação).
  - Emissão de NF-e de venda/baixa de ativo ou leitura por código de barras.
  - Geração automática de lançamentos contábeis no livro diário.

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário cadastra um bem patrimonial informando localização, responsável, data de aquisição, custo, vida útil, valor residual e política; o sistema calcula a quota mensal e permite registrar encargos por competência.
  - Ao transferir, reavaliar (se permitido) ou baixar o bem com referência documental, o sistema atualiza o estado do bem e grava o evento no histórico documental.
  - Ao importar saldos e movimentações de estoque, o sistema registra as movimentações e atualiza o saldo consolidado de cada item de estoque.
- **Fluxo de erro/exceção:**
  - Se custo <= 0, vida útil <= 0, valor residual < 0 ou valor residual > custo, o sistema recusa o cadastro do bem (HTTP 400).
  - Se tentar calcular encargo em bem baixado ou repetir cálculo na mesma competência, ou tentar reavaliar bem cuja política não permite reavaliação, o sistema recusa a operação.
  - Se a importação de estoque estiver vazia ou contiver quantidade/valor inválido, o sistema recusa a importação.

## 5. Critérios de aceite
- **CA-1 (Cadastro de bem e cálculo de depreciação/amortização/exaustão):** Dada uma empresa com um bem cadastrado com custo, valor residual, vida útil em meses e política configurada, quando for registrada a depreciação/amortização/exaustão para uma competência, então a quota (`(custo - valorResidual) / vidaUtilMeses`) deve ser registrada, aumentando o acumulado e reduzindo o valor contábil líquido sem ficar abaixo do valor residual (RF-057, RF-058).
- **CA-2 (Baixa, transferência, reavaliação e histórico documental):** Dado um bem patrimonial ativo, quando forem registradas transferência, reavaliação permitida e baixa com documento associado, então o bem deve refletir as alterações (localização/responsável, valor e status `BAIXADO`) e manter o histórico documental completo (RF-059).
- **CA-3 (Importação de saldos e movimentações de estoque):** Dada uma empresa, quando forem importados saldos e movimentações de estoque (`SALDO_INICIAL`, `ENTRADA`, `SAIDA`, `AJUSTE`), então as movimentações devem ser persistidas e o saldo consolidado por item deve corresponder exatamente ao importado (RF-060).
- **CA-4 (Validações e bloqueios):** Dado o cadastro de bem, cálculo de encargo, movimentação patrimonial ou importação de estoque, quando houver parâmetros inválidos (vida útil <= 0, residual > custo), cálculo em bem baixado ou em competência duplicada, reavaliação não permitida pela política ou estoque com dados inválidos, então o sistema deve recusar a operação (RF-057, RF-058, RF-059, RF-060).

## 6. Plano técnico
- **Modelos (`src/models/PatrimonioEstoqueModel.ts`):** Interfaces para `BemPatrimonial`, `PoliticaPatrimonial`, `RegistroEncargoPatrimonial`, `EventoHistoricoPatrimonial`, `MovimentacaoEstoque` e `SaldoEstoqueItem`.
- **Repositório (`src/repositories/PatrimonioEstoqueRepository.ts`):** Interface `IPatrimonioEstoqueRepository` e `InMemoryPatrimonioEstoqueRepository`.
- **Serviço (`src/services/PatrimonioEstoqueService.ts`):** Cadastro de bens, cálculo de depreciação/amortização/exaustão, transferência, reavaliação, baixa, histórico documental e importação/consolidação de estoque.
- **Controller e Rotas (`src/controllers/PatrimonioEstoqueController.ts` e `src/routes/patrimonioEstoqueRoutes.ts`):**
  - `POST /api/empresas/:empresaId/patrimonio/bens`
  - `GET /api/empresas/:empresaId/patrimonio/bens`
  - `POST /api/empresas/:empresaId/patrimonio/bens/:bemId/depreciar`
  - `POST /api/empresas/:empresaId/patrimonio/bens/:bemId/transferir`
  - `POST /api/empresas/:empresaId/patrimonio/bens/:bemId/reavaliar`
  - `POST /api/empresas/:empresaId/patrimonio/bens/:bemId/baixar`
  - `POST /api/empresas/:empresaId/estoque/importar`
  - `GET /api/empresas/:empresaId/estoque/saldos`
- **Integração (`src/app.ts`):** Registro do repositório, serviço, controller e rotas no `criarApp()`.
- **Testes (`tests/patrimonioEstoque.test.ts`):** Cenários de integração com `supertest` cobrindo CA-1 a CA-4.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/PatrimonioEstoqueModel.ts`.
- [x] Criar repositório em `src/repositories/PatrimonioEstoqueRepository.ts`.
- [x] Implementar `PatrimonioEstoqueService` em `src/services/PatrimonioEstoqueService.ts`.
- [x] Implementar `PatrimonioEstoqueController` e `patrimonioEstoqueRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/patrimonioEstoque.test.ts` cobrindo CA-1 a CA-4.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- Módulo base Express/TypeScript e estrutura multi-tenant por `empresaId`.

## 9. Como validar
1. Executar `npx jest tests/patrimonioEstoque.test.ts` e confirmar que todos os cenários (CA-1 a CA-4) passam.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- PR: https://github.com/joaovitor-webdev/pagamentus/pull/33
- Modelos, repositório, serviço, controller e rotas em `src/models/PatrimonioEstoqueModel.ts`, `src/repositories/PatrimonioEstoqueRepository.ts`, `src/services/PatrimonioEstoqueService.ts`, `src/controllers/PatrimonioEstoqueController.ts` e `src/routes/patrimonioEstoqueRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/patrimonioEstoque.test.ts` aprovada (1 suíte, 4 testes: CA-1 a CA-4).
- Compilação `npm run build` (`tsc`) concluída sem erros.

## 11. Histórico de revisão
- Ainda sem revisões registradas.
