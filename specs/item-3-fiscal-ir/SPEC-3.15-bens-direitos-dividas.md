# SPEC-3.15 – Bens, direitos e dívidas

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 3B – Imposto de Renda | @contafaculdade73-maker | @joaovitor-webdev | A definir | Revisando |

## 1. Contexto e objetivo
Esta especificação define o **registro e consolidação de bens e direitos (imóveis, veículos, participações societárias, aplicações, criptoativos e outros) e dívidas/ônus reais** por declaração de Imposto de Renda Pessoa Física e exercício fiscal.

## 2. Requisitos relacionados
- **RF-032:** Registrar bens e direitos, dívidas e ônus, participações societárias, imóveis, veículos, aplicações, criptoativos e outros itens conforme regras do exercício.

## 3. Escopo
- **Dentro do escopo:**
  - Registro e consulta de **bens e direitos** vinculados a uma declaração (`fichaId`), suportando as categorias: `IMOVEL`, `VEICULO`, `PARTICIPACAO_SOCIETARIA`, `APLICACAO_FINANCEIRA`, `CRIPTOATIVO` e `OUTRO_BEM`, com descrição, situação no ano anterior e situação no ano atual.
  - Registro e consulta de **dívidas e ônus reais** com credor, descrição, saldo anterior, saldo atual e valor pago no exercício.
  - Resumo patrimonial consolidado (total de bens no ano anterior, total de bens no ano atual, variação patrimonial, total de dívidas e patrimônio líquido declarado).
- **Fora do escopo:**
  - Cálculo automático de ganho de capital (GCAP) ou cotação online de ativos/criptoativos.

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário registra bens e direitos em diferentes categorias e dívidas/ônus reais vinculados a uma declaração (`fichaId`).
  - Ao consultar o resumo patrimonial da declaração, o sistema retorna os itens registrados e os totais consolidados (bens, dívidas, variação e patrimônio líquido).
- **Fluxo de erro/exceção:**
  - Se a categoria do bem for inválida, faltarem campos obrigatórios ou algum valor for negativo, o sistema recusa a operação (HTTP 400).

## 5. Critérios de aceite
- **CA-1 (Registro de bens e direitos por categoria):** Dada uma declaração (`fichaId`), quando forem registrados bens nas categorias previstas (imóvel, veículo, participação societária, aplicação, criptoativo, outro) com saldos anterior e atual, então o sistema deve armazenar cada item e consolidar o total patrimonial (`RF-032`).
- **CA-2 (Registro de dívidas e ônus e resumo patrimonial):** Dada uma declaração (`fichaId`), quando forem registradas dívidas/ônus reais, então o sistema deve armazenar os registros e calcular o total de dívidas e o patrimônio líquido no resumo (`RF-032`).
- **CA-3 (Validações de entrada):** Dada uma tentativa de registrar bem ou dívida com categoria inválida, campos obrigatórios ausentes ou valores negativos, então o sistema deve recusar com HTTP 400 (`RF-032`).

## 6. Plano técnico
- **Modelos (`src/models/PatrimonioIrModel.ts`):** `CategoriaBemIr`, `BemDireitoIr`, `DividaOnusIr` e `ResumoPatrimonialIr`.
- **Serviço (`src/services/PatrimonioIrService.ts`):** Registro, validações e consolidação patrimonial em memória por `fichaId`.
- **Controller e Rotas (`src/controllers/PatrimonioIrController.ts` e `src/routes/patrimonioIrRoutes.ts`):**
  - `POST /api/ir/fichas/:fichaId/bens`
  - `POST /api/ir/fichas/:fichaId/dividas`
  - `GET /api/ir/fichas/:fichaId/patrimonio`
- **Integração (`src/app.ts`):** Registrar serviço, controller e rotas em `criarApp()`.
- **Testes (`tests/bensDireitosDividasIr.test.ts`):** Cenários cobrindo CA-1 a CA-3.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/PatrimonioIrModel.ts`.
- [x] Implementar `PatrimonioIrService` em `src/services/PatrimonioIrService.ts`.
- [x] Implementar `PatrimonioIrController` e `patrimonioIrRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/bensDireitosDividasIr.test.ts` cobrindo CA-1 a CA-3.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- `SPEC-3.13` (referência a `fichaId`).

## 9. Como validar
1. Executar `npx jest tests/bensDireitosDividasIr.test.ts` e confirmar aprovação de `CA-1` a `CA-3`.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- Modelos, serviço, controller e rotas em `src/models/PatrimonioIrModel.ts`, `src/services/PatrimonioIrService.ts`, `src/controllers/PatrimonioIrController.ts` e `src/routes/patrimonioIrRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/bensDireitosDividasIr.test.ts` aprovada (1 suíte, 3 testes: CA-1 a CA-3).
- Compilação `npm run build` (`tsc`) concluída sem erros.

## 11. Histórico de revisão
- Revisão técnica por `@joaovitor-webdev`.
