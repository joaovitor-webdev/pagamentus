# SPEC-2.10 – Baixas, juros e inadimplência

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 2 – Contabilidade | @joaovitor-webdev | @joaovitor-webdev | https://trello.com/c/LbBBaKsb | Feito |

## 1. Contexto e objetivo
Esta especificação complementa a `SPEC-2.9` e define o controle de **pagamentos, recebimentos, baixas totais ou parciais, juros, multas, descontos, estornos e inadimplência** sobre as parcelas dos títulos a pagar e a receber da empresa. O objetivo é manter atualizado o saldo em aberto de cada parcela, o histórico de baixas/estornos e a identificação de parcelas em atraso.

## 2. Requisitos relacionados
- **RF-047:** Controlar pagamentos, recebimentos, baixas parciais, juros, multas, descontos, estornos e inadimplência.

## 3. Escopo
- **Dentro do escopo:**
  - Registro de baixa total ou parcial (pagamento para títulos `PAGAR` e recebimento para títulos `RECEBER`) em uma parcela específica, com valor principal baixado, juros, multa, desconto e data da baixa.
  - Cálculo do valor líquido da baixa (`principalBaixado + juros + multa - desconto`), atualização do saldo em aberto e do status da parcela (`ABERTA`, `PARCIAL`, `LIQUIDADA`).
  - Estorno de baixa realizada, recompondo o saldo em aberto da parcela e recalculando seu status.
  - Verificação e marcação de inadimplência de parcelas com saldo em aberto e vencimento anterior à data de referência informada.
- **Fora do escopo:**
  - Integração bancária, emissão de boletos/PIX ou importação de extrato/CNAB.
  - Envio automático de cobranças ou notificações externas.
  - Geração automática de lançamentos contábeis no livro diário a partir da baixa.

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário registra uma baixa parcial ou total em uma parcela informando data, principal baixado e eventuais juros, multa e desconto; o saldo em aberto diminui pelo principal baixado.
  - Caso uma baixa tenha sido lançada indevidamente, o usuário solicita seu estorno e o sistema restaura o saldo em aberto da parcela.
  - Ao consultar ou processar inadimplência para uma data de referência (`YYYY-MM-DD`), parcelas não liquidadas com vencimento anterior à data são marcadas como inadimplentes.
- **Fluxo de erro/exceção:**
  - Se o principal baixado for menor ou igual a zero ou maior que o saldo em aberto da parcela, o sistema recusa a baixa (HTTP 400).
  - Se juros, multa ou desconto forem negativos, ou se o desconto deixar o valor líquido menor que zero, o sistema recusa a baixa.
  - Se tentar estornar uma baixa inexistente ou já estornada, o sistema recusa o estorno.

## 5. Critérios de aceite
- **CA-1 (Baixa total ou parcial com juros, multa e desconto):** Dada uma parcela com saldo em aberto de um título da empresa, quando for registrada uma baixa parcial ou total informando juros, multa e desconto válidos, então o sistema deve registrar a baixa com o valor líquido calculado, atualizar o saldo em aberto da parcela e alterar seu status para `PARCIAL` ou `LIQUIDADA` (RF-047).
- **CA-2 (Estorno de baixa):** Dada uma baixa ativa registrada em uma parcela, quando for solicitado o estorno da baixa, então a baixa deve ser marcada como estornada, o principal baixado deve ser recomposto ao saldo em aberto e o status da parcela deve retornar para `ABERTA` ou `PARCIAL` (RF-047).
- **CA-3 (Marcação de inadimplência por atraso):** Dadas parcelas com saldo em aberto e vencimento anterior à data de referência, quando for executada a verificação de inadimplência para essa data, então apenas as parcelas vencidas e não liquidadas devem ser marcadas e listadas como inadimplentes (RF-047).
- **CA-4 (Validações e bloqueios):** Dada a tentativa de baixa ou estorno, quando o principal exceder o saldo em aberto ou for inválido, houver valores negativos, desconto superior ao devido ou tentativa de estornar baixa já estornada, então o sistema deve recusar a operação (RF-047).

## 6. Plano técnico
- **Modelos (`src/models/BaixaTituloModel.ts`):** Tipos para `StatusParcela` (`ABERTA | PARCIAL | LIQUIDADA`), `BaixaTitulo`, `ResumoParcelaBaixa` e `ResultadoInadimplencia`.
- **Repositório (`src/repositories/BaixaTituloRepository.ts`):** Interface `IBaixaTituloRepository` e `InMemoryBaixaTituloRepository`.
- **Serviço (`src/services/BaixaTituloService.ts`):** Regras de baixa total/parcial, cálculo de saldo em aberto por parcela, estorno e verificação de inadimplência sobre `ITituloFinanceiroRepository`.
- **Controller e Rotas (`src/controllers/BaixaTituloController.ts` e `src/routes/baixaTituloRoutes.ts`):**
  - `POST /api/empresas/:empresaId/titulos/:tituloId/parcelas/:numeroParcela/baixas`
  - `POST /api/empresas/:empresaId/baixas/:baixaId/estorno`
  - `GET /api/empresas/:empresaId/titulos/:tituloId/parcelas/situacao`
  - `POST /api/empresas/:empresaId/inadimplencia/verificar`
- **Integração (`src/app.ts`):** Registro do repositório, serviço, controller e rotas no `criarApp()`.
- **Testes (`tests/baixasJurosInadimplencia.test.ts`):** Cenários de integração com `supertest` cobrindo CA-1 a CA-4.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/BaixaTituloModel.ts`.
- [x] Criar repositório em `src/repositories/BaixaTituloRepository.ts`.
- [x] Implementar `BaixaTituloService` em `src/services/BaixaTituloService.ts`.
- [x] Implementar `BaixaTituloController` e `baixaTituloRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/baixasJurosInadimplencia.test.ts` cobrindo CA-1 a CA-4.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- `SPEC-2.9` – Títulos a pagar e a receber e vínculos (`ITituloFinanceiroRepository`).

## 9. Como validar
1. Executar `npx jest tests/baixasJurosInadimplencia.test.ts` e confirmar que todos os cenários (CA-1 a CA-4) passam.
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- PR: https://github.com/joaovitor-webdev/pagamentus/pull/30
- Modelos, repositório, serviço, controller e rotas em `src/models/BaixaTituloModel.ts`, `src/repositories/BaixaTituloRepository.ts`, `src/services/BaixaTituloService.ts`, `src/controllers/BaixaTituloController.ts` e `src/routes/baixaTituloRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/baixasJurosInadimplencia.test.ts` aprovada (1 suíte, 4 testes: CA-1 a CA-4).
- Compilação `npm run build` (`tsc`) concluída sem erros.

## 11. Histórico de revisão
- Ainda sem revisões registradas.
