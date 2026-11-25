# SPEC-3.8 – Retenções, créditos e parcelamentos

| Item | Responsável | Revisor (4º período) | Trello | Status |
|---|---|---|---|---|
| 3A – Fiscal e tributos | @matheusbdsousa-lgtm | A definir | https://trello.com/c/2WE1HxGo | Feito |

## 1. Contexto e objetivo
Esta especificação define o **controle de tributos retidos e sofridos, créditos tributários, compensações, parcelamentos e vencimentos** por empresa, permitindo acompanhar saldos, utilizações e datas de vencimento das obrigações e parcelamentos.

## 2. Requisitos relacionados
- **RF-022:** Controlar tributos retidos e sofridos, créditos, compensações, parcelamentos e vencimentos.

## 3. Escopo
- **Dentro do escopo:**
  - Registro e listagem de **tributos retidos (a recolher)** e **tributos sofridos (retidos na fonte por terceiros)** com tributo, valor, competência e data de vencimento.
  - Registro de **créditos tributários** (com saldo inicial e saldo disponível) e aplicação de **compensações** vinculadas a um crédito, abatendo o saldo disponível e registrando o histórico de compensações.
  - Cadastro de **parcelamentos tributários** com valor total, quantidade de parcelas e geração/controle das parcelas com seus respectivos vencimentos e status (`ABERTA`, `PAGA`, `ATRASADA`).
  - Consulta de **vencimentos** por empresa (retenções a recolher e parcelas de parcelamentos), permitindo identificar itens em aberto ou vencidos até determinada data.
- **Fora do escopo:**
  - Transmissão de PER/DCOMP, EFD-Reinf ou emissão de guias oficiais (DARF/GPS/DAS) junto à Receita Federal.
  - Baixa bancária automática ou conciliação financeira automática com extrato.

## 4. Comportamento esperado
- **Fluxo normal:**
  - O usuário registra retenções de tributos (tipo `RETIDO` ou `SOFRIDO`) informando tributo, valor e data de vencimento.
  - O usuário registra um crédito tributário e, posteriormente, realiza uma ou mais compensações dentro do saldo disponível, reduzindo o saldo do crédito.
  - O usuário registra um parcelamento informando tributo, valor total, número de parcelas e primeiro vencimento; o sistema gera as parcelas com vencimentos mensais e permite registrar o pagamento de parcelas e consultar vencimentos.
- **Fluxo de erro/exceção:**
  - Se houver campos obrigatórios ausentes, valores inválidos (`<= 0`), datas inválidas ou tentativa de compensar valor superior ao saldo disponível do crédito, o sistema recusa a operação (HTTP 400).
  - Se o crédito ou parcelamento/parcela informado não existir, o sistema retorna erro explícito (HTTP 404).

## 5. Critérios de aceite
- **CA-1 (Controle de tributos retidos e sofridos):** Dada uma empresa existente, quando forem registrados tributos retidos (`RETIDO`) e sofridos (`SOFRIDO`) com valor, competência e vencimento, então o sistema deve armazenar e listar separadamente ou por filtro os registros e seus vencimentos (`RF-022`).
- **CA-2 (Controle de créditos e compensações):** Dado um crédito tributário registrado com saldo disponível, quando uma compensação válida for aplicada sobre ele, então o sistema deve registrar a compensação e reduzir o saldo disponível do crédito; quando a compensação exceder o saldo disponível, deve recusar a operação (`RF-022`).
- **CA-3 (Controle de parcelamentos e vencimentos):** Dado um parcelamento cadastrado com quantidade de parcelas e data inicial de vencimento, quando o parcelamento for criado, quitada uma parcela ou consultados os vencimentos até uma data de referência, então o sistema deve controlar as parcelas, atualizar o status da parcela paga e listar os vencimentos pendentes/vencidos (`RF-022`).
- **CA-4 (Validações de entrada e existência):** Dados valores inválidos (`<= 0`), quantidade de parcelas inválida, formato de data inválido ou crédito/parcelamento inexistente, quando a operação for solicitada, então o sistema deve recusar com mensagem explicativa (`RF-022`).

