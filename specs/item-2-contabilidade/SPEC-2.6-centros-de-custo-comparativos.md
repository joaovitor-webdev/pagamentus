# SPEC-2.6 – Centros de custo e comparativos

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 2 – Contabilidade | @italograu17-ai | @joaovitor-webdev | https://trello.com/c/GHLUQ6wR | Feito |

## 1. Contexto e objetivo
Permitir o cadastro e a manutenção de dimensões gerenciais por empresa — centros de custo, departamentos, projetos e unidades — bem como sua associação em lançamentos contábeis e a emissão de comparativos financeiros/contábeis entre dois períodos (competências).

## 2. Requisitos relacionados
- **RF-014**: Permitir centros de custo, departamentos, projetos, unidades e comparativos por período.

## 3. Escopo
- **Dentro do escopo:**
  - Cadastro e consulta de centros de custo e dimensões gerenciais (`CENTRO_CUSTO`, `DEPARTAMENTO`, `PROJETO`, `UNIDADE`) vinculados a uma empresa, com código único por empresa.
  - Associação de centro de custo (ou departamento/projeto/unidade) às partidas/lançamentos contábeis registrados, validando que o centro de custo pertence à empresa e está ativo.
  - Emissão de relatório comparativo entre dois períodos (competência A vs. competência B) consolidando totais de débito, crédito e saldo líquido por centro de custo/dimensão, com variação absoluta e percentual.
- **Fora do escopo:**
  - Rateio automático por folha de pagamento (Item 4).
  - Orçamento anual (*budget* vs. realizado) ou projeções futuras de fluxo de caixa.
  - Emissão de livros contábeis obrigatórios (Diário, Razão, Balancete, DRE - RF-013).

## 4. Comportamento esperado
- **Fluxo normal (Cadastro de Centros de Custo / Dimensões):** O usuário cadastra centros de custo, departamentos, projetos e unidades para uma empresa informando código, nome e tipo; o sistema valida a unicidade do código dentro da empresa e persiste o registro.
- **Fluxo normal (Associação no Lançamento Contábil):** Ao registrar um lançamento contábil informando `centroCustoId` (no cabeçalho ou na partida), o sistema valida que o centro de custo existe, pertence à empresa e está ativo, gravando a associação.
- **Fluxo normal (Relatório Comparativo por Período):** O usuário solicita o comparativo entre duas competências (ex.: `2026-10` e `2026-11`) para a empresa; o sistema consolida os lançamentos associados a cada centro de custo nos dois períodos e retorna totais, diferença absoluta e variação percentual.
- **Fluxo de erro:** Tentativa de cadastrar código duplicado na mesma empresa, associar centro de custo inexistente/inativo no lançamento ou solicitar comparativo sem informar os dois períodos resulta em erro de validação.

## 5. Critérios de aceite
- **CA-1:** Dada uma empresa existente, quando forem cadastrados centros de custo, departamentos, projetos ou unidades com código único, nome e tipo válido, então os registros devem ser persistidos e listados vinculados à empresa (RF-014).
- **CA-2:** Dado um centro de custo ativo cadastrado para a empresa, quando um lançamento contábil for registrado associando esse centro de custo, então o lançamento e suas partidas devem persistir o vínculo com o centro de custo (RF-014).
- **CA-3:** Dados dois períodos (competência inicial e competência comparada) com lançamentos associados a centros de custo, quando for solicitado o relatório comparativo por período, então o sistema deve retornar os valores consolidados de ambos os períodos e a variação calculada por centro de custo (RF-014).
- **CA-4:** Dado o cadastro de centro de custo ou lançamento contábil, quando o código for duplicado na mesma empresa, o centro de custo associado não existir/estiver inativo ou faltar um dos períodos no comparativo, então o sistema deve recusar a operação (RF-014).

## 6. Plano técnico
- **Modelos e Repositório:**
  - Entidade `CentroCustoDimensao` (`id`, `empresaId`, `codigo`, `nome`, `tipo` (`'CENTRO_CUSTO' | 'DEPARTAMENTO' | 'PROJETO' | 'UNIDADE'`), `ativo`, `criadoEm`).
  - Repositório `InMemoryCentroCustoRepository` com unicidade por `(empresaId, codigo)`.
- **Serviços:**
  - `CentroCustoComparativoService`:
    - `cadastrarDimensao` e `listarPorEmpresa`.
    - `validarCentroCustoAtivo(empresaId, centroCustoId)` integrado ao `LancamentoContabilService` quando `centroCustoId` for informado no lançamento ou partida.
    - `gerarComparativoPeriodos(empresaId, periodoBase, periodoComparado)` agregando os lançamentos do `ILancamentoContabilRepository` por centro de custo nos dois períodos.
- **Rotas Express:**
  - `POST /api/empresas/:empresaId/centros-custo` e `GET /api/empresas/:empresaId/centros-custo`
  - `GET /api/empresas/:empresaId/centros-custo/comparativo?periodoBase=YYYY-MM&periodoComparado=YYYY-MM`

## 7. Tarefas de implementação
- [x] Criar branch de trabalho `spec/2.6-centros-de-custo-comparativos` a partir da `main`
- [x] Criar modelo e repositório `CentroCustoDimensao` suportando centros de custo, departamentos, projetos e unidades (CA-1)
- [x] Implementar serviço `CentroCustoComparativoService` com validação de duplicidade/existência e cálculo de comparativo entre dois períodos (CA-1, CA-3 e CA-4)
- [x] Integrar validação opcional de `centroCustoId` em `LancamentoContabilService` ao associar centro de custo a lançamentos (CA-2 e CA-4)
- [x] Expor controller e rotas Express para centros de custo e comparativo por período
- [x] Implementar testes automatizados cobrindo os critérios CA-1 a CA-4
- [x] Atualizar `CHANGELOG.md` na seção `[Não lançado]`

## 8. Dependências
- `SPEC-2.1` (Plano de contas).
- `SPEC-2.2` (Lançamentos contábeis).
- `SPEC-2.5` (Períodos contábeis).

## 9. Como validar
1. **Cadastro de Dimensões (CA-1):** Cadastrar centro de custo, departamento, projeto e unidade para a empresa e listar os 4 registros.
2. **Associação em Lançamento (CA-2):** Gravar lançamentos contábeis em `2026-10` e `2026-11` associando um `centroCustoId` cadastrado e confirmar que o lançamento persiste a associação.
3. **Relatório Comparativo (CA-3):** Chamar `GET /api/empresas/:empresaId/centros-custo/comparativo?periodoBase=2026-10&periodoComparado=2026-11` e conferir os totais dos dois períodos e a variação por centro de custo.
4. **Validações de Erro (CA-4):** Tentar cadastrar código duplicado, associar centro de custo inexistente no lançamento ou omitir um período no comparativo e confirmar recusa com HTTP 400.

## 10. Evidências (preencher ao concluir)
- PR: https://github.com/joaovitor-webdev/pagamentus/pull/26
- Modelos e Repositório: `src/models/CentroCustoModel.ts`, `src/repositories/CentroCustoRepository.ts`
- Serviço, Controller, Rotas e Integração: `src/services/CentroCustoComparativoService.ts`, `src/controllers/CentroCustoComparativoController.ts`, `src/routes/centroCustoComparativoRoutes.ts`, `src/services/LancamentoContabilService.ts`
- Suíte de testes automatizados (`tests/centrosCustoComparativos.test.ts`): 4 cenários aprovados cobrindo integralmente CA-1 a CA-4 (`PASS tests/centrosCustoComparativos.test.ts`).

## 11. Histórico de revisão
*(Nenhuma ressalva registrada até o momento).*
