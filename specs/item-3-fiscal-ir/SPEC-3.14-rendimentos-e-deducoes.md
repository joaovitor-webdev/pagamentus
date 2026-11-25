# SPEC-3.14 – Rendimentos e deduções

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 3B – Imposto de Renda | @contafaculdade73-maker | @joaovitor-webdev | A definir | Revisando |

## 1. Contexto e objetivo
Esta especificação define o **registro, categorização e consolidação de rendimentos e pagamentos/despesas dedutíveis** por declaração de Imposto de Renda Pessoa Física, contemplando todas as categorias de rendimentos e despesas previstas.

## 2. Requisitos relacionados
- **RF-031:** Coletar rendimentos tributáveis, isentos/não tributáveis, sujeitos à tributação exclusiva, rendimentos recebidos acumuladamente e rendimentos do exterior, quando aplicável.
- **RF-033:** Registrar pagamentos e despesas dedutíveis, contribuições, previdência, despesas médicas, educação, pensão e doações, conforme regras aplicáveis.

## 3. Escopo
- **Dentro do escopo:**
  - Registro e listagem de **rendimentos** por declaração (`fichaId`), suportando as categorias: `TRIBUTAVEL`, `ISENTO_NAO_TRIBUTAVEL`, `TRIBUTACAO_EXCLUSIVA`, `RRA` (rendimentos recebidos acumuladamente) e `EXTERIOR`, com fonte pagadora, valor e IR retido (opcional).
  - Registro e listagem de **pagamentos e despesas dedutíveis** por declaração, suportando as categorias: `CONTRIBUICAO`, `PREVIDENCIA`, `MEDICA`, `EDUCACAO`, `PENSAO`, `DOACAO` e `OUTRO_PAGAMENTO`, com beneficiário, valor e indicador de dedutibilidade.
  - Resumo consolidado de totais por categoria de rendimento e total de deduções aplicáveis.
- **Fora do escopo:**
  - Cálculo final do IR devido/a restituir ou comparação completa vs simplificada (tratado na SPEC-3.18).

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário registra rendimentos nas diferentes categorias e despesas/pagamentos dedutíveis vinculados a uma declaração (`fichaId`).
  - Ao consultar o resumo da declaração, o sistema retorna os itens registrados e os totais consolidados por categoria de rendimento e por categoria de dedução.
- **Fluxo de erro/exceção:**
  - Se a categoria for inválida, faltarem campos obrigatórios ou algum valor for `<= 0` (ou IR retido `< 0`), o sistema recusa a operação (HTTP 400).

## 5. Critérios de aceite
- **CA-1 (Coleta de rendimentos por categoria):** Dada uma declaração (`fichaId`), quando forem registrados rendimentos tributáveis, isentos, exclusivos, RRA ou do exterior, então o sistema deve armazenar cada item e totalizar corretamente por categoria (`RF-031`).
- **CA-2 (Registro de pagamentos e despesas dedutíveis):** Dada uma declaração (`fichaId`), quando forem registrados pagamentos/despesas (contribuições, previdência, médicas, educação, pensão, doações), então o sistema deve armazenar cada item e consolidar o total dedutível (`RF-033`).
- **CA-3 (Validações de entrada):** Dada uma tentativa de registrar rendimento ou dedução com categoria inválida ou valor `<= 0`, então o sistema deve recusar a operação com HTTP 400 (`RF-031`, `RF-033`).

## 6. Plano técnico
- **Modelos (`src/models/RendimentoDeducaoIrModel.ts`):** `CategoriaRendimentoIr`, `CategoriaDeducaoIr`, `RendimentoIr`, `DeducaoIr` e `ResumoRendimentosDeducoesIr`.
- **Serviço (`src/services/RendimentoDeducaoIrService.ts`):** Registro, validação e resumo consolidado em memória por `fichaId`.
- **Controller e Rotas (`src/controllers/RendimentoDeducaoIrController.ts` e `src/routes/rendimentoDeducaoIrRoutes.ts`):**
  - `POST /api/ir/fichas/:fichaId/rendimentos`
  - `POST /api/ir/fichas/:fichaId/deducoes`
  - `GET /api/ir/fichas/:fichaId/rendimentos-deducoes`
- **Integração (`src/app.ts`):** Registrar serviço, controller e rotas em `criarApp()`.
- **Testes (`tests/rendimentosDeducoesIr.test.ts`):** Cenários cobrindo CA-1 a CA-3.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/RendimentoDeducaoIrModel.ts`.
- [x] Implementar `RendimentoDeducaoIrService` em `src/services/RendimentoDeducaoIrService.ts`.
- [x] Implementar `RendimentoDeducaoIrController` e `rendimentoDeducaoIrRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/rendimentosDeducoesIr.test.ts` cobrindo CA-1 a CA-3.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- `SPEC-3.13` (referência a `fichaId`).

## 9. Como validar
1. Executar `npx jest tests/rendimentosDeducoesIr.test.ts` e confirmar aprovação de `CA-1` a `CA-3`.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- Modelos, serviço, controller e rotas em `src/models/RendimentoDeducaoIrModel.ts`, `src/services/RendimentoDeducaoIrService.ts`, `src/controllers/RendimentoDeducaoIrController.ts` e `src/routes/rendimentoDeducaoIrRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/rendimentosDeducoesIr.test.ts` aprovada (1 suíte, 3 testes: CA-1 a CA-3).
- Compilação `npm run build` (`tsc`) concluída sem erros.
- PR: https://github.com/joaovitor-webdev/pagamentus/pull/61

## 11. Histórico de revisão
- Revisão técnica por `@joaovitor-webdev`.