## 6. Plano técnico
- **Modelos (`src/models/RetencaoCreditoParcelamentoModel.ts`):** Tipos para `RetencaoTributaria` (`RETIDO` | `SOFRIDO`), `CreditoTributario`, `CompensacaoTributaria`, `ParcelaParcelamento`, `ParcelamentoTributario` e `ItemVencimentoTributario`.
- **Repositório (`src/repositories/RetencaoCreditoParcelamentoRepository.ts`):** Interface e implementação em memória para retenções, créditos, compensações e parcelamentos por empresa.
- **Serviço (`src/services/RetencaoCreditoParcelamentoService.ts`):** Regras de validação, abatimento de saldo em compensações, geração de parcelas com vencimentos e consulta consolidada de vencimentos.
- **Controller e Rotas (`src/controllers/RetencaoCreditoParcelamentoController.ts` e `src/routes/retencaoCreditoParcelamentoRoutes.ts`):**
  - `POST /api/empresas/:empresaId/fiscal/retencoes` e `GET /api/empresas/:empresaId/fiscal/retencoes`
  - `POST /api/empresas/:empresaId/fiscal/creditos` e `GET /api/empresas/:empresaId/fiscal/creditos`
  - `POST /api/empresas/:empresaId/fiscal/compensacoes`
  - `POST /api/empresas/:empresaId/fiscal/parcelamentos` e `GET /api/empresas/:empresaId/fiscal/parcelamentos`
  - `PATCH /api/empresas/:empresaId/fiscal/parcelamentos/:parcelamentoId/parcelas/:numero/pagar`
  - `GET /api/empresas/:empresaId/fiscal/vencimentos?ate=YYYY-MM-DD`
- **Integração (`src/app.ts`):** Registrar repositório, serviço, controller e rotas em `criarApp()`.
- **Testes (`tests/retencoesCreditosParcelamentos.test.ts`):** Testes de integração com `supertest` cobrindo CA-1 a CA-4.

## 7. Tarefas de implementação
- [x] Criar modelos em `src/models/RetencaoCreditoParcelamentoModel.ts`.
- [x] Criar repositório em `src/repositories/RetencaoCreditoParcelamentoRepository.ts`.
- [x] Implementar `RetencaoCreditoParcelamentoService` em `src/services/RetencaoCreditoParcelamentoService.ts`.
- [x] Implementar `RetencaoCreditoParcelamentoController` e `retencaoCreditoParcelamentoRoutes` e registrar em `src/app.ts`.
- [x] Criar testes automatizados em `tests/retencoesCreditosParcelamentos.test.ts` cobrindo CA-1 a CA-4.
- [x] Executar testes e build TypeScript e registrar evidências na spec.

## 8. Dependências
- Nenhuma dependência obrigatória bloqueante.

## 9. Como validar
1. Executar `npx jest tests/retencoesCreditosParcelamentos.test.ts` e confirmar aprovação de todos os cenários (`CA-1` a `CA-4`).
2. Executar `npm run build` para garantir ausência de erros de compilação TypeScript.

## 10. Evidências (preencher ao concluir)
- Modelos, repositório, serviço, controller e rotas em `src/models/RetencaoCreditoParcelamentoModel.ts`, `src/repositories/RetencaoCreditoParcelamentoRepository.ts`, `src/services/RetencaoCreditoParcelamentoService.ts`, `src/controllers/RetencaoCreditoParcelamentoController.ts` e `src/routes/retencaoCreditoParcelamentoRoutes.ts`, registrados em `src/app.ts`.
- Suíte de testes `npx jest tests/retencoesCreditosParcelamentos.test.ts` aprovada (1 suíte, 4 testes: CA-1 a CA-4).
- Compilação `npm run build` (`tsc`) concluída sem erros.
- PR: https://github.com/joaovitor-webdev/pagamentus/pull/44

## 11. Histórico de revisão
- Ainda sem revisões registradas.
