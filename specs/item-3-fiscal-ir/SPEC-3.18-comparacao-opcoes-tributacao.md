# SPEC-3.18 – Comparação de opções de tributação

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 3B – Imposto de Renda | @contafaculdade73-maker | @joaovitor-webdev | A definir | Revisando |

## 1. Contexto e objetivo
Esta especificação define o **comparador de opções de tributação permitidas no IRPF (Deduções Legais / Completa vs. Desconto Simplificado)** para determinado exercício fiscal, exibindo estimativas de base, imposto devido/a restituir, opção mais vantajosa e premissas utilizadas (com parâmetros configuráveis de demonstração, sem caráter de tabela oficial).

## 2. Requisitos relacionados
- **RF-037:** Comparar opções de tributação permitidas para o exercício, quando aplicável, exibindo estimativas e premissas.

## 3. Escopo
- **Dentro do escopo:**
  - Comparação entre as modalidades `COMPLETA` (usando deduções legais informadas) e `SIMPLIFICADA` (usando percentual de desconto simplificado e teto parametrizados na entrada).
  - Cálculo da base de cálculo estimada, imposto estimado (com alíquota efetiva parametrizada), saldo a pagar ou a restituir considerando o IR retido, indicação da opção mais vantajosa e lista explícita de premissas.
- **Fora do escopo:**
  - Tabela progressiva oficial hardcoded da Receita Federal.

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário informa exercício, rendimentos tributáveis, deduções legais, IR retido e parâmetros do exercício (percentual/teto do desconto simplificado e alíquota efetiva parametrizada).
  - O sistema calcula ambas as opções (`COMPLETA` e `SIMPLIFICADA`), indica qual resulta em menor imposto (ou maior restituição) e lista as premissas adotadas.
- **Fluxo de erro/exceção:**
  - Se `exercicio` for inválido ou valores numéricos forem negativos/inválidos, o sistema recusa a operação (HTTP 400).

## 5. Critérios de aceite
- **CA-1 (Comparação Completa vs Simplificada com estimativas e premissas):** Dados rendimentos tributáveis, deduções legais, IR retido e parâmetros do exercício, quando a comparação for executada, então o sistema deve retornar estimativas para `COMPLETA` e `SIMPLIFICADA`, a opção recomendada e as premissas utilizadas (`RF-037`).
- **CA-2 (Aplicação do teto do desconto simplificado):** Dado um rendimento cujo desconto simplificado percentual ultrapasse o teto parametrizado, quando a comparação for executada, então o sistema deve limitar o desconto simplificado ao teto informado (`RF-037`).
- **CA-3 (Validações de entrada):** Dados valores negativos ou exercício inválido, quando a comparação for solicitada, então o sistema deve recusar com HTTP 400 (`RF-037`).

## 6. Plano técnico
- **Modelos (`src/models/ComparacaoTributacaoIrModel.ts`):** `EntradaComparacaoIr`, `EstimativaOpcaoIr` e `ResultadoComparacaoIr`.
- **Serviço (`src/services/ComparacaoTributacaoIrService.ts`):** Cálculo comparativo de `COMPLETA` vs `SIMPLIFICADA` com teto parametrizado e premissas.
- **Controller e Rotas (`src/controllers/ComparacaoTributacaoIrController.ts` e `src/routes/comparacaoTributacaoIrRoutes.ts`):**
  - `POST /api/ir/fichas/:fichaId/comparar-tributacao`
- **Integração (`src/app.ts`):** Registrar serviço, controller e rotas em `criarApp()`.
- **Testes (`tests/comparacaoOpcoesTributacaoIr.test.ts`):** Cenários cobrindo CA-1 a CA-3.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/ComparacaoTributacaoIrModel.ts`.
- [x] Implementar `ComparacaoTributacaoIrService` em `src/services/ComparacaoTributacaoIrService.ts`.
- [x] Implementar `ComparacaoTributacaoIrController` e `comparacaoTributacaoIrRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/comparacaoOpcoesTributacaoIr.test.ts` cobrindo CA-1 a CA-3.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- `SPEC-3.14` e `SPEC-3.17`.

## 9. Como validar
1. Executar `npx jest tests/comparacaoOpcoesTributacaoIr.test.ts` e confirmar aprovação de `CA-1` a `CA-3`.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- Modelos, serviço, controller e rotas em `src/models/ComparacaoTributacaoIrModel.ts`, `src/services/ComparacaoTributacaoIrService.ts`, `src/controllers/ComparacaoTributacaoIrController.ts` e `src/routes/comparacaoTributacaoIrRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/comparacaoOpcoesTributacaoIr.test.ts` aprovada (1 suíte, 3 testes: CA-1 a CA-3).
- Compilação `npm run build` (`tsc`) concluída sem erros.
- PR: https://github.com/joaovitor-webdev/pagamentus/pull/65

## 11. Histórico de revisão
- Revisão técnica por `@joaovitor-webdev`.
